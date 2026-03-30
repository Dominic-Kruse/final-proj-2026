import { Outlet } from "react-router-dom";
import { Sidebar } from "./SideBar";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] overflow-hidden font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}