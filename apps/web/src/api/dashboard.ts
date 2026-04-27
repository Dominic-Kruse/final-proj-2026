import { apiClient } from "../lib/apiClient";

export type WeeklyRevenueRow = {
  day: string;
  dayOrder: number;
  week: "current" | "previous";
  revenue: number;
};

export type SalesByCategoryRow = {
  category: string;
  units: number;
  revenue: number;
};

export type SalesByExpiryStatusRow = {
  status: string;
  units: number;
  revenue: number;
};

export type StockByCategoryRow = {
  category: string;
  stock: number;
};

export type StockByExpiryHeatmapRow = {
  category: string;
  expiry_bucket: string;
  stock: number;
};

async function getWeeklyRevenue(): Promise<WeeklyRevenueRow[]> {
  const res = await apiClient.get("/dashboard/weekly-revenue");
  return res.data as WeeklyRevenueRow[];
}

async function getSalesByCategory(): Promise<SalesByCategoryRow[]> {
  const res = await apiClient.get("/dashboard/sales-by-category");
  return res.data as SalesByCategoryRow[];
}

async function getSalesByExpiryStatus(): Promise<SalesByExpiryStatusRow[]> {
  const res = await apiClient.get("/dashboard/sales-by-expiry-status");
  return res.data as SalesByExpiryStatusRow[];
}

async function getStockByCategory(): Promise<StockByCategoryRow[]> {
  const res = await apiClient.get("/dashboard/stock-by-category");
  return res.data as StockByCategoryRow[];
}

async function getStockByExpiryHeatmap(): Promise<StockByExpiryHeatmapRow[]> {
  const res = await apiClient.get("/dashboard/stock-by-expiry-heatmap");
  return res.data as StockByExpiryHeatmapRow[];
}

export const dashboardApi = {
  getWeeklyRevenue,
  getSalesByCategory,
  getSalesByExpiryStatus,
  getStockByCategory,
  getStockByExpiryHeatmap,
};
