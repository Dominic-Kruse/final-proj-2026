// import React from 'react'

export const Header = () => {
  return (
    <header className="h-16 bg-slate-100 flex items-center justify-between px-8 shrink-0 z-10">
      {/* Search Bar */}
      <div className="w-96">
        <div className="relative flex items-center w-full h-10 rounded-full focus-within:shadow-sm bg-white overflow-hidden">
          <div className="grid place-items-center h-full w-12 text-slate-400">
            {/* Search Icon Placeholder */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            className="peer h-full w-full outline-none text-sm text-slate-700 bg-transparent pr-2"
            type="text"
            id="search"
            placeholder="Search products..."
          />
        </div>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-4">
        <button className="text-slate-400 hover:text-slate-600">
          {/* Bell Icon Placeholder */}
          <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
        </button>
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 bg-slate-300 rounded-full overflow-hidden">
            {/* Avatar Placeholder */}
          </div>
          <span className="text-sm font-medium text-slate-700"></span>
        </div>
      </div>
    </header>
  );
};