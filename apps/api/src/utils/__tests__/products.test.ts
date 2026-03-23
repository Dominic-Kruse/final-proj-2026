import request from "supertest";
import express from "express";
import productsRoutes from "../../routes/productsRoutes"
import {db} from "../../db"
import {products} from "../../db/schema"

const app = express();
app.use(express.json());
app.use("/products", productsRoutes);

describe("Products API", () => {
    afterAll(async () => {
        await db.delete(products)
    })

  it("GET /products should return 200 and an array", async () => {
    const response = await request(app).get("/products");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("POST /products should create a product", async () => {
    const newProduct = {
      sku: "TESTSKU123",
      name: "Test Product",
      genericName: "Generic Test",
      baseUnit: "Tablet"
    };

    const response = await request(app)
      .post("/products")
      .send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Test Product");
    expect(response.body.sku).toBe("TESTSKU123");
  });

  it("PUT /products/:id should update a product", async () => {
    const productToUpdate = {
      sku: "UPDATE-123",
      name: "Original Name",
      genericName: "Generic Original",
      baseUnit: "Box"
    };

    const createRes = await request(app)
      .post("/products")
      .send(productToUpdate);
    const productId = createRes.body.id;

    const updateData = {
      name: "Updated Name",
      genericName: "Generic Updated",
    };

    const updateRes = await request(app)
      .put(`/products/${productId}`)
      .send(updateData);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe("Updated Name");
    expect(updateRes.body.genericName).toBe("Generic Updated");
  });
  
  it("DELETE /products/:id should delete a product", async () => {
    const productToDelete = {
      sku: "DEL-123",
      name: "To Be Deleted",
      genericName: "Delete Me",
      baseUnit: "Box"
    };

    const createRes = await request(app)
      .post("/products")
      .send(productToDelete);

    expect(createRes.status).toBe(201);
    const productId = createRes.body.id;

    const deleteRes = await request(app)
      .delete(`/products/${productId}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Product deleted successfully");

    const getRes = await request(app).get(`/products/${productId}`);
    expect(getRes.status).toBe(404);
  });
});