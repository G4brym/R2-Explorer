import { test, expect } from "@playwright/test";
import { uploadFile, deleteObject, BUCKET } from "./helpers";

test.describe("Metadata", () => {
	test.beforeEach(async ({ request }) => {
		await uploadFile(request, "e2e-metadata.txt", "metadata test file");
	});

	test.afterEach(async ({ request }) => {
		await deleteObject(request, "e2e-metadata.txt");
	});

	test("opens metadata dialog from context menu", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-metadata.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-metadata.txt").click({ button: "right" });
		await page.getByText("Update Metadata").click();

		// Metadata dialog should open with both sections
		await expect(page.locator("text=HTTP Metadata")).toBeVisible({
			timeout: 5_000,
		});
		await expect(page.locator("text=Custom Metadata")).toBeVisible();
	});

	test("adds custom metadata and saves", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-metadata.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-metadata.txt").click({ button: "right" });
		await page.getByText("Update Metadata").click();
		await expect(page.locator("text=Custom Metadata")).toBeVisible({
			timeout: 5_000,
		});

		// Click the "Add" button in the Custom Metadata section
		// The add buttons are round icon buttons — get the last one (custom metadata section)
		const addButtons = page.locator(".q-dialog .q-btn--round");
		await addButtons.last().click();

		// Fill in key and value — inputs have label="Key" and label="Value"
		const keyInputs = page.locator('.q-dialog input[aria-label="Key"]');
		const valueInputs = page.locator('.q-dialog input[aria-label="Value"]');
		await keyInputs.last().fill("e2e-key");
		await valueInputs.last().fill("e2e-value");

		// Save via Update Metadata button
		await page.getByRole("button", { name: "Update Metadata" }).click();

		// Verify by reopening metadata dialog
		await page.locator("text=e2e-metadata.txt").click({ button: "right" });
		await page.getByText("Update Metadata").click();
		await expect(page.locator("text=Custom Metadata")).toBeVisible({
			timeout: 5_000,
		});

		// The saved metadata should appear
		await expect(page.locator('input[value="e2e-key"]')).toBeVisible({
			timeout: 5_000,
		});
		await expect(page.locator('input[value="e2e-value"]')).toBeVisible();
	});
});
