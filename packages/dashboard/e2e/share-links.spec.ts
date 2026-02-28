import { test, expect } from "@playwright/test";
import { uploadFile, deleteObject, BUCKET } from "./helpers";

test.describe("Share links", () => {
	test.beforeAll(async ({ request }) => {
		await uploadFile(request, "e2e-share-file.txt", "shareable content");
	});

	test.afterAll(async ({ request }) => {
		await deleteObject(request, "e2e-share-file.txt");
	});

	test("opens create share link dialog from context menu", async ({
		page,
	}) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.getByText("Create Share Link").click();

		// Share link dialog should open with "Share File" title
		await expect(page.locator("text=Share File")).toBeVisible({
			timeout: 5_000,
		});
		// Should show expiration field
		await expect(
			page.locator("text=Expires in"),
		).toBeVisible();
	});

	test("creates a share link and shows the URL", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.getByText("Create Share Link").click();
		await expect(page.locator("text=Share File")).toBeVisible({
			timeout: 5_000,
		});

		// Submit the share link form
		await page.getByRole("button", { name: "Create Link" }).click();

		// A share URL should be displayed in the dialog
		await expect(
			page.locator(".q-dialog").locator("text=Share Link Created!"),
		).toBeVisible({
			timeout: 5_000,
		});
	});

	test("opens manage shares dialog", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

		// Click Manage Shares button
		await page.getByRole("button", { name: "Manage Shares" }).click();

		// Manage shares dialog should open
		await expect(
			page.locator("text=Manage Share Links"),
		).toBeVisible({ timeout: 5_000 });
	});
});
