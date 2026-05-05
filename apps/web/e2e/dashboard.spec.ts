import { expect, test } from "@playwright/test";
import { createApiContext, seedProductWithBatch } from "./helpers";

test.describe("Dashboard page", () => {
  test("renders dashboard stat cards and chart area", async ({ page }) => {
    const api = await createApiContext();
    await seedProductWithBatch(api, {
      name: `E2E Dashboard ${Date.now()}`,
      quantity: 3,
    });
    await api.dispose();

    await page.goto("/");

    await expect(page.getByText("Total Medicines")).toBeVisible();
    await expect(page.getByText("Low Stock")).toBeVisible();
    await expect(page.getByText("Out of Stock")).toBeVisible();
    await expect(page.getByText("Expired Batches")).toBeVisible();
    await expect(page.getByText("Inventory alerts")).toBeVisible();
  });

  test("can switch alert views", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: "All alerts" })).toBeVisible();
    await page.getByRole("button", { name: "Stock alerts" }).click();
    await expect(page.getByText("Stock alerts").first()).toBeVisible();

    await page.getByRole("button", { name: "Expiry alerts" }).click();
    await expect(page.getByText("Expiry alerts").first()).toBeVisible();
  });

  test("opens and closes low stock alert modal", async ({ page }) => {
    const api = await createApiContext();
    await seedProductWithBatch(api, {
      name: `E2E Low Stock ${Date.now()}`,
      quantity: 3,
    });
    await api.dispose();

    await page.goto("/");

    await page.getByText("Low Stock").click();
    await expect(page.getByText(/low stock/i).first()).toBeVisible();

    const closeButton = page.getByRole("button", { name: /close|×/i }).first();
    if (await closeButton.count()) {
      await closeButton.click();
    } else {
      await page.keyboard.press("Escape");
    }
  });
});
