import { test, expect } from "@playwright/test";
import { BUCKET } from "./helpers";

test.describe("App loads", () => {
	test("renders the app shell with header and sidebar", async ({ page }) => {
		await page.goto("/");

		// Header with app title should be visible
		await expect(
			page.locator(".q-toolbar").locator("text=R2-Explorer"),
		).toBeVisible({
			timeout: 10_000,
		});

		// Sidebar navigation buttons should be visible
		await expect(page.getByRole("button", { name: "Files" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Info" })).toBeVisible();
	});

	test("shows the file table when navigating to a bucket", async ({
		page,
	}) => {
		await page.goto(`/${BUCKET}/files`);

		// The file listing table should render
		await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });
	});
});
