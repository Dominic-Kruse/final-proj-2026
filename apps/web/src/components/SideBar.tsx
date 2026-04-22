
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  Pill,
  ScrollText,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar = ({ collapsed = false, onToggleCollapse }: SidebarProps) => {
  const labelClass = collapsed
    ? "max-w-0 opacity-0 -translate-x-1"
    : "max-w-[140px] opacity-100 translate-x-0";

  return (
    <aside className={`${collapsed ? "w-20" : "w-64"} bg-white border-r border-slate-200 flex flex-col h-full shrink-0 transition-[width] duration-300 ease-in-out`}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-slate-100">
        <div className="flex items-center gap-3 text-blue-600 font-bold text-xl">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
            PA {/* Placeholder for Logo Icon */}
          </div>
          <span
            className={`${labelClass} inline-block overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out`}
            aria-hidden={collapsed}
          >
            PharmAssist
          </span>
        </div>
      </div>  

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <NavLink
          to="/"
          title="Dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-300 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" strokeWidth={2} />
          <span
            className={`${labelClass} inline-block overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out`}
            aria-hidden={collapsed}
          >
            Dashboard
          </span>
        </NavLink>

        <NavLink
          to="/inventory"
          title="Inventory"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-300 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <Boxes className="w-5 h-5 shrink-0" strokeWidth={2} />
          <span
            className={`${labelClass} inline-block overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out`}
            aria-hidden={collapsed}
          >
            Inventory
          </span>
        </NavLink>

        <NavLink
          to="/stockin"
          title="Stock In"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-300 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <ArrowDownToLine className="w-5 h-5 shrink-0" strokeWidth={2} />
          <span
            className={`${labelClass} inline-block overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out`}
            aria-hidden={collapsed}
          >
            Stock In
          </span>
        </NavLink>

        <NavLink
          to="/dispense"
          title="Dispense"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-300 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <Pill className="w-5 h-5 shrink-0" strokeWidth={2} />
          <span
            className={`${labelClass} inline-block overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out`}
            aria-hidden={collapsed}
          >
            Dispense
          </span>
        </NavLink>

        <NavLink
          to="/customer"
          title="Audit Logs"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-300 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <ScrollText className="w-5 h-5 shrink-0" strokeWidth={2} />
          <span
            className={`${labelClass} inline-block overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out`}
            aria-hidden={collapsed}
          >
            Audit Logs
          </span>
        </NavLink>
      </nav>

      <div className="px-3 pb-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`w-full flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all ${!collapsed ? "rotate-180" : ""}`}
        >
          <ChevronRight size={20} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
};



