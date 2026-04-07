import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryTable } from "../components/InventoryTable";
import { inventoryApi } from "../api/inventory";
import { productsApi } from "../api/products";
import { transformInventory } from "../utils/transformInventory";
import { SearchBar } from "../components/SearchBar";

// ── Transform backend response → InventoryTable shape ─────────────────────────
// GET /inventory returns: { inventory_batches: Batch, products: Product }[]
// We need to group rows by product and sum up quantities.

export function Inventory() {
    const queryClient = useQueryClient();
    const pageSize = 20;

    const { data: rawInventory = [], isLoading, isError } = useQuery({
    queryKey: ["inventory"],
    queryFn: inventoryApi.getAll, // already returns MedicineWithStock[]
  });

    const addProductMutation = useMutation({
        mutationFn: productsApi.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
    });

    const catalog = useMemo(() => {
            try { return transformInventory(rawInventory); } catch { return []; }
        }, [rawInventory]);

    const [showAddProduct, setShowAddProduct] = useState(false);
    const [newName, setNewName] = useState("");
    const [newGenericName, setNewGenericName] = useState("");
    const [newBaseUnit, setNewBaseUnit] = useState("Tablet");
    const [errorMessage, setErrorMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredCatalog = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return catalog;
        return catalog.filter(p =>
            p.productDetails.toLowerCase().includes(q) ||
            p.dosage.toLowerCase().includes(q) ||
            p.batches.some(b => b.batchNumber.toLowerCase().includes(q))
        );
    }, [catalog, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredCatalog.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedCatalog = useMemo(() => {
        const startIndex = (safeCurrentPage - 1) * pageSize;
        return filteredCatalog.slice(startIndex, startIndex + pageSize);
    }, [filteredCatalog, safeCurrentPage]);


    const normalizedCatalog = useMemo(
        () => new Set(catalog.map((item) => `${item.productDetails.trim().toLowerCase()}|${item.dosage.trim().toLowerCase()}`)),
        [catalog]
    );

    const handleAddProduct = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedName = newName.trim();
        const trimmedGenericName = newGenericName.trim();

        if (!trimmedName) { setErrorMessage("Product name is required."); return; }
        if (!trimmedGenericName) { setErrorMessage("Generic name is required."); return; }
        if (normalizedCatalog.has(`${trimmedName.toLowerCase()}|${trimmedGenericName.toLowerCase()}`)) {
            setErrorMessage("This product already exists in the catalog.");
            return;
        }

        try {
            await addProductMutation.mutateAsync({
                name: trimmedName,
                genericName: trimmedGenericName,
                baseUnit: newBaseUnit,
                conversionFactor: 1,
                isPrescriptionRequired: false,
                requiresColdChain: false,
                reorderLevel: 10,
            });
            setNewName("");
            setNewGenericName("");
            setNewBaseUnit("Tablet");
            setErrorMessage("");
            setShowAddProduct(false);
        } catch {
            setErrorMessage("Failed to add product. Please try again.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
                Loading inventory...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center py-20 text-red-500 text-sm">
                Failed to load inventory. Is the backend running?
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">
                        Export CSV
                    </button>
                    <button
                        onClick={() => { setShowAddProduct(true); setErrorMessage(""); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm flex items-center gap-2"
                    >
                        <span>+</span> Add Product
                    </button>
                </div>
            </div>
            <div className="w-full max-w-2xl mx-auto mb-6 shrink-0">
                            <SearchBar
                                placeholder="Search by medicine name, dosage, or batch..."
                                onSearch={(query) => {
                                    setSearchQuery(query);
                                    setCurrentPage(1);
                                }} />
            </div>
            {showAddProduct && (
                <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <form onSubmit={handleAddProduct} className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div className="flex-1">
                            <label htmlFor="product-name" className="block text-sm font-medium text-slate-700 mb-1">Brand / Product Name</label>
                            <input
                                id="product-name"
                                value={newName}
                                onChange={(e) => { setNewName(e.target.value); if (errorMessage) setErrorMessage(""); }}
                                placeholder="e.g. Biogesic"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="generic-name" className="block text-sm font-medium text-slate-700 mb-1">Generic Name</label>
                            <input
                                id="generic-name"
                                value={newGenericName}
                                onChange={(e) => { setNewGenericName(e.target.value); if (errorMessage) setErrorMessage(""); }}
                                placeholder="e.g. Paracetamol 500mg"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                            {errorMessage && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}
                        </div>
                        <div className="w-full md:w-36">
                            <label htmlFor="base-unit" className="block text-sm font-medium text-slate-700 mb-1">Base Unit</label>
                            <select
                                id="base-unit"
                                value={newBaseUnit}
                                onChange={(e) => setNewBaseUnit(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                                <option>Tablet</option>
                                <option>Capsule</option>
                                <option>mL</option>
                                <option>Sachet</option>
                                <option>Piece</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={addProductMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                            >
                                {addProductMutation.isPending ? "Saving..." : "Save Product"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowAddProduct(false); setNewName(""); setNewGenericName(""); setErrorMessage(""); }}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mx-auto w-full max-w-6xl">
                <InventoryTable products={paginatedCatalog} />
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                    <span>
                        Showing {filteredCatalog.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
                        -{Math.min(safeCurrentPage * pageSize, filteredCatalog.length)} of {filteredCatalog.length}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={safeCurrentPage === 1}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span>
                            Page {safeCurrentPage} of {totalPages}
                        </span>
                        <label className="flex items-center gap-2">
                            <span className="whitespace-nowrap">Jump to</span>
                            <input
                                type="number"
                                min={1}
                                max={totalPages}
                                value={safeCurrentPage}
                                onChange={(event) => {
                                    const nextPage = Number(event.target.value);
                                    if (!Number.isFinite(nextPage)) return;
                                    setCurrentPage(Math.min(totalPages, Math.max(1, Math.floor(nextPage))));
                                }}
                                className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={safeCurrentPage === totalPages}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}