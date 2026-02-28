import { test, expect } from "@playwright/test";
import { deleteObject, BUCKET } from "./helpers";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

test.describe("File upload", () => {
	let tmpFile: string;

	test.beforeAll(async () => {
		// Create a temporary file to upload
		tmpFile = path.join(os.tmpdir(), "e2e-upload-test.txt");
		fs.writeFileSync(tmpFile, "uploaded via E2E test");
	});

	test.afterAll(async ({ request }) => {
		await deleteObject(request, "e2e-upload-test.txt");
		if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
	});

	test("uploads a file via the Upload Files button", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

		// The hidden file input is inside DragAndDrop component
		// Playwright can set files on hidden inputs before they're clicked
		const fileInput = page.locator('input[type="file"]:not([webkitdirectory])');

		// Set the file on the input before triggering the click
		await fileInput.setInputFiles(tmpFile);

		// File should appear in the listing after upload completes
		await expect(page.locator("text=e2e-upload-test.txt")).toBeVisible({
			timeout: 15_000,
		});
	});
});

test.describe("File download", () => {
	test.beforeAll(async ({ request }) => {
		const { uploadFile } = await import("./helpers");
		await uploadFile(request, "e2e-download-me.txt", "download this content");
	});

	test.afterAll(async ({ request }) => {
		await deleteObject(request, "e2e-download-me.txt");
	});

	test("initiates file download via context menu", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-download-me.txt")).toBeVisible({
			timeout: 10_000,
		});

		// Listen for download event
		const downloadPromise = page.waitForEvent("download");

		await page.locator("text=e2e-download-me.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("Download").click();

		// Verify download was triggered
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toBe("e2e-download-me.txt");
	});
});
