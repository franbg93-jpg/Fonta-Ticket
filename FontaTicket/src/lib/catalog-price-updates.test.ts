import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  applyPriceUpdateProposal,
  buildPriceUpdateProposal,
} from "./catalog-price-updates.mjs";
import { createTecnoaguaFeed } from "../../scripts/tecnoagua-workbook.mjs";
import type { Product } from "../types";

const sourceUrl = "https://supplier.example/tarifa.xlsx";
const date = "2026-10-07";

function tecnoaguaFeed(rows: Array<{ supplierReference: string; sourcePrice: number }>) {
  return {
    supplier: "Tecnoagua" as const,
    priceDate: date,
    sourceUrl,
    rows: rows.map((row) => ({ ...row, priceUnit: "unidad", priceIncludesVat: null })),
  };
}

describe("actualización segura de precios del catálogo", () => {
  it("relaciona solo por proveedor y referencia exacta, y conserva fotos y variantes", () => {
    const products: Product[] = [
      {
        id: "tecnoagua-group",
        reference: "MODELO-GENERICO",
        nombre: "Producto con nombre parecido",
        precio: null,
        foto: "data:image/png;base64,cGFyZW50",
        supplier: "Tecnoagua",
        variants: [{
          id: "variant-one",
          reference: "SERIE-X",
          supplierReference: "00123",
          price: 3.5,
          photo: "data:image/png;base64,dmFyaWFudA==",
          attributes: { Medida: "20 mm", Conexión: "Hembra" },
        }],
      },
      {
        id: "other-supplier",
        reference: "00123",
        nombre: "El mismo nombre y código en otro proveedor",
        precio: 8,
        foto: null,
        supplier: "Obramat",
        supplierReference: "00123",
      },
    ];
    const before = structuredClone(products);
    const proposal = buildPriceUpdateProposal(products, tecnoaguaFeed([
      { supplierReference: "00123", sourcePrice: 4 },
      { supplierReference: "OTRA-REF", sourcePrice: 5 },
    ]));

    expect(proposal.rows.find((row) => row.supplierReference === "00123")).toMatchObject({
      status: "changed",
      productId: "tecnoagua-group",
      targetKind: "variant",
      proposedCatalogPrice: 4,
    });
    expect(proposal.rows.find((row) => row.supplierReference === "OTRA-REF")?.status).toBe("source_only");
    const result = applyPriceUpdateProposal(products, proposal);
    expect(result.applied).toBe(1);
    expect(result.products[0].variants?.[0]).toMatchObject({
      price: 4,
      supplier: "Tecnoagua",
      supplierReference: "00123",
      sourcePrice: 4,
      priceSource: sourceUrl,
      priceMethod: "tarifa_oficial",
      photo: before[0].variants?.[0].photo,
      attributes: before[0].variants?.[0].attributes,
    });
    expect(result.products[0]).toMatchObject({ foto: before[0].foto, reference: before[0].reference });
    expect(result.products[1]).toEqual(before[1]);
  });

  it("aplica el 30 % con redondeo comercial a Ferrocano y Obramat", () => {
    const products: Product[] = [{
      id: "retail-product",
      reference: "UNIQUE",
      nombre: "Latiguillo",
      precio: 1.49,
      foto: "data:image/png;base64,aW1hZ2U=",
      supplier: "Ferrocano",
      supplierReference: "FE-001",
    }];
    const feed = {
      supplier: "Ferrocano" as const,
      priceDate: date,
      sourceUrl: "https://ferrocanosuministros.es/producto/fe-001",
      rows: [{ supplierReference: "FE-001", sourcePrice: 1.15, priceUnit: "unidad", priceIncludesVat: true, sourceUrl: "https://ferrocanosuministros.es/producto/fe-001" }],
    };
    const proposal = buildPriceUpdateProposal(products, feed);
    expect(proposal.rows[0]).toMatchObject({
      sourcePrice: 1.15,
      proposedCatalogPrice: 1.5,
      priceMethod: "Ferrocano x1.30",
    });
    const result = applyPriceUpdateProposal(products, proposal);
    expect(result.products[0]).toMatchObject({ precio: 1.5, sourcePrice: 1.15, priceMethod: "Ferrocano x1.30" });
    expect(result.products[0].foto).toBe(products[0].foto);
  });

  it("deja para revisión las referencias ausentes, sin referencia y las duplicadas", () => {
    const products: Product[] = [
      { id: "a", reference: "A", nombre: "A", precio: 2, foto: null, supplier: "Tecnoagua", supplierReference: "DUP" },
      { id: "b", reference: "B", nombre: "B", precio: 3, foto: null, supplier: "Tecnoagua", supplierReference: "DUP" },
      { id: "c", reference: null, nombre: "Sin código", precio: 1, foto: null, supplier: "Tecnoagua" },
      { id: "d", reference: "D", nombre: "No está en tarifa", precio: 4, foto: null, supplier: "Tecnoagua", supplierReference: "OLD" },
    ];
    const proposal = buildPriceUpdateProposal(products, tecnoaguaFeed([
      { supplierReference: "DUP", sourcePrice: 8 },
      { supplierReference: "NEW", sourcePrice: 9 },
    ]));
    expect(proposal.rows.map((row) => row.status)).toContain("ambiguous_catalog_reference");
    expect(proposal.rows.map((row) => row.status)).toContain("missing_supplier_reference");
    expect(proposal.rows.map((row) => row.status)).toContain("not_in_source");
    expect(proposal.rows.map((row) => row.status)).toContain("source_only");
    expect(applyPriceUpdateProposal(products, proposal).applied).toBe(0);
    expect(products.map((product) => product.precio)).toEqual([2, 3, 1, 4]);
  });

  it("rechaza una propuesta obsoleta antes de cambiar cualquier referencia", () => {
    const products: Product[] = [{
      id: "stale",
      reference: "REF",
      nombre: "Producto",
      precio: 10,
      foto: null,
      supplier: "Tecnoagua",
      supplierReference: "T-10",
    }];
    const proposal = buildPriceUpdateProposal(products, tecnoaguaFeed([{ supplierReference: "T-10", sourcePrice: 12 }]));
    const changedAfterPreview = [{ ...products[0], precio: 11 }];
    expect(() => applyPriceUpdateProposal(changedAfterPreview, proposal)).toThrow("precio cambió");
    expect(changedAfterPreview[0].precio).toBe(11);
  });

  it("lee una tarifa Excel por la columna de código y €/U, sin usar el nombre del producto", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["TARIFA OFICIAL"],
      ["REF.", "COD.", "DIM.", "€/U"],
      ["SERIE", "000123", "20 mm", "1,25"],
      ["SERIE", "000124", "25 mm", "2,50"],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "PVC");
    const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const feed = createTecnoaguaFeed(bytes, { priceDate: date, sourceUrl });
    expect(feed.rows).toEqual([
      { supplierReference: "000123", sourcePrice: 1.25, priceUnit: "unidad", priceIncludesVat: null, sourceUrl },
      { supplierReference: "000124", sourcePrice: 2.5, priceUnit: "unidad", priceIncludesVat: null, sourceUrl },
    ]);
  });
});
