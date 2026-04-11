type SummaryPanelProps = {
  totalUnits: number;
  totalCost: number;
  totalRetail: number;
  errorMessage: string;
  saveMessage: string;
  isPending: boolean;
  onClearDraft: () => void;
  onSave: () => void;
};

export function SummaryPanel({
  totalUnits, totalCost, totalRetail,
  errorMessage, saveMessage,
  isPending, onClearDraft, onSave,
}: SummaryPanelProps) {
  const metrics = [
    { label: "Total units", value: totalUnits.toLocaleString() },
    { label: "Total cost", value: `₱${totalCost.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` },
    { label: "Potential retail", value: `₱${totalRetail.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Summary</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {metrics.map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className="text-xl font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>

        {errorMessage && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {errorMessage}
          </p>
        )}
        {saveMessage && (
          <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
            {saveMessage}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClearDraft}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Clear draft
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isPending ? "Saving..." : "Save stock inward"}
          </button>
        </div>
      </div>
    </div>
  );
}