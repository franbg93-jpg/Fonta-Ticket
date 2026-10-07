import type { Product, ProductVariant } from "../types";
import { matchesSearch, normalizeSearchText } from "./core";

export interface VariantSelectorOption {
  value: string;
  label: string;
}

export interface VariantSelector {
  key: string;
  label: string;
  options: VariantSelectorOption[];
}

const variantChoiceKey = "__variant";
const hiddenAttributeNames = new Set([
  "code",
  "codigo",
  "codigotecnoagua",
  "ean",
  "id",
  "mix",
  "photo",
  "precio",
  "price",
  "reference",
  "referencia",
  "descripcioncatalogo",
]);

function normalizeAttributeName(name: string): string {
  return normalizeSearchText(name).replace(/[\s_-]+/g, "");
}

function displayValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return null;
}

function isSelectableAttribute(name: string, value: unknown): boolean {
  const normalized = normalizeAttributeName(name);
  return Boolean(displayValue(value))
    && !hiddenAttributeNames.has(normalized)
    && !normalized.startsWith("codigo")
    && !normalized.startsWith("ean")
    && !normalized.startsWith("id");
}

function selectorLabel(key: string): string {
  const normalized = normalizeAttributeName(key);
  const known: Record<string, string> = {
    acabado: "Acabado",
    finish: "Acabado",
    configuration: "Configuración",
    configuracion: "Configuración",
    connection: "Conexión",
    conexion: "Conexión",
    diameter: "Diámetro",
    diametro: "Diámetro",
    angle: "Ángulo",
    angulo: "Ángulo",
    length: "Longitud",
    longitud: "Longitud",
    measure: "Medida",
    medida: "Medida",
    material: "Material",
    presentation: "Presentación",
    presentacion: "Presentación",
    model: "Modelo",
    modelo: "Modelo",
    type: "Tipo",
    tipo: "Tipo",
  };
  return known[normalized] ?? key.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toLocaleUpperCase("es"));
}

function selectorPriority(key: string): number {
  const normalized = normalizeAttributeName(key);
  if (normalized === "tipo" || normalized === "type") return 0;
  if (normalized === "configuracion" || normalized === "configuration") return 1;
  if (["conexion", "connection"].includes(normalized)) return 2;
  if (["angulo", "angle"].includes(normalized)) return 3;
  if (["pulgadas", "inches"].includes(normalized)) return 4;
  if (["medida", "measure", "diametro", "diameter", "longitud", "length"].includes(normalized)) return 5;
  if (["presentacion", "presentation"].includes(normalized)) return 5;
  return 4;
}

function visibleAttributes(variant: ProductVariant): Array<[string, string]> {
  return Object.entries(variant.attributes)
    .filter(([key, value]) => isSelectableAttribute(key, value))
    .flatMap(([key, value]) => {
      const text = displayValue(value);
      return text ? [[key, text] as [string, string]] : [];
    })
    .sort(([a], [b]) => selectorPriority(a) - selectorPriority(b) || a.localeCompare(b, "es"));
}

function valueForSelector(variant: ProductVariant, key: string): string | null {
  return displayValue(variant.attributes[key]);
}

function fallbackVariantLabel(variant: ProductVariant, index: number): string {
  const details = visibleAttributes(variant).map(([, value]) => value);
  if (variant.description?.trim() && !details.includes(variant.description.trim())) {
    details.unshift(variant.description.trim());
  }
  return details.length ? details.join(" × ") : `Opción ${index + 1}`;
}

export function getVariantSelectors(product: Product): VariantSelector[] {
  const variants = product.variants ?? [];
  if (variants.length < 2) return [];

  const keys = [...new Set(variants.flatMap((variant) =>
    Object.keys(variant.attributes).filter((key) => isSelectableAttribute(key, variant.attributes[key])),
  ))].sort((a, b) => selectorPriority(a) - selectorPriority(b) || a.localeCompare(b, "es"));
  const selectors = keys
    .map((key) => {
      const values = [...new Set(variants.map((variant) => valueForSelector(variant, key)).filter((value): value is string => value !== null))];
      return values.length > 1
        ? { key, label: selectorLabel(key), options: values.map((value) => ({ value, label: value })) }
        : null;
    })
    .filter((selector): selector is VariantSelector => selector !== null);

  if (selectors.length) {
    const combinations = new Set(variants.map((variant) =>
      selectors.map((selector) => valueForSelector(variant, selector.key) ?? "").join("\u001f"),
    ));
    if (combinations.size === variants.length) return selectors;
  }

  const labels = variants.map(fallbackVariantLabel);
  return [{
    key: variantChoiceKey,
    label: "Variante",
    options: labels.map((label, index) => ({
      value: String(index),
      label: labels.filter((candidate) => candidate === label).length > 1
        ? `Opción ${index + 1}`
        : label,
    })),
  }];
}

