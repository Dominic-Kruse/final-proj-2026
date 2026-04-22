import type { SortFilter } from "../utils/catalogDecorators";
import { ChipToggleGroup } from "./ChipToggleGroup";

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
    <ChipToggleGroup
      label="Sort by"
      items={FILTERS}
      activeValues={activeFilters}
      onToggle={onToggle}
      onClear={() => activeFilters.forEach(onToggle)}
    />
  );
}