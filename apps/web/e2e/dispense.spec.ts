import { expect, test, type Page } from "@playwright/test";
import { createApiContext, seedProductWithBatch } from "./helpers";

async function gotoDispense(page: Page) {
  await page.goto("/dispense");
  await expect(page.getByPlaceholder("Search by medicine name, generic name, or batch...")).toBeVisible();
  await expect(page.getByText("Dispense List")).toBeVisible();
}

function dispensePanel(page: Page) {
  return page.locator("aside").filter({ hasText: "Dispense List" });
}

function dispenseItems(page: Page) {
  return dispensePanel(page).locator("div.bg-slate-50.p-4.rounded-xl.border.border-slate-200");
}

async function searchDispense(page: Page, query: string) {
  const input = page.getByPlaceholder("Search by medicine name, generic name, or batch...");
  await input.fill(query);
}

async function expandProduct(page: Page, productName: string, batchNumber?: string) {
  if (batchNumber) {
    const visibleBatch = page.locator("tbody tr").filter({ hasText: batchNumber }).first();
    if (await visibleBatch.isVisible().catch(() => false)) return;
  }

  const row = page.locator("tbody tr").filter({ hasText: productName }).first();
  await expect(row).toBeVisible({ timeout: 15000 });

  const detailsButton = row.getByRole("button", { name: /batch details/i }).first();

  if (await detailsButton.isVisible().catch(() => false)) {
    await detailsButton.click();
  } else {
    await row.click();
  }

  await expect(page.getByText(/Batches/i).first()).toBeVisible({ timeout: 10000 });
}


async function addSeededBatch(page: Page, productName: string, batchNumber: string) {
  await searchDispense(page, productName);
  await expect(page.getByText(productName).first()).toBeVisible({ timeout: 15000 });

  await expandProduct(page, productName, batchNumber);


  const batchRow = page.locator("tbody tr").filter({ hasText: batchNumber }).first();
  await expect(batchRow).toBeVisible({ timeout: 15000 });
  await batchRow.getByRole("button", { name: "Add" }).click();

  await expect(dispensePanel(page).getByText(batchNumber)).toBeVisible();
}

