interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({ placeholder = "Search...", onSearch }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <input
        type="text"
        onChange={(e) => onSearch?.(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2 pl-10 pr-4 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
      />
      <span className="absolute left-3 top-2.5 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
    </div>
  );
}