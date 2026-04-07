import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/products";
import { inventoryApi } from "../api/inventory";

type StockInBatchDraft = {
    productId: number;
    productName: string;
    productDosage: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    unitCost: number;
    sellingPrice: number;
};

const defaultDateReceived = new Date().toISOString().slice(0, 10);

export function StockIn() {
    const queryClient = useQueryClient();

    // ── Remote state ───────────────────────────────────────────────────────────
    const { data: productCatalog = [] } = useQuery({
        queryKey: ["products"],
        queryFn: productsApi.getAll,
    });

    const addProductMutation = useMutation({
        mutationFn: productsApi.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    });

    const stockInwardMutation = useMutation({
        mutationFn: inventoryApi.stockInward,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
    });

    // ── Local form state ───────────────────────────────────────────────────────
    const [supplier, setSupplier] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [dateReceived, setDateReceived] = useState(defaultDateReceived);
    const [productName, setProductName] = useState("");
    const [productDosage, setProductDosage] = useState("");
    const [batchNumber, setBatchNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unitCost, setUnitCost] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [draftBatches, setDraftBatches] = useState<StockInBatchDraft[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [saveMessage, setSaveMessage] = useState("");
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [pendingBatchData, setPendingBatchData] = useState<Omit<StockInBatchDraft, "productId"> | null>(null);
    const [addProductMessage, setAddProductMessage] = useState("");

    // ── Derived ────────────────────────────────────────────────────────────────
    const summary = useMemo(() => {
        const totalUnits = draftBatches.reduce((sum, item) => sum + item.quantity, 0);
        const totalCost = draftBatches.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
        const totalRetail = draftBatches.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);
        return { totalUnits, totalCost, totalRetail };
    }, [draftBatches]);

    const filteredDraftBatches = draftBatches;

    // ── Helpers ────────────────────────────────────────────────────────────────
    const resetBatchInputs = () => {
        setProductName("");
        setProductDosage("");
        setBatchNumber("");
        setExpiryDate("");
        setQuantity("");
        setUnitCost("");
        setSellingPrice("");
    };

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleAddBatch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaveMessage("");

        const trimmedProductName = productName.trim();
        const trimmedProductDosage = productDosage.trim();
        const trimmedBatchNumber = batchNumber.trim();
        const parsedQuantity = Number(quantity);
        const parsedUnitCost = Number(unitCost);
        const parsedSellingPrice = Number(sellingPrice);

        if (!supplier.trim() || !referenceNumber.trim() || !dateReceived) {
            setErrorMessage("Please complete supplier, invoice/reference number, and date received before adding batches.");
            return;
        }

        if (!trimmedProductName || !trimmedProductDosage || !trimmedBatchNumber || !expiryDate || !quantity || !unitCost || !sellingPrice) {
            setErrorMessage("Please complete all fields including product name and dosage.");
            return;
        }

        if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
            setErrorMessage("Quantity must be a positive number.");
            return;
        }

        if (!Number.isFinite(parsedUnitCost) || parsedUnitCost <= 0 || !Number.isFinite(parsedSellingPrice) || parsedSellingPrice <= 0) {
            setErrorMessage("Unit cost and selling price must be positive numbers.");
            return;
        }

        // Check against real product catalog from backend
        const matchedProduct = productCatalog.find(
            (p) =>
                p.name.toLowerCase() === trimmedProductName.toLowerCase() &&
                p.genericName.toLowerCase() === trimmedProductDosage.toLowerCase()
        );

        if (!matchedProduct) {
            setErrorMessage("");
            setPendingBatchData({
                productName: trimmedProductName,
                productDosage: trimmedProductDosage,
                batchNumber: trimmedBatchNumber,
                expiryDate,
                quantity: parsedQuantity,
                unitCost: parsedUnitCost,
                sellingPrice: parsedSellingPrice,
            });
            setShowAddProduct(true);
            return;
        }

        if (draftBatches.some((item) => item.batchNumber.toLowerCase() === trimmedBatchNumber.toLowerCase())) {
            setErrorMessage("Batch number already exists in the draft list.");
            return;
        }

        setDraftBatches((current) => [
            ...current,
            {
                productId: matchedProduct.id,
                productName: trimmedProductName,
                productDosage: trimmedProductDosage,
                batchNumber: trimmedBatchNumber,
                expiryDate,
                quantity: parsedQuantity,
                unitCost: parsedUnitCost,
                sellingPrice: parsedSellingPrice,
            },
        ]);
        setErrorMessage("");
        resetBatchInputs();
    };

    const handleRemoveBatch = (batchNumberToRemove: string) => {
        setDraftBatches((current) => current.filter((item) => item.batchNumber !== batchNumberToRemove));
    };

    const handleSaveInward = async () => {
        if (!supplier.trim() || !referenceNumber.trim() || !dateReceived) {
            setErrorMessage("Please fill in the stock inward header before saving.");
            return;
        }

        if (draftBatches.length === 0) {
            setErrorMessage("Add at least one batch to the draft list before saving.");
            return;
        }

        setErrorMessage("");

        try {
            await stockInwardMutation.mutateAsync({
                supplierName: supplier.trim(),
                referenceNumber: referenceNumber.trim(),
                dateReceived,
                batches: draftBatches.map((b) => ({
                    productId: b.productId,
                    batchNumber: b.batchNumber,
                    expiryDate: b.expiryDate,
                    quantity: b.quantity,
                    unitCost: b.unitCost,
                    sellingPrice: b.sellingPrice,
                })),
            });

            setSaveMessage(`Saved ${draftBatches.length} batch(es) from ${supplier.trim()} (ref: ${referenceNumber.trim()}).`);
            setDraftBatches([]);
            resetBatchInputs();
        } catch {
            setErrorMessage("Failed to save stock inward. Please try again.");
        }
    };

    const handleAddProduct = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!pendingBatchData) return;

        try {
            const newProduct = await addProductMutation.mutateAsync({
                name: pendingBatchData.productName,
                genericName: pendingBatchData.productDosage,
                baseUnit: "Tablet",
                conversionFactor: 1,
                isPrescriptionRequired: false,
                requiresColdChain: false,
                reorderLevel: 10,
            });

            setAddProductMessage(`Product "${newProduct.name}" added successfully.`);

            setTimeout(() => {
                setDraftBatches((current) => [
                    ...current,
                    { ...pendingBatchData, productId: newProduct.id },
                ]);
                setPendingBatchData(null);
                resetBatchInputs();
                setShowAddProduct(false);
                setAddProductMessage("");
            }, 1000);
        } catch {
            setAddProductMessage("Failed to add product. Please try again.");
        }
    };

    return (
        <div className={`w-full space-y-6 ${showAddProduct ? "lg:pr-128" : ""}`}>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Stock Inward</h1>
                <p className="text-sm text-slate-500">Capture supplier receipts and incoming batches</p>
            </div>

            {/* <SearchBar placeholder="Search products..." onSearch={setSearchQuery} /> */}

            {showAddProduct ? (
                <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Add New Product</h3>
                            <p className="text-sm text-slate-500">Create the medicine record before saving the batch.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setShowAddProduct(false); setPendingBatchData(null); setAddProductMessage(""); }}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Close
                        </button>
                    </div>

                    <form onSubmit={handleAddProduct} className="space-y-5 px-6 py-5">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            <p className="font-medium text-slate-700">Pending batch</p>
                            <p>{pendingBatchData?.batchNumber ?? "No batch number yet"}</p>
                            <p>{pendingBatchData ? `${pendingBatchData.quantity} units` : ""}</p>
                        </div>

                        <div>
                            <label htmlFor="product-name" className="mb-1 block text-sm font-medium text-slate-700">Product Name</label>
                            <input
                                id="product-name"
                                value={pendingBatchData?.productName || ""}
                                onChange={(e) => pendingBatchData && setPendingBatchData({ ...pendingBatchData, productName: e.target.value })}
                                placeholder="e.g. Azithromycin"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label htmlFor="product-dosage" className="mb-1 block text-sm font-medium text-slate-700">Dosage</label>
                            <input
                                id="product-dosage"
                                value={pendingBatchData?.productDosage || ""}
                                onChange={(e) => pendingBatchData && setPendingBatchData({ ...pendingBatchData, productDosage: e.target.value })}
                                placeholder="e.g. 500 mg"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={addProductMutation.isPending}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                                {addProductMutation.isPending ? "Adding..." : "Add New Product"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowAddProduct(false); setPendingBatchData(null); setAddProductMessage(""); }}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                        </div>

                        {addProductMessage ? <p className="text-sm text-emerald-700">{addProductMessage}</p> : null}
                    </form>
                </aside>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Inward Header</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label htmlFor="supplier" className="mb-1 block text-sm font-medium text-slate-700">Supplier</label>
                        <input
                            id="supplier"
                            value={supplier}
                            onChange={(e) => { setSupplier(e.target.value); if (errorMessage) setErrorMessage(""); }}
                            placeholder="e.g. MediCore Pharma"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="reference" className="mb-1 block text-sm font-medium text-slate-700">Invoice / Reference Number</label>
                        <input
                            id="reference"
                            value={referenceNumber}
                            onChange={(e) => { setReferenceNumber(e.target.value); if (errorMessage) setErrorMessage(""); }}
                            placeholder="e.g. INV-2026-118"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="date-received" className="mb-1 block text-sm font-medium text-slate-700">Date Received</label>
                        <input
                            id="date-received"
                            type="date"
                            value={dateReceived}
                            onChange={(e) => { setDateReceived(e.target.value); if (errorMessage) setErrorMessage(""); }}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Batch Entry</h2>
                <form onSubmit={handleAddBatch} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="product-name-input" className="mb-1 block text-sm font-medium text-slate-700">Product Name</label>
                        <input id="product-name-input" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Azithromycin" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                        <label htmlFor="product-dosage-input" className="mb-1 block text-sm font-medium text-slate-700">Dosage / Generic Name</label>
                        <input id="product-dosage-input" value={productDosage} onChange={(e) => setProductDosage(e.target.value)} placeholder="e.g. 500 mg" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                        <label htmlFor="batch-number" className="mb-1 block text-sm font-medium text-slate-700">Batch Number</label>
                        <input id="batch-number" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="e.g. AMX-2026-04" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                        <label htmlFor="expiry-date" className="mb-1 block text-sm font-medium text-slate-700">Expiry Date</label>
                        <input id="expiry-date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                        <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
                        <input id="quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                        <label htmlFor="unit-cost" className="mb-1 block text-sm font-medium text-slate-700">Unit Cost</label>
                        <input id="unit-cost" type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="0.00" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                        <label htmlFor="selling-price" className="mb-1 block text-sm font-medium text-slate-700">Selling Price</label>
                        <input id="selling-price" type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="0.00" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                            Add To Draft List
                        </button>
                    </div>
                </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Draft List</h2>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{draftBatches.length} batches</span>
                </div>

                {filteredDraftBatches.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-slate-500">No batch entries yet. Add at least one batch to prepare a stock inward save.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">Product Name</th>
                                    <th className="px-5 py-3">Dosage</th>
                                    <th className="px-5 py-3">Batch Number</th>
                                    <th className="px-5 py-3">Expiry Date</th>
                                    <th className="px-5 py-3 text-right">Quantity</th>
                                    <th className="px-5 py-3 text-right">Unit Cost</th>
                                    <th className="px-5 py-3 text-right">Selling Price</th>
                                    <th className="px-5 py-3 text-right">Line Total</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDraftBatches.map((item) => (
                                    <tr key={item.batchNumber} className="hover:bg-slate-50">
                                        <td className="px-5 py-3 text-slate-700">{item.productName}</td>
                                        <td className="px-5 py-3 text-slate-600">{item.productDosage}</td>
                                        <td className="px-5 py-3 font-mono text-xs text-slate-700">{item.batchNumber}</td>
                                        <td className="px-5 py-3 text-slate-600">{item.expiryDate}</td>
                                        <td className="px-5 py-3 text-right text-slate-800">{item.quantity}</td>
                                        <td className="px-5 py-3 text-right text-slate-800">{item.unitCost.toFixed(2)}</td>
                                        <td className="px-5 py-3 text-right text-slate-800">{item.sellingPrice.toFixed(2)}</td>
                                        <td className="px-5 py-3 text-right font-semibold text-slate-900">{(item.quantity * item.unitCost).toFixed(2)}</td>
                                        <td className="px-5 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBatch(item.batchNumber)}
                                                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Save</h2>

                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-slate-500">Total Units</p>
                        <p className="text-lg font-semibold text-slate-800">{summary.totalUnits}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-slate-500">Total Cost</p>
                        <p className="text-lg font-semibold text-slate-800">{summary.totalCost.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-slate-500">Potential Retail</p>
                        <p className="text-lg font-semibold text-slate-800">{summary.totalRetail.toFixed(2)}</p>
                    </div>
                </div>

                {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
                {saveMessage ? <p className="mt-4 text-sm text-emerald-700">{saveMessage}</p> : null}

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => { setDraftBatches([]); setErrorMessage(""); setSaveMessage(""); }}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Clear Draft
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveInward}
                        disabled={stockInwardMutation.isPending}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {stockInwardMutation.isPending ? "Saving..." : "Save Stock Inward"}
                    </button>
                </div>
            </section>
        </div>
    );
}