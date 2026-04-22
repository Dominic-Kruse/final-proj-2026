import type { ProductCatalogItem } from "../components/InventoryTable";

export interface InventoryUrgencyStrategy {
  getPriority: (item: ProductCatalogItem) => number;
  isUrgent: (item: ProductCatalogItem) => boolean;
  sort: (items: ProductCatalogItem[]) => ProductCatalogItem[];
  filterUrgent: (items: ProductCatalogItem[]) => ProductCatalogItem[];
}

type InventoryUrgencyMode = "stock" | "expiry";

function daysLeft(expiryDate: string): number {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
}

function createInventoryUrgencyStrategy(
  mode: InventoryUrgencyMode,
  nearExpiryDays = 90
): InventoryUrgencyStrategy {
  const getPriority = (item: ProductCatalogItem): number => {
    const hasExpired = item.batches.some((batch) => daysLeft(batch.expiryDate) <= 0);
    const hasNearExpiry = item.batches.some((batch) => {
      const days = daysLeft(batch.expiryDate);
      return days > 0 && days <= nearExpiryDays;
    });

    if (mode === "expiry") {
      if (hasExpired) return 0;
      if (hasNearExpiry) return 1;
      return 2;
    }

    if (item.status === "Low Stock") return 0;
    if (item.status === "Out of Stock") return 1;
    if (hasExpired) return 2;
    if (hasNearExpiry) return 3;
    return 4;
  };

  const isUrgent = (item: ProductCatalogItem): boolean => {
    if (mode === "expiry") {
      return getPriority(item) < 2;
    }

    return item.status === "Low Stock" || item.status === "Out of Stock";
  };

  const sort = (items: ProductCatalogItem[]): ProductCatalogItem[] =>
    [...items].sort((a, b) => {
      const priorityDiff = getPriority(a) - getPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      return a.productDetails.localeCompare(b.productDetails);
    });

  const filterUrgent = (items: ProductCatalogItem[]): ProductCatalogItem[] =>
    items.filter((item) => isUrgent(item));

  return {
    getPriority,
    isUrgent,
    sort,
    filterUrgent,
  };
}

export const stockOnlyInventoryStrategy = createInventoryUrgencyStrategy("stock");
export const expiryOnlyInventoryStrategy = createInventoryUrgencyStrategy("expiry");
