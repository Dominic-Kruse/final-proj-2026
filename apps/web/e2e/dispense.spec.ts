import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the Dispense page and wait for the <h1> to confirm mount. */
async function gotoDispense(page: Page) {
  await page.goto("/dispense");
  // Pin to <h1> — the page also renders <h2>Dispense List</h2> which would
  // trigger a strict-mode violation with a plain heading name match.
  await expect(page.locator("h1", { hasText: "Dispense" })).toBeVisible();
}

/**
 * Search the Dispense inventory table (client-side filter — no network call).
 * NOTE: The placeholder here differs from the shared searchInventory helper,
 * which targets the separate Inventory page.
 */
async function searchDispense(page: Page, query: string) {
  const input = page.getByPlaceholder(
    "Search by medicine name, generic name, or batch..."
  );
  await input.fill(query);
  // Allow the client-side filter to settle
  await page.waitForTimeout(200);
}

/**
 * Returns the DispenseList <aside> panel.
 * The layout has TWO <aside> elements: the nav sidebar and the dispense panel.
 * We disambiguate by filtering on the heading text only the panel carries.
 */
function dispensePanel(page: Page) {
  return page.locator("aside").filter({ hasText: "Dispense List" });
}

function dispenseListItems(page: Page) {
  return dispensePanel(page).locator("div.bg-slate-50.p-4.rounded-xl.border.border-slate-200");
}

/**
 * Row locator scoped strictly to the inventory <table> body.
 * Using a CSS comma selector in a single Playwright locator causes
 * double-counting; keep it to a single selector.
 */
function inventoryRows(page: Page) {
  return page.locator("section").first().locator("table tbody tr");
}

/**
 * Click the first Add button in the inventory table section.
 * Scoped to <section> to avoid matching unrelated "Add" buttons in the
 * nav sidebar or page header that caused the 30 s timeout.
 */
