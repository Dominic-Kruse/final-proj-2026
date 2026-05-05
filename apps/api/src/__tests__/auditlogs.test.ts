import request from "supertest";
import express from "express";
import auditLogsRoutes from "../routes/auditLogsRoutes";
import { db } from "../db";
import { auditLogs } from "../db/schema";

const app = express();
app.use(express.json());
app.use("/audit-logs", auditLogsRoutes);

describe("Audit Logs API", () => {
  beforeEach(async () => {
    await db.delete(auditLogs);

    await db.insert(auditLogs).values([
      {
        action: "create",
        entityType: "product",
        entityId: 1,
        performedBy: "jest",
        oldValues: null,
        newValues: JSON.stringify({ name: "Test Product" }),
      },
      {
        action: "stock_inward",
        entityType: "inventory_batch",
        entityId: 2,
        performedBy: "jest",
        oldValues: null,
        newValues: JSON.stringify({ currentQuantity: 100 }),
      },
      {
        action: "update",
        entityType: "product",
        entityId: 3,
        performedBy: "admin",
        oldValues: JSON.stringify({ name: "Old Name" }),
        newValues: JSON.stringify({ name: "New Name" }),
      },
    ]);
  });

  afterAll(async () => {
    await db.delete(auditLogs);
  });

  it("GET /audit-logs returns 200 with metadata and data array", async () => {
    const res = await request(app).get("/audit-logs");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metadata");
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.metadata).toHaveProperty("currentPage");
    expect(res.body.metadata).toHaveProperty("totalPages");
    expect(res.body.metadata).toHaveProperty("totalCount");
    expect(res.body.metadata).toHaveProperty("limit");
  });

  it("GET /audit-logs supports pagination", async () => {
    const res = await request(app).get("/audit-logs?page=1&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.metadata.currentPage).toBe(1);
    expect(res.body.metadata.limit).toBe(2);
    expect(res.body.metadata.totalCount).toBe(3);
    expect(res.body.data).toHaveLength(2);
  });

  it("GET /audit-logs filters by product entityType", async () => {
    const res = await request(app).get("/audit-logs?entityType=product");

    expect(res.status).toBe(200);
    expect(res.body.metadata.totalCount).toBe(2);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((log: { entityType: string }) => log.entityType === "product")).toBe(true);
  });

  it("GET /audit-logs filters by inventory_batch entityType", async () => {
    const res = await request(app).get("/audit-logs?entityType=inventory_batch");

    expect(res.status).toBe(200);
    expect(res.body.metadata.totalCount).toBe(1);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].entityType).toBe("inventory_batch");
    expect(res.body.data[0].action).toBe("stock_inward");
  });

  it("GET /audit-logs returns empty data for an entityType with no logs", async () => {
    const res = await request(app).get("/audit-logs?entityType=missing_type");

    expect(res.status).toBe(200);
    expect(res.body.metadata.currentPage).toBe(1);
    expect(res.body.metadata.totalPages).toBe(0);
    expect(res.body.metadata.totalCount).toBe(0);
    expect(res.body.data).toEqual([]);
  });

  it("GET /audit-logs falls back to safe pagination defaults for invalid query values", async () => {
    const res = await request(app).get("/audit-logs?page=abc&limit=-1");

    expect(res.status).toBe(200);
    expect(res.body.metadata.currentPage).toBe(1);
    expect(res.body.metadata.limit).toBe(25);
    expect(res.body.metadata.totalCount).toBe(3);
  });
});
