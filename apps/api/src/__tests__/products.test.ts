import request from "supertest";
import express from "express";
import productsRoutes from "../routes/productsRoutes";
import { db } from "../db";
import { auditLogs, inventoryBatches, products, stockTransactions } from "../db/schema";
import { and, eq } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use("/products", productsRoutes);

describe("Products API", () => {
  afterAll(async () => {
    await db.delete(auditLogs);
    await db.delete(stockTransactions);
    await db.delete(inventoryBatches);
    await db.delete(products);
  });

  it("GET /products should return 200 with metadata and data array", async () => {
    const response = await request(app).get("/products");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("metadata");
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.metadata).toHaveProperty("currentPage");
    expect(response.body.metadata).toHaveProperty("totalPages");
    expect(response.body.metadata).toHaveProperty("totalCount");
  });

  it("GET /products supports search and pagination", async () => {
    await request(app).post("/products").send({
      sku: "SEA-1",
      name: "Biogesic",
      genericName: "Paracetamol",
      baseUnit: "Tablet",
    });

    await request(app).post("/products").send({
      sku: "SEA-2",
      name: "Amoxil",
      genericName: "Amoxicillin",
      baseUnit: "Capsule",
    });

    const response = await request(app).get("/products?page=1&limit=1&search=amox");

    expect(response.status).toBe(200);
    expect(response.body.metadata.currentPage).toBe(1);
    expect(response.body.metadata.limit).toBe(1);
    expect(response.body.metadata.totalCount).toBeGreaterThanOrEqual(1);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name.toLowerCase()).toContain("amox");
  });

  it("GET /products/:id should return a product when it exists", async () => {
    const createRes = await request(app).post("/products").send({
      sku: "GET123",
      name: "Readable Product",
      genericName: "Readable Generic",
      baseUnit: "Tablet",
    });

    const response = await request(app).get(`/products/${createRes.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createRes.body.id);
    expect(response.body.name).toBe("Readable Product");
  });

  it("GET /products/:id returns 404 when the product does not exist", async () => {
    const response = await request(app).get("/products/999999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Product not found");
  });

  it("GET /products/:id returns 400 for a non-numeric ID", async () => {
    const response = await request(app).get("/products/abc");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid product ID");
  });

  it("POST /products should create a product", async () => {
    const newProduct = {
      sku: "TESTSKU123",
      name: "Test Product",
      genericName: "Generic Test",
      baseUnit: "Tablet",
    };

    const response = await request(app).post("/products").send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Test Product");
    expect(response.body.sku).toBe("TESTSKU123");

    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, "product"),
          eq(auditLogs.entityId, response.body.id),
          eq(auditLogs.action, "create"),
        ),
      )
      .limit(1);

    expect(audit).toBeDefined();
  });

  it("POST /products returns 400 when required fields are missing", async () => {
    const response = await request(app).post("/products").send({
      sku: "MISSING123",
      name: "Missing Required Fields",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/name, genericName, and baseUnit/i);
  });

  it("PUT /products/:id should update a product", async () => {
    const productToUpdate = {
      sku: "UPDATE123",
      name: "Original Name",
      genericName: "Generic Original",
      baseUnit: "Box",
    };

    const createRes = await request(app).post("/products").send(productToUpdate);
    const productId = createRes.body.id;

    const updateData = {
      name: "Updated Name",
      genericName: "Generic Updated",
    };

    const updateRes = await request(app).put(`/products/${productId}`).send(updateData);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe("Updated Name");
    expect(updateRes.body.genericName).toBe("Generic Updated");

    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, "product"),
          eq(auditLogs.entityId, productId),
          eq(auditLogs.action, "update"),
        ),
      )
      .limit(1);

    expect(audit).toBeDefined();
    expect(audit?.oldValues).toContain("Original Name");
    expect(audit?.newValues).toContain("Updated Name");
  });

  it("PUT /products/:id returns 404 when the product does not exist", async () => {
    const response = await request(app).put("/products/999999").send({
      name: "Missing Product",
      genericName: "Missing Generic",
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Product not found");
  });

  it("PUT /products/:id returns 400 for a non-numeric ID", async () => {
    const response = await request(app).put("/products/not-a-number").send({
      name: "Invalid Product",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid product ID");
  });

  it("DELETE /products/:id should delete a product", async () => {
    const productToDelete = {
      sku: "DEL123",
      name: "To Be Deleted",
      genericName: "Delete Me",
      baseUnit: "Box",
    };

    const createRes = await request(app).post("/products").send(productToDelete);

    expect(createRes.status).toBe(201);
    const productId = createRes.body.id;

    const deleteRes = await request(app).delete(`/products/${productId}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Product deleted successfully");

    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, "product"),
          eq(auditLogs.entityId, productId),
          eq(auditLogs.action, "delete"),
        ),
      )
      .limit(1);

    expect(audit).toBeDefined();
    expect(audit?.oldValues).toContain("To Be Deleted");
    expect(audit?.newValues).toBeNull();

    const getRes = await request(app).get(`/products/${productId}`);
    expect(getRes.status).toBe(404);
  });

  it("DELETE /products/:id returns 404 when the product does not exist", async () => {
    const response = await request(app).delete("/products/999999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Product not found");
  });

  it("DELETE /products/:id returns 400 for a non-numeric ID", async () => {
    const response = await request(app).delete("/products/not-a-number");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid product ID");
  });
  
  it("PUT /products/:id logs rename when only product name changes", async () => {
  const createRes = await request(app).post("/products").send({
    sku: "RENAME123",
    name: "Rename Original",
    genericName: "Rename Generic",
    baseUnit: "Tablet",
  });

  const productId = createRes.body.id;

  const renameRes = await request(app)
    .put(`/products/${productId}`)
    .send({ name: "Rename Updated" });

  expect(renameRes.status).toBe(200);
  expect(renameRes.body.name).toBe("Rename Updated");

  const [audit] = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, "product"),
        eq(auditLogs.entityId, productId),
        eq(auditLogs.action, "rename"),
      ),
    )
    .limit(1);

  expect(audit).toBeDefined();
  expect(audit?.oldValues).toContain("Rename Original");
  expect(audit?.newValues).toContain("Rename Updated");
});

