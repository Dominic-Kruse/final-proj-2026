import { pool } from "../db";
import { Request, Response } from "express";

export const dashboardController = {
  async getWeeklyRevenue(_req: Request, res: Response) {
    try {
      // Get start of current week (Monday) and last week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);

      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() + diffToMonday);
      thisMonday.setHours(0, 0, 0, 0);

      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);

      // Use raw query for complex SQL with proper parameterization
      const query = `
        SELECT
          to_char(st.created_at, 'Dy') as day,
          CAST(EXTRACT(DOW FROM st.created_at) AS INTEGER) as "dayOrder",
          CASE
            WHEN st.created_at >= $1::timestamp
            THEN 'current'
            ELSE 'previous'
          END as week,
          CAST(COALESCE(SUM(ABS(st.quantity_changed)::numeric * (ib.selling_price)::numeric), 0) AS DOUBLE PRECISION) as revenue
        FROM stock_transactions st
        INNER JOIN inventory_batches ib ON st.batch_id = ib.id
        WHERE st.type = 'outward'
        AND st.created_at >= $2::timestamp
        GROUP BY
          to_char(st.created_at, 'Dy'),
          EXTRACT(DOW FROM st.created_at),
          CASE WHEN st.created_at >= $1::timestamp THEN 'current' ELSE 'previous' END
        ORDER BY EXTRACT(DOW FROM st.created_at)
      `;

      const result = await pool.query(query, [thisMonday, lastMonday]);
      res.json(result.rows);
    } catch (error) {
      console.error("[dashboardController] getWeeklyRevenue:", error);
      res.status(500).json({ error: "Failed to fetch weekly revenue" });
    }
  },

  async getSalesByCategory(_req: Request, res: Response) {
    try {
      const query = `
        SELECT
          COALESCE(NULLIF(TRIM(p.category), ''), 'Uncategorized') as category,
          CAST(COALESCE(SUM(ABS(st.quantity_changed)), 0) AS INTEGER) as units,
          CAST(COALESCE(SUM(ABS(st.quantity_changed)::numeric * (ib.selling_price)::numeric), 0) AS DOUBLE PRECISION) as revenue
        FROM stock_transactions st
        INNER JOIN inventory_batches ib ON st.batch_id = ib.id
        INNER JOIN products p ON ib.product_id = p.id
        WHERE st.type = 'outward'
        GROUP BY COALESCE(NULLIF(TRIM(p.category), ''), 'Uncategorized')
        ORDER BY revenue DESC, category ASC
      `;

      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("[dashboardController] getSalesByCategory:", error);
      res.status(500).json({ error: "Failed to fetch sales by category" });
    }
  },

  async getSalesByExpiryStatus(_req: Request, res: Response) {
    try {
      const query = `
        SELECT
          CASE
            WHEN ib.expiry_date < CURRENT_DATE THEN 'Expired'
            WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '90 day') THEN 'Near Expiry (<=90 days)'
            ELSE 'Healthy (>90 days)'
          END as status,
          CAST(COALESCE(SUM(ABS(st.quantity_changed)), 0) AS INTEGER) as units,
          CAST(COALESCE(SUM(ABS(st.quantity_changed)::numeric * (ib.selling_price)::numeric), 0) AS DOUBLE PRECISION) as revenue
        FROM stock_transactions st
        INNER JOIN inventory_batches ib ON st.batch_id = ib.id
        WHERE st.type = 'outward'
        GROUP BY
          CASE
            WHEN ib.expiry_date < CURRENT_DATE THEN 'Expired'
            WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '90 day') THEN 'Near Expiry (<=90 days)'
            ELSE 'Healthy (>90 days)'
          END
        ORDER BY
          CASE
            WHEN CASE
              WHEN ib.expiry_date < CURRENT_DATE THEN 'Expired'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '90 day') THEN 'Near Expiry (<=90 days)'
              ELSE 'Healthy (>90 days)'
            END = 'Expired' THEN 1
            WHEN CASE
              WHEN ib.expiry_date < CURRENT_DATE THEN 'Expired'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '90 day') THEN 'Near Expiry (<=90 days)'
              ELSE 'Healthy (>90 days)'
            END = 'Near Expiry (<=90 days)' THEN 2
            ELSE 3
          END
      `;

      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("[dashboardController] getSalesByExpiryStatus:", error);
      res.status(500).json({ error: "Failed to fetch sales by expiry status" });
    }
  },

  async getStockByCategory(_req: Request, res: Response) {
    try {
      const query = `
        SELECT
          COALESCE(NULLIF(TRIM(p.category), ''), 'Uncategorized') as category,
          CAST(COALESCE(SUM(CASE WHEN ib.status = 'available' THEN ib.current_quantity ELSE 0 END), 0) AS INTEGER) as stock
        FROM inventory_batches ib
        INNER JOIN products p ON ib.product_id = p.id
        GROUP BY COALESCE(NULLIF(TRIM(p.category), ''), 'Uncategorized')
        ORDER BY stock DESC, category ASC
      `;

      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("[dashboardController] getStockByCategory:", error);
      res.status(500).json({ error: "Failed to fetch stock by category" });
    }
  },

  async getStockByExpiryHeatmap(_req: Request, res: Response) {
    try {
      const query = `
        SELECT
          COALESCE(NULLIF(TRIM(p.category), ''), 'Uncategorized') as category,
          CASE
            WHEN ib.expiry_date < CURRENT_DATE THEN 'Expired'
            WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '30 day') THEN '0-30 days'
            WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '60 day') THEN '30-60 days'
            WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '90 day') THEN '60-90 days'
            ELSE '>90 days'
          END as expiry_bucket,
          CAST(COALESCE(SUM(CASE WHEN ib.status = 'available' THEN ib.current_quantity ELSE 0 END), 0) AS INTEGER) as stock
        FROM inventory_batches ib
        INNER JOIN products p ON ib.product_id = p.id
        GROUP BY
          COALESCE(NULLIF(TRIM(p.category), ''), 'Uncategorized'),
          CASE
            WHEN ib.expiry_date < CURRENT_DATE THEN 'Expired'
            WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '30 day') THEN '0-30 days'
            WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '60 day') THEN '30-60 days'
            WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '90 day') THEN '60-90 days'
            ELSE '>90 days'
          END
        ORDER BY category ASC, 
          CASE
            WHEN CASE
              WHEN ib.expiry_date < CURRENT_DATE THEN 'Expired'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '30 day') THEN '0-30 days'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '60 day') THEN '30-60 days'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '90 day') THEN '60-90 days'
              ELSE '>90 days'
            END = 'Expired' THEN 0
            WHEN CASE
              WHEN ib.expiry_date < CURRENT_DATE THEN 'Expired'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '30 day') THEN '0-30 days'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '60 day') THEN '30-60 days'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '90 day') THEN '60-90 days'
              ELSE '>90 days'
            END = '0-30 days' THEN 1
            WHEN CASE
              WHEN ib.expiry_date < CURRENT_DATE THEN 'Expired'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '30 day') THEN '0-30 days'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '60 day') THEN '30-60 days'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '90 day') THEN '60-90 days'
              ELSE '>90 days'
            END = '30-60 days' THEN 2
            WHEN CASE
              WHEN ib.expiry_date < CURRENT_DATE THEN 'Expired'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '30 day') THEN '0-30 days'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '60 day') THEN '30-60 days'
              WHEN ib.expiry_date <= (CURRENT_DATE + INTERVAL '90 day') THEN '60-90 days'
              ELSE '>90 days'
            END = '60-90 days' THEN 3
            ELSE 4
          END
      `;

      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("[dashboardController] getStockByExpiryHeatmap:", error);
      res.status(500).json({ error: "Failed to fetch stock by expiry heatmap" });
    }
  },
};
