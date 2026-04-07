import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryTable } from "../components/InventoryTable";
import type { ProductCatalogItem, ProductBatch } from "../components/InventoryTable";
import { DispenseList } from "../components/DispenseList";
import type { DispenseItem, DispenseReason } from "../components/DispenseList";
import { SearchBar } from "../components/SearchBar";
import { inventoryApi } from "../api/inventory";
import { transformInventory } from "../utils/transformInventory";

export function Dispense() {
    const queryClient = useQueryClient();

    const { data: rawInventory = [] } = useQuery({
        queryKey: ["inventory"],
        queryFn: inventoryApi.getAll,
    });

    const catalog = useMemo(() => {
        try { return transformInventory(rawInventory); } catch { return []; }
    }, [rawInventory]);

    const dispenseMutation = useMutation({
        mutationFn: inventoryApi.stockOutward,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
    });

    const [dispenseItems, setDispenseItems] = useState<DispenseItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const filteredCatalog = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return catalog;
        return catalog.filter(p =>
            p.productDetails.toLowerCase().includes(q) ||
            p.dosage.toLowerCase().includes(q) ||
            p.batches.some(b => b.batchNumber.toLowerCase().includes(q))
        );
    }, [catalog, searchQuery]);

    const handleAddToDispense = (product: ProductCatalogItem, batch: ProductBatch) => {
        if (dispenseItems.find(i => i.batchNumber === batch.batchNumber)) return;

        // Look up the real DB batch id from rawInventory
        const medicine = rawInventory.find(m => m.id === product.productId);
        const realBatch = medicine?.batches.find(b => b.batchNumber === batch.batchNumber);
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
            items.map(item => item.batchNumber === batchNumber ? { ...item, quantity: newQuantity } : item)
        );
    };

    const handleUpdateReason = (batchNumber: string, reason: DispenseReason) => {
        setDispenseItems(items =>
            items.map(item => item.batchNumber === batchNumber ? { ...item, reason } : item)
        );
    };

    const handleRemove = (batchNumber: string) => {
        setDispenseItems(items => items.filter(item => item.batchNumber !== batchNumber));
    };

    const handleConfirmDispense = async () => {
        if (dispenseItems.length === 0) return;
        console.log("dispenseItems:", JSON.stringify(dispenseItems, null, 2));
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8 shrink-0">
                <h1 className="text-2xl font-bold text-slate-800">Dispense</h1>
                <p className="text-sm text-slate-500">Select medicine batches and prepare outgoing stock</p>
            </div>

            <div className="w-full max-w-2xl mx-auto mb-6 shrink-0">
                <SearchBar
                    placeholder="Search by medicine name, dosage, or batch..."
                    onSearch={setSearchQuery}
                />
            </div>

            {errorMessage && (
                <p className="text-sm text-red-600 text-center">{errorMessage}</p>
            )}
            {successMessage && (
                <p className="text-sm text-emerald-600 text-center">{successMessage}</p>
            )}

            <main className="mx-auto w-full flex flex-col lg:flex-row gap-6">
                <section className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 min-h-0 rounded-3xl overflow-hidden border border-slate-200/50 bg-white shadow-sm">
                        <InventoryTable
                            products={filteredCatalog}
                            mode="dispense"
                            onAddBatch={handleAddToDispense}
                        />
                    </div>
                </section>

                <aside className="w-full lg:w-96 flex flex-col min-h-0 shrink-0">
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