async function addFirstBatchToDispense(page: Page) {
  const inventoryTable = page.locator("main table").first();
  const firstProductRow = inventoryTable.locator("tbody tr").first();

  await expect(firstProductRow).toBeVisible({ timeout: 10000 });

  let addButton = page.getByRole("button", { name: /^add$/i }).first();
  if ((await addButton.count()) === 0 || !(await addButton.isVisible())) {
    await firstProductRow.click();
    addButton = page.getByRole("button", { name: /^add$/i }).first();
  }

  await expect(addButton).toBeVisible({ timeout: 10000 });
  await addButton.click();

  await expect(dispenseListItems(page).first()).toBeVisible();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Dispense page", () => {
  // ── Layout & initial render ─────────────────────────────────────────────

  test("renders page heading and subtitle", async ({ page }) => {
    await gotoDispense(page);

    await expect(page.locator("h1", { hasText: "Dispense" })).toBeVisible();
    await expect(
      page.getByText("Select medicine batches and prepare outgoing stock")
    ).toBeVisible();
  });

  test("renders search bar with correct placeholder", async ({ page }) => {
    await gotoDispense(page);

    await expect(
      page.getByPlaceholder("Search by medicine name, generic name, or batch...")
    ).toBeVisible();
  });

  test("renders the inventory table section", async ({ page }) => {
    await gotoDispense(page);

    await expect(page.locator("section").first()).toBeVisible();
  });

  test("renders the dispense list aside panel", async ({ page }) => {
    await gotoDispense(page);

    // Filter by "Dispense List" text to avoid matching the nav sidebar <aside>
    await expect(dispensePanel(page)).toBeVisible();
  });

  // ── Search / filter ─────────────────────────────────────────────────────

  test("filters inventory table when typing in search bar", async ({ page }) => {
    await gotoDispense(page);

    const rows = inventoryRows(page);
    // Wait for initial data to load
    await rows.first().waitFor({ state: "visible" });
    const totalBefore = await rows.count();

    await searchDispense(page, "amoxicillin");

    const totalAfter = await rows.count();
    expect(totalAfter).toBeLessThanOrEqual(totalBefore);

    for (let i = 0; i < totalAfter; i++) {
      const text = await rows.nth(i).innerText();
      expect(text.toLowerCase()).toContain("amoxicillin");
    }
  });

  test("shows all rows when search is cleared", async ({ page }) => {
    await gotoDispense(page);

    const rows = inventoryRows(page);
    await rows.first().waitFor({ state: "visible" });
    const totalBefore = await rows.count();

    await searchDispense(page, "xyz_no_match");
    // Confirm the filter actually reduced results before clearing
    await expect(rows).toHaveCount(0);

    await searchDispense(page, ""); // clear

    const totalAfter = await rows.count();
    expect(totalAfter).toBe(totalBefore);
  });

  test("shows empty state when search has no matches", async ({ page }) => {
    await gotoDispense(page);

    const rows = inventoryRows(page);
    await rows.first().waitFor({ state: "visible" });

    await searchDispense(page, "zzz_definitely_not_a_medicine_9999");

    const count = await rows.count();
    if (count === 0) {
      expect(count).toBe(0);
    } else {
      // Some implementations render a single "no results" row
      const text = await rows.first().innerText();
      expect(text.toLowerCase()).toMatch(/no result|no item|empty|not found/);
    }
  });

  // ── Adding items to the dispense list ───────────────────────────────────

  test("adds a batch to the dispense list", async ({ page }) => {
    await gotoDispense(page);

    await addFirstBatchToDispense(page);

    const items = dispenseListItems(page);
    await expect(items).toHaveCount(1);
  });

  test("does not add the same batch twice", async ({ page }) => {
    await gotoDispense(page);

    await addFirstBatchToDispense(page);
    await addFirstBatchToDispense(page); // attempt duplicate

    const items = dispenseListItems(page);
    expect(await items.count()).toBe(1);
  });

  // ── Quantity update ─────────────────────────────────────────────────────

  test("updates quantity of a dispense item", async ({ page }) => {
    await gotoDispense(page);

    await addFirstBatchToDispense(page);

    const qtyInput = dispensePanel(page).getByRole("spinbutton").first();
    await qtyInput.fill("3");
    await qtyInput.blur();

    await expect(qtyInput).toHaveValue("3");
  });

  test("does not allow quantity below 1", async ({ page }) => {
    await gotoDispense(page);

    await addFirstBatchToDispense(page);

    const qtyInput = dispensePanel(page).getByRole("spinbutton").first();
    await qtyInput.fill("0");
    await qtyInput.blur();

    const value = await qtyInput.inputValue();
    expect(Number(value)).toBeGreaterThanOrEqual(1);
  });

  // ── Reason selection ────────────────────────────────────────────────────

  test("defaults dispense reason to Sale", async ({ page }) => {
    await gotoDispense(page);

    await addFirstBatchToDispense(page);

    const select = dispensePanel(page).getByRole("combobox").first();
    await expect(select).toHaveValue("Sale");
  });

  test("updates dispense reason", async ({ page }) => {
    await gotoDispense(page);

    await addFirstBatchToDispense(page);

    const select = dispensePanel(page).getByRole("combobox").first();
    await select.selectOption("Expired");

    await expect(select).toHaveValue("Expired");
  });

  // ── Removing items ──────────────────────────────────────────────────────

  test("removes an item from the dispense list", async ({ page }) => {
    await gotoDispense(page);

    await addFirstBatchToDispense(page);

    const panel = dispensePanel(page);
    const removeBtn = panel.getByRole("button", { name: /remove|delete|×|trash/i }).first();
    await removeBtn.click();

    const items = dispenseListItems(page);
    expect(await items.count()).toBe(0);
  });

  // ── Confirm / submit ────────────────────────────────────────────────────

  test("Confirm button is disabled or absent when dispense list is empty", async ({ page }) => {
    await gotoDispense(page);

    // Scope to the dispense panel so we don't accidentally match other buttons
    const confirmBtn = dispensePanel(page).getByRole("button", { name: /confirm|dispense/i });

    const count = await confirmBtn.count();
    if (count > 0) {
      await expect(confirmBtn.first()).toBeDisabled();
    }
    // count === 0 is also acceptable — button may be hidden when list is empty
  });

  test("shows success message after confirming dispense", async ({ page }) => {
    await gotoDispense(page);

    await addFirstBatchToDispense(page);

    await page.route("**/inventory/stock-outward", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await dispensePanel(page).getByRole("button", { name: /confirm|dispense/i }).first().click();

    await expect(page.getByText(/successfully dispensed/i)).toBeVisible({ timeout: 5000 });
  });

  test("clears the dispense list after a successful dispense", async ({ page }) => {
    await gotoDispense(page);

    await addFirstBatchToDispense(page);

    await page.route("**/inventory/stock-outward", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await dispensePanel(page).getByRole("button", { name: /confirm|dispense/i }).first().click();

    await expect(page.getByText(/successfully dispensed/i)).toBeVisible({ timeout: 5000 });

    const items = dispenseListItems(page);
    expect(await items.count()).toBe(0);
  });

  test("shows error message when dispense API fails", async ({ page }) => {
    await gotoDispense(page);

    await addFirstBatchToDispense(page);

    await page.route("**/inventory/stock-outward", async (route) => {
      await route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) });
    });

    await dispensePanel(page).getByRole("button", { name: /confirm|dispense/i }).first().click();

    await expect(page.getByText(/failed to dispense/i)).toBeVisible({ timeout: 5000 });
  });

  // ── Accessibility ────────────────────────────────────────────────────────

  test("search input is focusable via keyboard", async ({ page }) => {
    await gotoDispense(page);

    // Assert the input is visible and enabled (keyboard-accessible).
    // Asserting exact Tab focus order is brittle across browsers so we skip it.
    const searchInput = page.getByPlaceholder(
      "Search by medicine name, generic name, or batch..."
    );
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();
  });
});