export function getVariantSelectorOptions(
  product: Product,
  selection: Record<string, string>,
  selectorKey: string,
): VariantSelectorOption[] {
  const selectors = getVariantSelectors(product);
  const selectorIndex = selectors.findIndex((selector) => selector.key === selectorKey);
  const selector = selectors[selectorIndex];
  if (!selector) return [];
  if (selectorKey === variantChoiceKey) return selector.options;

  const priorSelectors = selectors.slice(0, selectorIndex);
  const values = [...new Set((product.variants ?? [])
    .filter((variant) => priorSelectors.every((priorSelector) =>
      !selection[priorSelector.key]
        || valueForSelector(variant, priorSelector.key) === selection[priorSelector.key],
    ))
    .map((variant) => valueForSelector(variant, selectorKey))
    .filter((value): value is string => value !== null))];
  return values.map((value) => ({ value, label: value }));
}

export function updateVariantSelection(
  product: Product,
  selection: Record<string, string>,
  selectorKey: string,
  value: string,
): Record<string, string> {
  const selectors = getVariantSelectors(product);
  const selectedIndex = selectors.findIndex((selector) => selector.key === selectorKey);
  if (selectedIndex < 0) return selection;
  const next = { ...selection, [selectorKey]: value };
  for (const selector of selectors.slice(selectedIndex + 1)) {
    const options = getVariantSelectorOptions(product, next, selector.key);
    if (options.length === 1) {
      next[selector.key] = options[0].value;
    } else if (!options.some((option) => option.value === next[selector.key])) {
      next[selector.key] = "";
    }
  }
  return next;
}

export function initialVariantSelection(product: Product): Record<string, string> {
  if (!product.variants?.length) return {};
  const selectors = getVariantSelectors(product);
  const selection: Record<string, string> = Object.fromEntries(selectors.map((selector) => [selector.key, ""]));
  for (const selector of selectors) {
    const options = getVariantSelectorOptions(product, selection, selector.key);
    if (options.length === 1) selection[selector.key] = options[0].value;
  }
  return selection;
}

export function findSelectedVariant(
  product: Product,
  selection: Record<string, string>,
): ProductVariant | null {
  const variants = product.variants ?? [];
  if (!variants.length) return null;
  const selectors = getVariantSelectors(product);
  if (!selectors.length) return variants[0];
  if (selectors[0].key === variantChoiceKey) {
    const selectedIndex = Number(selection[variantChoiceKey]);
    return Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < variants.length
      ? variants[selectedIndex]
      : null;
  }
  const matches = variants.filter((variant) =>
    selectors.every((selector) =>
      (valueForSelector(variant, selector.key) ?? "") === selection[selector.key],
    ),
  );
  return matches.length === 1 ? matches[0] : null;
}

export function variantTicketDescription(product: Product, variant: ProductVariant): string {
  const selectors = getVariantSelectors(product);
  if (selectors[0]?.key === variantChoiceKey) {
    const index = (product.variants ?? []).indexOf(variant);
    return index >= 0 ? selectors[0].options[index]?.label ?? "" : "";
  }
  const selectedValues = selectors
    .map((selector) => valueForSelector(variant, selector.key))
    .filter((value): value is string => value !== null);
  const description = variant.description?.trim();
  if (description && description !== product.nombre && !selectedValues.includes(description)) {
    selectedValues.push(description);
  }
  return selectedValues.join(" × ");
}

export function productForVariant(product: Product, variant: ProductVariant): Product {
  const detail = variantTicketDescription(product, variant);
  return {
    ...product,
    nombre: detail ? `${product.nombre?.trim() || "Producto"} ${detail}` : product.nombre,
    reference: variant.reference ?? product.reference,
    precio: variant.price,
    foto: product.foto,
    variants: undefined,
  };
}

export function productStartingPrice(product: Product): number | null {
  const prices = (product.variants ?? []).map(({ price }) => price).filter(Number.isFinite);
  if (prices.length) return Math.min(...prices);
  return product.precio;
}

export function productMatchesSearch(product: Product, query: string): boolean {
  const variantValues = (product.variants ?? []).flatMap((variant) => [
    variant.reference,
    variant.description,
    ...Object.entries(variant.attributes)
      .filter(([key]) => !hiddenAttributeNames.has(normalizeAttributeName(key)))
      .map(([, value]) => displayValue(value)),
  ]);
  return matchesSearch(
    query,
    product.nombre,
    product.reference,
    product.category,
    product.supplier,
    ...variantValues,
  );
}
