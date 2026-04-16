import { expect, test, type Page } from "@playwright/test";
import { searchInventory } from "./helpers";

async function gotoInventory(page: Page) {
  await page.goto("/inventory");
  await expect(page.locator("h1", { hasText: "Inventory" })).toBeVisible();
}

function inventoryRows(page: Page) {
  return page.locator("table tbody tr");
}

async function openAddProductDrawer(page: Page) {
  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByText("Add new product")).toBeVisible();
}

test("inventory search filters product list", async ({ page }) => {
  await page.goto("/inventory");

  await expect(page.getByRole("cell", { name: "Biogesic" })).toBeVisible();

  await searchInventory(page, "zzzz-not-found");
  await expect(page.getByText("No products found")).toBeVisible();

  await searchInventory(page, "Biogesic");
  await expect(page.getByRole("cell", { name: "Biogesic" })).toBeVisible();
});

test("inventory shows stock summary chips", async ({ page }) => {
  await gotoInventory(page);

  const summaryChips = page.locator("div.flex.gap-3.flex-wrap");
  await expect(summaryChips.getByText("In stock", { exact: true })).toBeVisible();
  await expect(summaryChips.getByText("Low stock", { exact: true })).toBeVisible();
  await expect(summaryChips.getByText("Out of stock", { exact: true })).toBeVisible();
});

test("inventory search matches generic name", async ({ page }) => {
  await gotoInventory(page);

  await searchInventory(page, "paracetamol");
  await expect(page.getByRole("cell", { name: "Biogesic" })).toBeVisible();
});

test("inventory search is case insensitive", async ({ page }) => {
  await gotoInventory(page);

  await searchInventory(page, "BIOGESIC");
  await expect(page.getByRole("cell", { name: "Biogesic" })).toBeVisible();
});

test("inventory add product drawer opens from button", async ({ page }) => {
  await gotoInventory(page);

  await openAddProductDrawer(page);
  await expect(page.getByPlaceholder("e.g. Biogesic")).toBeVisible();
  await expect(page.getByPlaceholder("e.g. Paracetamol")).toBeVisible();
  await expect(page.getByPlaceholder("e.g. 500mg")).toBeVisible();
});

test("inventory add product drawer closes with X button", async ({ page }) => {
  await gotoInventory(page);

  await openAddProductDrawer(page);
  await page.locator("button", { hasText: "×" }).click();

  await expect(page.getByText("Add new product")).not.toBeVisible();
});

test("inventory add product drawer defaults to Tablet base unit", async ({ page }) => {
  await gotoInventory(page);

  await openAddProductDrawer(page);

  await expect(page.locator('label:has-text("Base unit") + select')).toHaveValue("Tablet");
});

test("inventory add product validation clears after typing", async ({ page }) => {
  await gotoInventory(page);

  await openAddProductDrawer(page);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Product name is required.")).toBeVisible();

  await page.getByPlaceholder("e.g. Biogesic").fill("Validation Fix");
  await expect(page.getByText("Product name is required.")).not.toBeVisible();
});

test("inventory search no match shows empty state", async ({ page }) => {
  await gotoInventory(page);

  await searchInventory(page, "zzzz-not-found-in-inventory");
  await expect(page.getByText("No products found")).toBeVisible();
});

test("inventory search clears back to the full list", async ({ page }) => {
  await gotoInventory(page);

  const rows = inventoryRows(page);
  await rows.first().waitFor({ state: "visible" });
  const totalBefore = await rows.count();

  await searchInventory(page, "zzzz-not-found-in-inventory");
  await expect(page.getByText("No products found")).toBeVisible();

  await searchInventory(page, "");
  await expect.poll(async () => rows.count(), { timeout: 10000 }).toBe(totalBefore);
});

test("inventory add product drawer opens and closes", async ({ page }) => {
  await gotoInventory(page);

  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByText("Add new product")).toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Add new product")).not.toBeVisible();
});

test("inventory user can add a new product", async ({ page }) => {
  const uniqueSuffix = Date.now();
  const productName = `E2E Product ${uniqueSuffix}`;

  await gotoInventory(page);

  await page.getByRole("button", { name: "Add product" }).click();
  await page.getByPlaceholder("e.g. Biogesic").fill(productName);
  await page.getByPlaceholder("e.g. Paracetamol").fill("E2EGeneric");
  await page.getByPlaceholder("e.g. 500mg").fill("250mg");

  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Add new product")).not.toBeVisible();

  await searchInventory(page, productName);
  await expect(page.getByRole("cell", { name: productName })).toBeVisible();
});

test("inventory add product shows required field validation", async ({ page }) => {
  await gotoInventory(page);

  await page.getByRole("button", { name: "Add product" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Product name is required.")).toBeVisible();

  await page.getByPlaceholder("e.g. Biogesic").fill("Validation Product");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Generic name is required.")).toBeVisible();
});

test("inventory blocks duplicate product entries", async ({ page }) => {
  await gotoInventory(page);

  await page.getByRole("button", { name: "Add product" }).click();
  await page.getByPlaceholder("e.g. Biogesic").fill("Biogesic");
  await page.getByPlaceholder("e.g. Paracetamol").fill("Paracetamol");
  await page.getByPlaceholder("e.g. 500mg").fill("500mg");

  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("This product already exists in the catalog.")).toBeVisible();
  await expect(page.getByText("Add new product")).toBeVisible();
});

test("inventory search returns to full list when cleared", async ({ page }) => {
  await gotoInventory(page);

  const rows = inventoryRows(page);
  await rows.first().waitFor({ state: "visible" });
  const totalBefore = await rows.count();
  expect(totalBefore).toBeGreaterThan(0);

  await searchInventory(page, "zzzz-not-found");
  await expect(page.getByText("No products found")).toBeVisible();

  await searchInventory(page, "");
  await expect
    .poll(async () => rows.count(), { timeout: 10000 })
    .toBe(totalBefore);
});

test("inventory cancel clears add product form", async ({ page }) => {
  await gotoInventory(page);

  await page.getByRole("button", { name: "Add product" }).click();
  await page.getByPlaceholder("e.g. Biogesic").fill("Temporary Name");
  await page.getByPlaceholder("e.g. Paracetamol").fill("Temporary Generic");
  await page.getByPlaceholder("e.g. 500mg").fill("111mg");

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Add new product")).not.toBeVisible();

  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByPlaceholder("e.g. Biogesic")).toHaveValue("");
  await expect(page.getByPlaceholder("e.g. Paracetamol")).toHaveValue("");
  await expect(page.getByPlaceholder("e.g. 500mg")).toHaveValue("");
});
