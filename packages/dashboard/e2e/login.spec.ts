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

	test("shows error on invalid credentials", async ({ page }) => {
		await page.goto("/auth/login");

		await page.locator('input[type="text"]').fill("wrong-user");
		await page.locator('input[type="password"]').fill("wrong-pass");

		// Submit the form
		await page.locator("button", { hasText: /sign in/i }).click();

		// Should show an error message
		await expect(
			page.locator("text=Invalid username or password"),
		).toBeVisible({ timeout: 5_000 });
	});
});
