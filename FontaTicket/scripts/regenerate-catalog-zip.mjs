import { readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import JSZip from "jszip";

export async function writeCatalogArchive(productsPath, imagesRoot, zipPath) {
  const zip = new JSZip();
  zip.file("productos.json", await readFile(productsPath));

  async function addImages(directory, relative = "") {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relativePath = path.posix.join(relative, entry.name);
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await addImages(fullPath, relativePath);
      else if (entry.isFile()) zip.file(`imagenes/${relativePath}`, await readFile(fullPath));
    }
  }
  await addImages(imagesRoot);
  const archive = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const temporaryPath = `${zipPath}.tmp`;
  await writeFile(temporaryPath, archive);
  await rename(temporaryPath, zipPath);
  return archive.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.resolve(process.cwd(), "..");
  const size = await writeCatalogArchive(
    path.join(root, "FontaTicket_Catalogo_CORREGIDO", "productos.json"),
    path.join(root, "FontaTicket_Catalogo_CORREGIDO", "imagenes"),
    path.join(root, "FontaTicket", "public", "catalogo-inicial.zip"),
  );
  process.stdout.write(`ZIP regenerado (${size} bytes).\n`);
}
