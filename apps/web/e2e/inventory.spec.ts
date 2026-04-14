import { expect, test } from "@playwright/test";
import { searchInventory } from "./helpers";

test("inventory search filters product list", async ({ page }) => {
  await page.goto("/inventory");

  await expect(page.getByRole("cell", { name: "Biogesic" })).toBeVisible();

  await searchInventory(page, "zzzz-not-found");
  await expect(page.getByText("No products found")).toBeVisible();

  await searchInventory(page, "Biogesic");
  await expect(page.getByRole("cell", { name: "Biogesic" })).toBeVisible();
});

test("inventory add product drawer opens and closes", async ({ page }) => {
  await page.goto("/inventory");

  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByText("Add new product")).toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Add new product")).not.toBeVisible();
});

test("inventory user can add a new product", async ({ page }) => {
  const uniqueSuffix = Date.now();
  const productName = `E2E Product ${uniqueSuffix}`;

  await page.goto("/inventory");

  await page.getByRole("button", { name: "Add product" }).click();
  await page.getByPlaceholder("e.g. Biogesic").fill(productName);
  await page.getByPlaceholder("e.g. Paracetamol").fill("E2EGeneric");
  await page.getByPlaceholder("e.g. 500mg").fill("250mg");

  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Add new product")).not.toBeVisible();

  await searchInventory(page, productName);
  await expect(page.getByRole("cell", { name: productName })).toBeVisible();
});
