import { Fragment, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProductBatch = {
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    supplier: string;
    location: string;
    costPrice: number;
    sellingPrice: number;
};

export type ProductCatalogItem = {
    productId: number;
    productDetails: string;
    genericName: string;
    dosage: string | null;
    form: string | null;
    baseUnit: string;
    packageUnit: string | null;
    conversionFactor: number;
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
    title?: string;
    emptyTitle?: string;
    emptySubtitle?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysLeft(expiryDate: string) {
    return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
}

function fmt(n: number) {
    return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ExpiryBadge({ days }: { days: number }) {
    if (days <= 0)
        return <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Expired</span>;
    if (days <= 90)
        return <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">{days}d left</span>;
    if (days <= 180)
        return <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">{days}d left</span>;
    return <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">{days}d left</span>;
}

function StatusPill({ status }: { status: ProductCatalogItem["status"] }) {
    const map = {
        "In Stock":     { cls: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
        "Low Stock":    { cls: "bg-amber-50 text-amber-800 border-amber-200",       dot: "bg-amber-400"   },
        "Out of Stock": { cls: "bg-red-50 text-red-800 border-red-200",             dot: "bg-red-500"     },
    };
    const { cls, dot } = map[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
            {status}
        </span>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InventoryTable({
    products = [],
    mode = "view",
    onAddBatch,
    title,
    emptyTitle = "No products found",
    emptySubtitle = "Add a product or complete a stock inward to get started.",
}: InventoryTableProps) {
    const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

    const resolvedTitle = title ?? (mode === "dispense" ? "Select medicine" : "Inventory master");

    if (products.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
                    </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">{emptyTitle}</p>
                <p className="text-xs text-slate-400">{emptySubtitle}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-slate-800">
                    {resolvedTitle}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                    {products.length} products
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: 860, fontSize: 13 }}>
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Product · Unit</th>
                            <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Generic · Form</th>
                            <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</th>
                            <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Total stock</th>
                            <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Shelf</th>
                            <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Batches</th>
                            <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                            <th className="text-right px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {products.map((product) => {
                            const isExpanded = expandedProduct === product.productId;
                            const batchDays = product.batches.map(b => daysLeft(b.expiryDate));
                            const hasExpired = batchDays.some(d => d <= 0);
                            const hasNearExpiry = !hasExpired && batchDays.some(d => d <= 90);
                            const availableCount = product.batches.filter(b => daysLeft(b.expiryDate) > 0).length;

                            // Unit display
                            const unitLabel = product.packageUnit
                                ? `${product.conversionFactor} ${product.baseUnit}s / ${product.packageUnit}`
                                : product.baseUnit;

                            return (
                                <Fragment key={product.productId}>
                                    <tr
                                        className={`cursor-pointer transition-colors ${isExpanded ? "bg-blue-50/30" : "hover:bg-slate-50"}`}
                                        onClick={() => setExpandedProduct(isExpanded ? null : product.productId)}
                                    >
                                        {/* Product + unit */}
                                        <td className="px-5 py-3" style={{ width: "18%" }}>
                                            <p className="font-bold text-slate-900 leading-tight">{product.productDetails}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{unitLabel}</p>
                                            {hasExpired    && <p className="text-[10px] font-bold text-red-500 mt-0.5">⚠ Expired batch</p>}
                                            {hasNearExpiry && <p className="text-[10px] font-bold text-amber-600 mt-0.5">⚠ Near expiry</p>}
                                        </td>

                                        {/* Generic + form */}
                                        <td className="px-3 py-3" style={{ width: "19%" }}>
                                            <p className="text-slate-700 leading-tight">{product.genericName}</p>
                                            {product.dosage && (
                                                <p className="text-[11px] text-slate-500 mt-0.5">{product.dosage}</p>
                                            )}
                                            {product.form && (
                                                <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                                    {product.form}
                                                </span>
                                            )}
                                        </td>

                                        {/* Category */}
                                        <td className="px-3 py-3" style={{ width: "11%" }}>
                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                                                {product.category}
                                            </span>
                                        </td>

                                        {/* Total stock */}
                                        <td className="px-3 py-3 text-right" style={{ width: "10%" }}>
                                            <span className="text-base font-bold text-slate-800">{product.totalStock.toLocaleString()}</span>
                                            <span className="block text-[10px] text-slate-400">{product.baseUnit}s</span>
                                        </td>

                                        {/* Shelf */}
                                        <td className="px-3 py-3 text-center" style={{ width: "7%" }}>
                                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                                {product.shelfLocation}
                                            </span>
                                        </td>

                                        {/* Batch count */}
                                        <td className="px-3 py-3 text-center" style={{ width: "7%" }}>
                                            <span className="font-bold text-slate-800">{availableCount}</span>
                                            <span className="block text-[10px] text-slate-400">available</span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-3 py-3" style={{ width: "12%" }}>
                                            <StatusPill status={product.status} />
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-3 text-right" style={{ width: "16%" }} onClick={e => e.stopPropagation()}>
                                            <div className="inline-flex items-center gap-1.5">
                                                {mode === "view" && (
                                                    <button className="px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors">
                                                        Edit
                                                    </button>
                                                )}
                                                <button
                                                    onClick={e => { e.stopPropagation(); setExpandedProduct(isExpanded ? null : product.productId); }}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                                        className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* ── Expanded batch sub-table ── */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={8} className="bg-slate-50 px-5 py-3 border-t border-slate-100">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                    Batches — {product.batches.length} total
                                                </p>

                                                {product.batches.length === 0 ? (
                                                    <p className="text-center py-4 text-xs text-slate-400 italic">No available batches.</p>
                                                ) : (
                                                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                                                        <table className="w-full border-collapse bg-white" style={{ fontSize: 12 }}>
                                                            <thead>
                                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Batch no.</th>
                                                                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Supplier</th>
                                                                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Location</th>
                                                                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Expiry</th>
                                                                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Days left</th>
                                                                    <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Qty</th>
                                                                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Share of stock</th>
                                                                    <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cost</th>
                                                                    <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Sell price</th>
                                                                    {mode === "dispense" && (
                                                                        <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Dispense</th>
                                                                    )}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {product.batches.map((batch) => {
                                                                    const days = daysLeft(batch.expiryDate);
                                                                    const expired = days <= 0;
                                                                    const near = !expired && days <= 90;

                                                                    // ✅ FIX: % of total product stock, not relative to largest batch
                                                                    const pct = product.totalStock > 0
                                                                        ? Math.round((batch.quantity / product.totalStock) * 100)
                                                                        : 0;

                                                                    return (
                                                                        <tr key={batch.batchNumber}
                                                                            className={`transition-colors ${expired ? "bg-red-50/60" : near ? "bg-amber-50/30" : "hover:bg-slate-50"}`}>

                                                                            {/* Batch no. */}
                                                                            <td className="px-4 py-2.5">
                                                                                <span className="font-mono font-bold text-slate-800">{batch.batchNumber}</span>
                                                                            </td>

                                                                            {/* Supplier */}
                                                                            <td className="px-4 py-2.5 text-slate-500">{batch.supplier}</td>

                                                                            {/* Location */}
                                                                            <td className="px-4 py-2.5">
                                                                                <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                                                    {batch.location || "—"}
                                                                                </span>
                                                                            </td>

                                                                            {/* Expiry */}
                                                                            <td className="px-4 py-2.5">
                                                                                <span className={`font-semibold ${expired ? "text-red-700" : near ? "text-amber-700" : "text-slate-700"}`}>
                                                                                    {batch.expiryDate}
                                                                                </span>
                                                                            </td>

                                                                            {/* Days left */}
                                                                            <td className="px-4 py-2.5">
                                                                                <ExpiryBadge days={days} />
                                                                            </td>

                                                                            {/* Quantity */}
                                                                            <td className="px-4 py-2.5 text-right">
                                                                                <span className="font-bold text-slate-800">{batch.quantity.toLocaleString()}</span>
                                                                                <span className="text-[10px] text-slate-400 ml-1">{product.baseUnit}s</span>
                                                                            </td>

                                                                            {/* Share of stock bar — % of total product stock */}
                                                                            <td className="px-4 py-2.5">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                                                                        <div
                                                                                            className={`h-full rounded-full ${expired ? "bg-red-400" : near ? "bg-amber-400" : "bg-emerald-400"}`}
                                                                                            style={{ width: `${pct}%` }}
                                                                                        />
                                                                                    </div>
                                                                                    <span className="text-[10px] text-slate-400 tabular-nums w-7">{pct}%</span>
                                                                                </div>
                                                                            </td>

                                                                            {/* Cost price */}
                                                                            <td className="px-4 py-2.5 text-right">
                                                                                <span className="font-semibold text-slate-700">{fmt(batch.costPrice)}</span>
                                                                                <span className="block text-[10px] text-slate-400">/ {product.baseUnit}</span>
                                                                            </td>

                                                                            {/* Sell price */}
                                                                            <td className="px-4 py-2.5 text-right">
                                                                                <span className="font-bold text-emerald-700">{fmt(batch.sellingPrice)}</span>
                                                                                <span className="block text-[10px] text-slate-400">/ {product.baseUnit}</span>
                                                                            </td>

                                                                            {/* Dispense */}
                                                                            {mode === "dispense" && (
                                                                                <td className="px-4 py-2.5 text-right">
                                                                                    <button
                                                                                        onClick={e => { e.stopPropagation(); onAddBatch?.(product, batch); }}
                                                                                        disabled={expired || batch.quantity === 0}
                                                                                        className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                                                    >
                                                                                        Add
                                                                                    </button>
                                                                                </td>
                                                                            )}
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
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