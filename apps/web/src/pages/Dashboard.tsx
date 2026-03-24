import { StatCard } from "../components/StatCard";
import { Chart } from "../components/Chart";
import { InventoryTable } from "../components/InventoryTable";

export function Dashboard() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="h-10 w-64 bg-white border border-slate-200 rounded-lg"></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Medicines" value="120" subtitle="In stock" />
        <StatCard title="Low Stock" value="8" subtitle="Needs restock" />
        <StatCard title="Expired" value="3" subtitle="Remove soon" />
        <StatCard title="Sales Today" value="₱5,200" subtitle="Revenue" />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <Chart />
      </div>

      {/* Inventory Table */}
      <div className="mb-8">
        <InventoryTable />
      </div>
    </>
  );
}