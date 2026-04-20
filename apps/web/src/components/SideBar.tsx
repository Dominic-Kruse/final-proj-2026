
import { NavLink } from "react-router-dom";

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            PA {/* Placeholder for Logo Icon */}
          </div>
          PharmAssist
        </div>
      </div>  

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-300 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <span className="w-5 h-5 bg-white/20 rounded-md"></span> {/* Icon Placeholder */}
          Dashboard
        </NavLink>

        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-300 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <span className="w-5 h-5 bg-white/20 rounded-md"></span> {/* Icon Placeholder */}
          Inventory
        </NavLink>

        <NavLink
          to="/stockin"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-300 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <span className="w-5 h-5 bg-white/20 rounded-md"></span> {/* Icon Placeholder */}
          Stock In
        </NavLink>

        <NavLink
          to="/dispense"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-300 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <span className="w-5 h-5 bg-white/20 rounded-md"></span> {/* Icon Placeholder */}
          Dispense
        </NavLink>

        <NavLink
          to="/customer"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-300 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <span className="w-5 h-5 bg-white/20 rounded-md"></span> {/* Icon Placeholder */}
          Audit Logs
        </NavLink>
      </nav>
    </aside>
  );
};