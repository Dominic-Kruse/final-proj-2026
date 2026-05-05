import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { dashboardApi } from "../api/dashboard";

const PIE_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#64748b"];
const HEATMAP_COLORS = ["#dc2626", "#f97316", "#eab308", "#84cc16", "#22c55e"];
const EXPIRY_BUCKETS = ["Expired", "0-30 days", "30-60 days", "60-90 days", ">90 days"];

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
    }).format(value);
}

export function Chart() {
    const {
        data: rawCategoryData = [],
        isLoading: loadingCategory,
    } = useQuery({
        queryKey: ["dashboard", "sales-by-category"],
        queryFn: dashboardApi.getSalesByCategory,
    });

    const {
        data: rawExpiryData = [],
        isLoading: loadingExpiry,
    } = useQuery({
        queryKey: ["dashboard", "sales-by-expiry-status"],
        queryFn: dashboardApi.getSalesByExpiryStatus,
    });

    const {
        data: rawStockByCategoryData = [],
        isLoading: loadingStockByCategory,
    } = useQuery({
        queryKey: ["dashboard", "stock-by-category"],
        queryFn: dashboardApi.getStockByCategory,
    });

    const {
        data: rawStockByExpiryData = [],
        isLoading: loadingStockByExpiry,
    } = useQuery({
        queryKey: ["dashboard", "stock-by-expiry-heatmap"],
        queryFn: dashboardApi.getStockByExpiryHeatmap,
    });

    const categoryData = useMemo(
        () => rawCategoryData.slice(0, 8).map((row) => ({
            ...row,
            revenue: Number(row.revenue) || 0,
            units: Number(row.units) || 0,
        })),
        [rawCategoryData],
    );

    const expiryData = useMemo(
        () => rawExpiryData.map((row) => ({
            ...row,
            revenue: Number(row.revenue) || 0,
            units: Number(row.units) || 0,
        })),
        [rawExpiryData],
    );

    const stockByCategoryData = useMemo(
        () => rawStockByCategoryData.slice(0, 8).map((row) => ({
            ...row,
            stock: Number(row.stock) || 0,
        })),
        [rawStockByCategoryData],
    );

    const stockByExpiryHeatmapData = useMemo(() => {
        const grouped = new Map<string, any>();

        // Initialize all categories with all buckets
        rawStockByExpiryData.forEach((row) => {
            if (!grouped.has(row.category)) {
                grouped.set(row.category, { category: row.category });
            }
        });

        // Add stock data for each bucket
        rawStockByExpiryData.forEach((row) => {
            const entry = grouped.get(row.category);
            if (entry) {
                entry[row.expiry_bucket] = Number(row.stock) || 0;
            }
        });

        // Ensure all buckets exist for each category (with 0 if not present)
        const result = Array.from(grouped.values()).map((entry) => {
            EXPIRY_BUCKETS.forEach((bucket) => {
                if (!(bucket in entry)) {
                    entry[bucket] = 0;
                }
            });
            return entry;
        });

        return result;
    }, [rawStockByExpiryData]);

    const isLoading = loadingCategory || loadingExpiry || loadingStockByCategory || loadingStockByExpiry;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Row 1: Sales Analytics */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-95">
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-800">Sales by Product Category</h3>
                    <p className="text-xs text-slate-500">Revenue generated per category</p>
                </div>

                {isLoading ? (
                    <div className="h-75 flex items-center justify-center text-sm text-slate-400">
                        Loading chart data...
                    </div>
                ) : categoryData.length === 0 ? (
                    <div className="h-75 flex items-center justify-center text-sm text-slate-400">
                        No category sales data yet.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryData} margin={{ top: 8, right: 12, left: 0, bottom: 12 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="category"
                                tick={{ fill: "#64748b", fontSize: 12 }}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => formatCurrency(Number(value))} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </section>

            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-95">
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-800">Sales by Expiry Status</h3>
                    <p className="text-xs text-slate-500">Sold units distribution across expiry states</p>
                </div>

                {isLoading ? (
                    <div className="h-75 flex items-center justify-center text-sm text-slate-400">
                        Loading chart data...
                    </div>
                ) : expiryData.length === 0 ? (
                    <div className="h-75 flex items-center justify-center text-sm text-slate-400">
                        No expiry-status sales data yet.
                    </div>
                ) : (
                    <div className="h-75 flex flex-col md:flex-row items-center">
                        <div className="w-full md:w-2/3 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip formatter={(value) => `${Number(value)} units`} />
                                    <Pie
                                        data={expiryData}
                                        dataKey="units"
                                        nameKey="status"
                                        innerRadius={55}
                                        outerRadius={95}
                                        paddingAngle={3}
                                    >
                                        {expiryData.map((entry, index) => (
                                            <Cell key={`${entry.status}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-full md:w-1/3 space-y-2 text-sm">
                            {expiryData.map((item, index) => (
                                <div key={item.status} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="inline-block w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                        />
                                        <span className="text-slate-600 truncate">{item.status}</span>
                                    </div>
                                    <span className="font-semibold text-slate-800">{item.units}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Row 2: Stock Analytics */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-95">
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-800">Current Stock by Category</h3>
                    <p className="text-xs text-slate-500">Available units per category</p>
                </div>

                {isLoading ? (
                    <div className="h-75 flex items-center justify-center text-sm text-slate-400">
                        Loading chart data...
                    </div>
                ) : stockByCategoryData.length === 0 ? (
                    <div className="h-75 flex items-center justify-center text-sm text-slate-400">
                        No stock data yet.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stockByCategoryData} margin={{ top: 8, right: 12, left: 0, bottom: 12 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="category"
                                tick={{ fill: "#64748b", fontSize: 12 }}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => `${Number(value)}`} />
                            <Tooltip formatter={(value) => `${Number(value)} units`} />
                            <Bar dataKey="stock" fill="#10b981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </section>

            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-95">
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-800">Stock by Expiry Date (Heatmap)</h3>
                    <p className="text-xs text-slate-500">Inventory distribution across expiry buckets</p>
                </div>

                {isLoading ? (
                    <div className="h-75 flex items-center justify-center text-sm text-slate-400">
                        Loading chart data...
                    </div>
                ) : stockByExpiryHeatmapData.length === 0 ? (
                    <div className="h-75 flex items-center justify-center text-sm text-slate-400">
                        No stock by expiry data yet.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stockByExpiryHeatmapData} margin={{ top: 8, right: 12, left: 0, bottom: 12 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="category"
                                tick={{ fill: "#64748b", fontSize: 12 }}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                            <Tooltip formatter={(value) => `${Number(value)} units`} />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                            {EXPIRY_BUCKETS.map((bucket, index) => (
                                <Bar
                                    key={bucket}
                                    dataKey={bucket}
                                    stackId="expiry"
                                    fill={HEATMAP_COLORS[index % HEATMAP_COLORS.length]}
                                    radius={index === 0 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </section>
        </div>
    );
}