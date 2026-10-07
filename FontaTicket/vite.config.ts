import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const canonicalCatalogRoot = path.resolve(process.cwd(), "..", "FontaTicket_Catalogo_CORREGIDO");

function liveCanonicalCatalog(): Plugin {
  const routePrefix = "/__fontaticket_catalog__/";
  const rootWithSeparator = `${canonicalCatalogRoot}${path.sep}`;
  return {
    name: "fontaticket-live-canonical-catalog",
    apply: "serve",
    configureServer(server) {
      server.watcher.add(canonicalCatalogRoot);
      const notifyCatalogChanged = (file: string) => {
        const resolved = path.resolve(file);
        if (resolved === path.join(canonicalCatalogRoot, "productos.json")
          || resolved.startsWith(path.join(canonicalCatalogRoot, "imagenes") + path.sep)) {
          server.ws.send({ type: "custom", event: "fontaticket:canonical-catalog-changed" });
        }
      };
      server.watcher.on("change", notifyCatalogChanged);
      server.watcher.on("add", notifyCatalogChanged);
      server.watcher.on("unlink", notifyCatalogChanged);

      server.middlewares.use(async (request, response, next) => {
        const pathname = (request.url ?? "").split("?", 1)[0];
        if (!pathname.startsWith(routePrefix)) {
          next();
          return;
        }
        if (request.method !== "GET" && request.method !== "HEAD") {
          response.statusCode = 405;
          response.end();
          return;
        }
        try {
          const relativePath = decodeURIComponent(pathname.slice(routePrefix.length));
          const resolvedPath = path.resolve(canonicalCatalogRoot, relativePath);
          if (!resolvedPath.startsWith(rootWithSeparator)) {
            response.statusCode = 400;
            response.end();
            return;
          }
          const fileStats = await stat(resolvedPath);
          if (!fileStats.isFile()) {
            response.statusCode = 404;
            response.end();
            return;
          }
          const extension = path.extname(resolvedPath).toLowerCase();
          const mimeType = extension === ".json" ? "application/json; charset=utf-8"
            : extension === ".jpg" || extension === ".jpeg" ? "image/jpeg"
              : extension === ".png" ? "image/png"
                : extension === ".webp" ? "image/webp"
                  : extension === ".svg" ? "image/svg+xml"
                    : extension === ".gif" ? "image/gif" : "application/octet-stream";
          response.statusCode = 200;
          response.setHeader("Content-Type", mimeType);
          response.setHeader("Cache-Control", "no-store");
          response.setHeader("Content-Length", fileStats.size);
          if (request.method === "HEAD") response.end();
          else response.end(await readFile(resolvedPath));
        } catch {
          response.statusCode = 404;
          response.end();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), liveCanonicalCatalog()],
  server: {
    watch: { ignored: ["**/FontaTicket_Catalogo_Real.zip"] },
  },
  base:
    process.env.GITHUB_PAGES === "true" ||
    process.env.GITHUB_ACTIONS === "true"
      ? "/FontaTicket/"
      : "/",
});
