import { expect, test } from "@playwright/test";

test("stock in requires header and required fields", async ({ page }) => {
  await page.goto("/stockin");
  await page.getByRole("button", { name: "Add to draft list" }).click();

  await expect(
    page.getByText("Complete the inward header (supplier, reference, date) first.").first(),
  ).toBeVisible();
});