it("PUT /products/:id rejects an empty product name", async () => {
  const createRes = await request(app).post("/products").send({
    sku: "EMPTYNAME123",
    name: "Empty Name Original",
    genericName: "Empty Name Generic",
    baseUnit: "Tablet",
  });

  const response = await request(app)
    .put(`/products/${createRes.body.id}`)
    .send({ name: "   " });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe("Product name cannot be empty");
});

it("DELETE /products/:id deletes product batches and preserves stock transactions", async () => {
  const createRes = await request(app).post("/products").send({
    sku: "CASCADE123",
    name: "Cascade Delete Product",
    genericName: "Cascade Generic",
    baseUnit: "Tablet",
  });

  const productId = createRes.body.id;

  const [batch] = await db
    .insert(inventoryBatches)
    .values({
      productId,
      batchNumber: `CASCADE-BATCH-${Date.now()}`,
      inventoryLocation: "Cascade Shelf",
      expiryDate: "2027-12-31",
      initialQuantity: 12,
      currentQuantity: 12,
      costPrice: "5.00",
      sellingPrice: "8.00",
      status: "available",
    })
    .returning();

  const [transaction] = await db
    .insert(stockTransactions)
    .values({
      batchId: batch.id,
      type: "restock",
      quantityChanged: 12,
      reason: "cascade delete test",
      performedBy: "jest",
    })
    .returning();

  const deleteRes = await request(app).delete(`/products/${productId}`);

  expect(deleteRes.status).toBe(200);
  expect(deleteRes.body.message).toBe("Product deleted successfully");

  const remainingBatches = await db
    .select()
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId));

  expect(remainingBatches).toHaveLength(0);

  const [preservedTransaction] = await db
    .select()
    .from(stockTransactions)
    .where(eq(stockTransactions.id, transaction.id))
    .limit(1);

  expect(preservedTransaction).toBeDefined();
  expect(preservedTransaction?.batchId).toBeNull();

  const [audit] = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, "product"),
        eq(auditLogs.entityId, productId),
        eq(auditLogs.action, "delete"),
      ),
    )
    .limit(1);

  expect(audit).toBeDefined();
  expect(audit?.oldValues).toContain("Cascade Delete Product");
  expect(audit?.oldValues).toContain(batch.batchNumber);
});


});
