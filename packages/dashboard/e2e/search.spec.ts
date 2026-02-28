import { test, expect } from "@playwright/test";
import { uploadFile, deleteObject, BUCKET } from "./helpers";

test.describe("Search", () => {
	test.beforeAll(async ({ request }) => {
		await uploadFile(request, "e2e-search-alpha.txt", "alpha file");
		await uploadFile(request, "e2e-search-beta.txt", "beta file");
		await uploadFile(request, "e2e-search-gamma.txt", "gamma file");
	});

	test.afterAll(async ({ request }) => {
		await deleteObject(request, "e2e-search-alpha.txt");
		await deleteObject(request, "e2e-search-beta.txt");
		await deleteObject(request, "e2e-search-gamma.txt");
	});

	test("searches by prefix and shows matching files", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-search-alpha.txt")).toBeVisible({
			timeout: 10_000,
		});

		// Type search prefix
		const searchInput = page.locator('input[placeholder="Search by prefix..."]');
		await searchInput.fill("e2e-search-b");
		await searchInput.press("Enter");

		// Only beta should be visible
		await expect(page.locator("text=e2e-search-beta.txt")).toBeVisible({
			timeout: 5_000,
		});
		await expect(
			page.locator("text=e2e-search-alpha.txt"),
		).not.toBeVisible();
		await expect(
			page.locator("text=e2e-search-gamma.txt"),
		).not.toBeVisible();
	});

	test("clears search and shows all files again", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-search-alpha.txt")).toBeVisible({
			timeout: 10_000,
		});

		// Search for beta
		const searchInput = page.locator('input[placeholder="Search by prefix..."]');
		await searchInput.fill("e2e-search-b");
		await searchInput.press("Enter");
		await expect(page.locator("text=e2e-search-beta.txt")).toBeVisible({
			timeout: 5_000,
		});

		// Clear search
		await searchInput.clear();
		await searchInput.press("Enter");

		// All files should be visible again
		await expect(page.locator("text=e2e-search-alpha.txt")).toBeVisible({
			timeout: 5_000,
		});
		await expect(page.locator("text=e2e-search-beta.txt")).toBeVisible();
		await expect(page.locator("text=e2e-search-gamma.txt")).toBeVisible();
	});
});
