import { readFile, writeFile } from "node:fs/promises";

const file = "FontaTicket_Catalogo_CORREGIDO/productos.json";
const products = JSON.parse(await readFile(file, "utf8"));
const product = products.find((item) => item.family === "PVC presion" && item.nombre === "Derivaciones");
if (!product) throw new Error("No se encontró el producto Derivaciones de PVC presión");

const inch = (value) => value;
const newVariants = [
  ...[
    ["90920", 20, 0.48], ["90925", 25, 0.62], ["90932", 32, 1.00],
    ["90940", 40, 1.49], ["90950", 50, 2.24], ["90963", 63, 2.72],
    ["90975", 75, 5.84], ["90990", 90, 10.67], ["90991", 110, 16.73],
  ].map(([supplierReference, mm, price]) => ({
    reference: "P-DPHH90",
    price,
    description: "Derivación PVC presión H-H 90°",
    supplierReference,
    attributes: {
      Tipo: "H-H",
      Medida: `${mm} mm`,
      Configuración: "90°",
      Conexión: "Hembra-Hembra",
    },
  })),
  ...[
    ["91020", 20, "1/2", 0.93], ["91025", 25, "3/4", 1.07],
    ["91026", 25, "1/2", 1.07], ["91032", 32, "1", 1.53],
    ["91040", 40, "1 1/4", 2.65], ["91050", 50, "1 1/2", 2.86],
    ["91063", 63, "2", 4.00], ["91075", 75, "2 1/2", 19.29],
    ["91090", 90, "3", 28.71], ["91091", 110, "4", 46.84],
  ].map(([supplierReference, mm, threadSize, price]) => ({
    reference: "P-DPRH90",
    price,
    description: "Derivación PVC presión 90° con rosca hembra",
    supplierReference,
    attributes: {
      Tipo: "Rosca hembra",
      Medida: `${mm} mm`,
      Pulgadas: inch(threadSize),
      Configuración: "90°",
      Conexión: "Encolar × rosca Hembra",
    },
  })),
];

const known = new Set((product.variants ?? []).map((variant) => variant.supplierReference).filter(Boolean));
const additions = newVariants.filter((variant) => !known.has(variant.supplierReference));

// Normalize this product's millimetre label to the catalog-wide variant convention.
for (const variant of product.variants ?? []) {
  if (Object.hasOwn(variant.attributes ?? {}, "Diámetro")) {
    variant.attributes.Medida = variant.attributes["Diámetro"];
    delete variant.attributes["Diámetro"];
  }
}

product.variants.push(...additions);
const typeOrder = new Map([["H-H", 0], ["Rosca hembra", 1], ["Doble", 2]]);
const numberFrom = (value) => Number.parseFloat(String(value).replace(",", ".")) || 0;
product.variants.sort((a, b) =>
  (typeOrder.get(a.attributes?.Tipo) ?? 99) - (typeOrder.get(b.attributes?.Tipo) ?? 99)
  || numberFrom(a.attributes?.Medida) - numberFrom(b.attributes?.Medida)
  || numberFrom(a.attributes?.Pulgadas) - numberFrom(b.attributes?.Pulgadas),
);
await writeFile(file, `${JSON.stringify(products, null, 2)}\n`, "utf8");
console.log(`Añadidas ${additions.length} variantes; total: ${product.variants.length}`);
