import { readFile } from "node:fs/promises";
import JSZip from "../FontaTicket/node_modules/jszip/lib/index.js";

const canonical = await readFile("FontaTicket_Catalogo_CORREGIDO/productos.json");
const archive = await JSZip.loadAsync(await readFile("FontaTicket/public/catalogo-inicial.zip"));
const archivedProducts = await archive.file("productos.json").async("nodebuffer");
console.log(`JSON canónico incluido sin cambios: ${canonical.equals(archivedProducts)}`);
