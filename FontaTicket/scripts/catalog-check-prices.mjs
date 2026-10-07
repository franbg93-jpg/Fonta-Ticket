import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { stdin, stdout } from "node:process";
import readline from "node:readline/promises";
import { chromium } from "playwright";
import {
  buildPriceUpdateProposal,
  normalizeSupplier,
  proposalCsv,
} from "../src/lib/catalog-price-updates.mjs";

const PROVIDERS = ["Obramat", "Ferrocano"];
const PROVIDER_ROOTS = {
  Obramat: "https://www.obramat.es/",
  Ferrocano: "https://ferrocanosuministros.es/",
};
const OBRAMAT_STORE = "Obramat Murcia";
const root = path.resolve(process.cwd(), "..");
const options = Object.fromEntries(process.argv.slice(2).flatMap((arg, index, args) => {
  if (!arg.startsWith("--")) return [];
  const key = arg.slice(2);
  const value = args[index + 1];
  return [[key, value && !value.startsWith("--") ? value : true]];
}));
const catalogPath = path.resolve(String(options.catalog ?? path.join(root, "FontaTicket_Catalogo_CORREGIDO", "productos.json")));
const checkDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
const outDirectory = path.resolve(String(options["out-dir"] ?? path.join(root, ".tmp", "catalog-price-checks", checkDate)));
const browserProfile = path.join(root, ".tmp", "catalog-check-prices-browser-profile");
let obramatStorePrompted = false;
const challengePrompted = new Set();

function targetsFor(products, supplier) {
  const targets = [];
  for (const product of products) {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const entries = variants.length
      ? [
          ...(product.supplierReference && Number.isFinite(product.precio) ? [{ variant: null }] : []),
          ...variants.map((variant) => ({ variant })),
        ]
      : [{ variant: null }];
    for (const { variant } of entries) {
      const targetSupplier = normalizeSupplier(variant?.supplier || product.supplier);
      if (targetSupplier !== supplier) continue;
      targets.push({
        supplier,
        supplierReference: String(variant ? variant.supplierReference ?? "" : product.supplierReference ?? "").trim(),
        productId: product.id ?? null,
        targetKind: variant ? "variant" : "product",
        reference: variant?.reference ?? product.reference ?? null,
        productName: product.nombre ?? "(sin nombre)",
        sourceUrl: String(product.sourceUrl ?? "").trim(),
      });
    }
  }
  return targets;
}

function normalizedHost(hostname) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function directProductUrl(supplier, rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "URL no válida." };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "La URL no usa HTTPS." };
  const host = normalizedHost(url.hostname);
  if (supplier === "Obramat") {
    if (host !== "obramat.es" || !/^\/productos\//.test(url.pathname)) {
      return { ok: false, reason: "La URL no apunta a una ficha concreta de Obramat." };
    }
    return { ok: true, url: url.href };
  }
  if (host !== "ferrocanosuministros.es" || !/^\/[^/]+\/\d+-[^/]+\.html$/i.test(url.pathname)) {
    return { ok: false, reason: "La URL no apunta a una ficha concreta de Ferrocano." };
  }
  return { ok: true, url: url.href };
}

function parseEuro(value) {
  const text = String(value ?? "").replace(/\s|€/g, "");
  if (!text) return null;
  let normalized = text;
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.lastIndexOf(",") > normalized.lastIndexOf(".")
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(/,/g, "");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }
  const price = Number(normalized);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function visiblePrices(text) {
  const matches = [...String(text ?? "").matchAll(/(\d[\d\s.,]*\d|\d)\s*€/g)];
  return [...new Set(matches.map((match) => parseEuro(match[1])).filter((price) => price !== null))];
}

function pending(target, reason, extra = {}) {
  return { ...target, status: "pending", checkedAt: new Date().toISOString(), reason, ...extra };
}

function checkCloudflare(text) {
  return /verificaci[oó]n de seguridad en curso|just a moment|checking your browser|ray id:|rendimiento y seguridad de cloudflare/i.test(text);
}

async function visibleText(page) {
  return page.locator("body").innerText({ timeout: 8000 });
}

async function waitForManualCheck(message) {
  stdout.write(`${message}\n`);
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  await prompt.question("Cuando termine, pulsa Intro para continuar. ");
  prompt.close();
}

