import type { DispenseItem, DispenseReason } from "./DispenseList";

// ── Reason badge colours ───────────────────────────────────────────────────────
const reasonStyles: Record<DispenseReason, string> = {
  Sale:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  Expired: "bg-red-50    text-red-700     border-red-200",
  Damaged: "bg-amber-50  text-amber-700   border-amber-200",
  Sample:  "bg-blue-50   text-blue-700    border-blue-200",
};

function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface DispenseConfirmModalProps {
  items: DispenseItem[];
  dispensedBy: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function DispenseConfirmModal({
  items,
  dispensedBy,
  onConfirm,
  onCancel,
}: DispenseConfirmModalProps) {
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalRevenue = items.reduce((sum, i) => sum + i.quantity * i.sellingPrice, 0);

  // Group units by reason for the summary breakdown
  const byReason = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.reason] = (acc[item.reason] ?? 0) + item.quantity;
    return acc;
  }, {});

  return (
    // Backdrop — clicking it cancels
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      {/* Panel */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Confirm Dispense</h3>
              <p className="text-xs text-slate-500">
                Review before updating stock — this cannot be undone easily.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 max-h-72 overflow-y-auto">

          {/* Dispensed by */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium">Dispensed by</span>
            {dispensedBy.trim() ? (
              <span className="font-semibold text-slate-800">{dispensedBy.trim()}</span>
            ) : (
              <span className="text-slate-400 italic text-xs">Not specified</span>
            )}
          </div>

          <div className="border-t border-slate-100" />

          {/* Per-item list */}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.batchNumber}
                className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs font-mono text-slate-400">{item.batchNumber}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${reasonStyles[item.reason]}`}>
                    {item.reason}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 tabular-nums">
                      −{item.quantity} <span className="text-slate-400 font-normal text-xs">units</span>
                    </p>
                    <p className="text-xs font-semibold text-emerald-700 tabular-nums">
                      {fmt(item.quantity * item.sellingPrice)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reason breakdown — only shown when there are multiple reasons */}
          {Object.keys(byReason).length > 1 && (
            <>
              <div className="border-t border-slate-100" />
              <div className="flex flex-wrap gap-2">
                {Object.entries(byReason).map(([reason, qty]) => (
                  <span
                    key={reason}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${reasonStyles[reason as DispenseReason]}`}
                  >
                    {reason}: {qty} units
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="border-t border-slate-100" />

          {/* Totals */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total units deducted</span>
              <span className="text-sm font-bold text-slate-800 tabular-nums">{totalUnits}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="text-sm font-semibold text-slate-600">Total revenue</span>
              <span className="text-lg font-bold text-emerald-700 tabular-nums">{fmt(totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Go back
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            Yes, confirm
          </button>
        </div>
      </div>
    </div>
  );
}