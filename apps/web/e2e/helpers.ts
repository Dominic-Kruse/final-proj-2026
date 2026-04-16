import type { Page } from "@playwright/test";

export async function searchInventory(page: Page, query: string) {
  const input = page.getByPlaceholder("Search by medicine name or generic name...");
  const expectedQuery = query.trim();

  const responsePromise = page
    .waitForResponse((response) => {
      if (response.request().method() !== "GET") return false;

      const url = new URL(response.url());
      const actualQuery = (url.searchParams.get("search") ?? "").trim();
      return url.pathname.endsWith("/inventory") && actualQuery === expectedQuery;
    }, { timeout: 2500 })
    .catch(() => null);

  await input.fill(query);
  await responsePromise;
}
