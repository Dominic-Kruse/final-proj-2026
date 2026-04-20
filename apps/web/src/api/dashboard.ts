import { apiClient } from "../lib/apiClient";

export type WeeklyRevenueRow = {
  day: string;
  dayOrder: number;
  week: "current" | "previous";
  revenue: number;
};

async function getWeeklyRevenue(): Promise<WeeklyRevenueRow[]> {
  const res = await apiClient.get("/dashboard/weekly-revenue");
  return res.data as WeeklyRevenueRow[];
}

export const dashboardApi = {
  getWeeklyRevenue,
};
