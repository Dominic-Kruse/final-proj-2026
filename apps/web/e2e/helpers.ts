import { expect, request as playwrightRequest, type APIRequestContext, type Page } from "@playwright/test";

export const API_BASE_URL = process.env.E2E_API_URL ?? "http://localhost:3001";

export async function createApiContext(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: API_BASE_URL,
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  });
}

export async function searchInventory(page: Page, query: string) {
  const input = page.getByPlaceholder("Search by medicine name or generic name...");
  const expectedQuery = query.trim();

  const responsePromise = expectedQuery
    ? page.waitForResponse((response) => {
        if (response.request().method() !== "GET") return false;

        const url = new URL(response.url());
        const actualQuery = (url.searchParams.get("search") ?? "").trim();
        return url.pathname.endsWith("/inventory") && actualQuery === expectedQuery;
      }, { timeout: 5000 })
    : null;

  await input.fill(query);

  if (responsePromise) {
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
  }
}

export async function seedProductWithBatch(api: APIRequestContext, options?: {
  name?: string;
  genericName?: string;
  category?: string;
  form?: string;
  baseUnit?: string;
  batchNumber?: string;
  quantity?: number;
  sellingPrice?: number;
  expiryDate?: string;
  location?: string;
}) {
  const suffix = Date.now();
  const name = options?.name ?? `E2E Medicine ${suffix}`;
  const genericName = options?.genericName ?? `E2E Generic ${suffix}`;
  const batchNumber = options?.batchNumber ?? `E2E-BATCH-${suffix}`;

  const productRes = await api.post("/products", {
    data: {
      sku: `E2E-SKU-${suffix}`,
      name,
      genericName,
      category: options?.category ?? "E2E Category",
      form: options?.form ?? "Tablet",
      baseUnit: options?.baseUnit ?? "Tablet",
      reorderLevel: 5,
    },
  });

  expect(productRes.ok()).toBeTruthy();
  const product = await productRes.json();

  const stockInRes = await api.post("/inventory/stock-inward", {
    data: {
      supplierName: "E2E Supplier",
      referenceNumber: `E2E-REF-${suffix}`,
      dateReceived: "2026-05-05",
      performedBy: "playwright",
      batches: [
        {
          productId: product.id,
          batchNumber,
          expiryDate: options?.expiryDate ?? "2099-12-31",
          quantity: options?.quantity ?? 25,
          unitCost: 5,
          sellingPrice: options?.sellingPrice ?? 12,
          inventoryLocation: options?.location ?? "E2E Shelf",
        },
      ],
    },
  });

  expect(stockInRes.ok()).toBeTruthy();
  const stockIn = await stockInRes.json();

  return {
    product,
    batch: stockIn.batches[0],
    productName: name,
    genericName,
    batchNumber,
  };
}

export async function seedDispensedBatch(api: APIRequestContext) {
  const seeded = await seedProductWithBatch(api, {
    name: `E2E Dispensed ${Date.now()}`,
    quantity: 10,
    sellingPrice: 15,
  });

  const dispenseRes = await api.post("/inventory/stock-outward", {
    data: {
      performedBy: "playwright",
      items: [
        {
          batchId: seeded.batch.id,
          quantity: 2,
          reason: "Sale",
        },
      ],
    },
  });

  expect(dispenseRes.ok()).toBeTruthy();

  return seeded;
}
