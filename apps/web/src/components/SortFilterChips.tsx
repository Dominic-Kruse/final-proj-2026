import type { SortFilter } from "../utils/catalogDecorators";

// ── Config ────────────────────────────────────────────────────────────────────

const FILTERS: {
  key: SortFilter;
  label: string;
  activeClass: string;
  dotClass: string;
}[] = [
  {
    key: "alphabetical",
    label: "A → Z",
    activeClass: "bg-slate-800 text-white border-slate-800",
    dotClass: "bg-white",
  },
  {
    key: "in-stock",
    label: "In stock",
    activeClass: "bg-emerald-500 text-white border-emerald-500",
    dotClass: "bg-white",
  },
  {
    key: "low-stock",
    label: "Low stock",
    activeClass: "bg-amber-500 text-white border-amber-500",
    dotClass: "bg-white",
  },
  {
    key: "near-expiry",
    label: "Near expiry",
    activeClass: "bg-orange-500 text-white border-orange-500",
    dotClass: "bg-white",
  },
  {
    key: "expired",
    label: "Expired",
    activeClass: "bg-red-600 text-white border-red-600",
    dotClass: "bg-white",
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface SortFilterChipsProps {
  activeFilters: SortFilter[];
  onToggle: (filter: SortFilter) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SortFilterChips({ activeFilters, onToggle }: SortFilterChipsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mr-1">
        Sort by
      </span>
      {FILTERS.map(({ key, label, activeClass, dotClass }) => {
        const isActive = activeFilters.includes(key);
        // Show the decorator order number when multiple filters are active
        const orderIndex = activeFilters.indexOf(key);

        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
              border transition-all duration-150 select-none
              ${isActive
                ? activeClass
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800"
              }
            `}
          >
            {/* Dot indicator */}
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                isActive ? dotClass : "bg-slate-300"
              }`}
            />
            {label}
            {/* Show priority badge when 2+ filters are active */}
            {isActive && activeFilters.length > 1 && (
              <span
                className={`
                  ml-0.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center
                  bg-white/25
                `}
              >
                {orderIndex + 1}
              </span>
            )}
          </button>
        );
      })}

      {/* Clear all button — only shows when filters are active */}
      {activeFilters.length > 0 && (
        <button
          onClick={() => activeFilters.forEach(onToggle)}
          className="ml-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors underline underline-offset-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}