import type { Product, ProductVariant } from "../types";

function familyKey(product: Product): string {
  return product.family?.trim() || product.category?.trim() || "Sin familia";
}

function hasOrder(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizedName(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[\s_-]+/g, "");
}

function numberParts(value: unknown): number[] {
  const tokens = String(value ?? "").match(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?/g) ?? [];
  return tokens.map((token) => {
    if (token.includes("/")) {
      const [whole, fraction] = token.trim().split(/\s+/);
      const [numerator, denominator] = (fraction ?? whole).split("/").map(Number);
      return (fraction ? Number(whole) : 0) + numerator / denominator;
    }
    return Number(token.replace(",", "."));
  });
}

function compareValue(leftValue: unknown, rightValue: unknown): number {
  const left = numberParts(leftValue);
  const right = numberParts(rightValue);
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  if (left.length !== right.length) return left.length - right.length;
  return String(leftValue ?? "").localeCompare(String(rightValue ?? ""), "es", { numeric: true, sensitivity: "base" });
}

function attributePriority(name: string): number {
  const priorities: Record<string, number> = {
    medida: 0,
    diametro: 0,
    pulgadas: 1,
    longitud: 2,
    angulo: 3,
    configuracion: 4,
    conexion: 4,
    tipo: 5,
    presentacion: 6,
    modelo: 7,
  };
  return priorities[normalizedName(name)] ?? 8;
}

function compareVariants(left: ProductVariant, right: ProductVariant): number {
  const keys = [...new Set([
    ...Object.keys(left.attributes ?? {}),
    ...Object.keys(right.attributes ?? {}),
  ])]
    .filter((key) => left.attributes?.[key] != null || right.attributes?.[key] != null)
    .sort((a, b) => attributePriority(a) - attributePriority(b) || normalizedName(a).localeCompare(normalizedName(b)));

  for (const key of keys) {
    const leftValue = left.attributes?.[key];
    const rightValue = right.attributes?.[key];
    if (leftValue == null || rightValue == null) return leftValue == null ? -1 : 1;
    const difference = compareValue(leftValue, rightValue);
    if (difference) return difference;
  }
  return String(left.reference ?? "").localeCompare(String(right.reference ?? ""), "es", { numeric: true });
}

export function compareCatalogOrder(left: Product, right: Product): number {
  const leftHasOrder = hasOrder(left.catalogFamilyOrder) && hasOrder(left.catalogProductOrder);
  const rightHasOrder = hasOrder(right.catalogFamilyOrder) && hasOrder(right.catalogProductOrder);
  if (leftHasOrder !== rightHasOrder) return leftHasOrder ? -1 : 1;
  if (leftHasOrder && rightHasOrder) {
    return left.catalogFamilyOrder! - right.catalogFamilyOrder!
      || left.catalogProductOrder! - right.catalogProductOrder!
      || (left.nombre ?? "").localeCompare(right.nombre ?? "", "es");
  }
  return (left.nombre ?? "").localeCompare(right.nombre ?? "", "es");
}

/** Keep explicit catalog positions and append new items to their family. */
export function assignCatalogOrdering(products: readonly Product[]): Product[] {
  const familyOrders = new Map<string, number>();
  let nextFamilyOrder = 0;
  for (const product of products) {
    if (!hasOrder(product.catalogFamilyOrder)) continue;
    const family = familyKey(product);
    familyOrders.set(family, Math.min(familyOrders.get(family) ?? product.catalogFamilyOrder, product.catalogFamilyOrder));
    nextFamilyOrder = Math.max(nextFamilyOrder, product.catalogFamilyOrder);
  }

  const nextProductOrder = new Map<string, number>();
  for (const product of products) {
    if (hasOrder(product.catalogProductOrder)) {
      const family = familyKey(product);
      nextProductOrder.set(family, Math.max(nextProductOrder.get(family) ?? 0, product.catalogProductOrder));
    }
  }

  return products.map((product) => {
    const family = familyKey(product);
    if (!familyOrders.has(family)) familyOrders.set(family, ++nextFamilyOrder);
    let productOrder = product.catalogProductOrder;
    if (!hasOrder(productOrder)) {
      productOrder = (nextProductOrder.get(family) ?? 0) + 1;
      nextProductOrder.set(family, productOrder);
    }
    return {
      ...product,
      catalogFamilyOrder: product.catalogFamilyOrder ?? familyOrders.get(family)!,
      catalogProductOrder: productOrder,
      variants: product.variants?.slice().sort(compareVariants),
    };
  }).sort(compareCatalogOrder);
}
