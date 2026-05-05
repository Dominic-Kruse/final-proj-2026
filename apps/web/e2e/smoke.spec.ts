import { expect, test } from "@playwright/test";

test("dashboard page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Total Medicines")).toBeVisible();
});


test("sidebar navigation works across core routes", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Inventory" }).click();
  await expect(page).toHaveURL(/\/inventory$/);
  await expect(page.getByRole("heading", { name: "Inventory", level: 1, exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Stock In" }).click();
  await expect(page).toHaveURL(/\/stockin$/);
  await expect(page.getByRole("heading", { name: "Stock In", level: 1, exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Dispense" }).click();
  await expect(page).toHaveURL(/\/dispense$/);
  await expect(page.getByRole("heading", { name: "Dispense", level: 1, exact: true })).toBeVisible();


  await page.getByRole("link", { name: "Audit Logs" }).click();
  await expect(page).toHaveURL(/\/customer$/);
  await expect(page.getByRole("heading", { name: "Audit Logs", level: 1, exact: true })).toBeVisible();
});