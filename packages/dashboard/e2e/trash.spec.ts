import { test, expect } from "@playwright/test";
import { uploadFile, deleteObject, BUCKET } from "./helpers";

test.describe("Trash", () => {
	test.describe("Delete to trash and restore", () => {
		test.beforeEach(async ({ request }) => {
			await uploadFile(request, "e2e-trash-me.txt", "trash this");
		});

		test.afterEach(async ({ request }) => {
			await deleteObject(request, "e2e-trash-me.txt");
			// Ensure no restored copy remains
			await request.post(`${process.env.BASE_URL || "http://localhost:8787"}/api/buckets/${BUCKET}/delete`, {
				data: { key: btoa("e2e-trash-me.txt"), permanent: true },
			});
		});

		test("moves a deleted file to trash and restores it", async ({ page }) => {
			await page.goto(`/${BUCKET}/files`);
			await expect(page.locator("text=e2e-trash-me.txt")).toBeVisible({
				timeout: 10_000,
			});

			await page.locator("text=e2e-trash-me.txt").click({ button: "right" });
			await page.locator(".q-menu").getByText("Delete").click();
			await page.locator(".q-dialog").getByRole("button", { name: "Delete" }).click();

			await expect(page.locator(".q-dialog")).not.toBeVisible({ timeout: 5_000 });
			await expect(
				page.locator(".q-table").locator("text=e2e-trash-me.txt"),
			).not.toBeVisible({ timeout: 5_000 });

			// Navigate to trash
			await page.getByRole("button", { name: "Trash" }).click();
			await expect(page.locator("text=e2e-trash-me.txt")).toBeVisible({
				timeout: 10_000,
			});

			// Restore the file
			const row = page.locator("tr", { hasText: "e2e-trash-me.txt" });
			await row.locator("button[aria-label='Restore']").click();

			await expect(
				page.locator(".q-table").locator("text=e2e-trash-me.txt"),
			).not.toBeVisible({ timeout: 5_000 });

			await page.goto(`/${BUCKET}/files`);
			await expect(page.locator("text=e2e-trash-me.txt")).toBeVisible({
				timeout: 10_000,
			});
		});
	});

	test.describe("Empty trash", () => {
		test.beforeEach(async ({ request }) => {
			await uploadFile(request, "e2e-trash-empty-1.txt", "one");
			await uploadFile(request, "e2e-trash-empty-2.txt", "two");
			await request.post(`${process.env.BASE_URL || "http://localhost:8787"}/api/buckets/${BUCKET}/delete`, {
				data: { key: btoa("e2e-trash-empty-1.txt") },
			});
			await request.post(`${process.env.BASE_URL || "http://localhost:8787"}/api/buckets/${BUCKET}/delete`, {
				data: { key: btoa("e2e-trash-empty-2.txt") },
			});
		});

		test("empties the trash via the header button", async ({ page }) => {
			await page.goto(`/${BUCKET}/trash`);
			await expect(page.locator("text=e2e-trash-empty-1.txt")).toBeVisible({
				timeout: 10_000,
			});
			await expect(page.locator("text=e2e-trash-empty-2.txt")).toBeVisible({
				timeout: 10_000,
			});

			await page.getByRole("button", { name: "Empty trash" }).click();
			await page.locator(".q-dialog").getByRole("button", { name: "OK" }).click();

			await expect(
				page.locator("text=e2e-trash-empty-1.txt"),
			).not.toBeVisible({ timeout: 5_000 });
			await expect(
				page.locator("text=e2e-trash-empty-2.txt"),
			).not.toBeVisible({ timeout: 5_000 });
		});
	});

	test.describe("Undo notification", () => {
		test.beforeEach(async ({ request }) => {
			await uploadFile(request, "e2e-trash-undo.txt", "undo me");
		});

		test.afterEach(async ({ request }) => {
			await request.post(`${process.env.BASE_URL || "http://localhost:8787"}/api/buckets/${BUCKET}/delete`, {
				data: { key: btoa("e2e-trash-undo.txt"), permanent: true },
			});
		});

		test("shows an undo action after deleting a file", async ({ page }) => {
			await page.goto(`/${BUCKET}/files`);
			await expect(page.locator("text=e2e-trash-undo.txt")).toBeVisible({
				timeout: 10_000,
			});

			await page.locator("text=e2e-trash-undo.txt").click({ button: "right" });
			await page.locator(".q-menu").getByText("Delete").click();
			await page.locator(".q-dialog").getByRole("button", { name: "Delete" }).click();

			await expect(page.locator("text=Moved to trash")).toBeVisible({
				timeout: 5_000,
			});
			await page.locator("text=Undo").click();

			await expect(page.locator("text=File restored!")).toBeVisible({
				timeout: 5_000,
			});
			await expect(page.locator("text=e2e-trash-undo.txt")).toBeVisible({
				timeout: 5_000,
			});
		});
	});
});
