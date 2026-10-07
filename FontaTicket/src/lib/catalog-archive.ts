import JSZip from "jszip";
import type { Product } from "../types";
import { newId } from "./id";

interface ArchiveProduct {
  id: string | null;
  reference: string | null;
  nombre: string | null;
  precio: number | null;
  foto: string | null;
  category: string | null;
  supplier: string | null;
  family: string | null;
  type: string | null;
  size: string | null;
  connection: string | null;
  variant: string | null;
  length: string | null;
  manufacturerReference: string | null;
  sourceUrl: string | null;
  photoSourceUrl: string | null;
  priceDate: string | null;
  priceSource: string | null;
  sourcePrice: number | null;
  priceUnit: string | null;
  priceIncludesVat: boolean | null;
  brand: string | null;
  model: string | null;
  supplierReference: string | null;
  priceStatus: string | null;
  priceMethod: string | null;
  catalogFamilyOrder: number | null;
  catalogProductOrder: number | null;
  variants?: ArchiveVariant[];
}

interface ArchiveVariant {
  id: string | null;
  reference: string | null;
  supplier: string | null;
  supplierReference: string | null;
  price: number;
  sourcePrice: number | null;
  priceDate: string | null;
  priceSource: string | null;
  sourceUrl: string | null;
  priceUnit: string | null;
  priceIncludesVat: boolean | null;
  priceMethod: string | null;
  description: string | null;
  photo: string | null;
  attributes: Record<string, unknown>;
}

function hasNameOrPrice(product: { nombre: string | null; precio: number | null; variants?: unknown[] }): boolean {
  return Boolean(product.nombre?.trim()) || product.precio !== null || Boolean(product.variants?.length);
}

function imageExtension(dataUrl: string): string {
  const mimeType = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/)?.[1]?.toLowerCase();
  if (!mimeType) throw new Error("Una foto del catálogo no tiene un formato de imagen válido.");
  return mimeType === "jpeg" ? "jpg" : mimeType === "svg+xml" ? "svg" : mimeType;
}

