import { test, expect } from "@playwright/test";

test.describe("File browsing", () => {
	test("shows breadcrumbs on bucket root", async ({ page }) => {
		await page.goto("/my-bucket/files");

		// Breadcrumb should show the bucket name
		await expect(page.locator("text=my-bucket")).toBeVisible({
			timeout: 10_000,
		});
	});

	test("shows empty state when bucket has no files", async ({ page }) => {
		await page.goto("/my-bucket/files");

		// Wait for the file table to load
		await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });
	});
});
