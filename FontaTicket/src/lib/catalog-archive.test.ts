import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { exportCatalogArchive, importCatalogArchive } from "./catalog-archive";
import type { Product } from "../types";

const products: Product[] = [
  { id: "one", reference: "REF-1", nombre: "Grifo", precio: 18.5, foto: "data:image/png;base64,aGVsbG8=" },
  { id: "two", reference: "REF-2", nombre: "Tubo", precio: 3, foto: null },
];

describe("catalog ZIP", () => {
  it("exports product fields and real image bytes, then restores image associations", async () => {
    const archive = await exportCatalogArchive(products);
    const zip = await JSZip.loadAsync(archive);
    const json = JSON.parse(await zip.file("productos.json")!.async("string")) as Array<Record<string, unknown>>;

    expect(zip.files["imagenes/"]?.dir).toBe(true);
    expect(json.map((item) => item.reference)).toEqual(["REF-1", "REF-2"]);
    expect(json[0].foto).toMatch(/^imagenes\/.+\.png$/);
    expect(json[1].foto).toBeNull();
    expect(await zip.file(String(json[0].foto))!.async("string")).toBe("hello");

    const restored = await importCatalogArchive(archive);
    expect(restored.map(({ reference, nombre, precio }) => ({ reference, nombre, precio }))).toEqual([
      { reference: "REF-1", nombre: "Grifo", precio: 18.5 },
      { reference: "REF-2", nombre: "Tubo", precio: 3 },
    ]);
    expect(restored[0].foto).toBe("data:image/png;base64,aGVsbG8=");
    expect(restored[1].foto).toBeNull();
  });

  it("rejects ZIPs with missing referenced image files", async () => {
    const zip = new JSZip();
    zip.file("productos.json", JSON.stringify([
      { reference: "REF", nombre: "Grifo", precio: 10, foto: "imagenes/falta.png" },
    ]));
    await expect(importCatalogArchive(await zip.generateAsync({ type: "blob" }))).rejects.toThrow("Falta la imagen");
  });

  it("imports images/ paths and preserves product hierarchy metadata", async () => {
    const zip = new JSZip();
    zip.file("productos.json", JSON.stringify([{
      reference: "52010",
      name: "Codo 87 grados",
      price: 0.72,
      photo: "images/52010.png",
      family: "PVC evacuación",
      type: "Codo 87 grados",
      size: "32 mm",
      connection: "Macho-hembra",
      variant: null,
      length: null,
      manufacturerReference: "EG-CMH87",
      sourceUrl: "https://example.com/product",
      priceDate: "2026-06-15",
      priceSource: "https://example.com/tariff.xlsx",
      sourcePrice: 0.72,
      priceUnit: "unidad",
      priceIncludesVat: false,
      brand: "Tecnoagua",
      model: "T-32",
      supplierReference: "SKU-52010",
      priceStatus: "PRECIO_VERIFICADO_DIRECTO",
      priceMethod: "ficha_directa",
    }]));
    zip.file("images/52010.png", "product image");

    const [imported] = await importCatalogArchive(await zip.generateAsync({ type: "blob" }));

    expect(imported).toMatchObject({
      reference: "52010",
      family: "PVC evacuación",
      type: "Codo 87 grados",
      size: "32 mm",
      connection: "Macho-hembra",
      manufacturerReference: "EG-CMH87",
      sourceUrl: "https://example.com/product",
      priceDate: "2026-06-15",
      priceSource: "https://example.com/tariff.xlsx",
      sourcePrice: 0.72,
      priceUnit: "unidad",
      priceIncludesVat: false,
      brand: "Tecnoagua",
      model: "T-32",
      supplierReference: "SKU-52010",
      priceStatus: "PRECIO_VERIFICADO_DIRECTO",
      priceMethod: "ficha_directa",
    });
    expect(imported.foto).toMatch(/^data:image\/png;base64,/);
  });

  it("imports simple variants with options and price", async () => {
    const zip = new JSZip();
    zip.file("productos.json", JSON.stringify([{
      name: "Tubo multicapa",
      price: 0,
      photo: null,
      variants: [
        { options: { medida: "16 mm", longitud: "5 m" }, price: 12.5 },
        { options: { medida: "20 mm", longitud: "25 m" }, price: 32.5 },
      ],
    }]));

    const [imported] = await importCatalogArchive(await zip.generateAsync({ type: "blob" }));

    expect(imported.variants).toEqual([
      { reference: null, price: 12.5, description: null, photo: null, attributes: { medida: "16 mm", longitud: "5 m" } },
      { reference: null, price: 32.5, description: null, photo: null, attributes: { medida: "20 mm", longitud: "25 m" } },
    ]);
  });

  it("omits products missing both name and price, while preserving other incomplete records", async () => {
    const zip = new JSZip();
    zip.file("productos.json", JSON.stringify([
      { referencia: "REF-3", nombre: "", precio: null, foto: "" },
      { reference: "NO-NAME", precio: 5 },
      { reference: "NO-PRICE", nombre: "Tubo" },
      { reference: "NULL-NAME-PRICE", nombre: null, precio: null, foto: null },
      { reference: null, nombre: "Sin referencia", precio: null, foto: null },
    ]));
    const imported = await importCatalogArchive(await zip.generateAsync({ type: "blob" }));
    expect(imported).toMatchObject([
      { reference: "NO-NAME", nombre: null, precio: 5, foto: null },
      { reference: "NO-PRICE", nombre: "Tubo", precio: null, foto: null },
      { reference: null, nombre: "Sin referencia", precio: null, foto: null },
    ]);
    expect(imported).toHaveLength(3);
  });

  it("omits photo-only products but keeps referenced photos on named or priced products", async () => {
    const zip = new JSZip();
    zip.file("productos.json", JSON.stringify([
      { reference: "VALIDO", nombre: "Grifo", precio: 10 },
      { reference: "CON-NOMBRE", nombre: "Tubo", precio: null, foto: "imagenes/nombre.webp" },
      { reference: "CON-PRECIO", nombre: "", precio: 5, foto: "imagenes/precio.webp" },
      { reference: "SOLO-FOTO", nombre: "", precio: null, foto: "imagenes/solo-foto.webp" },
    ]));
    zip.file("imagenes/nombre.webp", "foto del artículo con nombre");
    zip.file("imagenes/precio.webp", "foto del artículo con precio");
    zip.file("imagenes/solo-foto.webp", "foto del artículo que se descarta");
    zip.file("imagenes/otra-imagen-suelta.webp", "archivo suelto");

    const imported = await importCatalogArchive(await zip.generateAsync({ type: "blob" }));
    expect(imported.map((product) => product.reference)).toEqual(["VALIDO", "CON-NOMBRE", "CON-PRECIO"]);
    expect(imported[1].foto).toMatch(/^data:image\/webp;base64,/);
    expect(imported[2].foto).toMatch(/^data:image\/webp;base64,/);
  });

  it("uses the attached catalog's referencia field", async () => {
    const zip = new JSZip();
    zip.file("productos.json", JSON.stringify([
      { referencia: "T-281NS+", nombre: "Mecanismo", precio: 19.47, foto: "" },
    ]));
    const [imported] = await importCatalogArchive(await zip.generateAsync({ type: "blob" }));
    expect(imported).toMatchObject({ reference: "T-281NS+", nombre: "Mecanismo", precio: 19.47, foto: "" });
  });

  it("imports a grouped product, metadata and image associations from the requested folder layout", async () => {
    const zip = new JSZip();
    zip.file("FontaTicket_Catalogo/productos.json", JSON.stringify([
      {
        id: "codo",
        reference: "COD-GRUPO",
        name: "Codo de latón",
        price: 2,
        photo: "imagenes/codo.jpg",
        category: "RACORERÍA DE LATÓN",
        supplier: "Tecnoagua",
        variants: [
          {
            reference: "COD-20",
            supplier: "Ferrocano",
            supplierReference: "FC-20",
            price: 2.25,
            sourcePrice: 1.73,
            priceDate: "2026-10-07",
            priceSource: "https://ferrocanosuministros.es/producto/fc-20",
            priceUnit: "unidad",
            priceIncludesVat: true,
            priceMethod: "Ferrocano x1.30",
            measure: "1/2\"",
            type: "Macho-Hembra",
            photo: "imagenes/codo-20.png",
          },
          { reference: "COD-25", price: 2.5, measure: "3/4\"", type: "Hembra-Hembra" },
        ],
      },
    ]));
    zip.file("FontaTicket_Catalogo/imagenes/codo.jpg", "foto del producto");
    zip.file("FontaTicket_Catalogo/imagenes/codo-20.png", "foto de variante");

    const imported = await importCatalogArchive(await zip.generateAsync({ type: "blob" }));

    expect(imported).toHaveLength(1);
    expect(imported[0]).toMatchObject({
      id: "codo",
      reference: "COD-GRUPO",
      nombre: "Codo de latón",
      precio: 2,
      category: "RACORERÍA DE LATÓN",
      supplier: "Tecnoagua",
      variants: [
        {
          reference: "COD-20",
          supplier: "Ferrocano",
          supplierReference: "FC-20",
          price: 2.25,
          sourcePrice: 1.73,
          priceDate: "2026-10-07",
          priceSource: "https://ferrocanosuministros.es/producto/fc-20",
          priceUnit: "unidad",
          priceIncludesVat: true,
          priceMethod: "Ferrocano x1.30",
          attributes: { measure: "1/2\"", type: "Macho-Hembra" },
        },
        {
          reference: "COD-25",
          price: 2.5,
          attributes: { measure: "3/4\"", type: "Hembra-Hembra" },
        },
      ],
    });
    expect(imported[0].foto).toMatch(/^data:image\/jpeg;base64,/);
    expect(imported[0].variants?.[0].photo).toMatch(/^data:image\/png;base64,/);
    expect(imported[0].variants?.[1].photo).toBeNull();

    const roundTrip = await importCatalogArchive(await exportCatalogArchive(imported));
    expect(roundTrip[0]).toMatchObject(imported[0]);
  });

  it("keeps a product whose only usable data is in its variants", async () => {
    const zip = new JSZip();
    zip.file("productos.json", JSON.stringify([{
      reference: null,
      nombre: null,
      precio: null,
      foto: null,
      variants: [{ reference: "VAL-20", price: 3.5, attributes: { medida: "20 mm" } }],
    }]));

    const [imported] = await importCatalogArchive(await zip.generateAsync({ type: "blob" }));

    expect(imported).toMatchObject({
      nombre: null,
      precio: null,
      variants: [{ reference: "VAL-20", price: 3.5, attributes: { medida: "20 mm" } }],
    });
  });

  it("accepts complete products without an optional reference", async () => {
    const zip = new JSZip();
    zip.file("productos.json", JSON.stringify([{ nombre: "Válvula", precio: 2.5 }]));
    const [imported] = await importCatalogArchive(await zip.generateAsync({ type: "blob" }));
    expect(imported).toMatchObject({ reference: null, nombre: "Válvula", precio: 2.5, foto: null });
  });

  it("rejects non-ZIP files instead of accepting another archive format", async () => {
    await expect(importCatalogArchive(new Blob(["esto no es un ZIP"]))).rejects.toThrow("no es un ZIP válido");
  });

  it("imports and exports all attached catalog records, null fields and image associations", async () => {
    const contents = await readFile(new URL("../../public/catalogo-inicial.zip", import.meta.url));
    const imported = await importCatalogArchive(new Blob([Uint8Array.from(contents)]));
    const canonical = JSON.parse(await readFile(new URL("../../../FontaTicket_Catalogo_CORREGIDO/productos.json", import.meta.url), "utf8")) as Product[];
    const importable = canonical.filter((product) =>
      Boolean(product.nombre?.trim()) || product.precio !== null || Boolean(product.variants?.length),
    );
    expect(imported).toHaveLength(importable.length);
    expect(imported.map((product) => product.id)).toEqual(importable.map((product) => product.id));
    expect(imported.some((product) => (product.variants?.length ?? 0) > 0)).toBe(true);
    expect(imported.every((product) => Boolean(product.nombre?.trim()) || product.precio !== null)).toBe(true);
    expect(imported.filter((product) => product.foto).length)
      .toBe(importable.filter((product) => product.foto).length);
    expect(imported.some((product) => product.variants?.some((variant) => variant.supplierReference))).toBe(true);
  });

  it("excludes products without both name and price from ZIP export", async () => {
    const exportable: Product[] = [
      ...products,
      { id: "photo-only", reference: "PHOTO", nombre: "", precio: null, foto: "data:image/png;base64,aGVsbG8=" },
      { id: "name-only", reference: "NAME", nombre: "Solo nombre", precio: null, foto: null },
      { id: "price-only", reference: "PRICE", nombre: null, precio: 4, foto: null },
    ];
    const zip = await JSZip.loadAsync(await exportCatalogArchive(exportable));
    const json = JSON.parse(await zip.file("productos.json")!.async("string")) as Array<Record<string, unknown>>;
    expect(json.map((item) => item.reference)).toEqual(["REF-1", "REF-2", "NAME", "PRICE"]);
    expect(Object.keys(zip.files).some((path) => path.includes("photo-only"))).toBe(false);
  });

  it("does not require an image for a product omitted because both name and price are missing", async () => {
    const zip = new JSZip();
    zip.file("productos.json", JSON.stringify([
      { reference: "INCOMPLETO", nombre: "", precio: null, foto: "imagenes/falta.webp" },
    ]));
    await expect(importCatalogArchive(await zip.generateAsync({ type: "blob" }))).resolves.toHaveLength(0);
  });
});