function decodeDataUrl(dataUrl: string): Uint8Array {
  const encoded = dataUrl.split(",")[1];
  if (!encoded) throw new Error("No se pudo leer una foto del catálogo.");
  const binary = atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function safeFilename(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "producto";
}

export async function exportCatalogArchive(products: Product[]): Promise<Blob> {
  const zip = new JSZip();
  zip.folder("imagenes");
  const archiveImage = (productId: string, reference: string | null, photo: string | null, variantId: string) => {
    if (!photo) return photo;
    const filename = `${safeFilename(reference ?? "")}-${safeFilename(productId)}-${safeFilename(variantId)}.${imageExtension(photo)}`;
    const path = `imagenes/${filename}`;
    zip.file(path, decodeDataUrl(photo));
    return path;
  };
  const archivedProducts: ArchiveProduct[] = products.filter(hasNameOrPrice).map((product) => {
    const foto = archiveImage(product.id, product.reference, product.foto, "producto");
    const variants = product.variants?.map((variant, index) => ({
      id: variant.id ?? null,
      reference: variant.reference ?? null,
      supplier: variant.supplier ?? null,
      supplierReference: variant.supplierReference ?? null,
      price: variant.price,
      sourcePrice: variant.sourcePrice ?? null,
      priceDate: variant.priceDate ?? null,
      priceSource: variant.priceSource ?? null,
      sourceUrl: variant.sourceUrl ?? null,
      priceUnit: variant.priceUnit ?? null,
      priceIncludesVat: variant.priceIncludesVat ?? null,
      priceMethod: variant.priceMethod ?? null,
      description: variant.description ?? null,
      photo: archiveImage(product.id, variant.reference ?? null, variant.photo ?? null, `variante-${index + 1}`),
      attributes: variant.attributes,
    }));
    return {
      id: product.id,
      reference: product.reference,
      nombre: product.nombre,
      precio: product.precio,
      foto,
      category: product.category ?? null,
      supplier: product.supplier ?? null,
      family: product.family ?? null,
      type: product.type ?? null,
      size: product.size ?? null,
      connection: product.connection ?? null,
      variant: product.variant ?? null,
      length: product.length ?? null,
      manufacturerReference: product.manufacturerReference ?? null,
      sourceUrl: product.sourceUrl ?? null,
      photoSourceUrl: product.photoSourceUrl ?? null,
      priceDate: product.priceDate ?? null,
      priceSource: product.priceSource ?? null,
      sourcePrice: product.sourcePrice ?? null,
      priceUnit: product.priceUnit ?? null,
      priceIncludesVat: product.priceIncludesVat ?? null,
      brand: product.brand ?? null,
      model: product.model ?? null,
      supplierReference: product.supplierReference ?? null,
      priceStatus: product.priceStatus ?? null,
      priceMethod: product.priceMethod ?? null,
      catalogFamilyOrder: product.catalogFamilyOrder ?? null,
      catalogProductOrder: product.catalogProductOrder ?? null,
      ...(variants ? { variants } : {}),
    };
  });
  zip.file("productos.json", JSON.stringify(archivedProducts, null, 2));
  return zip.generateAsync({ type: "blob", mimeType: "application/zip" });
}

function validateArchivedProduct(value: unknown, index: number): ArchiveProduct {
  if (typeof value !== "object" || value === null) {
    throw new Error(`El producto ${index + 1} de productos.json no es válido.`);
  }
  const item = value as Record<string, unknown>;
  const archivedReference = item.reference === undefined ? item.referencia : item.reference;
  const archivedName = item.nombre === undefined ? item.name : item.nombre;
  const archivedPrice = item.precio === undefined ? item.price : item.precio;
  const archivedPhoto = item.foto === undefined ? item.photo : item.foto;
  if (archivedReference !== null && archivedReference !== undefined && typeof archivedReference !== "string") {
    throw new Error(`La referencia del producto ${index + 1} no es válida.`);
  }
  const reference = typeof archivedReference === "string" ? archivedReference : null;
  if (archivedName !== null && archivedName !== undefined && typeof archivedName !== "string") {
    throw new Error(`El nombre del producto ${index + 1} no es válido.`);
  }
  if (archivedPrice !== null && archivedPrice !== undefined
    && (typeof archivedPrice !== "number" || !Number.isFinite(archivedPrice))) {
    throw new Error(`El precio del producto ${index + 1} no es válido.`);
  }
  if (archivedPhoto !== null && archivedPhoto !== undefined && typeof archivedPhoto !== "string") {
    throw new Error(`La foto del producto ${index + 1} no es válida.`);
  }
  if (item.variants !== undefined && !Array.isArray(item.variants)) {
    throw new Error(`Las variantes del producto ${index + 1} no son válidas.`);
  }
  const variants = Array.isArray(item.variants)
    ? item.variants.map((value, variantIndex) => validateArchivedVariant(value, index, variantIndex))
    : undefined;
  const category = item.category === undefined ? item.categoria : item.category;
  const supplier = item.supplier === undefined ? item.proveedor : item.supplier;
  if (category !== null && category !== undefined && typeof category !== "string") {
    throw new Error(`La categoría del producto ${index + 1} no es válida.`);
  }
  if (supplier !== null && supplier !== undefined && typeof supplier !== "string") {
    throw new Error(`El proveedor del producto ${index + 1} no es válido.`);
  }
  const stringField = (field: string): string | null => {
    const fieldValue = item[field];
    if (fieldValue !== null && fieldValue !== undefined && typeof fieldValue !== "string") {
      throw new Error(`El campo ${field} del producto ${index + 1} no es válido.`);
    }
    return typeof fieldValue === "string" ? fieldValue : null;
  };
  const priceIncludesVat = item.priceIncludesVat;
  if (priceIncludesVat !== null && priceIncludesVat !== undefined && typeof priceIncludesVat !== "boolean") {
    throw new Error(`El campo priceIncludesVat del producto ${index + 1} no es válido.`);
  }
  const sourcePrice = item.sourcePrice;
  if (sourcePrice !== null && sourcePrice !== undefined
    && (typeof sourcePrice !== "number" || !Number.isFinite(sourcePrice))) {
    throw new Error(`El campo sourcePrice del producto ${index + 1} no es válido.`);
  }
  for (const field of ["catalogFamilyOrder", "catalogProductOrder"] as const) {
    const order = item[field];
    if (order !== null && order !== undefined && (typeof order !== "number" || !Number.isFinite(order))) {
      throw new Error(`El campo ${field} del producto ${index + 1} no es válido.`);
    }
  }
  const metadata = {
    family: stringField("family"),
    type: stringField("type"),
    size: stringField("size"),
    connection: stringField("connection"),
    variant: stringField("variant"),
    length: stringField("length"),
    manufacturerReference: stringField("manufacturerReference"),
    sourceUrl: stringField("sourceUrl"),
    photoSourceUrl: stringField("photoSourceUrl"),
    priceDate: stringField("priceDate"),
    priceSource: typeof item.priceSource === "string" ? item.priceSource : null,
    sourcePrice: typeof sourcePrice === "number" ? sourcePrice : null,
    priceUnit: typeof item.priceUnit === "string" ? item.priceUnit : null,
    priceIncludesVat: typeof priceIncludesVat === "boolean" ? priceIncludesVat : null,
    brand: stringField("brand"),
    model: stringField("model"),
    supplierReference: stringField("supplierReference"),
    priceStatus: stringField("priceStatus"),
    priceMethod: stringField("priceMethod"),
    catalogFamilyOrder: typeof item.catalogFamilyOrder === "number" ? item.catalogFamilyOrder : null,
    catalogProductOrder: typeof item.catalogProductOrder === "number" ? item.catalogProductOrder : null,
  };
  const id = typeof item.id === "string" && item.id.trim() ? item.id : null;
  return {
    id,
    reference,
    nombre: typeof archivedName === "string" ? archivedName : null,
    precio: typeof archivedPrice === "number" ? archivedPrice : null,
    foto: typeof archivedPhoto === "string" ? archivedPhoto : null,
    category: typeof category === "string" ? category : null,
    supplier: typeof supplier === "string" ? supplier : null,
    ...metadata,
    variants,
  };
}

function validateArchivedVariant(value: unknown, productIndex: number, variantIndex: number): ArchiveVariant {
  const number = variantIndex + 1;
  if (typeof value !== "object" || value === null) {
    throw new Error(`La variante ${number} del producto ${productIndex + 1} no es válida.`);
  }
  const item = value as Record<string, unknown>;
  const referenceValue = item.reference === undefined ? item.referencia : item.reference;
  const priceValue = item.price === undefined ? item.precio : item.price;
  if (referenceValue !== null && referenceValue !== undefined && typeof referenceValue !== "string") {
    throw new Error(`La referencia de la variante ${number} del producto ${productIndex + 1} no es válida.`);
  }
  if (item.supplierReference !== null && item.supplierReference !== undefined && typeof item.supplierReference !== "string") {
    throw new Error(`La referencia del proveedor de la variante ${number} del producto ${productIndex + 1} no es válida.`);
  }
  if (item.supplier !== null && item.supplier !== undefined && typeof item.supplier !== "string") {
    throw new Error(`El proveedor de la variante ${number} del producto ${productIndex + 1} no es válido.`);
  }
  if (typeof priceValue !== "number" || !Number.isFinite(priceValue)) {
    throw new Error(`El precio de la variante ${number} del producto ${productIndex + 1} no es válido.`);
  }
  const sourcePrice = item.sourcePrice;
  if (sourcePrice !== null && sourcePrice !== undefined
    && (typeof sourcePrice !== "number" || !Number.isFinite(sourcePrice))) {
    throw new Error(`El precio publicado de la variante ${number} del producto ${productIndex + 1} no es válido.`);
  }
  const priceIncludesVat = item.priceIncludesVat;
  if (priceIncludesVat !== null && priceIncludesVat !== undefined && typeof priceIncludesVat !== "boolean") {
    throw new Error(`El impuesto de la variante ${number} del producto ${productIndex + 1} no es válido.`);
  }
  const photoValue = item.photo === undefined ? item.foto : item.photo;
  const descriptionValue = item.description === undefined
    ? item.descripcion === undefined
      ? item.name === undefined ? item.nombre : item.name
      : item.descripcion
    : item.description;
  if (photoValue !== null && photoValue !== undefined && typeof photoValue !== "string") {
    throw new Error(`La fotografía de la variante ${number} del producto ${productIndex + 1} no es válida.`);
  }
  if (descriptionValue !== null && descriptionValue !== undefined && typeof descriptionValue !== "string") {
    throw new Error(`La descripción de la variante ${number} del producto ${productIndex + 1} no es válida.`);
  }
  const optionsValue = item.attributes === undefined ? item.options : item.attributes;
  if (optionsValue !== undefined
    && (typeof optionsValue !== "object" || optionsValue === null || Array.isArray(optionsValue))) {
    throw new Error(`Los datos de la variante ${number} del producto ${productIndex + 1} no son válidos.`);
  }
  const attributes: Record<string, unknown> = optionsValue === undefined
    ? {}
    : { ...(optionsValue as Record<string, unknown>) };
  const reserved = new Set([
    "id", "reference", "referencia", "price", "precio", "photo", "foto",
    "description", "descripcion", "name", "nombre", "attributes", "options",
    "supplier", "supplierReference", "sourcePrice", "priceDate", "priceSource", "sourceUrl", "priceUnit", "priceIncludesVat", "priceMethod",
  ]);
  for (const [key, attribute] of Object.entries(item)) {
    if (!reserved.has(key) && attribute !== null && ["string", "number", "boolean"].includes(typeof attribute)) {
      attributes[key] = attribute;
    }
  }
  return {
    id: typeof item.id === "string" && item.id.trim() ? item.id : null,
    reference: typeof referenceValue === "string" ? referenceValue : null,
    supplier: typeof item.supplier === "string" ? item.supplier : null,
    supplierReference: typeof item.supplierReference === "string" ? item.supplierReference : null,
    price: priceValue,
    sourcePrice: typeof sourcePrice === "number" ? sourcePrice : null,
    priceDate: typeof item.priceDate === "string" ? item.priceDate : null,
    priceSource: typeof item.priceSource === "string" ? item.priceSource : null,
    sourceUrl: typeof item.sourceUrl === "string" ? item.sourceUrl : null,
    priceUnit: typeof item.priceUnit === "string" ? item.priceUnit : null,
    priceIncludesVat: typeof priceIncludesVat === "boolean" ? priceIncludesVat : null,
    priceMethod: typeof item.priceMethod === "string" ? item.priceMethod : null,
    description: typeof descriptionValue === "string" ? descriptionValue : null,
    photo: typeof photoValue === "string" ? photoValue : null,
    attributes,
  };
}

async function restoreImage(
  zip: JSZip,
  imagePrefix: string,
  photoPath: string | null,
  reference: string | null,
): Promise<string | null> {
  if (!photoPath) return photoPath;
  const [directory, filename, extraPath] = photoPath.split("/");
  if ((directory !== "imagenes" && directory !== "images") || !filename || filename === "." || filename === ".." || extraPath !== undefined || filename.includes("\\")) {
    throw new Error(`La ruta de imagen del producto ${reference ?? ""} no es válida.`);
  }
  const image = zip.file(`${imagePrefix}${photoPath}`);
  if (!image) throw new Error(`Falta la imagen ${photoPath} del producto ${reference ?? ""}.`);
  const bytes = await image.async("uint8array");
  const extension = photoPath.split(".").pop()?.toLowerCase();
  const mimeType = extension === "jpg" || extension === "jpeg"
    ? "image/jpeg"
    : extension === "svg"
      ? "image/svg+xml"
      : `image/${extension || "png"}`;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

export async function importCatalogArchive(file: Blob): Promise<Product[]> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("El archivo seleccionado no es un ZIP válido.");
  }

  let jsonPath = "productos.json";
  let jsonFile = zip.file(jsonPath);
  if (!jsonFile) {
    const nestedPaths = Object.keys(zip.files).filter((path) => {
      const parts = path.split("/");
      return !zip.files[path].dir
        && parts.length === 2
        && parts[1] === "productos.json"
        && parts[0] !== "."
        && parts[0] !== ".."
        && !parts[0].includes("\\");
    });
    if (nestedPaths.length === 1) {
      jsonPath = nestedPaths[0];
      jsonFile = zip.file(jsonPath);
    }
  }
  if (!jsonFile) throw new Error("El ZIP no contiene productos.json.");
  const imagePrefix = jsonPath === "productos.json" ? "" : jsonPath.slice(0, -"productos.json".length);
  let contents: unknown;
  try {
    contents = JSON.parse(await jsonFile.async("string")) as unknown;
  } catch {
    throw new Error("No se pudo leer productos.json. Comprueba que el JSON sea válido.");
  }
  if (!Array.isArray(contents)) throw new Error("productos.json debe contener una lista de productos.");

  const archivedProducts = contents.map(validateArchivedProduct).filter(hasNameOrPrice);
  const products: Product[] = [];
  const usedIds = new Set<string>();
  for (const archived of archivedProducts) {
    const foto = await restoreImage(zip, imagePrefix, archived.foto, archived.reference);
    const variants = await Promise.all((archived.variants ?? []).map(async (variant) => ({
      reference: variant.reference,
      ...(variant.id ? { id: variant.id } : {}),
      ...(variant.supplier ? { supplier: variant.supplier } : {}),
      ...(variant.supplierReference ? { supplierReference: variant.supplierReference } : {}),
      price: variant.price,
      ...(variant.sourcePrice !== null ? { sourcePrice: variant.sourcePrice } : {}),
      ...(variant.priceDate ? { priceDate: variant.priceDate } : {}),
      ...(variant.priceSource ? { priceSource: variant.priceSource } : {}),
      ...(variant.sourceUrl ? { sourceUrl: variant.sourceUrl } : {}),
      ...(variant.priceUnit ? { priceUnit: variant.priceUnit } : {}),
      ...(variant.priceIncludesVat !== null ? { priceIncludesVat: variant.priceIncludesVat } : {}),
      ...(variant.priceMethod ? { priceMethod: variant.priceMethod } : {}),
      description: variant.description,
      photo: await restoreImage(zip, imagePrefix, variant.photo, variant.reference),
      attributes: variant.attributes,
    })));
    let id = archived.id ?? newId();
    while (usedIds.has(id)) id = newId();
    usedIds.add(id);
    products.push({
      id,
      reference: archived.reference,
      nombre: archived.nombre,
      precio: archived.precio,
      foto,
      category: archived.category,
      supplier: archived.supplier,
      family: archived.family,
      type: archived.type,
      size: archived.size,
      connection: archived.connection,
      variant: archived.variant,
      length: archived.length,
      manufacturerReference: archived.manufacturerReference,
      sourceUrl: archived.sourceUrl,
      photoSourceUrl: archived.photoSourceUrl,
      priceDate: archived.priceDate,
      priceSource: archived.priceSource,
      sourcePrice: archived.sourcePrice,
      priceUnit: archived.priceUnit,
      priceIncludesVat: archived.priceIncludesVat,
      brand: archived.brand,
      model: archived.model,
      supplierReference: archived.supplierReference,
      priceStatus: archived.priceStatus,
      priceMethod: archived.priceMethod,
      catalogFamilyOrder: archived.catalogFamilyOrder,
      catalogProductOrder: archived.catalogProductOrder,
      ...(archived.variants !== undefined ? { variants } : {}),
    });
  }
  return products;
}
