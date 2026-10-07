import * as XLSX from "xlsx";
import { validatePriceFeed } from "../src/lib/catalog-price-updates.mjs";

function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/€/g, "eur")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, "");
}

export function createTecnoaguaFeed(workbookBytes, { priceDate, sourceUrl }) {
  const workbook = XLSX.read(workbookBytes, { type: "buffer", cellDates: false });
  const rows = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: null });
    let codeColumn = -1;
    let priceColumn = -1;
    let activeHeaders = false;
    for (const cells of matrix) {
      const headers = cells.map(normalizeHeader);
      const nextCode = headers.findIndex((header) => ["cod", "codigo", "codigoproveedor"].includes(header));
      const nextPrice = headers.findIndex((header) => ["euru", "eurperu", "eurud", "preciopvp", "pvpu", "pvpunidad"].includes(header));
      if (nextCode >= 0 && nextPrice >= 0) {
        codeColumn = nextCode;
        priceColumn = nextPrice;
        activeHeaders = true;
        continue;
      }
      if (!activeHeaders) continue;
      const supplierReference = String(cells[codeColumn] ?? "").trim();
      if (!supplierReference) continue;
      const sourcePrice = cells[priceColumn];
      if (sourcePrice === null || sourcePrice === undefined || String(sourcePrice).trim() === "") continue;
      rows.push({ supplierReference, sourcePrice, priceUnit: "unidad", priceIncludesVat: null });
    }
  }
  if (!rows.length) {
    throw new Error("No encontré filas con columnas de código de proveedor y €/U. Revisa que sea una tarifa Tecnoagua compatible.");
  }
  return validatePriceFeed({ supplier: "Tecnoagua", priceDate, sourceUrl, rows });
}
