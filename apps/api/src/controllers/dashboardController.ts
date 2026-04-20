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
};
