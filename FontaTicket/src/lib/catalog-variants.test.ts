import { describe, expect, it } from "vitest";
import type { Product } from "../types";
import {
  findSelectedVariant,
  getVariantSelectors,
  getVariantSelectorOptions,
  initialVariantSelection,
  productMatchesSearch,
  productForVariant,
  productStartingPrice,
  variantTicketDescription,
  updateVariantSelection,
} from "./catalog-variants";

const codo: Product = {
  id: "codo",
  reference: "COD-GRUPO",
  nombre: "Codo de latón",
  precio: 4,
  foto: "data:image/png;base64,cHJvZHVjdG8=",
  category: "RACORERÍA DE LATÓN",
  supplier: "Tecnoagua",
  variants: [
    {
      id: "codo-12-mh",
      reference: "COD-12-MH",
      price: 3.25,
      photo: null,
      attributes: { medida: "1/2\"", tipo: "Macho-Hembra", codigo: "1001" },
    },
    {
      id: "codo-34-hh",
      reference: "COD-34-HH",
      price: 4.5,
      description: "Codo compacto",
      photo: "data:image/png;base64,dmFyaWFudGU=",
      attributes: { medida: "3/4\"", tipo: "Hembra-Hembra", codigo: "1002" },
    },
  ],
};

describe("catalog product variants", () => {
  it("searches a grouped product by name, variant reference, category and variant characteristics", () => {
    expect(productMatchesSearch(codo, "codo")).toBe(true);
    expect(productMatchesSearch(codo, "COD-34-HH")).toBe(true);
    expect(productMatchesSearch(codo, "laton")).toBe(true);
    expect(productMatchesSearch(codo, "1/2")).toBe(true);
    expect(productMatchesSearch(codo, "sin coincidencia")).toBe(false);
  });

  it("offers separate type and measure selectors and resolves the exact selected variant", () => {
    const selectors = getVariantSelectors(codo);
    expect(selectors.map(({ label }) => label)).toEqual(["Tipo", "Medida"]);

    const initial = initialVariantSelection(codo);
    expect(findSelectedVariant(codo, initial)).toBeNull();

    const next = { ...initial, tipo: "Hembra-Hembra", medida: "3/4\"" };
    const selected = findSelectedVariant(codo, next);
    expect(selected?.reference).toBe("COD-34-HH");
    expect(selected?.price).toBe(4.5);
    expect(selected?.photo).toBe("data:image/png;base64,dmFyaWFudGU=");
    expect(variantTicketDescription(codo, selected!)).toBe("Hembra-Hembra × 3/4\" × Codo compacto");
    expect(productForVariant(codo, selected!)).toMatchObject({
      nombre: "Codo de latón Hembra-Hembra × 3/4\" × Codo compacto",
      reference: "COD-34-HH",
      precio: 4.5,
      foto: codo.foto,
      variants: undefined,
    });
  });

  it("offers angle and diameter selectors for H-H branches with exact reference prices", () => {
    const derivacion: Product = {
      ...codo,
      nombre: "Derivación H-H",
      foto: "data:image/png;base64,cHJvZHVjdG8=",
      variants: [
        { reference: "52050", price: 0.83, attributes: { angulo: "45º", medida: "Ø32", presentacion: "P2" } },
        { reference: "52051", price: 0.72, attributes: { angulo: "45º", medida: "Ø40", presentacion: "P2" } },
        { reference: "52070", price: 0.64, attributes: { angulo: "87º", medida: "Ø32", presentacion: "P2" } },
        { reference: "51070", price: 0.78, attributes: { angulo: "87º", medida: "Ø32", presentacion: "P4" } },
      ],
    };
    const selectors = getVariantSelectors(derivacion);
    expect(selectors.map(({ label }) => label)).toEqual(["Ángulo", "Medida", "Presentación"]);

    const initial = initialVariantSelection(derivacion);
    expect(findSelectedVariant(derivacion, initial)).toBeNull();
    const selection = { ...initial, angulo: "87º", medida: "Ø32", presentacion: "P4" };
    const variant = findSelectedVariant(derivacion, selection);
    expect(variant?.reference).toBe("51070");
    expect(variant?.price).toBe(0.78);
    expect(productForVariant(derivacion, variant!).nombre).toBe("Derivación H-H 87º × Ø32 × P4");
    expect(productForVariant(derivacion, variant!).foto).toBe(derivacion.foto);
  });

  it("offers connection type as an option when otherwise identical fittings differ M-H/H-H", () => {
    const codoConOpciones: Product = {
      ...codo,
      nombre: "Codo",
      variants: [
        { reference: "MH-32", price: 1.2, attributes: { conexion: "M-H", angulo: "87º", medida: "Ø32" } },
        { reference: "HH-32", price: 1.4, attributes: { conexion: "H-H", angulo: "87º", medida: "Ø32" } },
      ],
    };
    expect(getVariantSelectors(codoConOpciones).map(({ label }) => label)).toEqual(["Conexión"]);
    const selection = { conexion: "H-H" };
    const variant = findSelectedVariant(codoConOpciones, selection);
    expect(variant?.reference).toBe("HH-32");
    expect(variant?.price).toBe(1.4);
  });

  it("filters later options and auto-selects the only remaining combination", () => {
    const sparseProduct: Product = {
      ...codo,
      nombre: "Derivación",
      variants: [
        { reference: "A", price: 1, attributes: { angulo: "45º", medida: "Ø32" } },
        { reference: "B", price: 2, attributes: { angulo: "87º", medida: "Ø40" } },
      ],
    };

    expect(getVariantSelectorOptions(sparseProduct, { angulo: "45º" }, "medida").map(({ value }) => value))
      .toEqual(["Ø32"]);
    expect(updateVariantSelection(sparseProduct, { angulo: "45º", medida: "Ø32" }, "angulo", "87º"))
      .toEqual({ angulo: "87º", medida: "Ø40" });
  });

  it("uses a distinct variant selector when attribute combinations do not identify one variant", () => {
    const ambiguous: Product = {
      ...codo,
      variants: [
        { reference: "COD-A", price: 1, attributes: { medida: "1/2\"" } },
        { reference: "COD-B", price: 2, attributes: { medida: "1/2\"" } },
      ],
    };
    const [selector] = getVariantSelectors(ambiguous);
    expect(selector.label).toBe("Variante");
    expect(selector.options.map(({ label }) => label)).toEqual(["Opción 1", "Opción 2"]);
    expect(selector.options).toHaveLength(2);
    expect(findSelectedVariant(ambiguous, { __variant: "1" })?.reference).toBe("COD-B");
  });

  it("labels English attribute aliases in Spanish and falls back to the product photo", () => {
    const imported: Product = {
      ...codo,
      variants: [
        { reference: "A", price: 1, attributes: { type: "Macho", measure: "15 mm" } },
        { reference: "B", price: 2, attributes: { type: "Hembra", measure: "22 mm" } },
      ],
    };
    const selection = initialVariantSelection(imported);
    const variant = findSelectedVariant(imported, { ...selection, type: "Macho", measure: "15 mm" });

    expect(getVariantSelectors(imported).map(({ label }) => label)).toEqual(["Tipo", "Medida"]);
    expect(variant && productForVariant(imported, variant).foto).toBe(codo.foto);
  });

  it("shows the minimum variant price as the product starting price", () => {
    expect(productStartingPrice(codo)).toBe(3.25);
    expect(productStartingPrice({ ...codo, variants: undefined })).toBe(4);
  });
});
