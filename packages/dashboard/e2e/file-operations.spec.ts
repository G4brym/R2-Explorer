import { test, expect } from "@playwright/test";
import { uploadFile, createFolder, deleteObject, BUCKET } from "./helpers";

test.describe("File operations", () => {
	test.describe("Create folder", () => {
		test.afterEach(async ({ request }) => {
			await deleteObject(request, "e2e-new-folder/");
		});

		test("creates a folder via the New menu", async ({ page }) => {
			await page.goto(`/${BUCKET}/files`);
			await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

			// Open the New menu in sidebar
			await page.getByRole("button", { name: "New" }).click();
			await page.getByText("New Folder").click();

			// Fill in folder name — input is inside the dialog
			await page.locator(".q-dialog input").fill("e2e-new-folder");
			await page.getByRole("button", { name: "Create" }).click();

			// Folder should appear in file list
			await expect(page.locator("text=e2e-new-folder/")).toBeVisible({
				timeout: 5_000,
			});
		});
	});

	test.describe("Create file", () => {
		test.afterEach(async ({ request }) => {
			await deleteObject(request, "e2e-new-file.txt");
		});

		test("creates a file via the New menu", async ({ page }) => {
			await page.goto(`/${BUCKET}/files`);
			await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

			await page.getByRole("button", { name: "New" }).click();
			await page.getByText("New File").click();

			await page.locator(".q-dialog input").fill("e2e-new-file.txt");
			await page.getByRole("button", { name: "Create" }).click();

			// File should appear in listing
			await expect(page.locator("text=e2e-new-file.txt")).toBeVisible({
				timeout: 5_000,
			});
		});
	});

	test.describe("Delete file", () => {
		test.beforeEach(async ({ request }) => {
			await uploadFile(request, "e2e-delete-me.txt", "delete this");
		});

		test("deletes a file via context menu", async ({ page }) => {
			await page.goto(`/${BUCKET}/files`);
			await expect(page.locator("text=e2e-delete-me.txt")).toBeVisible({
				timeout: 10_000,
			});

			// Right-click to open context menu
			await page.locator("text=e2e-delete-me.txt").click({ button: "right" });
			await page.locator(".q-menu").getByText("Delete").click();

			// Confirm deletion in dialog
			await page.locator(".q-dialog").getByRole("button", { name: "Delete" }).click();

			// Wait for dialog to close
			await expect(page.locator(".q-dialog")).not.toBeVisible({ timeout: 5_000 });

			// File should disappear from the table
			await expect(
				page.locator(".q-table").locator("text=e2e-delete-me.txt"),
			).not.toBeVisible({ timeout: 5_000 });
		});
	});

	test.describe("Rename file", () => {
		test.beforeEach(async ({ request }) => {
			await uploadFile(request, "e2e-old-name.txt", "rename me");
		});

		test.afterEach(async ({ request }) => {
			await deleteObject(request, "e2e-old-name.txt");
			await deleteObject(request, "e2e-new-name.txt");
		});

		test("renames a file via context menu", async ({ page }) => {
			await page.goto(`/${BUCKET}/files`);
			await expect(page.locator("text=e2e-old-name.txt")).toBeVisible({
				timeout: 10_000,
			});

			await page.locator("text=e2e-old-name.txt").click({ button: "right" });
			await page.getByText("Rename").click();

			// Clear and type new name — input inside dialog
			const input = page.locator(".q-dialog input");
			await input.clear();
			await input.fill("e2e-new-name.txt");
			await page.getByRole("button", { name: "Rename" }).click();

			// New name should appear, old should disappear
			await expect(page.locator("text=e2e-new-name.txt")).toBeVisible({
				timeout: 5_000,
			});
			await expect(page.locator("text=e2e-old-name.txt")).not.toBeVisible();
		});
	});

	test.describe("Delete folder", () => {
		test.beforeEach(async ({ request }) => {
			await createFolder(request, "e2e-delete-folder");
		});

		test("deletes a folder via context menu", async ({ page }) => {
			await page.goto(`/${BUCKET}/files`);
			await expect(page.locator("text=e2e-delete-folder/")).toBeVisible({
				timeout: 10_000,
			});

			await page.locator("text=e2e-delete-folder/").click({ button: "right" });
			await page.locator(".q-menu").getByText("Delete").click();
			await page.locator(".q-dialog").getByRole("button", { name: "Delete" }).click();

			// Wait for dialog to close
			await expect(page.locator(".q-dialog")).not.toBeVisible({ timeout: 5_000 });

			// Folder should disappear from the table
			await expect(
				page.locator(".q-table").locator("text=e2e-delete-folder/"),
			).not.toBeVisible({ timeout: 5_000 });
		});
	});
});
