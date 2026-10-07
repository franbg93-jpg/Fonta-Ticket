const SUPPLIERS = new Set(["Tecnoagua", "Obramat", "Ferrocano"]);
const UPDATEABLE_STATUSES = new Set(["changed", "unchanged"]);

export function normalizeSupplier(value) {
  const normalized = String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  return [...SUPPLIERS].find((supplier) => supplier.toLocaleLowerCase("es") === normalized) ?? null;
}

function parsePrice(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  let text = value.trim().replace(/\s|€/g, "");
  if (!text) return null;
  if (text.includes(",") && text.includes(".")) {
    text = text.lastIndexOf(",") > text.lastIndexOf(".")
      ? text.replace(/\./g, "").replace(",", ".")
      : text.replace(/,/g, "");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }
  const price = Number(text);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function normalizedReference(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function roundHalfUpToCents(value) {
  const decimal = String(value);
  const match = decimal.match(/^([+-]?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i);
  if (!match) throw new Error(`El precio ${value} no tiene formato decimal válido.`);
  const sign = match[1] === "-" ? -1n : 1n;
  const exponent = Number(match[4] ?? 0);
  const fraction = match[3] ?? "";
  const digits = BigInt(`${match[2]}${fraction}` || "0");
  const scale = fraction.length - exponent;
  let numerator = digits * 13n;
  let denominator = 10n ** BigInt(Math.max(0, scale));
  if (scale < 0) numerator *= 10n ** BigInt(-scale);
  // Published prices are multiplied by 1.30, then commercial half-up rounding to cents.
  numerator *= 100n;
  denominator *= 10n;
  const cents = (numerator * 2n + denominator) / (2n * denominator);
  return Number(sign * cents) / 100;
}

function catalogPrice(feed, row) {
  return feed.supplier === "Tecnoagua" ? row.sourcePrice : roundHalfUpToCents(row.sourcePrice);
}

function targetEntries(products) {
  const entries = [];
  for (const product of products) {
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      entries.push({ product, variant: null });
      continue;
    }
    if (product.supplierReference && Number.isFinite(product.precio)) {
      entries.push({ product, variant: null });
    }
    for (const variant of product.variants) entries.push({ product, variant });
  }
  return entries.map(({ product, variant }) => ({
    product,
    variant,
    supplier: normalizeSupplier(variant?.supplier || product.supplier),
    supplierReference: normalizedReference(variant?.supplierReference ?? (variant ? "" : product.supplierReference)),
    reference: variant?.reference ?? product.reference ?? null,
    price: variant ? variant.price : product.precio,
    sourcePrice: variant ? variant.sourcePrice ?? null : product.sourcePrice ?? null,
    priceMethod: variant ? variant.priceMethod ?? product.priceMethod ?? null : product.priceMethod ?? null,
    priceSource: variant ? variant.priceSource ?? product.priceSource ?? null : product.priceSource ?? null,
  }));
}

function getTargetKey(supplier, supplierReference) {
  return JSON.stringify([supplier, supplierReference]);
}

export function validatePriceFeed(feed) {
  if (!feed || typeof feed !== "object") throw new Error("El archivo de precios no contiene un feed válido.");
  const supplier = normalizeSupplier(feed.supplier);
  if (!supplier) throw new Error("El proveedor debe ser Tecnoagua, Obramat o Ferrocano.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(feed.priceDate ?? ""))
    || Number.isNaN(Date.parse(`${feed.priceDate}T00:00:00Z`))
    || new Date(`${feed.priceDate}T00:00:00Z`).toISOString().slice(0, 10) !== feed.priceDate) {
    throw new Error("Indica la fecha de consulta con formato AAAA-MM-DD.");
  }
  if (!Array.isArray(feed.rows)) throw new Error("El feed debe contener una lista rows.");
  if (!String(feed.sourceUrl ?? "").trim()) throw new Error("Indica la URL exacta de la tarifa o ficha fuente.");
  const rows = feed.rows.map((row, index) => {
    if (typeof row?.supplierReference !== "string") {
      throw new Error(`La referencia de proveedor de la fila ${index + 1} debe estar guardada como texto.`);
    }
    const supplierReference = normalizedReference(row?.supplierReference);
    const sourcePrice = parsePrice(row?.sourcePrice);
    if (!supplierReference) throw new Error(`Falta supplierReference en la fila ${index + 1}.`);
    if (sourcePrice === null) throw new Error(`Precio no válido para ${supplierReference}.`);
    const priceUnit = String(row?.priceUnit ?? "").trim();
    if (!priceUnit) throw new Error(`Falta la unidad de venta para la referencia ${supplierReference}.`);
    if (supplier !== "Tecnoagua" && !String(row?.sourceUrl ?? "").trim()) {
      throw new Error(`Falta la página exacta de origen para ${supplierReference}.`);
    }
    if (supplier !== "Tecnoagua" && typeof row?.priceIncludesVat !== "boolean") {
      throw new Error(`Indica si el precio de ${supplierReference} incluye impuestos (true/false).`);
    }
    if (row?.priceIncludesVat !== undefined && row.priceIncludesVat !== null && typeof row.priceIncludesVat !== "boolean") {
      throw new Error(`El dato de impuestos de ${supplierReference} no es válido.`);
    }
    const sourceUrl = String(row?.sourceUrl ?? feed.sourceUrl).trim();
    if (!sourceUrl) throw new Error(`Falta la fuente exacta para la referencia ${supplierReference}.`);
    return {
      supplierReference,
      sourcePrice,
      priceUnit,
      priceIncludesVat: row?.priceIncludesVat ?? null,
      sourceUrl,
    };
  });
  return { ...feed, supplier, rows };
}

export function buildPriceUpdateProposal(products, rawFeed, { sourceFile = null, sourceSha256 = null } = {}) {
  const feed = validatePriceFeed(rawFeed);
  const target = targetEntries(products).filter((entry) => entry.supplier === feed.supplier);
  const byTargetKey = new Map();
  for (const entry of target) {
    if (!entry.supplierReference) continue;
    const key = getTargetKey(entry.supplier, entry.supplierReference);
    byTargetKey.set(key, [...(byTargetKey.get(key) ?? []), entry]);
  }
  const bySourceKey = new Map();
  for (const row of feed.rows) {
    const key = getTargetKey(feed.supplier, row.supplierReference);
    bySourceKey.set(key, [...(bySourceKey.get(key) ?? []), row]);
  }
  const resultRows = [];
  const usedSourceKeys = new Set();

  for (const entry of target) {
    if (!entry.supplierReference) {
      resultRows.push({
        status: "missing_supplier_reference",
        supplier: feed.supplier,
        targetKind: entry.variant ? "variant" : "product",
        supplierReference: null,
        productId: entry.product.id,
        variantReference: entry.reference,
        productName: entry.product.nombre,
        previousCatalogPrice: entry.price,
        previousSourcePrice: entry.sourcePrice,
        note: "No se puede actualizar sin una referencia exacta del proveedor.",
      });
      continue;
    }
    const key = getTargetKey(entry.supplier, entry.supplierReference);
    const sourceRows = bySourceKey.get(key) ?? [];
    usedSourceKeys.add(key);
    const catalogMatches = byTargetKey.get(key) ?? [];
    if (catalogMatches.length !== 1) {
      resultRows.push({
        status: "ambiguous_catalog_reference",
        supplier: feed.supplier,
        targetKind: entry.variant ? "variant" : "product",
        supplierReference: entry.supplierReference,
        productId: entry.product.id,
        variantReference: entry.reference,
        productName: entry.product.nombre,
        previousCatalogPrice: entry.price,
        previousSourcePrice: entry.sourcePrice,
        note: `La referencia aparece ${catalogMatches.length} veces en el catálogo; requiere revisión.`,
      });
      continue;
    }
    if (!sourceRows.length) {
      resultRows.push({
        status: "not_in_source",
        supplier: feed.supplier,
        targetKind: entry.variant ? "variant" : "product",
        supplierReference: entry.supplierReference,
        productId: entry.product.id,
        variantReference: entry.reference,
        productName: entry.product.nombre,
        previousCatalogPrice: entry.price,
        previousSourcePrice: entry.sourcePrice,
        note: "No aparece en el archivo recibido; no se interpreta como descatalogado.",
      });
      continue;
    }
    if (sourceRows.length !== 1) {
      resultRows.push({
        status: "ambiguous_source_reference",
        supplier: feed.supplier,
        targetKind: entry.variant ? "variant" : "product",
        supplierReference: entry.supplierReference,
        productId: entry.product.id,
        variantReference: entry.reference,
        productName: entry.product.nombre,
        previousCatalogPrice: entry.price,
        previousSourcePrice: entry.sourcePrice,
        note: `La referencia aparece ${sourceRows.length} veces en la tarifa; requiere revisión.`,
      });
      continue;
    }
    const sourceRow = sourceRows[0];
    const proposedPrice = catalogPrice(feed, sourceRow);
    const changed = entry.price !== proposedPrice || entry.sourcePrice !== sourceRow.sourcePrice;
    resultRows.push({
      status: changed ? "changed" : "unchanged",
      supplier: feed.supplier,
      targetKind: entry.variant ? "variant" : "product",
      supplierReference: entry.supplierReference,
      productId: entry.product.id,
      variantReference: entry.reference,
      productName: entry.product.nombre,
      previousCatalogPrice: entry.price,
      previousSourcePrice: entry.sourcePrice,
      sourcePrice: sourceRow.sourcePrice,
      proposedCatalogPrice: proposedPrice,
      priceDate: feed.priceDate,
      priceSource: sourceRow.sourceUrl || feed.sourceUrl,
      sourceUrl: sourceRow.sourceUrl || feed.sourceUrl,
      priceUnit: sourceRow.priceUnit,
      priceIncludesVat: sourceRow.priceIncludesVat,
      priceMethod: feed.supplier === "Tecnoagua" ? "tarifa_oficial" : `${feed.supplier} x1.30`,
      note: feed.supplier === "Tecnoagua" ? "PVP publicado aplicado sin recargo." : "Precio publicado × 1,30; redondeo comercial a dos decimales.",
    });
  }

  for (const [key, sourceRows] of bySourceKey) {
    if (usedSourceKeys.has(key)) continue;
    resultRows.push({
      status: sourceRows.length > 1 ? "ambiguous_source_reference" : "source_only",
      supplier: feed.supplier,
      supplierReference: sourceRows[0].supplierReference,
      sourcePrice: sourceRows[0].sourcePrice,
      proposedCatalogPrice: sourceRows.length === 1 ? catalogPrice(feed, sourceRows[0]) : null,
      priceDate: feed.priceDate,
      priceSource: sourceRows[0].sourceUrl || feed.sourceUrl,
      note: "Referencia de la fuente no vinculada; no se crea ni sustituye ningún producto automáticamente.",
    });
  }

  const counts = Object.fromEntries([...new Set(resultRows.map((row) => row.status))]
    .map((status) => [status, resultRows.filter((row) => row.status === status).length]));
  return {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    feed: {
      supplier: feed.supplier,
      priceDate: feed.priceDate,
      sourceUrl: feed.sourceUrl,
      rows: feed.rows,
      sourceFile,
      sourceSha256,
    },
    counts,
    rows: resultRows,
  };
}

export function applyPriceUpdateProposal(products, proposal) {
  if (proposal?.schemaVersion !== 1 || !proposal.feed || !Array.isArray(proposal.rows)) {
    throw new Error("La propuesta de precios no tiene un formato compatible.");
  }
  const feed = validatePriceFeed(proposal.feed);
  const approvedRows = proposal.rows.filter((row) => UPDATEABLE_STATUSES.has(row.status));
  const planned = [];
  const conflicts = [];
  for (const row of approvedRows) {
    const candidates = targetEntries(products).filter((entry) =>
      entry.supplier === row.supplier
      && entry.supplierReference === normalizedReference(row.supplierReference)
      && entry.product.id === row.productId
      && (entry.variant ? "variant" : "product") === row.targetKind,
    );
    if (candidates.length !== 1) {
      conflicts.push(`${row.supplier} ${row.supplierReference}: el destino ya no es único.`);
      continue;
    }
    const target = candidates[0];
    if (target.price !== row.previousCatalogPrice || target.sourcePrice !== row.previousSourcePrice) {
      conflicts.push(`${row.supplier} ${row.supplierReference}: el precio cambió desde que se creó la propuesta.`);
      continue;
    }
    const sourceRows = feed.rows.filter((sourceRow) =>
      normalizedReference(sourceRow.supplierReference) === normalizedReference(row.supplierReference),
    );
    if (sourceRows.length !== 1) {
      conflicts.push(`${row.supplier} ${row.supplierReference}: la referencia de la propuesta ya no es única.`);
      continue;
    }
    if (row.proposedCatalogPrice !== catalogPrice(feed, sourceRows[0])) {
      conflicts.push(`${row.supplier} ${row.supplierReference}: el precio propuesto no coincide con la fórmula del proveedor.`);
      continue;
    }
    planned.push({ row, target, sourceRow: sourceRows[0] });
  }
  if (conflicts.length) throw new Error(`No se aplicó ningún cambio. Revisa la propuesta: ${conflicts.join(" ")}`);

  const updated = products.map((product) => ({
    ...product,
    ...(product.variants ? { variants: product.variants.map((variant) => ({ ...variant, attributes: { ...variant.attributes } })) } : {}),
  }));
  for (const { row } of planned) {
    const product = updated.find((candidate) => candidate.id === row.productId);
    if (!product) throw new Error(`No se encontró el producto ${row.productId}.`);
    const target = row.targetKind === "variant"
      ? product.variants.find((variant) =>
        (variant.supplier || product.supplier) === row.supplier
        && normalizedReference(variant.supplierReference) === row.supplierReference,
      )
      : product;
    if (!target) throw new Error(`No se encontró la referencia ${row.supplierReference} en ${product.nombre}.`);
    const sourceRow = feed.rows.find((item) => normalizedReference(item.supplierReference) === row.supplierReference);
    if (row.targetKind === "variant") target.price = row.proposedCatalogPrice;
    else target.precio = row.proposedCatalogPrice;
    target.supplier = row.supplier;
    target.sourcePrice = sourceRow.sourcePrice;
    target.priceDate = feed.priceDate;
    target.priceSource = sourceRow.sourceUrl || feed.sourceUrl;
    target.sourceUrl = sourceRow.sourceUrl || feed.sourceUrl;
    target.priceUnit = sourceRow.priceUnit;
    target.priceIncludesVat = sourceRow.priceIncludesVat ?? null;
    target.priceMethod = feed.supplier === "Tecnoagua" ? "tarifa_oficial" : `${feed.supplier} x1.30`;
    target.priceStatus = "VERIFICADO";
  }
  return { products: updated, applied: planned.length };
}

export async function sha256(bytes) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function proposalCsv(proposal) {
  const columns = ["estado", "proveedor", "referencia_proveedor", "producto", "referencia_catalogo", "precio_actual", "precio_publicado", "precio_propuesto", "fecha", "fuente", "nota"];
  const rows = proposal.rows.map((row) => [
    row.status, row.supplier, row.supplierReference, row.productName, row.variantReference,
    row.previousCatalogPrice, row.sourcePrice, row.proposedCatalogPrice, row.priceDate, row.priceSource, row.note,
  ]);
  const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [columns, ...rows].map((row) => row.map(quote).join(";")).join("\r\n");
}
