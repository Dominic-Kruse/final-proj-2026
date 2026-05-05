import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { inventoryApi } from "../api/inventory";
import { transformInventory } from "../utils/transformInventory";
// import type { SortFilter } from "../utils/catalogDecorators";

// 1. Added "near-expiry" to the ModalType union
type ModalType = "low-stock" | "expired" | "out-of-stock" | "near-expiry";

type Props = {
  type: ModalType;
  onClose: () => void;
};

type CatalogItem = ReturnType<typeof transformInventory>[number];

const CONFIG = {
  "low-stock": {
    title: "Low Stock Items",
    summary:
      "These products are at or below their reorder level. Restock soon to avoid running out.",
    emptyMessage: "All products are sufficiently stocked.",
    actionLabel: "Go to Stock In →",
    actionPath: "/StockIn",
    rowFilter: (item: CatalogItem) =>
      item.status === "Low Stock" || item.status === "Out of Stock",
    badge: (item: CatalogItem) => (
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          item.status === "Out of Stock"
            ? "bg-red-100 text-red-600"
            : "bg-amber-100 text-amber-600"
        }`}
      >
        {item.status}
      </span>
    ),
    detail: (item: CatalogItem) =>
      `${item.totalStock} ${item.baseUnit} remaining`,
  },
  "out-of-stock": {
    title: "Out of Stock Items",
    summary:
      "These products have no units left in stock and should be reordered immediately.",
    emptyMessage: "No out of stock items.",
    actionLabel: "Go to Stock In →",
    actionPath: "/StockIn",
    rowFilter: (item: CatalogItem) => item.status === "Out of Stock",
    badge: () => (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
        Out of Stock
      </span>
    ),
    detail: (item: CatalogItem) =>
      `${item.totalStock} ${item.baseUnit} remaining`,
  },
  expired: {
    title: "Expired Batches",
    summary:
      "These batches have passed their expiry date. Remove them from the shelf immediately.",
    emptyMessage: "No expired batches found.",
    actionLabel: "Go to Stock In →",
    actionPath: "/StockIn",
    rowFilter: (item: CatalogItem) =>
      item.batches.some((b) => new Date(b.expiryDate) < new Date()),
    badge: () => (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
        Expired
      </span>
    ),
    detail: (item: CatalogItem) => {
      const expiredCount = item.batches.filter(
        (b) => new Date(b.expiryDate) < new Date(),
      ).length;
      return `${expiredCount} expired batch${expiredCount > 1 ? "es" : ""}`;
    },
  },
  // 2. Added the near-expiry configuration block
  "near-expiry": {
    title: "Near Expiry Batches",
    summary:
      "These batches are expiring within 90 days. Prioritize dispensing them.",
    emptyMessage: "No batches are currently nearing expiry.",
    actionLabel: "Go to Dispense →",
    actionPath: "/dispense",
    rowFilter: (item: CatalogItem) =>
      item.batches.some((b) => {
        const days = Math.ceil(
          (new Date(b.expiryDate).getTime() - Date.now()) / 86400000,
        );
        return days > 0 && days <= 90;
      }),
    badge: () => (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
        Near Expiry
      </span>
    ),
    detail: (item: CatalogItem) => {
      const count = item.batches.filter((b) => {
        const days = Math.ceil(
          (new Date(b.expiryDate).getTime() - Date.now()) / 86400000,
        );
        return days > 0 && days <= 90;
      }).length;
      return `${count} near expiry batch${count > 1 ? "es" : ""}`;
    },
  },
};

export function InventoryAlertModal({ type, onClose }: Props) {
  const navigate = useNavigate();
  const config = CONFIG[type];

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", "all"],
    queryFn: () => inventoryApi.getAll(),
    staleTime: 30_000,
  });

  const catalog = data ? transformInventory(data) : [];
  const filtered = catalog.filter(config.rowFilter);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{config.title}</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              {config.summary}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-12">
              {config.emptyMessage}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="text-left pb-2 font-semibold">Product</th>
                  <th className="text-left pb-2 font-semibold">Generic</th>
                  <th className="text-left pb-2 font-semibold">Status</th>
                  <th className="text-right pb-2 font-semibold">Stock</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.productId}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-3 font-medium text-slate-800">
                      {item.productDetails}
                    </td>
                    <td className="py-3 text-slate-500">
                      {item.genericName} {item.dosage}
                    </td>
                    <td className="py-3">{config.badge(item)}</td>
                    <td className="py-3 text-right text-slate-400">
                      {config.detail(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""} found
          </span>
          <button
            onClick={() => {
              onClose();
              navigate(config.actionPath);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {config.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
