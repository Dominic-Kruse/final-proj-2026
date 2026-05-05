import type { ProductCatalogItem } from "../components/InventoryTable";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SortFilter =
  | "alphabetical"
  | "low-stock"
  | "near-expiry"
  | "expired"
  | "in-stock";

// A decorator is just a function that takes a list and returns a sorted/filtered list
type CatalogDecorator = (items: ProductCatalogItem[]) => ProductCatalogItem[];

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntilExpiry(expiryDate: string): number {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
}

function earliestExpiry(product: ProductCatalogItem): number {
  if (product.batches.length === 0) return Infinity;
  return Math.min(...product.batches.map((b) => daysUntilExpiry(b.expiryDate)));
}

// ── Individual decorators ─────────────────────────────────────────────────────

const alphabeticalDecorator: CatalogDecorator = (items) =>
  [...items].sort((a, b) =>
    a.productDetails.localeCompare(b.productDetails)
  );

const lowStockDecorator: CatalogDecorator = (items) =>
  [...items].sort((a, b) => {
    const priority = { "Out of Stock": 0, "Low Stock": 1, "In Stock": 2 };
    return priority[a.status] - priority[b.status];
  });

const nearExpiryDecorator: CatalogDecorator = (items) =>
  [...items].sort((a, b) => {
    const daysA = earliestExpiry(a);
    const daysB = earliestExpiry(b);
    // Only sort near-expiry (<=90 days) to the top, leave the rest in place
    const isNearA = daysA > 0 && daysA <= 90;
    const isNearB = daysB > 0 && daysB <= 90;
    if (isNearA && !isNearB) return -1;
    if (!isNearA && isNearB) return 1;
    if (isNearA && isNearB) return daysA - daysB;
    return 0;
  });

const expiredDecorator: CatalogDecorator = (items) =>
  [...items].sort((a, b) => {
    const hasExpiredA = a.batches.some((b) => daysUntilExpiry(b.expiryDate) <= 0);
    const hasExpiredB = b.batches.some((b) => daysUntilExpiry(b.expiryDate) <= 0);
    if (hasExpiredA && !hasExpiredB) return -1;
    if (!hasExpiredA && hasExpiredB) return 1;
    return 0;
  });

// Floats "In Stock" items to the top, pushing Low Stock and Out of Stock down
const inStockDecorator: CatalogDecorator = (items) =>
  [...items].sort((a, b) => {
    const priority = { "In Stock": 0, "Low Stock": 1, "Out of Stock": 2 };
    return priority[a.status] - priority[b.status];
  });

// ── Registry: maps each filter key to its decorator ──────────────────────────

const DECORATOR_MAP: Record<SortFilter, CatalogDecorator> = {
  alphabetical: alphabeticalDecorator,
  "low-stock": lowStockDecorator,
  "near-expiry": nearExpiryDecorator,
  expired: expiredDecorator,
  "in-stock": inStockDecorator,
};

// ── Core: compose active decorators in order and apply to catalog ─────────────
// Each active filter wraps the result of the previous one.
// Order matters: last filter in the array has the highest sort priority.

export function applyDecorators(
  catalog: ProductCatalogItem[],
  activeFilters: SortFilter[]
): ProductCatalogItem[] {
  return activeFilters.reduce<ProductCatalogItem[]>(
    (items, filter) => DECORATOR_MAP[filter](items),
    catalog
  );
}