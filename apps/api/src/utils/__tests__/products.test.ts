
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
  
});