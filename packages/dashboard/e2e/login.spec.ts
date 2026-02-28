import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
	test("renders the login form", async ({ page }) => {
		await page.goto("/auth/login");

		await expect(page.locator("text=Sign in")).toBeVisible();
	});

	test("has username and password inputs", async ({ page }) => {
		await page.goto("/auth/login");

		await expect(page.locator('input[type="text"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
	});
});
