import type { StockInBatchDraft } from "./types";

type DraftListProps = {
  batches: StockInBatchDraft[];
  onRemove: (batchNumber: string) => void;
};

const daysUntilExpiry = (date: string) =>
  Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

export function DraftList({ batches, onRemove }: DraftListProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Draft list</span>
        <span className="text-xs bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-md font-medium">
          {batches.length} batch{batches.length !== 1 ? "es" : ""}
        </span>
      </div>

      {batches.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-400 text-center">
          No batches yet. Fill in the form above and click "Add to draft list".
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                {["Product", "Generic", "Category", "Batch #", "Expiry", "Base units", "Cost", "Sell", "Line total", ""].map((h) => (
                  <th key={h} className={`px-4 py-3 ${["Base units", "Cost", "Sell", "Line total"].includes(h) ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((item) => {
                const days = daysUntilExpiry(item.expiryDate);
                return (
                  <tr key={item.batchNumber} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.productName}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {item.genericName}
                      {item.strengthValue && ` ${item.strengthValue}${item.strengthUnit}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                        {item.category || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{item.batchNumber}</td>
                    <td className={`px-4 py-3 text-xs font-medium ${days <= 90 ? "text-red-600" : "text-slate-600"}`}>
                      {item.expiryDate}
                      {days <= 90 && <span className="ml-1 text-[10px]">({days}d)</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {item.totalBaseUnits.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">₱{item.unitCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">₱{item.sellingPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      ₱{(item.totalBaseUnits * item.unitCost).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRemove(item.batchNumber)}
                        className="text-xs px-2.5 py-1 rounded-md border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}