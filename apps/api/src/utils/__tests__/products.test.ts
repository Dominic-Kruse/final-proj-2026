import request from "supertest";
import express from "express";
import productsRoutes from "../../routes/productsRoutes";
import { db } from "../../db";
import { inventoryBatches,  stockTransactions, products } from "../../db/schema";
import { inArray } from "drizzle-orm";
 
const app = express();
app.use(express.json());
app.use("/products", productsRoutes);

const createdIds: number[] = [];
// ── Helpers ────────────────────────────────────────────────────────────────────
const makeProduct = (overrides = {}) => ({
  sku: `SKU-${Date.now()}`,
  name: "Test Product",
  genericName: "Generic Test",
  baseUnit: "Tablet",
  ...overrides,
});
 
const createProduct = (overrides = {}) =>
  request(app).post("/products").send(makeProduct(overrides)).then((res) => {
    if (res.body.id) createdIds.push(res.body.id); // ← track it
    return res;
  });
// ── Teardown ───────────────────────────────────────────────────────────────────
afterAll(async () => {
  await db.delete(stockTransactions);
  await db.delete(inventoryBatches);
  if (createdIds.length > 0) {
    await db.delete(products).where(inArray(products.id, createdIds));
  }
});
 
// ── Tests ──────────────────────────────────────────────────────────────────────
describe("GET /products", () => {
  it("returns 200 and an array", async () => {
    const res = await request(app).get("/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
 
describe("GET /products/:id", () => {
  it("returns 200 and the product when it exists", async () => {
    const created = await createProduct({ name: "Lookup Product" });
    const res = await request(app).get(`/products/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });
 
  it("returns 404 when the product does not exist", async () => {
    const res = await request(app).get("/products/999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Product not found");
  });
 
  it("returns 400 for a non-numeric ID", async () => {
    const res = await request(app).get("/products/abc");
    expect(res.status).toBe(400);
  });
});
 
describe("POST /products", () => {
  it("creates a product and returns 201", async () => {
    const res = await createProduct({ name: "New Product", sku: "NEW-001" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("New Product");
    expect(res.body.sku).toBe("NEW-001");
    expect(res.body.id).toBeDefined();
  });
 
  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/products")
      .send({ sku: "NO-NAME", genericName: "Generic", baseUnit: "Tablet" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });
 
  it("returns 400 when genericName is missing", async () => {
    const res = await request(app)
      .post("/products")
      .send({ sku: "NO-GENERIC", name: "Something", baseUnit: "Tablet" });
    expect(res.status).toBe(400);
  });
 
  it("returns 400 when baseUnit is missing", async () => {
    const res = await request(app)
      .post("/products")
      .send({ sku: "NO-UNIT", name: "Something", genericName: "Generic" });
    expect(res.status).toBe(400);
  });
});
 
describe("PUT /products/:id", () => {
  it("updates a product and returns 200", async () => {
    const created = await createProduct({ name: "Before Update" });
    const res = await request(app)
      .put(`/products/${created.body.id}`)
      .send({ name: "After Update", genericName: "Updated Generic" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("After Update");
    expect(res.body.genericName).toBe("Updated Generic");
  });
 
  it("returns 404 when the product does not exist", async () => {
    const res = await request(app)
      .put("/products/999999")
      .send({ name: "Ghost" });
    expect(res.status).toBe(404);
  });
 
  it("returns 400 for a non-numeric ID", async () => {
    const res = await request(app).put("/products/abc").send({ name: "X" });
    expect(res.status).toBe(400);
  });
});
 
describe("DELETE /products/:id", () => {
  it("deletes a product and returns 200", async () => {
    const created = await createProduct({ name: "To Delete" });
    const id = created.body.id;
 
    const deleteRes = await request(app).delete(`/products/${id}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Product deleted successfully");
 
    const getRes = await request(app).get(`/products/${id}`);
    expect(getRes.status).toBe(404);
  });
 
  it("returns 404 when the product does not exist", async () => {
    const res = await request(app).delete("/products/999999");
    expect(res.status).toBe(404);
  });
 
  it("returns 400 for a non-numeric ID", async () => {
    const res = await request(app).delete("/products/abc");
    expect(res.status).toBe(400);
  });
});