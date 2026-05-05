import { useState } from "react";
import { DispenseConfirmModal } from "./DispenseConfirmModal";

export type DispenseReason = "Sale" | "Expired" | "Damaged" | "Sample";

export interface DispenseItem {
  productId: number;
  batchId: number;
  name: string;
  batchNumber: string;
  quantity: number;
  maxQuantity: number;
  reason: DispenseReason;
  sellingPrice: number;         // ← added
}

interface DispenseListProps {
  items: DispenseItem[];
  dispensedBy: string;
  onDispensedByChange: (name: string) => void;
  onUpdateQuantity: (batchNumber: string, newQuantity: number) => void;
  onUpdateReason: (batchNumber: string, reason: DispenseReason) => void;
  onRemove: (batchNumber: string) => void;
  onConfirm: () => void;
}

function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DispenseList({
  items,
  dispensedBy,
  onDispensedByChange,
  onUpdateQuantity,
  onUpdateReason,
  onRemove,
  onConfirm,
}: DispenseListProps) {
  const [showModal, setShowModal] = useState(false);

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = items.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);

  const handleConfirmClick = () => {
    if (items.length === 0) return;
    setShowModal(true);
  };

  const handleModalConfirm = () => {
    setShowModal(false);
    onConfirm();
  };

  return (
    <>
      {showModal && (
        <DispenseConfirmModal
          items={items}
          dispensedBy={dispensedBy}
          onConfirm={handleModalConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mb-4 flex justify-between items-end border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-800">Dispense List</h2>
          <span className="text-sm font-medium text-slate-500">
            {items.length} unique batch(es)
          </span>
        </div>

        {/* Item list */}
        <div
          className="overflow-y-auto space-y-4 pr-2 transition-all duration-200"
          style={{ maxHeight: items.length === 0 ? "6rem" : "min(500px, 80vh)" }}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-16 text-slate-400">
              <p className="text-sm">No items selected.</p>
              <p className="text-xs mt-1">Add batches from the inventory table.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.batchNumber}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{item.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Batch: {item.batchNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.batchNumber)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Qty (Max: {item.maxQuantity})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={item.maxQuantity}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const safeVal = Math.min(Math.max(1, val), item.maxQuantity);
                        onUpdateQuantity(item.batchNumber, safeVal);
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Reason
                    </label>
                    <select
                      value={item.reason}
                      onChange={(e) =>
                        onUpdateReason(item.batchNumber, e.target.value as DispenseReason)
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Sale">Sale</option>
                      <option value="Expired">Expired</option>
                      <option value="Damaged">Damaged</option>
                      <option value="Sample">Sample</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">

          {/* Units row */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500">Total Units</span>
            <span className="text-sm font-bold text-slate-800">{totalUnits}</span>
          </div>

          {/* Revenue row */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500">Total Revenue</span>
            <span className="text-base font-bold text-emerald-700">{fmt(totalRevenue)}</span>
          </div>

          <div className="pt-3 space-y-3">
            {/* Dispensed by */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Dispensed by
              </label>
              <input
                type="text"
                placeholder="Enter staff name..."
                value={dispensedBy}
                onChange={(e) => onDispensedByChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleConfirmClick}
              disabled={items.length === 0}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Confirm & Update Stock
            </button>
          </div>
        </div>
      </div>
    </>
  );
}