async function readObramat(page, target, landedUrl) {
  const title = (await page.locator("h1").first().innerText({ timeout: 5000 }).catch(() => "")).trim();
  const body = await visibleText(page).catch(() => "");
  if (checkCloudflare(body)) return pending(target, "La página muestra una verificación de seguridad; no se intenta evitarla.");
  if (!title || !landedUrl.includes("/productos/")) return pending(target, "No se pudo confirmar una ficha de producto visible.");

  const titlePosition = body.indexOf(title);
  const primaryBlock = titlePosition < 0 ? body.slice(0, 1800) : body.slice(titlePosition, titlePosition + 1800);
  const referenceMatch = primaryBlock.match(/\bRef\.\s*([A-Z0-9-]+)/i);
  if (!referenceMatch) return pending(target, "La ficha no muestra una referencia junto al producto principal.", { pageTitle: title });
  const observedReference = referenceMatch[1].trim();
  if (observedReference !== target.supplierReference) {
    return pending(target, "La referencia visible no coincide con supplierReference.", { observedReference, pageTitle: title });
  }

  let visibleStore = await page.getByRole("button", { name: OBRAMAT_STORE, exact: false }).count().catch(() => 0);
  if (!visibleStore && options.headless !== true && !obramatStorePrompted) {
    obramatStorePrompted = true;
    await waitForManualCheck(`La ficha está abierta en Chrome. Selecciona ${OBRAMAT_STORE} en la web y confirma que aparece en la cabecera.`);
    return readObramat(page, target, landedUrl);
  }
  if (!visibleStore) {
    return pending(target, `No se pudo confirmar el almacén ${OBRAMAT_STORE}.`, { observedReference, pageTitle: title });
  }

  const priceMatches = [...primaryBlock.matchAll(/(\d[\d\s.,]*\d|\d)\s*€\s*IVA\s*(?:\/|por)\s*Unidad/gi)];
  const prices = [...new Set(priceMatches.map((match) => parseEuro(match[1])).filter((price) => price !== null))];
  if (prices.length !== 1) return pending(target, "El precio IVA por unidad no aparece claramente en la ficha principal.", { observedReference, pageTitle: title });
  const stockValues = [...new Set([...body.matchAll(/(\d+)\s+en stock en\s+Obramat Murcia/gi)].map((match) => Number(match[1])))];
  if (stockValues.length !== 1) {
    return pending(target, "No se muestra una cantidad de stock única para el almacén comprobado.", { observedReference, pageTitle: title, sourcePrice: prices[0] });
  }
  if (stockValues[0] === 0) {
    return pending(target, "La ficha indica que no hay unidades en stock en el almacén comprobado.", { observedReference, pageTitle: title, sourcePrice: prices[0] });
  }

  return {
    ...target,
    status: "verified",
    observedReference,
    pageTitle: title,
    sourcePrice: prices[0],
    priceUnit: "unidad",
    priceIncludesVat: true,
    checkedStore: OBRAMAT_STORE,
    landedUrl,
  };
}

async function readFerrocano(page, target, landedUrl) {
  const title = (await page.locator("h1").first().innerText({ timeout: 5000 }).catch(() => "")).trim();
  const body = await visibleText(page).catch(() => "");
  if (checkCloudflare(body)) return pending(target, "La página muestra una verificación de seguridad; no se intenta evitarla.");
  if (!title || !landedUrl.endsWith(".html")) return pending(target, "No se pudo confirmar una ficha de producto visible.");

  const detailsTab = page.getByRole("tab", { name: "Detalles del producto", exact: true });
  if (await detailsTab.count().catch(() => 0)) await detailsTab.click().catch(() => {});
  const skuText = (await page.locator('[itemprop="sku"]').first().innerText({ timeout: 5000 }).catch(() => "")).trim();
  const skuMatch = skuText.match(/(?:referencia\s*:?)?\s*([A-Z0-9-]{4,})/i);
  if (!skuMatch) return pending(target, "La ficha no muestra una referencia de proveedor legible.", { pageTitle: title });
  const observedReference = skuMatch[1].trim();
  if (observedReference !== target.supplierReference) {
    return pending(target, "La referencia visible no coincide con supplierReference.", { observedReference, pageTitle: title });
  }

  const priceElement = page.locator(".product-price").first();
  const visiblePriceText = (await priceElement.innerText({ timeout: 5000 }).catch(() => "")).trim();
  const visiblePriceOptions = visiblePrices(visiblePriceText);
  const machinePrice = await page.locator('[itemprop="price"]').first().getAttribute("content", { timeout: 3000 }).catch(() => null);
  const machinePriceValue = parseEuro(machinePrice);
  if (visiblePriceOptions.length !== 1 || machinePriceValue === null || visiblePriceOptions[0] !== machinePriceValue) {
    return pending(target, "El precio visible no es único o no coincide con el valor de la ficha.", { observedReference, pageTitle: title, visiblePriceText });
  }

  const vatIncluded = /impuestos incluidos/i.test(body);
  const vatExcluded = /impuestos (?:no )?excluidos|sin\s+IVA/i.test(body);
  if (vatIncluded === vatExcluded) {
    return pending(target, "La ficha no permite determinar con claridad si el precio incluye impuestos.", { observedReference, pageTitle: title, visiblePriceText });
  }
  const addToCart = page.getByRole("button", { name: /añadir al carrito/i }).first();
  const canAddToCart = (await addToCart.count().catch(() => 0)) > 0
    && await addToCart.isVisible().catch(() => false)
    && await addToCart.isEnabled().catch(() => false);
  if (!/Cantidad\s*:/i.test(body) || !canAddToCart) {
    return pending(target, "La ficha no muestra una compra activa por unidad.", { observedReference, pageTitle: title, visiblePriceText });
  }

  return {
    ...target,
    status: "verified",
    observedReference,
    pageTitle: title,
    sourcePrice: visiblePriceOptions[0],
    priceUnit: "unidad",
    priceIncludesVat: vatIncluded,
    landedUrl,
  };
}

