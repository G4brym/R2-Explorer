import { test, expect } from "@playwright/test";
import { uploadFile, createFolder, deleteObject, BUCKET } from "./helpers";

test.describe("Navigation", () => {
	test.beforeAll(async ({ request }) => {
		await createFolder(request, "e2e-nav-folder");
		await uploadFile(
			request,
			"e2e-nav-folder/nested-file.txt",
			"nested content",
		);
	});

	test.afterAll(async ({ request }) => {
		await deleteObject(request, "e2e-nav-folder/nested-file.txt");
		await deleteObject(request, "e2e-nav-folder/");
	});

	test("navigates into a folder by double-clicking", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-nav-folder/")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-nav-folder/").dblclick();

		// Should see the nested file
		await expect(page.locator("text=nested-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		// URL should include the folder
		await expect(page).toHaveURL(/\/files\//);
	});

	test("breadcrumbs update when entering a folder", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await page.locator("text=e2e-nav-folder/").dblclick();

		// Breadcrumbs should show bucket name and folder
		await expect(page.locator("text=e2e-nav-folder")).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.locator(`text=${BUCKET}`)).toBeVisible();
	});

	test("navigates back via breadcrumb click", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-nav-folder")).toBeVisible({
			timeout: 10_000,
		});
		await page.locator("text=e2e-nav-folder").first().dblclick();
		await expect(page.locator("text=nested-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		// Click the bucket breadcrumb to go back to root
		await page.locator(`text=${BUCKET}`).first().click();

		// Should see the folder again, not the nested file
		await expect(page.locator("text=e2e-nav-folder")).toBeVisible({
			timeout: 10_000,
		});
	});
});

test.describe("Sidebar", () => {
	test("opens info dialog", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);

		await page.getByRole("button", { name: "Info" }).click();

		// Info dialog should show version and config
		await expect(
			page.locator("text=Thank you for using R2-Explorer"),
		).toBeVisible({ timeout: 5_000 });
		await expect(page.locator("text=Server Configuration")).toBeVisible();
	});

	test("closes info dialog with OK", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await page.getByRole("button", { name: "Info" }).click();
		await expect(
			page.locator("text=Thank you for using R2-Explorer"),
		).toBeVisible({ timeout: 5_000 });

		await page.getByRole("button", { name: "OK" }).click();

		await expect(
			page.locator("text=Thank you for using R2-Explorer"),
		).not.toBeVisible({ timeout: 3_000 });
	});
});
