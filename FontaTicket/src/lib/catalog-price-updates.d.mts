import type { Product } from "../types";

export type CatalogPriceSupplier = "Tecnoagua" | "Obramat" | "Ferrocano";

export interface PriceFeedRow {
  supplierReference: string;
  sourcePrice: number;
  priceUnit: string;
  priceIncludesVat: boolean | null;
  sourceUrl?: string;
}

export interface CatalogPriceFeed {
  supplier: CatalogPriceSupplier;
  priceDate: string;
  sourceUrl: string;
  rows: PriceFeedRow[];
  sourceFile?: string | null;
  sourceSha256?: string | null;
}

export interface PriceProposalRow {
  status: "changed" | "unchanged" | "missing_supplier_reference" | "ambiguous_catalog_reference"
    | "not_in_source" | "ambiguous_source_reference" | "source_only";
  supplier: CatalogPriceSupplier;
  targetKind?: "product" | "variant";
  supplierReference: string | null;
  productId?: string;
  variantReference?: string | null;
  productName?: string | null;
  previousCatalogPrice?: number | null;
  previousSourcePrice?: number | null;
  sourcePrice?: number;
  proposedCatalogPrice?: number | null;
  priceDate?: string;
  priceSource?: string;
  sourceUrl?: string;
  priceUnit?: string;
  priceIncludesVat?: boolean | null;
  priceMethod?: string;
  note: string;
}

export interface PriceUpdateProposal {
  schemaVersion: 1;
  createdAt: string;
  feed: CatalogPriceFeed & { sourceFile: string | null; sourceSha256: string | null };
  counts: Record<string, number>;
  rows: PriceProposalRow[];
}

export function normalizeSupplier(value: unknown): CatalogPriceSupplier | null;
export function validatePriceFeed(feed: unknown): CatalogPriceFeed;
export function buildPriceUpdateProposal(
  products: Product[],
  feed: CatalogPriceFeed,
  options?: { sourceFile?: string | null; sourceSha256?: string | null },
): PriceUpdateProposal;
export function applyPriceUpdateProposal(
  products: Product[],
  proposal: PriceUpdateProposal,
): { products: Product[]; applied: number };
export function sha256(bytes: Uint8Array): Promise<string>;
export function proposalCsv(proposal: PriceUpdateProposal): string;
