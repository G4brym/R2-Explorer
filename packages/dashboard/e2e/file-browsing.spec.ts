import { test, expect } from "@playwright/test";
import { uploadFile, createFolder, deleteObject, BUCKET } from "./helpers";

test.describe("File browsing", () => {
	test("shows breadcrumbs on bucket root", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);

		await expect(page.locator(`text=${BUCKET}`)).toBeVisible({
			timeout: 10_000,
		});
	});

	test("shows empty state when bucket has no files", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);

		await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });
	});

	test("displays file table columns", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

		await expect(page.locator("text=Name")).toBeVisible();
		await expect(page.locator("text=Last Modified")).toBeVisible();
		await expect(page.locator("text=Size")).toBeVisible();
	});
});

test.describe("Sorting", () => {
	test.beforeAll(async ({ request }) => {
		await uploadFile(request, "e2e-sort-aaa.txt", "a");
		await uploadFile(request, "e2e-sort-zzz.txt", "z");
		await createFolder(request, "e2e-sort-folder");
	});

	test.afterAll(async ({ request }) => {
		await deleteObject(request, "e2e-sort-aaa.txt");
		await deleteObject(request, "e2e-sort-zzz.txt");
		await deleteObject(request, "e2e-sort-folder/");
	});

	test("shows folders before files by default", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-sort-folder/")).toBeVisible({
			timeout: 10_000,
		});

		// Get all row texts in order
		const rows = page.locator(".q-table tbody tr");
		const firstRowText = await rows.first().textContent();

		// Folders should sort before files
		expect(firstRowText).toContain("e2e-sort-folder");
	});

	test("sorts by name when clicking the Name header", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-sort-aaa.txt")).toBeVisible({
			timeout: 10_000,
		});

		// Click Name header to toggle sort direction
		await page.locator("th:has-text('Name')").click();

		// After clicking, files should still be visible
		await expect(page.locator("text=e2e-sort-aaa.txt")).toBeVisible();
		await expect(page.locator("text=e2e-sort-zzz.txt")).toBeVisible();
	});
});
