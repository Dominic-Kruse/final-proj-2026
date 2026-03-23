

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            P {/* Placeholder for Logo Icon */}
          </div>
          Pharmacy
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {/* Active Link Example */}
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-blue-300 text-white rounded-lg font-medium">
          <span className="w-5 h-5 bg-white/20 rounded-md"></span> {/* Icon Placeholder */}
          Dashboard
        </a>
        
        {/* Inactive Link Example */}
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-colors">
          <span className="w-5 h-5 bg-slate-200 rounded-md"></span> {/* Icon Placeholder */}
          Medicine
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-colors">
          <span className="w-5 h-5 bg-slate-200 rounded-md"></span> {/* Icon Placeholder */}
          Customer
        </a>
        {/* Add more links as needed... */}
      </nav>
    </aside>
  );
};