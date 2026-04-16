import { expect, type Page } from "@playwright/test";

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
