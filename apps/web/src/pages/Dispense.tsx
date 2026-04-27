import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryTable } from "../components/InventoryTable";
import type { ProductCatalogItem, ProductBatch } from "../components/InventoryTable";
import { DispenseList } from "../components/DispenseList";
import type { DispenseItem, DispenseReason } from "../components/DispenseList";
import { SearchBar } from "../components/SearchBar";
import { SortFilterChips } from "../components/SortFilterChips";
import { inventoryApi } from "../api/inventory";
import { type SortFilter } from "../utils/catalogDecorators";
import { usePaginatedCatalog } from "../hooks/usePaginatedCatalog";
import { MedicineWithStock } from "../utils/types";

export function Dispense() {
    const queryClient = useQueryClient();

    // ── Pagination state (mirrors Inventory page) ─────────────────────────────
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // ── Decorator pattern for sort/filter chips ───────────────────────────────
    const [activeFilters, setActiveFilters] = useState<SortFilter[]>([]);

    const toggleFilter = (filter: SortFilter) => {
        setActiveFilters(prev =>
            prev.includes(filter)
                ? prev.filter(f => f !== filter)
                : [...prev, filter]
        );
    };

    // Debounce search input — reset to page 1 on new query
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearchQuery(searchInput.trim());
        }, 350);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    // Use the shared pagination hook
    const {
        displayCatalog,
        setCurrentPage,
        totalPages,
        safeCurrentPage,
        totalCount,
        isLoading,
        isFetching,
        rawInventory,
        pageSize,
    } = usePaginatedCatalog(searchQuery, activeFilters);

    // ── Dispense mutation ─────────────────────────────────────────────────────
    const dispenseMutation = useMutation({
        mutationFn: inventoryApi.stockOutward,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-dispense"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });

    // ── Dispense cart state ───────────────────────────────────────────────────
    const [dispenseItems, setDispenseItems] = useState<DispenseItem[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleAddToDispense = (product: ProductCatalogItem, batch: ProductBatch) => {
        if (dispenseItems.find(i => i.batchNumber === batch.batchNumber)) return;

        const medicine = rawInventory.find((m: MedicineWithStock) => m.id === product.productId);
        const realBatch = medicine?.batches.find((b: any) => b.batchNumber === batch.batchNumber);
        if (!realBatch) return;

        setDispenseItems(prev => [...prev, {
            productId: product.productId,
            batchId: realBatch.id,
            name: product.productDetails,
            batchNumber: batch.batchNumber,
            quantity: 1,
            maxQuantity: batch.quantity,
            reason: "Sale",
        }]);
    };

    const handleUpdateQuantity = (batchNumber: string, newQuantity: number) => {
        setDispenseItems(items =>
            items.map(item =>
                item.batchNumber === batchNumber ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const handleUpdateReason = (batchNumber: string, reason: DispenseReason) => {
        setDispenseItems(items =>
            items.map(item =>
                item.batchNumber === batchNumber ? { ...item, reason } : item
            )
        );
    };

    const handleRemove = (batchNumber: string) => {
        setDispenseItems(items => items.filter(item => item.batchNumber !== batchNumber));
    };

    const handleConfirmDispense = async () => {
        if (dispenseItems.length === 0) return;
        setErrorMessage("");
        setSuccessMessage("");

        try {
            await dispenseMutation.mutateAsync({
                items: dispenseItems.map(i => ({
                    batchId: i.batchId,
                    quantity: i.quantity,
                    reason: i.reason,
                })),
            });
            setSuccessMessage(`Successfully dispensed ${dispenseItems.length} batch(es).`);
            setDispenseItems([]);
        } catch {
            setErrorMessage("Failed to dispense. Please try again.");
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    if (isLoading && displayCatalog.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading inventory...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dispense</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Select medicine batches and prepare outgoing stock
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="w-full max-w-2xl shrink-0">
                <SearchBar
                    placeholder="Search by medicine name, generic name, or batch..."
                    onSearch={(q) => setSearchInput(q)}
                />
            </div>

            {/* Sort filter chips — decorator toggles */}
            <SortFilterChips activeFilters={activeFilters} onToggle={toggleFilter} />

            {isFetching && (
                <p className="text-xs text-slate-400">Updating results...</p>
            )}

            {/* Status messages */}
            {errorMessage && (
                <p className="text-sm text-red-600 text-center">{errorMessage}</p>
            )}
            {successMessage && (
                <p className="text-sm text-emerald-600 text-center">{successMessage}</p>
            )}

            {/* Main layout: table + dispense cart */}
            <main className="w-full flex flex-col xl:flex-row gap-6 items-start">
                <section className="flex-1 min-w-0 flex flex-col min-h-0 gap-4">
                    <div className="flex-1 min-h-0 rounded-3xl overflow-hidden border border-slate-200/50 bg-white shadow-sm">
                        <InventoryTable
                            products={displayCatalog}
                            mode="dispense"
                            onAddBatch={handleAddToDispense}
                        />
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3 text-sm text-slate-500 shadow-sm">
                        <span className="text-xs">
                            Showing{" "}
                            <strong className="text-slate-700">
                                {totalCount === 0
                                    ? 0
                                    : (safeCurrentPage - 1) * pageSize + 1}–{Math.min(safeCurrentPage * pageSize, totalCount)}
                            </strong>{" "}
                            of <strong className="text-slate-700">{totalCount}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={safeCurrentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                                ← Previous
                            </button>
                            <span className="text-xs text-slate-400">
                                Page <strong className="text-slate-600">{safeCurrentPage}</strong> of {totalPages}
                            </span>
                            <label className="flex items-center gap-1.5 text-xs text-slate-400">
                                Jump to
                                <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={safeCurrentPage}
                                    onChange={(e) => {
                                        const n = Number(e.target.value);
                                        if (Number.isFinite(n))
                                            setCurrentPage(Math.min(totalPages, Math.max(1, Math.floor(n))));
                                    }}
                                    className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-center text-xs text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={safeCurrentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </section>
                <aside className="w-full xl:w-80 shrink-0 xl:sticky xl:top-6">
                    <DispenseList
                        items={dispenseItems}
                        onUpdateQuantity={handleUpdateQuantity}
                        onUpdateReason={handleUpdateReason}
                        onRemove={handleRemove}
                        onConfirm={handleConfirmDispense}
                    />
                </aside>
            </main>
        </div>
    );
}