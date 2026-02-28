import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	createRouter,
	createMemoryHistory,
	type RouteRecordRaw,
} from "vue-router";
import routes from "src/router/routes";

// Stub all heavy components that would trigger side effects
vi.mock("layouts/MainLayout.vue", () => ({
	default: { name: "MainLayout", template: "<router-view />" },
}));
vi.mock("pages/HomePage.vue", () => ({
	default: { name: "HomePage", template: "<div />" },
}));
vi.mock("pages/files/FilesFolderPage.vue", () => ({
	default: { name: "FilesFolderPage", template: "<div />" },
}));
vi.mock("pages/email/EmailFolderPage.vue", () => ({
	default: { name: "EmailFolderPage", template: "<div />" },
}));

function createTestRouter() {
	return createRouter({
		history: createMemoryHistory(),
		routes: routes as RouteRecordRaw[],
	});
}

describe("routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("resolves / to home", async () => {
		const router = createTestRouter();
		await router.push("/");
		await router.isReady();

		expect(router.currentRoute.value.name).toBe("home");
	});

	it("resolves /:bucket/files to files-home", async () => {
		const router = createTestRouter();
		await router.push("/my-bucket/files");
		await router.isReady();

		expect(router.currentRoute.value.name).toBe("files-home");
		expect(router.currentRoute.value.params.bucket).toBe("my-bucket");
	});

	it("resolves /:bucket/files/:folder to files-folder", async () => {
		const router = createTestRouter();
		await router.push("/my-bucket/files/photos");
		await router.isReady();

		expect(router.currentRoute.value.name).toBe("files-folder");
		expect(router.currentRoute.value.params.bucket).toBe("my-bucket");
		expect(router.currentRoute.value.params.folder).toBe("photos");
	});

	it("resolves /:bucket/files/:folder/:file to files-file", async () => {
		const router = createTestRouter();
		await router.push("/my-bucket/files/photos/image.jpg");
		await router.isReady();

		expect(router.currentRoute.value.name).toBe("files-file");
		expect(router.currentRoute.value.params.file).toBe("image.jpg");
	});

	it("resolves /:bucket/email to email-home", async () => {
		const router = createTestRouter();
		await router.push("/my-bucket/email");
		await router.isReady();

		expect(router.currentRoute.value.name).toBe("email-home");
		expect(router.currentRoute.value.params.bucket).toBe("my-bucket");
	});

	it("resolves /auth/login to login", async () => {
		const router = createTestRouter();
		await router.push("/auth/login");
		await router.isReady();

		expect(router.currentRoute.value.name).toBe("login");
	});

	describe("backward-compat redirects", () => {
		it("redirects /storage/:bucket to files-home", async () => {
			const router = createTestRouter();
			await router.push("/storage/old-bucket");
			await router.isReady();

			expect(router.currentRoute.value.name).toBe("files-home");
			expect(router.currentRoute.value.params.bucket).toBe("old-bucket");
		});

		it("redirects /storage/:bucket/:folder to files-folder", async () => {
			const router = createTestRouter();
			await router.push("/storage/old-bucket/docs");
			await router.isReady();

			expect(router.currentRoute.value.name).toBe("files-folder");
			expect(router.currentRoute.value.params.bucket).toBe("old-bucket");
			expect(router.currentRoute.value.params.folder).toBe("docs");
		});

		it("redirects /storage/:bucket/:folder/:file to files-file", async () => {
			const router = createTestRouter();
			await router.push("/storage/old-bucket/docs/readme.md");
			await router.isReady();

			expect(router.currentRoute.value.name).toBe("files-file");
			expect(router.currentRoute.value.params.file).toBe("readme.md");
		});
	});
});
