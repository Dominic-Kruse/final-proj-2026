import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "../components/StatCard";
import { Chart } from "../components/Chart";
import { InventoryTable } from "../components/InventoryTable";
import { InventoryAlertModal } from "../components/InventoryAlertModal";
import { ChipToggleGroup } from "../components/ChipToggleGroup";
import { inventoryApi } from "../api/inventory";
import { transformInventory } from "../utils/transformInventory";
import {
    expiryOnlyInventoryStrategy,
    stockOnlyInventoryStrategy,
} from "../utils/inventoryUrgencyStrategy";



export function Dashboard() {
    const [activeModal, setActiveModal] = useState<"low-stock" | "expired" | null>(null);
    const [activeView, setActiveView] = useState<"all" | "stock" | "expiry">("all");
    const stockStrategy = stockOnlyInventoryStrategy;
    const expiryStrategy = expiryOnlyInventoryStrategy;

    const { data: rawInventory = [], isLoading } = useQuery({
        queryKey: ["inventory"],
        queryFn: inventoryApi.getAll,
    });

   const catalog = useMemo(() => {
           try {
               return transformInventory(rawInventory);
           } catch { return []; }
       }, [rawInventory]);

    const stockCatalog = useMemo(
        () => stockStrategy.sort(stockStrategy.filterUrgent(catalog)),
        [catalog, stockStrategy]
    );

    const expiryCatalog = useMemo(
        () => expiryStrategy.sort(expiryStrategy.filterUrgent(catalog)),
        [catalog, expiryStrategy]
    );

    const allAlertsCatalog = useMemo(
        () => expiryStrategy.sort(
            catalog.filter((item) => stockStrategy.isUrgent(item) || expiryStrategy.isUrgent(item))
        ),
        [catalog, stockStrategy, expiryStrategy]
    );

    const alertViewOptions = [
        {
            key: "all" as const,
            label: "All alerts",
            activeClass: "bg-slate-800 text-white border-slate-800",
            dotClass: "bg-white",
        },
        {
            key: "stock" as const,
            label: "Stock alerts",
            activeClass: "bg-emerald-500 text-white border-emerald-500",
            dotClass: "bg-white",
        },
        {
            key: "expiry" as const,
            label: "Expiry alerts",
            activeClass: "bg-red-600 text-white border-red-600",
            dotClass: "bg-white",
        },
    ];

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
                    variant="warning"
                    onClick={() => setActiveModal("low-stock")}
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
                    variant="danger"
                    onClick={() => setActiveModal("expired")}
                />
            </div>

            <div className="mb-8">
                <Chart />
            </div>

            <div className="mb-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Inventory alerts</h2>
                        <p className="text-sm text-slate-500">
                            Switch between stock risk and expiry risk.
                        </p>
                    </div>

                    <ChipToggleGroup
                        label="View by"
                        items={alertViewOptions}
                        activeValues={[activeView]}
                        onToggle={(value) => setActiveView(value)}
                        showOrderBadges={false}
                    />
                </div>

                <InventoryTable
                    products={
                        activeView === "all"
                            ? allAlertsCatalog
                            : activeView === "stock"
                                ? stockCatalog
                                : expiryCatalog
                    }
                    title={
                        activeView === "all"
                            ? "All alerts"
                            : activeView === "stock"
                                ? "Stock alerts"
                                : "Expiry alerts"
                    }
                    emptyTitle={
                        activeView === "all"
                            ? "No alerts right now"
                            : activeView === "stock"
                            ? "No stock alerts right now"
                            : "No expiry alerts right now"
                    }
                    emptySubtitle={
                        activeView === "all"
                            ? "No stock or expiry alerts were found."
                            : activeView === "stock"
                            ? "No low-stock or out-of-stock medicines were found."
                            : "No expired or near-expiry medicines were found."
                    }
                />
            </div>

            {activeModal && (
                <InventoryAlertModal
                    type={activeModal}
                    onClose={() => setActiveModal(null)}
                />
            )}
        </>
    );
}