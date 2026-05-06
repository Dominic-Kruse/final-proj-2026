import { expect, test, type Page } from "@playwright/test";
import { createApiContext, seedProductWithBatch } from "./helpers";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function gotoStockIn(page: Page) {
  await page.goto("/stockin");
  await expect(page.getByText("Inward header")).toBeVisible();
}

async function fillHeader(page: Page, supplier = "MediCore Pharma", reference = "INV-2026-118") {
  await page.getByLabel("Supplier").fill(supplier);
  await page.getByLabel("Invoice / reference number").fill(reference);
}

async function selectGeneric(page: Page, query: string) {
  const input = page.getByPlaceholder("Search generic name...");
  await input.fill(query);
  const suggestion = input
    .locator('xpath=following-sibling::div//li')
    .filter({ hasText: new RegExp(escapeRegExp(query), "i") })
    .first();

  try {
    await expect(suggestion).toBeVisible({ timeout: 1500 });
    await suggestion.click();
    await expect(input).toHaveValue(new RegExp(query, "i"));
    return;
  } catch {
    await input.press("Enter");
  }
}



async function fillMatchingBatch(page: Page, overrides?: Partial<Record<string, string>>) {
  await page.getByPlaceholder("e.g. Biogesic, Amoxil").fill(overrides?.productName ?? "Biogesic");
  await selectGeneric(page, overrides?.genericName ?? "paracetamol");
  await page.getByPlaceholder("e.g. 500").fill(overrides?.strengthValue ?? "500");
  await page.getByRole("button", { name: overrides?.category ?? "Analgesic" }).click();
  await page.getByRole("button", { name: overrides?.form ?? "Tablet" }).first().click();
  await page.locator('label:has-text("Base unit") + select').selectOption(overrides?.baseUnit ?? "Tablet");
  await page.locator('label:has-text("Package unit") + select').selectOption(overrides?.packageUnit ?? "Box");
  await page.locator('label:has-text("Conversion factor") + input').fill(overrides?.conversionFactor ?? "100");
  await page.getByPlaceholder("e.g. AMX-2026-04").fill(overrides?.batchNumber ?? "BATCH-001");
  await page.locator('label:has-text("Expiry date") + input').fill(overrides?.expiryDate ?? "2027-04-16");
  await page.getByPlaceholder("e.g. Shelf A-3").fill(overrides?.inventoryLocation ?? "Shelf A-1");
  await page.locator('input[placeholder="0"]').fill(overrides?.quantityPackages ?? "2");
  await page.getByPlaceholder("0.00").first().fill(overrides?.unitCost ?? "1.25");
  await page.getByPlaceholder("0.00").nth(1).fill(overrides?.sellingPrice ?? "2.50");
}

async function addDraftBatch(page: Page) {
  await page.getByRole("button", { name: "Add to draft list" }).click();
}

test("stock in can add a valid batch to the draft list", async ({ page }) => {
  await gotoStockIn(page);
  await fillHeader(page);
  await fillMatchingBatch(page);

  await addDraftBatch(page);

  await expect(page.getByText("1 batch", { exact: true })).toBeVisible();
  await expect(page.locator("tbody").getByText("Biogesic", { exact: true })).toBeVisible();
});

test("stock in saves a drafted batch through the backend", async ({ page }) => {
  await gotoStockIn(page);
  await fillHeader(page, "MediCore Pharma", `INV-${Date.now()}`);
  await fillMatchingBatch(page, {
    productName: "Biogesic",
    genericName: "paracetamol",
    strengthValue: "500",
    batchNumber: `E2E-${Date.now()}`,
    expiryDate: "2027-04-16",
    inventoryLocation: "Shelf A-1",
  });

  await addDraftBatch(page);
  await expect(page.getByText("1 batch", { exact: true })).toBeVisible();

  const saveButton = page.getByRole("button", { name: "Save stock inward" }).last();
  await expect(saveButton).toBeVisible();
  await expect(saveButton).toBeEnabled();

  const [saveResponse] = await Promise.all([
    page.waitForResponse((response) => {
      return (
        response.request().method() === "POST" &&
        new URL(response.url()).pathname.endsWith("/inventory/stock-inward")
      );
    }),
    saveButton.click(),
  ]);

  expect(saveResponse.ok()).toBeTruthy();

  await expect(page.getByText(/Saved 1 batch\(es\) from MediCore Pharma/i)).toBeVisible();
  await expect(page.getByText("1 batch", { exact: true })).not.toBeVisible();
  await expect(page.locator("tbody").getByText("Biogesic", { exact: true })).not.toBeVisible();
});


