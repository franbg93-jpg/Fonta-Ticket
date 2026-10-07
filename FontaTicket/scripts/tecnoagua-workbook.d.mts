import type { CatalogPriceFeed } from "../src/lib/catalog-price-updates.mjs";

export function createTecnoaguaFeed(
  workbookBytes: Uint8Array,
  options: { priceDate: string; sourceUrl: string },
): CatalogPriceFeed;
