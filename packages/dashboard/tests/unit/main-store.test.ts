import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMainStore } from "stores/main-store";
import { api } from "boot/axios";
import { mockServerConfig } from "../helpers";

describe("main-store", () => {
	let store: ReturnType<typeof useMainStore>;

	beforeEach(() => {
		setActivePinia(createPinia());
		store = useMainStore();
		vi.clearAllMocks();
	});

	it("has correct initial state", () => {
		expect(store.apiReadonly).toBe(true);
		expect(store.buckets).toEqual([]);
		expect(store.config).toEqual({});
		expect(store.version).toBe("");
		expect(store.showHiddenFiles).toBe(false);
		expect(store.auth).toEqual({});
	});

	describe("loadServerConfigs", () => {
		it("populates store from API response", async () => {
			const serverConfig = mockServerConfig();
			vi.mocked(api.get).mockResolvedValue({ data: serverConfig });

			const mockRouter = {
				push: vi.fn(),
				replace: vi.fn(),
				currentRoute: { value: { fullPath: "/" } },
			};

			// Simulate being at root so it auto-navigates
			// We need to mock window.location
			Object.defineProperty(window, "location", {
				value: { href: "http://localhost/", origin: "http://localhost" },
				writable: true,
			});

			const result = await store.loadServerConfigs(
				mockRouter as any,
				{} as any,
			);

			expect(result).toBe(true);
			expect(store.apiReadonly).toBe(false);
			expect(store.config).toEqual(serverConfig.config);
			expect(store.auth).toEqual(serverConfig.auth);
			expect(store.version).toBe("1.0.0");
			expect(store.buckets).toEqual(serverConfig.buckets);
			expect(store.showHiddenFiles).toBe(false);

			// Should auto-navigate to first bucket
			expect(mockRouter.push).toHaveBeenCalledWith({
				name: "files-home",
				params: { bucket: "my-bucket" },
			});
		});

		it("populates readonly state correctly", async () => {
			const serverConfig = mockServerConfig({
				config: { readonly: true },
			});
			vi.mocked(api.get).mockResolvedValue({ data: serverConfig });

			const mockRouter = {
				push: vi.fn(),
				replace: vi.fn(),
				currentRoute: { value: { fullPath: "/" } },
			};

			Object.defineProperty(window, "location", {
				value: { href: "http://localhost/", origin: "http://localhost" },
				writable: true,
			});

			await store.loadServerConfigs(mockRouter as any, {} as any);

			expect(store.apiReadonly).toBe(true);
		});

		it("redirects to login on auth error with handleError=true", async () => {
			vi.mocked(api.get).mockRejectedValue({
				response: {
					status: 401,
					data: "Authentication error: Basic Auth required",
				},
			});

			const mockRouter = {
				push: vi.fn(),
				replace: vi.fn(),
				currentRoute: { value: { fullPath: "/my-bucket/files" } },
			};

			const result = await store.loadServerConfigs(
				mockRouter as any,
				{ notify: vi.fn() },
				true,
			);

			expect(mockRouter.push).toHaveBeenCalledWith({
				name: "login",
				query: { next: "/my-bucket/files" },
			});
		});

		it("throws on error when handleError=false", async () => {
			const error = {
				response: { status: 500, data: "Server error" },
			};
			vi.mocked(api.get).mockRejectedValue(error);

			const mockRouter = {
				push: vi.fn(),
				replace: vi.fn(),
				currentRoute: { value: { fullPath: "/" } },
			};

			await expect(
				store.loadServerConfigs(mockRouter as any, {} as any, false),
			).rejects.toEqual(error);
		});

		it("follows ?next query param when present", async () => {
			const serverConfig = mockServerConfig();
			vi.mocked(api.get).mockResolvedValue({ data: serverConfig });

			const mockRouter = {
				push: vi.fn(),
				replace: vi.fn(),
				currentRoute: { value: { fullPath: "/" } },
			};

			Object.defineProperty(window, "location", {
				value: {
					href: "http://localhost/?next=/other-bucket/files",
					origin: "http://localhost",
				},
				writable: true,
			});

			await store.loadServerConfigs(mockRouter as any, {} as any);

			expect(mockRouter.replace).toHaveBeenCalledWith("/other-bucket/files");
		});
	});
});
