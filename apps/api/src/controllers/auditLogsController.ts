import { Request, Response } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { auditLogs } from "../db/schema";

function handleError(res: Response, error: unknown, message: string) {
  console.error(`[auditLogsController] ${message}:`, error);
  res.status(500).json({ error: message });
}

export const auditLogsController = {
  async getAuditLogs(req: Request, res: Response) {
    try {
      const pageQuery = Number(req.query.page ?? 1);
      const limitQuery = Number(req.query.limit ?? 25);
      const entityType = typeof req.query.entityType === "string" ? req.query.entityType.trim() : "";

      const page = Number.isFinite(pageQuery) && pageQuery > 0 ? Math.floor(pageQuery) : 1;
      const limit = Number.isFinite(limitQuery) && limitQuery > 0
        ? Math.min(Math.floor(limitQuery), 100)
        : 25;

      const whereClause = entityType
        ? eq(auditLogs.entityType, entityType)
        : undefined;

      const [{ totalCount }] = await db
        .select({ totalCount: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(whereClause);

      const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);
      const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
      const offset = (currentPage - 1) * limit;

      const rows = await db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
        .limit(limit)
        .offset(offset);

      res.status(200).json({
        metadata: {
          currentPage,
          totalPages,
          totalCount,
          limit,
        },
        data: rows,
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch audit logs");
    }
  },
};