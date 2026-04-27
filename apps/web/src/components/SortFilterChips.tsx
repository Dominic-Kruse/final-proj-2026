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
    activeClass: "bg-blue-600 text-white border-blue-600",
    dotClass: "bg-white",
  },
  {
    key: "in-stock",
    label: "In stock",
    activeClass: "bg-blue-600 text-white border-blue-600",
    dotClass: "bg-white",
  },
  {
    key: "low-stock",
    label: "Low stock",
    activeClass: "bg-blue-600 text-white border-blue-600",
    dotClass: "bg-white",
  },
  {
    key: "near-expiry",
    label: "Near expiry",
    activeClass: "bg-blue-600 text-white border-blue-600",
    dotClass: "bg-white",
  },
  {
    key: "expired",
    label: "Expired",
    activeClass: "bg-blue-600 text-white border-blue-600",
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