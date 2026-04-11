import { useMemo, useState, useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { Medicine } from "../../utils/types";

type GenericNamePickerProps = {
  products: Medicine[];
  value: string;
  onChange: (genericName: string) => void;
  onAddNew: () => void;
};

export function GenericNamePicker({ products, value, onChange, onAddNew }: GenericNamePickerProps) {
  const [search, setSearch] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  const uniqueGenerics = useMemo(() => {
    const q = search.trim().toLowerCase();
    const seen = new Set<string>();
    return products
      .filter((p) =>
        !q ||
        p.genericName.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
      )
      .filter((p) => {
        if (seen.has(p.genericName)) return false;
        seen.add(p.genericName);
        return true;
      });
  }, [products, search]);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && uniqueGenerics.length === 1) {
      onChange(uniqueGenerics[0].genericName);
      setSearch(uniqueGenerics[0].genericName);
    }
  };

  const handleSelect = (genericName: string) => {
    onChange(genericName);
    setSearch(genericName);
  };

  return (
    <div className="flex flex-col">
      <input
        ref={inputRef}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Search generic name..."
        className="w-full px-3 py-2 border border-slate-300 rounded-t-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
      />
      <div className="border border-t-0 border-slate-200 rounded-b-lg overflow-hidden">
        <ul className="max-h-36 overflow-y-auto divide-y divide-slate-100">
          {uniqueGenerics.length === 0 ? (
            <li className="px-3 py-2 text-xs text-slate-400 italic">
              No match — use "Add new" below
            </li>
          ) : (
            uniqueGenerics.map((p) => (
              <li
                key={p.genericName}
                onClick={() => handleSelect(p.genericName)}
                className={`px-3 py-2 text-sm cursor-pointer flex justify-between items-center transition-colors ${
                  value === p.genericName
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>{p.genericName}</span>
                {p.category && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    {p.category}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
        <button
          type="button"
          onClick={onAddNew}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border-t border-slate-200 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="#185FA5" strokeWidth="1.2" />
            <path d="M8 5v6M5 8h6" stroke="#185FA5" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Add new generic product
        </button>
      </div>
    </div>
  );
}