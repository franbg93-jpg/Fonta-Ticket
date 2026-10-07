import { readFile, mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  applyPriceUpdateProposal,
  buildPriceUpdateProposal,
  proposalCsv,
  sha256,
} from "../src/lib/catalog-price-updates.mjs";
import { createTecnoaguaFeed } from "./tecnoagua-workbook.mjs";
import { writeCatalogArchive } from "./regenerate-catalog-zip.mjs";

const args = process.argv.slice(2);
const command = args[0];
const options = {};
for (let index = 1; index < args.length; index += 1) {
  if (args[index].startsWith("--")) {
    const key = args[index].slice(2);
    const next = args[index + 1];
    options[key] = next && !next.startsWith("--") ? args[++index] : true;
  }
}

const root = path.resolve(process.cwd(), "..");
const catalogPath = path.resolve(options.catalog ?? path.join(root, "FontaTicket_Catalogo_CORREGIDO", "productos.json"));

function usage() {
  stdout.write(`
FontaTicket · actualización revisable de precios

Prepara propuesta Tecnoagua desde Excel:
  npm run catalog:prices -- prepare --file tarifa.xlsx --date 2026-10-07 --source-url https://... --out propuesta.json

Prepara propuesta Obramat/Ferrocano desde un feed JSON documentado:
  npm run catalog:prices -- prepare --feed precios.json --out propuesta.json

Revisa propuesta.csv y aplica los precios reconocidos:
  npm run catalog:prices -- apply --proposal propuesta.json

Opciones comunes:
  --catalog ruta\\productos.json
  --yes confirma sin preguntar (solo usar después de revisar el CSV)
`);
}

async function prepare() {
  let feed;
  let sourceFile;
  let bytes;
  if (options.file) {
    sourceFile = path.resolve(String(options.file));
    bytes = await readFile(sourceFile);
    feed = createTecnoaguaFeed(bytes, {
      priceDate: String(options.date ?? ""),
      sourceUrl: String(options["source-url"] ?? "https://www.hidrotecnoagua.com/pdf/TARIFA_PVP_TECNOAGUA.xlsx"),
    });
  } else if (options.feed) {
    sourceFile = path.resolve(String(options.feed));
    bytes = await readFile(sourceFile);
    feed = JSON.parse(bytes.toString("utf8"));
  } else {
    throw new Error("Indica --file con la tarifa Tecnoagua o --feed con el snapshot de otro proveedor.");
  }
  const products = JSON.parse(await readFile(catalogPath, "utf8"));
  const proposal = buildPriceUpdateProposal(products, feed, {
    sourceFile: path.basename(sourceFile),
    sourceSha256: await sha256(bytes),
  });
  const outputPath = path.resolve(String(options.out ?? "catalog-price-proposal.json"));
  const csvPath = outputPath.replace(/\.json$/i, "") + ".csv";
  await writeFile(outputPath, `${JSON.stringify(proposal, null, 2)}\n`, "utf8");
  await writeFile(csvPath, proposalCsv(proposal), "utf8");
  stdout.write(`Propuesta: ${outputPath}\nRevisión legible: ${csvPath}\n`);
  stdout.write(`Filas: ${proposal.rows.length}\n`);
  for (const [status, count] of Object.entries(proposal.counts)) stdout.write(`  ${status}: ${count}\n`);
  stdout.write("No se ha modificado el catálogo. Las referencias no verificadas quedan sin cambios.\n");
}

async function apply() {
  if (!options.proposal) throw new Error("Indica --proposal con una propuesta preparada y revisada.");
  const proposalPath = path.resolve(String(options.proposal));
  const proposal = JSON.parse(await readFile(proposalPath, "utf8"));
  const catalogBytes = await readFile(catalogPath);
  const products = JSON.parse(catalogBytes.toString("utf8"));
  const rowsToApply = proposal.rows.filter((row) => row.status === "changed" || row.status === "unchanged");
  const changedPrices = rowsToApply.filter((row) => row.status === "changed").length;
  if (!rowsToApply.length) {
    stdout.write("La propuesta no contiene referencias exactas aplicables; no se modificó nada.\n");
    return;
  }
  stdout.write(`Se actualizarán ${changedPrices} precios y se refrescará la procedencia de ${rowsToApply.length} referencias coincidentes.\n`);
  stdout.write(`Proveedor: ${proposal.feed.supplier}; fecha de tarifa: ${proposal.feed.priceDate}.\n`);
  stdout.write("Fotos, nombres, referencias, variantes y atributos permanecen intactos.\n");
  if (options.yes !== true) {
    const prompt = readline.createInterface({ input: stdin, output: stdout });
    const answer = await prompt.question("Tras revisar el CSV, escribe APLICAR para continuar: ");
    prompt.close();
    if (answer.trim() !== "APLICAR") {
      stdout.write("Cancelado; no se modificó el catálogo.\n");
      return;
    }
  }

  const result = applyPriceUpdateProposal(products, proposal);
  if (result.applied === 0) {
    stdout.write("No había precios por actualizar.\n");
    return;
  }
  const backupDirectory = path.join(root, ".tmp", "catalog-price-backups");
  await mkdir(backupDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await writeFile(path.join(backupDirectory, `productos-${timestamp}.json`), catalogBytes);
  const temporaryCatalog = `${catalogPath}.tmp`;
  const archivePath = path.join(root, "FontaTicket", "public", "catalogo-inicial.zip");
  const temporaryArchive = `${archivePath}.candidate`;
  let archiveBytes;
  try {
    await writeFile(temporaryCatalog, `${JSON.stringify(result.products, null, 2)}\n`, "utf8");
    archiveBytes = await writeCatalogArchive(
      temporaryCatalog,
      path.join(root, "FontaTicket_Catalogo_CORREGIDO", "imagenes"),
      temporaryArchive,
    );
    await rename(temporaryCatalog, catalogPath);
    try {
      await rename(temporaryArchive, archivePath);
    } catch (error) {
      await writeFile(catalogPath, catalogBytes);
      throw error;
    }
  } finally {
    await Promise.all([
      rm(temporaryCatalog, { force: true }),
      rm(temporaryArchive, { force: true }),
    ]);
  }
  stdout.write(`Aplicadas ${result.applied} referencias.\nCopia de seguridad: ${backupDirectory}\nZIP de nuevas instalaciones: ${archiveBytes} bytes.\n`);
}

try {
  if (command === "prepare") await prepare();
  else if (command === "apply") await apply();
  else usage();
} catch (error) {
  stdout.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