async function checkTarget(page, target, urlCache) {
  if (!target.supplierReference) return pending(target, "Falta supplierReference en el catálogo.");
  if (!target.sourceUrl) return pending(target, "Falta la URL de proveedor en el catálogo.");
  const checkedUrl = directProductUrl(target.supplier, target.sourceUrl);
  if (!checkedUrl.ok) return pending(target, checkedUrl.reason);

  const cacheKey = `${target.supplier}\n${checkedUrl.url}`;
  let extraction = urlCache.get(cacheKey);
  if (!extraction) {
    try {
      const response = await page.goto(checkedUrl.url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await page.locator("h1").first().waitFor({ state: "visible", timeout: 7000 }).catch(() => {});
      let statusCode = response?.status() ?? null;
      const landedUrl = page.url();
      const pageHost = normalizedHost(new URL(landedUrl).hostname);
      const expectedHost = target.supplier === "Obramat" ? "obramat.es" : "ferrocanosuministros.es";
      let body = await visibleText(page).catch(() => "");
      if (checkCloudflare(body) && options.headless !== true) {
        for (let attempt = 0; attempt < 15 && checkCloudflare(body); attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          body = await visibleText(page).catch(() => "");
        }
        if (checkCloudflare(body) && !challengePrompted.has(target.supplier)) {
          challengePrompted.add(target.supplier);
          await waitForManualCheck("La web muestra una comprobación de seguridad en Chrome. Complétala solo si la propia página lo solicita; no se resolverá automáticamente.");
          body = await visibleText(page).catch(() => "");
        }
        if (!checkCloudflare(body)) statusCode = null;
      }
      if (pageHost !== expectedHost) {
        extraction = { status: "pending", reason: "La navegación terminó fuera del dominio del proveedor." };
      } else if (checkCloudflare(body)) {
        extraction = { status: "pending", reason: `La página sigue mostrando una verificación de seguridad (HTTP ${statusCode ?? "sin estado"}); se dejó pendiente.` };
      } else if (statusCode >= 400) {
        extraction = { status: "pending", reason: `La ficha respondió con HTTP ${statusCode}.` };
      } else {
        extraction = target.supplier === "Obramat"
          ? await readObramat(page, target, landedUrl)
          : await readFerrocano(page, target, landedUrl);
        extraction = { ...extraction, sourceUrl: checkedUrl.url, landedUrl };
      }
    } catch (error) {
      extraction = { status: "pending", reason: `No se pudo leer la ficha: ${error instanceof Error ? error.message : String(error)}` };
    }
    urlCache.set(cacheKey, extraction);
    await new Promise((resolve) => setTimeout(resolve, 900));
  }

  if (extraction.status !== "verified") return pending(target, extraction.reason, { sourceUrl: checkedUrl.url, landedUrl: extraction.landedUrl });
  if (extraction.observedReference !== target.supplierReference) {
    return pending(target, "La URL ya comprobada muestra otra referencia.", {
      observedReference: extraction.observedReference,
      sourceUrl: checkedUrl.url,
      pageTitle: extraction.pageTitle,
    });
  }
  return {
    ...target,
    status: "verified",
    observedReference: extraction.observedReference,
    pageTitle: extraction.pageTitle,
    sourcePrice: extraction.sourcePrice,
    priceUnit: extraction.priceUnit,
    priceIncludesVat: extraction.priceIncludesVat,
    sourceUrl: checkedUrl.url,
    landedUrl: extraction.landedUrl,
    checkedAt: new Date().toISOString(),
  };
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function reportCsv(rows) {
  const columns = ["estado", "proveedor", "referencia_proveedor", "referencia_observada", "producto", "precio_publicado", "unidad", "incluye_impuestos", "url", "fecha_comprobacion", "motivo"];
  return [columns, ...rows.map((row) => [
    row.status, row.supplier, row.supplierReference, row.observedReference, row.productName,
    row.sourcePrice, row.priceUnit, row.priceIncludesVat, row.sourceUrl, row.checkedAt, row.reason,
  ])].map((line) => line.map(csvCell).join(";")).join("\r\n");
}

async function main() {
  const products = JSON.parse(await readFile(catalogPath, "utf8"));
  if (!Array.isArray(products)) throw new Error("El catálogo debe ser una lista JSON de productos.");
  await mkdir(outDirectory, { recursive: true });
  await mkdir(browserProfile, { recursive: true });
  const context = await chromium.launchPersistentContext(browserProfile, {
    headless: options.headless === true,
    channel: "chrome",
    locale: "es-ES",
  });
  const page = context.pages()[0] ?? await context.newPage();
  page.setDefaultNavigationTimeout(25000);
  const allResults = [];
  try {
    for (const supplier of PROVIDERS) {
      const targets = targetsFor(products, supplier);
      const structurallyEligible = targets.filter((target) =>
        target.supplierReference && target.sourceUrl && directProductUrl(supplier, target.sourceUrl).ok,
      ).length;
      const duplicateReferences = new Set(targets.filter((target) => target.supplierReference)
        .reduce((groups, target) => groups.set(target.supplierReference, (groups.get(target.supplierReference) ?? 0) + 1), new Map())
        .entries().filter(([, count]) => count > 1).map(([reference]) => reference));
      const urlCache = new Map();
      let forbiddenResponses = 0;
      let providerBlockedReason = "";
      const results = [];
      for (let index = 0; index < targets.length; index += 1) {
        const target = targets[index];
        let result;
        if (!target.supplierReference) result = pending(target, "Falta supplierReference en el catálogo.");
        else if (!target.sourceUrl) result = pending(target, "Falta la URL de proveedor en el catálogo.");
        else if (duplicateReferences.has(target.supplierReference)) {
          result = pending(target, "La supplierReference aparece en más de un destino del catálogo.");
        } else if (providerBlockedReason && directProductUrl(supplier, target.sourceUrl).ok) {
          result = pending(target, providerBlockedReason);
        } else {
          result = await checkTarget(page, target, urlCache);
          if (/HTTP 403|verificación de seguridad/i.test(result.reason ?? "")) forbiddenResponses += 1;
          if (forbiddenResponses >= 2) {
            providerBlockedReason = "El proveedor devolvió HTTP 403 en dos fichas; se detuvieron más visitas por seguridad. Reintenta cuando el acceso visible funcione.";
          }
        }
        results.push(result);
        stdout.write(`${supplier} ${index + 1}/${targets.length}: ${result.status} ${target.supplierReference || "(sin referencia)"}\n`);
      }

      const verified = results.filter((row) => row.status === "verified");
      const feed = {
        supplier,
        priceDate: checkDate,
        sourceUrl: PROVIDER_ROOTS[supplier],
        rows: verified.map((row) => ({
          supplierReference: row.supplierReference,
          sourcePrice: row.sourcePrice,
          priceUnit: row.priceUnit,
          priceIncludesVat: row.priceIncludesVat,
          sourceUrl: row.sourceUrl,
        })),
      };
      const proposal = buildPriceUpdateProposal(products, feed, { sourceFile: "automatic-visible-page-check" });
      const prefix = supplier.toLocaleLowerCase("es");
      await writeFile(path.join(outDirectory, `${prefix}-snapshot.json`), `${JSON.stringify(feed, null, 2)}\n`, "utf8");
      await writeFile(path.join(outDirectory, `${prefix}-proposal.json`), `${JSON.stringify(proposal, null, 2)}\n`, "utf8");
      await writeFile(path.join(outDirectory, `${prefix}-proposal.csv`), proposalCsv(proposal), "utf8");
      allResults.push(...results);
      const pct = targets.length ? ((verified.length / targets.length) * 100).toFixed(1) : "0.0";
      const eligiblePct = targets.length ? ((structurallyEligible / targets.length) * 100).toFixed(1) : "0.0";
      stdout.write(`${supplier}: verificadas ${verified.length}/${targets.length} (${pct}%); con referencia y URL de ficha ${structurallyEligible}/${targets.length} (${eligiblePct}%).\n`);
    }
  } finally {
    await context.close();
  }

  await writeFile(path.join(outDirectory, "pendientes.json"), `${JSON.stringify(allResults.filter((row) => row.status !== "verified"), null, 2)}\n`, "utf8");
  await writeFile(path.join(outDirectory, "informe.csv"), reportCsv(allResults), "utf8");
  stdout.write(`\nSnapshots, propuestas e informe: ${outDirectory}\n`);
  stdout.write("No se modificó el catálogo. Para revisar y aplicar, usa la propuesta generada con catalog:prices -- apply --proposal <archivo> y confirma en el paso habitual.\n");
}

try {
  await main();
} catch (error) {
  stdout.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
