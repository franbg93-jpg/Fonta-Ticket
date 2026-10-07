import { createReadStream, createWriteStream } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "../FontaTicket/node_modules/jszip/lib/index.js";

const catalogRoot = path.resolve("FontaTicket_Catalogo_CORREGIDO");
const productsPath = path.join(catalogRoot, "productos.json");
const imagesRoot = path.join(catalogRoot, "imagenes");
const zipPath = path.resolve("FontaTicket/public/catalogo-inicial.zip");
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
const output = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
await new Promise((resolve, reject) => {
  const stream = createWriteStream(zipPath);
  stream.on("error", reject);
  stream.on("finish", resolve);
  stream.end(output);
});
console.log(`ZIP regenerado: ${output.length} bytes`);
