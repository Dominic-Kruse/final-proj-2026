import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "../components/StatCard";
import { Chart } from "../components/Chart";
import { InventoryTable } from "../components/InventoryTable";
import { inventoryApi } from "../api/inventory";
import { transformInventory } from "../utils/transformInventory";



export function Dashboard() {
    const { data: rawInventory = [], isLoading } = useQuery({
        queryKey: ["inventory"],
        queryFn: inventoryApi.getAll,
    });

   const catalog = useMemo(() => {
           try { return transformInventory(rawInventory); } catch { return []; }
       }, [rawInventory]);

    const stats = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return {
            total: catalog.length,
            lowStock: catalog.filter(p => p.status === "Low Stock").length,
            outOfStock: catalog.filter(p => p.status === "Out of Stock").length,
            expired: rawInventory.reduce((count, medicine) => {
                return count + (medicine.batches ?? []).filter(
                    b => b.expiryDate <= today && b.status === "available"
                ).length;
            }, 0),
        };
    }, [catalog, rawInventory]);

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <div className="h-10 w-64 bg-white border border-slate-200 rounded-lg"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Medicines"
                    value={isLoading ? "..." : String(stats.total)}
                    subtitle="Products in catalog"
                />
                <StatCard
                    title="Low Stock"
                    value={isLoading ? "..." : String(stats.lowStock)}
                    subtitle="Needs restock"
                />
                <StatCard
                    title="Out of Stock"
                    value={isLoading ? "..." : String(stats.outOfStock)}
                    subtitle="No units available"
                />
                <StatCard
                    title="Expired Batches"
                    value={isLoading ? "..." : String(stats.expired)}
                    subtitle="Remove soon"
                />
            </div>

            <div className="mb-8">
                <Chart />
            </div>

            <div className="mb-8">
                <InventoryTable products={catalog} />
            </div>
        </>
    );
}