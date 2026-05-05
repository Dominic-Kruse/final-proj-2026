import request from "supertest";
import express from "express";
import dashboardRoutes from "../routes/dashboardRoutes";
import { db } from "../db";
import {
  auditLogs,
  inventoryBatches,
  products,
  stockTransactions,
} from "../db/schema";
import { eq } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use("/dashboard", dashboardRoutes);

describe("Dashboard API", () => {
  let productId: number;
  let healthyBatchId: number;
  let expiredBatchId: number;

  beforeEach(async () => {
    await db.delete(auditLogs);
    await db.delete(stockTransactions);
    await db.delete(inventoryBatches);
    await db.delete(products);

    const [product] = await db
      .insert(products)
      .values({
        sku: `DASH-${Date.now()}`,
        name: "Dashboard Product",
        genericName: "Dashboard Generic",
        category: "Analgesic",
        baseUnit: "Tablet",
        reorderLevel: 10,
      })
      .returning();

    productId = product.id;

    const [healthyBatch] = await db
      .insert(inventoryBatches)
      .values({
        productId,
        batchNumber: `DASH-HEALTHY-${Date.now()}`,
        inventoryLocation: "Main Shelf",
        expiryDate: "2099-12-31",
        initialQuantity: 50,
        currentQuantity: 40,
        costPrice: "5.00",
        sellingPrice: "12.50",
        status: "available",
      })
      .returning();

    healthyBatchId = healthyBatch.id;

    const [expiredBatch] = await db
      .insert(inventoryBatches)
      .values({
        productId,
        batchNumber: `DASH-EXPIRED-${Date.now()}`,
        inventoryLocation: "Back Shelf",
        expiryDate: "2020-01-01",
        initialQuantity: 20,
        currentQuantity: 5,
        costPrice: "3.00",
        sellingPrice: "8.00",
        status: "available",
      })
      .returning();

    expiredBatchId = expiredBatch.id;

    await db.insert(stockTransactions).values([
      {
        batchId: healthyBatchId,
        type: "outward",
        quantityChanged: -3,
        reason: "Dashboard sale",
        performedBy: "jest",
      },
      {
        batchId: expiredBatchId,
        type: "outward",
        quantityChanged: -2,
        reason: "Expired dashboard sale",
        performedBy: "jest",
      },
    ]);
  });

  afterAll(async () => {
    await db.delete(auditLogs);
    await db.delete(stockTransactions);
    await db.delete(inventoryBatches);
    await db.delete(products);
  });

  it("GET /dashboard/weekly-revenue returns weekly revenue rows", async () => {
    const res = await request(app).get("/dashboard/weekly-revenue");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("day");
      expect(res.body[0]).toHaveProperty("dayOrder");
      expect(res.body[0]).toHaveProperty("week");
      expect(res.body[0]).toHaveProperty("revenue");
    }
  });

  it("GET /dashboard/sales-by-category returns units and revenue by category", async () => {
    const res = await request(app).get("/dashboard/sales-by-category");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const analgesic = res.body.find((row: { category: string }) => row.category === "Analgesic");

    expect(analgesic).toBeDefined();
    expect(analgesic.units).toBe(5);
    expect(analgesic.revenue).toBe(53.5);
  });

  it("GET /dashboard/sales-by-expiry-status groups sales by expiry status", async () => {
    const res = await request(app).get("/dashboard/sales-by-expiry-status");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const expired = res.body.find((row: { status: string }) => row.status === "Expired");
    const healthy = res.body.find((row: { status: string }) => row.status === "Healthy (>90 days)");

    expect(expired).toBeDefined();
    expect(expired.units).toBe(2);
    expect(expired.revenue).toBe(16);

    expect(healthy).toBeDefined();
    expect(healthy.units).toBe(3);
    expect(healthy.revenue).toBe(37.5);
  });

  it("GET /dashboard/stock-by-category returns available stock by category", async () => {
    const res = await request(app).get("/dashboard/stock-by-category");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const analgesic = res.body.find((row: { category: string }) => row.category === "Analgesic");

    expect(analgesic).toBeDefined();
    expect(analgesic.stock).toBe(45);
  });

  it("GET /dashboard/stock-by-expiry-heatmap returns stock grouped by category and expiry bucket", async () => {
    const res = await request(app).get("/dashboard/stock-by-expiry-heatmap");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const expired = res.body.find(
      (row: { category: string; expiry_bucket: string }) =>
        row.category === "Analgesic" && row.expiry_bucket === "Expired",
    );

    const healthy = res.body.find(
      (row: { category: string; expiry_bucket: string }) =>
        row.category === "Analgesic" && row.expiry_bucket === ">90 days",
    );

    expect(expired).toBeDefined();
    expect(expired.stock).toBe(5);

    expect(healthy).toBeDefined();
    expect(healthy.stock).toBe(40);
  });

  it("GET /dashboard/stock-by-category ignores non-available stock in totals", async () => {
    await db
      .update(inventoryBatches)
      .set({ status: "dispensed" })
      .where(eq(inventoryBatches.id, expiredBatchId));

    const res = await request(app).get("/dashboard/stock-by-category");

    expect(res.status).toBe(200);

    const analgesic = res.body.find((row: { category: string }) => row.category === "Analgesic");

    expect(analgesic).toBeDefined();
    expect(analgesic.stock).toBe(40);
  });
});
