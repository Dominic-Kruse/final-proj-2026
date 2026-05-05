type PillSelectorProps = {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  colorClass: string;
};

export function PillSelector({ options, value, onChange, colorClass }: PillSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? "": opt)}
          className={`px-3 py-1.5 rounded-full text-xs border transition-all font-medium ${
            value === opt
              ? colorClass
              : "border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}