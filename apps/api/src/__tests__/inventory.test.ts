import request from "supertest";
import express from "express";
import inventoryRoutes from "../routes/inventoryRoutes";
import productsRoutes from "../routes/productsRoutes";
import { db } from "../db";
import {
  auditLogs,
  inventoryBatches,
  products,
  stockTransactions,
} from "../db/schema";
import { and, eq } from "drizzle-orm";
import { inventoryHub } from "../controllers/productObserver";

const app = express();
app.use(express.json());
app.use("/inventory", inventoryRoutes);
app.use("/products", productsRoutes);

// ── Helpers ────────────────────────────────────────────────────────────────────
let seededProductId: number;

const makeProduct = (overrides = {}) => ({
  sku: `SKU-${Date.now()}`,
  name: "Inventory Test Product",
  genericName: "Generic Inventory",
  baseUnit: "Tablet",
  ...overrides,
});

const makeBatch = (productId: number, overrides = {}) => ({
  productId,
  batchNumber: `BATCH-${Date.now()}`,
  expiryDate: "2027-12-31",
  quantity: 100,
  unitCost: 5.5,
  sellingPrice: 10.0,
  inventoryLocation: "Main Shelf",
  ...overrides,
});

const makeStockInward = (productId: number, batchOverrides = {}) => ({
  supplierName: "Test Supplier",
  referenceNumber: `REF-${Date.now()}`,
  dateReceived: "2026-04-01",
  batches: [makeBatch(productId, batchOverrides)],
  performedBy: "jest",
});

// ── Setup / Teardown ───────────────────────────────────────────────────────────
beforeAll(async () => {
  const res = await request(app).post("/products").send(makeProduct());
  seededProductId = res.body.id;
});

afterAll(async () => {
  await db.delete(auditLogs);
  await db.delete(stockTransactions);
  await db.delete(inventoryBatches);
  await db.delete(products);
});

// ── Tests ──────────────────────────────────────────────────────────────────────
describe("GET /inventory", () => {
  it("returns 200 with metadata and data array", async () => {
    const res = await request(app).get("/inventory");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metadata");
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.metadata).toHaveProperty("currentPage");
    expect(res.body.metadata).toHaveProperty("totalPages");
    expect(res.body.metadata).toHaveProperty("totalCount");
    expect(res.body.metadata).toHaveProperty("limit");
  });

  it("supports pagination and returns limited rows", async () => {
    await request(app)
      .post("/products")
      .send(makeProduct({ name: `Paginated Product A ${Date.now()}` }));
    await request(app)
      .post("/products")
      .send(makeProduct({ name: `Paginated Product B ${Date.now()}` }));

    const res = await request(app).get("/inventory?page=1&limit=1");
    expect(res.status).toBe(200);
    expect(res.body.metadata.currentPage).toBe(1);
    expect(res.body.metadata.limit).toBe(1);
    expect(res.body.data).toHaveLength(1);
  });
});

describe("GET /inventory/:id", () => {
  it("returns 200 and the batch when it exists", async () => {
    const created = await request(app)
      .post("/inventory/stock-inward")
      .send(makeStockInward(seededProductId));

    const batchId = created.body.batches[0].id;
    const res = await request(app).get(`/inventory/${batchId}`);
    expect(res.status).toBe(200);
  });

  it("returns 404 when the batch does not exist", async () => {
    const res = await request(app).get("/inventory/999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Inventory item not found");
  });

  it("returns 400 for a non-numeric ID", async () => {
    const res = await request(app).get("/inventory/abc");
    expect(res.status).toBe(400);
  });
});

describe("POST /inventory/stock-inward", () => {
  it("saves a stock inward and returns 201 with batch data", async () => {
    const body = makeStockInward(seededProductId);
    const res = await request(app).post("/inventory/stock-inward").send(body);

    expect(res.status).toBe(201);
    expect(res.body.batches).toHaveLength(1);
    expect(res.body.batches[0].productId).toBe(seededProductId);
    expect(res.body.batches[0].currentQuantity).toBe(100);

    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, "inventory_batch"),
          eq(auditLogs.entityId, res.body.batches[0].id),
          eq(auditLogs.action, "stock_inward"),
        ),
      )
      .limit(1);

    expect(audit).toBeDefined();
    expect(audit?.performedBy).toBe("jest");
  });

  it("triggers an expiry notification for near-expiry batches", async () => {
    const notifyExpirySpy = jest
      .spyOn(inventoryHub, "notifyExpiry")
      .mockImplementation(() => undefined);

    const body = makeStockInward(seededProductId, {
      expiryDate: "2026-06-15",
      batchNumber: `EXPIRY-${Date.now()}`,
    });

    const res = await request(app).post("/inventory/stock-inward").send(body);

    expect(res.status).toBe(201);
    expect(notifyExpirySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: seededProductId,
        productName: "Inventory Test Product",
        batchId: expect.any(Number),
      }),
    );

    notifyExpirySpy.mockRestore();
  });

  it("saves multiple batches in one request", async () => {
    const body = {
      ...makeStockInward(seededProductId),
      batches: [
        makeBatch(seededProductId, { batchNumber: `MULTI-A-${Date.now()}` }),
        makeBatch(seededProductId, { batchNumber: `MULTI-B-${Date.now()}` }),
      ],
    };

    const res = await request(app).post("/inventory/stock-inward").send(body);
    expect(res.status).toBe(201);
    expect(res.body.batches).toHaveLength(2);
  });

  it("returns 400 when supplierName is missing", async () => {
    const { supplierName: _, ...body } = makeStockInward(seededProductId);
    const res = await request(app).post("/inventory/stock-inward").send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/supplierName/i);
  });

  it("returns 400 when referenceNumber is missing", async () => {
    const body = { ...makeStockInward(seededProductId), referenceNumber: "" };
    const res = await request(app).post("/inventory/stock-inward").send(body);
    expect(res.status).toBe(400);
  });

  it("returns 400 when batches array is empty", async () => {
    const body = { ...makeStockInward(seededProductId), batches: [] };
    const res = await request(app).post("/inventory/stock-inward").send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/batch/i);
  });

  it("returns 400 when a batch has an invalid productId", async () => {
    const body = makeStockInward(seededProductId, { productId: 999999 });
    const res = await request(app).post("/inventory/stock-inward").send(body);
    expect(res.status).toBe(400);
  });

  it("returns 400 when quantity is zero", async () => {
    const body = makeStockInward(seededProductId, { quantity: 0 });
    const res = await request(app).post("/inventory/stock-inward").send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantity/i);
  });

  it("returns 400 when unitCost is negative", async () => {
    const body = makeStockInward(seededProductId, { unitCost: -1 });
    const res = await request(app).post("/inventory/stock-inward").send(body);
    expect(res.status).toBe(400);
  });

  it("returns 400 when batchNumber is missing", async () => {
    const body = makeStockInward(seededProductId, { batchNumber: "" });
    const res = await request(app).post("/inventory/stock-inward").send(body);
    expect(res.status).toBe(400);
  });
});
