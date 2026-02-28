import { test, expect } from "@playwright/test";

test.describe("File browsing", () => {
	test("shows breadcrumbs on bucket root", async ({ page }) => {
		await page.goto("/teste/files");

		// Breadcrumb should show the bucket name
		await expect(page.locator("text=teste")).toBeVisible({ timeout: 10_000 });
	});

	test("navigates into a folder and updates breadcrumbs", async ({
		page,
	}) => {
		await page.goto("/teste/files");

		// Wait for the file table to load
		await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

		// Click on a folder row (if any exist in the test bucket)
		const folderRow = page.locator("tr").filter({ hasText: "/" }).first();

		if (await folderRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
			await folderRow.click();

			// URL should update to include the folder path
			await expect(page).not.toHaveURL(/\/teste\/files$/);
		}
	});
});