test("stock in requires header and required fields", async ({ page }) => {
  await gotoStockIn(page);
  await page.getByRole("button", { name: "Add to draft list" }).click();

  await expect(
    page.getByText("Complete the inward header (supplier, reference, date) first.").first(),
  ).toBeVisible();
});

test("stock in renders header fields and save controls", async ({ page }) => {
  await gotoStockIn(page);

  await expect(page.getByLabel("Supplier")).toBeVisible();
  await expect(page.getByLabel("Invoice / reference number")).toBeVisible();
  await expect(page.getByLabel("Date received")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save stock inward" }).first()).toBeVisible();
});

test("stock in batch entry shows default unit controls", async ({ page }) => {
  await gotoStockIn(page);

  await expect(page.locator('label:has-text("Base unit") + select')).toHaveValue("Tablet");
  await expect(page.locator('label:has-text("Package unit") + select')).toHaveValue("Box");
  await expect(page.locator('label:has-text("Conversion factor") + input')).toHaveValue("100");
});

test("stock in requires batch fields before adding to draft", async ({ page }) => {
  await gotoStockIn(page);
  await fillHeader(page);

  await addDraftBatch(page);

  await expect(page.locator("form").getByText("Please complete all required batch fields.").first()).toBeVisible();
});


test("stock in saves a batch, then appears in inventory and audit logs", async ({ page }) => {
  const unique = Date.now();
  const productName = "Biogesic";
  const batchNumber = `STOCKIN-AUDIT-${unique}`;

  await gotoStockIn(page);
  await fillHeader(page, "Audit Supplier", `AUDIT-INV-${unique}`);
  await fillMatchingBatch(page, {
    productName,
    genericName: "paracetamol",
    strengthValue: "500",
    batchNumber,
    expiryDate: "2027-04-16",
    inventoryLocation: "Audit Shelf",
    quantityPackages: "3",
    unitCost: "1.25",
    sellingPrice: "2.50",
  });

  await addDraftBatch(page);
  await expect(page.getByText("1 batch", { exact: true })).toBeVisible();

  const saveButton = page.getByRole("button", { name: "Save stock inward" }).last();
  await expect(saveButton).toBeEnabled();

  const [response] = await Promise.all([
    page.waitForResponse((response) => {
      return (
        response.request().method() === "POST" &&
        new URL(response.url()).pathname.endsWith("/inventory/stock-inward")
      );
    }),
    saveButton.click(),
  ]);

  expect(response.ok()).toBeTruthy();

  await expect(
    page.getByText(/Saved 1 batch\(es\) from Audit Supplier/i),
  ).toBeVisible();

  await page.goto("/inventory");
  await expect(page.locator("h1", { hasText: "Inventory" })).toBeVisible();

  await page
    .getByPlaceholder("Search by medicine name or generic name...")
    .fill(productName);

  await expect(page.getByRole("cell", { name: productName })).toBeVisible({
    timeout: 15000,
  });

  const inventoryRow = page
    .locator("tbody tr")
    .filter({ hasText: productName })
    .first();

  await inventoryRow.getByRole("button", { name: /batch details/i }).click();

  await expect(page.getByText(batchNumber)).toBeVisible();
  

    await page.goto("/customer");

  const auditRow = page
    .locator("tbody tr")
    .filter({ hasText: "stock_inward" })
    .filter({ hasText: "inventory_batch" })
    .first();

  await expect(auditRow).toBeVisible({ timeout: 15000 });
  await expect(auditRow).toContainText("stock_inward");
  await expect(auditRow).toContainText("inventory_batch");
});

