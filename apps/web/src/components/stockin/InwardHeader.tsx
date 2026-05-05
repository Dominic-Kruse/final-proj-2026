type InwardHeaderProps = {
  supplier: string;
  setSupplier: (v: string) => void;
  referenceNumber: string;
  setReferenceNumber: (v: string) => void;
  dateReceived: string;
  setDateReceived: (v: string) => void;
  onClearError: () => void;
};

export function InwardHeader({
  supplier, setSupplier,
  referenceNumber, setReferenceNumber,
  dateReceived, setDateReceived,
  onClearError,
}: InwardHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Inward header
        </span>
      </div>
      <div className="p-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { id: "supplier", label: "Supplier", value: supplier, setter: setSupplier, placeholder: "e.g. MediCore Pharma", type: "text" },
          { id: "reference", label: "Invoice / reference number", value: referenceNumber, setter: setReferenceNumber, placeholder: "e.g. INV-2026-118", type: "text" },
          { id: "date", label: "Date received", value: dateReceived, setter: setDateReceived, placeholder: "", type: "date" },
        ].map(({ id, label, value, setter, placeholder, type }) => (
          <div key={id}>
            <label htmlFor={id} className="block text-xs font-medium text-slate-600 mb-1.5">
              {label} <span className="text-red-500">*</span>
            </label>
            <input
              id={id}
              type={type}
              value={value}
              placeholder={placeholder}
              onChange={(e) => { setter(e.target.value); onClearError(); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
}