test.describe("Dispense page", () => {
  test("renders the dispense page shell", async ({ page }) => {
    await gotoDispense(page);

    await expect(page.getByPlaceholder("Search by medicine name, generic name, or batch...")).toBeVisible();
    await expect(page.getByText("Select medicine")).toBeVisible();
    await expect(page.getByText("No items selected.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm & Update Stock" })).toBeDisabled();
  });

  test("search finds a seeded medicine from the test database", async ({ page }) => {
    const api = await createApiContext();
    const seeded = await seedProductWithBatch(api);
    await api.dispose();

    await gotoDispense(page);
    await searchDispense(page, seeded.productName);

    await expect(page.getByText(seeded.productName).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(seeded.genericName).first()).toBeVisible();
  });

  test("adds a batch to the dispense list and blocks duplicates", async ({ page }) => {
    const api = await createApiContext();
    const seeded = await seedProductWithBatch(api);
    await api.dispose();

    await gotoDispense(page);
    await addSeededBatch(page, seeded.productName, seeded.batchNumber);

    await expect(dispenseItems(page)).toHaveCount(1);

    await page.locator("tbody tr").filter({ hasText: seeded.batchNumber }).first()
      .getByRole("button", { name: "Add" })
      .click();

    await expect(dispenseItems(page)).toHaveCount(1);
  });

  test("updates quantity, reason, and staff name before confirming", async ({ page }) => {
    const api = await createApiContext();
    const seeded = await seedProductWithBatch(api, { quantity: 20 });
    await api.dispose();

    await gotoDispense(page);
    await addSeededBatch(page, seeded.productName, seeded.batchNumber);

    const panel = dispensePanel(page);
    const qtyInput = panel.getByRole("spinbutton").first();
    await qtyInput.fill("3");
    await expect(qtyInput).toHaveValue("3");

    const reason = panel.getByRole("combobox").first();
    await expect(reason).toHaveValue("Sale");
    await reason.selectOption("Damaged");
    await expect(reason).toHaveValue("Damaged");

    await panel.getByPlaceholder("Enter staff name...").fill("E2E Staff");
    await expect(panel.getByPlaceholder("Enter staff name...")).toHaveValue("E2E Staff");
  });

  test("removes an item from the dispense list", async ({ page }) => {
    const api = await createApiContext();
    const seeded = await seedProductWithBatch(api);
    await api.dispose();

    await gotoDispense(page);
    await addSeededBatch(page, seeded.productName, seeded.batchNumber);

    await dispensePanel(page).getByTitle("Remove item").click();

    await expect(dispenseItems(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Confirm & Update Stock" })).toBeDisabled();
  });

  test("confirms dispense through the real API and updates the test database", async ({ page }) => {
  const api = await createApiContext();
  const seeded = await seedProductWithBatch(api, { quantity: 9 });

  await gotoDispense(page);
  await addSeededBatch(page, seeded.productName, seeded.batchNumber);

  const panel = dispensePanel(page);
  await panel.getByRole("spinbutton").first().fill("4");
  await panel.getByPlaceholder("Enter staff name...").fill("E2E Staff");

  const stockOutResponse = page.waitForResponse((response) => {
    return (
      response.request().method() === "POST" &&
      new URL(response.url()).pathname.endsWith("/inventory/stock-outward")
    );
  });

  await panel.getByRole("button", { name: "Confirm & Update Stock" }).click();
  await expect(page.getByText("Confirm Dispense")).toBeVisible();
  await page.getByRole("button", { name: "Yes, confirm" }).click();

  const response = await stockOutResponse;
  expect(response.ok()).toBeTruthy();

  await expect(page.getByText("Successfully dispensed 1 batch(es).")).toBeVisible({ timeout: 10000 });
  await expect(dispenseItems(page)).toHaveCount(0);

  const batchResponse = await api.get(`/inventory/${seeded.batch.id}`);
  expect(batchResponse.ok()).toBeTruthy();

  const batchPayload = await batchResponse.json();
  expect(batchPayload.inventory_batches.currentQuantity).toBe(5);

  await api.dispose();
});


  test("canceling the confirm modal does not dispense stock", async ({ page }) => {
    const api = await createApiContext();
    const seeded = await seedProductWithBatch(api, { quantity: 8 });
    await api.dispose();

    await gotoDispense(page);
    await addSeededBatch(page, seeded.productName, seeded.batchNumber);

    await dispensePanel(page).getByRole("button", { name: "Confirm & Update Stock" }).click();
    await expect(page.getByText("Confirm Dispense")).toBeVisible();

    await page.getByRole("button", { name: "Go back" }).click();

    await expect(page.getByText("Confirm Dispense")).not.toBeVisible();
    await expect(dispenseItems(page)).toHaveCount(1);
    await expect(page.getByText("Successfully dispensed 1 batch(es).")).not.toBeVisible();
  });

  test("shows failed dispense message when the real API rejects stale stock", async ({ page }) => {
  const api = await createApiContext();
  const seeded = await seedProductWithBatch(api, { quantity: 2 });

  await gotoDispense(page);
  await addSeededBatch(page, seeded.productName, seeded.batchNumber);

  const externalDispense = await api.post("/inventory/stock-outward", {
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

  expect(externalDispense.ok()).toBeTruthy();

  const stockOutResponse = page.waitForResponse((response) => {
    return (
      response.request().method() === "POST" &&
      new URL(response.url()).pathname.endsWith("/inventory/stock-outward")
    );
  });

  await dispensePanel(page).getByRole("button", { name: "Confirm & Update Stock" }).click();
  await page.getByRole("button", { name: "Yes, confirm" }).click();

  const response = await stockOutResponse;
  expect(response.ok()).toBeFalsy();

  await expect(page.getByText("Failed to dispense. Please try again.")).toBeVisible({ timeout: 10000 });

  await api.dispose();
});

test("dispense writes a stock outward audit log", async ({ page }) => {
  const api = await createApiContext();
  const seeded = await seedProductWithBatch(api, { quantity: 9 });

  await gotoDispense(page);
  await addSeededBatch(page, seeded.productName, seeded.batchNumber);

  const panel = dispensePanel(page);
  await panel.getByRole("spinbutton").first().fill("4");
  await panel.getByPlaceholder("Enter staff name...").fill("Audit E2E Staff");

  const stockOutResponse = page.waitForResponse((response) => {
    return (
      response.request().method() === "POST" &&
      new URL(response.url()).pathname.endsWith("/inventory/stock-outward")
    );
  });

  await panel.getByRole("button", { name: "Confirm & Update Stock" }).click();
  await expect(page.getByText("Confirm Dispense")).toBeVisible();
  await page.getByRole("button", { name: "Yes, confirm" }).click();

  const response = await stockOutResponse;
  expect(response.ok()).toBeTruthy();

  await expect(page.getByText("Successfully dispensed 1 batch(es).")).toBeVisible({
    timeout: 10000,
  });

  await page.goto("/customer");

  await expect(page.getByText("stock_outward").first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(seeded.productName).first()).toBeVisible();
  await expect(page.getByText("Audit E2E Staff").first()).toBeVisible();

  const row = page.locator("tbody tr").filter({ hasText: "stock_outward" }).first();
  await expect(row).toContainText("inventory_batch");
  await expect(row.getByRole("button", { name: "Undo" })).toBeVisible();

  await api.dispose();
});

});


