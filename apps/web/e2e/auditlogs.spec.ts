import { expect, test } from "@playwright/test";
import { createApiContext, seedDispensedBatch, seedProductWithBatch } from "./helpers";

test.describe("Audit logs page", () => {
  test("renders audit log table after a product mutation", async ({ page }) => {
    const api = await createApiContext();
    const seeded = await seedProductWithBatch(api);
    await api.dispose();

    await page.goto("/customer");

    await expect(page.getByText("Log entries")).toBeVisible();
    await expect(page.getByText("Product and stock mutations captured by the API.")).toBeVisible();
    await expect(page.getByText("create").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("stock_inward").first()).toBeVisible();
    await expect(page.getByText(seeded.productName).first()).toBeVisible();
  });

  test("pagination controls render", async ({ page }) => {
    await page.goto("/customer");

    await expect(page.getByRole("button", { name: "Previous" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
    await expect(page.getByText(/Showing/i)).toBeVisible();
  });

  test("stock outward audit log exposes undo action", async ({ page }) => {
    const api = await createApiContext();
    const seeded = await seedDispensedBatch(api);
    await api.dispose();

    await page.goto("/customer");

    await expect(page.getByText("stock_outward").first()).toBeVisible({ timeout: 15000 });

    const row = page.locator("tbody tr").filter({ hasText: "stock_outward" }).first();
    await expect(row).toContainText("inventory_batch");
    await expect(row.getByRole("button", { name: "Undo" })).toBeVisible();

    await expect(page.getByText(seeded.productName).first()).toBeVisible();
  });

  test("undo restores a dispensed batch from the audit log page", async ({ page }) => {
    await page.goto("/customer");

    const undoButton = page.locator("tbody tr").filter({ hasText: "stock_outward" })
      .first()
      .getByRole("button", { name: "Undo" });

    await expect(undoButton).toBeVisible({ timeout: 15000 });

    const undoResponse = page.waitForResponse((response) => {
      return response.request().method() === "POST"
        && new URL(response.url()).pathname.includes("/inventory/stock-outward/undo/");
    });

    await undoButton.click();

    const response = await undoResponse;
    expect(response.ok()).toBeTruthy();

    await expect(page.getByText("Dispense undone successfully!")).toBeVisible({ timeout: 10000 });
  });
});
