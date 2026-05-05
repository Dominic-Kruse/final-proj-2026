type ChipToggleItem<T extends string> = {
  key: T;
  label: string;
  activeClass: string;
  dotClass: string;
};

interface ChipToggleGroupProps<T extends string> {
  label: string;
  items: ChipToggleItem<T>[];
  activeValues: T[];
  onToggle: (value: T) => void;
  onClear?: () => void;
  clearLabel?: string;
  showOrderBadges?: boolean;
}

export function ChipToggleGroup<T extends string>({
  label,
  items,
  activeValues,
  onToggle,
  onClear,
  clearLabel = "Clear",
  showOrderBadges = true,
}: ChipToggleGroupProps<T>) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mr-1">
        {label}
      </span>
      {items.map(({ key, label: itemLabel, activeClass, dotClass }) => {
        const isActive = activeValues.includes(key);
        const orderIndex = activeValues.indexOf(key);

        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 select-none ${
              isActive
                ? activeClass
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                isActive ? dotClass : "bg-slate-300"
              }`}
            />
            {itemLabel}
            {isActive && showOrderBadges && activeValues.length > 1 && (
              <span className="ml-0.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center bg-white/25">
                {orderIndex + 1}
              </span>
            )}
          </button>
        );
      })}

      {onClear && activeValues.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="ml-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors underline underline-offset-2"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}
