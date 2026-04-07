import { Fragment, useState } from "react";

export type ProductBatch = {
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    supplier: string;
};

export type ProductCatalogItem = {
    productId: number;          // ← added: needed to link back to backend
    productDetails: string;
    dosage: string;
    category: string;
    totalStock: number;
    shelfLocation: string;
    status: "In Stock" | "Low Stock" | "Out of Stock";
    batches: ProductBatch[];
};

type InventoryTableProps = {
    products?: ProductCatalogItem[];
    mode?: "view" | "dispense";
    onAddBatch?: (product: ProductCatalogItem, batch: ProductBatch) => void;
};

export function InventoryTable({
    products = [],
    mode = "view",
    onAddBatch,
}: InventoryTableProps) {
    const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

    const calculateDaysLeft = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    if (products.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-sm text-slate-500">
                No products found. Add a product or complete a stock inward to get started.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                    {mode === "dispense" ? "Select Medicine" : "Inventory Master"}
                </h2>
                <div className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-600 rounded-md">
                    {products.length} Products
                </div>
            </div>

            <div className="overflow-y-auto overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse table-fixed">
                    <colgroup>
                        <col className="w-[12%]" />
                        <col className="w-[23%]" />
                        <col className="w-[9%]" />
                        <col className="w-[23%]" />
                        <col className="w-[13%]" />
                        <col className="w-[7%]" />
                        <col className="w-[13%]" />
                    </colgroup>
                    <thead className="sticky top-0 z-20 bg-white text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200 shadow-sm">
                        <tr>
                            <th className="pl-6 pr-2 py-3">Product</th>
                            <th className="px-2 py-3 text-center">Generic Name</th>
                            <th className="px-2 py-3">Category</th>
                            <th className="px-2 py-3 text-center">Total Stock</th>
                            <th className="px-2 py-3">Shelf</th>
                            <th className="px-2 py-3">Status</th>
                            <th className="pl-2 pr-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map((product) => {
                            const rowKey = `${product.productId}`;
                            const isExpanded = expandedProduct === rowKey;

                            return (
                                <Fragment key={rowKey}>
                                    <tr
                                        className={`hover:bg-blue-50/30 transition-all cursor-pointer ${isExpanded ? "bg-blue-50/50" : ""}`}
                                        onClick={() => setExpandedProduct(isExpanded ? null : rowKey)}
                                    >
                                        <td className={`pl-6 pr-2 py-4 font-semibold text-slate-900 ${mode === "view" ? "truncate" : ""}`}>
                                            {product.productDetails}
                                        </td>
                                        <td className="px-2 py-4 text-slate-600 text-center whitespace-nowrap">{product.dosage}</td>
                                        <td className="px-2 py-4 text-slate-600">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-[11px] font-bold text-slate-500">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-2 py-4 text-slate-900 font-medium text-center whitespace-nowrap">{product.totalStock}</td>
                                        <td className="px-2 py-4 text-slate-600 font-mono text-xs whitespace-nowrap">{product.shelfLocation}</td>
                                        <td className="px-2 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                product.status === "In Stock" ? "bg-emerald-100 text-emerald-700"
                                                : product.status === "Low Stock" ? "bg-amber-100 text-amber-700"
                                                : "bg-red-100 text-red-700"
                                            }`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="pl-2 pr-6 py-4 text-right whitespace-nowrap">
                                            {mode === "view" ? (
                                                <div className="inline-flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50">
                                                        Edit
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-slate-400">
                                                    <svg className={`w-5 h-5 transition-transform inline-block ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <tr className="bg-slate-50/50">
                                            <td colSpan={7} className="px-8 py-4">
                                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                                    <table className="w-full text-[12px] text-left">
                                                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                                            <tr>
                                                                <th className="px-4 py-2">Batch Number</th>
                                                                <th className="px-4 py-2">Expiry Date</th>
                                                                <th className="px-4 py-2 text-center">Quantity</th>
                                                                <th className="px-4 py-2 text-center">Days Left</th>
                                                                <th className="px-4 py-2">Supplier</th>
                                                                {mode === "dispense" && <th className="px-4 py-2 text-right">Selection</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {product.batches.length > 0 ? (
                                                                product.batches.map((batch) => {
                                                                    const daysLeft = calculateDaysLeft(batch.expiryDate);
                                                                    return (
                                                                        <tr key={batch.batchNumber} className="hover:bg-slate-50 transition-colors">
                                                                            <td className="px-4 py-2 font-mono font-medium text-slate-700">{batch.batchNumber}</td>
                                                                            <td className="px-4 py-2 text-slate-600">{batch.expiryDate}</td>
                                                                            <td className="px-4 py-2 text-center font-semibold text-slate-800">{batch.quantity}</td>
                                                                            <td className={`px-4 py-2 text-center font-bold ${daysLeft <= 90 ? "text-red-500" : "text-emerald-600"}`}>
                                                                                {daysLeft}d
                                                                            </td>
                                                                            <td className="px-4 py-2 text-slate-600">{batch.supplier}</td>
                                                                            {mode === "dispense" && (
                                                                                <td className="px-4 py-2 text-right">
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); onAddBatch?.(product, batch); }}
                                                                                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[11px] font-bold hover:bg-blue-700 shadow-sm active:scale-95 transition-all"
                                                                                    >
                                                                                        ADD
                                                                                    </button>
                                                                                </td>
                                                                            )}
                                                                        </tr>
                                                                    );
                                                                })
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={mode === "dispense" ? 6 : 5} className="px-4 py-4 text-center text-slate-400 italic">
                                                                        No available batches.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}