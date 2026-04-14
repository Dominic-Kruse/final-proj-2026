import type { Page } from "@playwright/test";

export async function searchInventory(page: Page, query: string) {
  const input = page.getByPlaceholder("Search by medicine name or generic name...");
  const responsePromise = page.waitForResponse((response) => {
    if (response.request().method() !== "GET") return false;

    const url = new URL(response.url());
    return url.pathname.endsWith("/inventory") && url.searchParams.get("search") === query;
  });

  await input.fill(query);
  await responsePromise;
}
