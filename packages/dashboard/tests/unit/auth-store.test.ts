import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "stores/auth-store";
import { useMainStore } from "stores/main-store";
import { api } from "boot/axios";
import { mockServerConfig } from "../helpers";

describe("auth-store", () => {
	let authStore: ReturnType<typeof useAuthStore>;
	let mainStore: ReturnType<typeof useMainStore>;

	beforeEach(() => {
		setActivePinia(createPinia());
		authStore = useAuthStore();
		mainStore = useMainStore();
		vi.clearAllMocks();
		sessionStorage.clear();
		localStorage.clear();
		delete api.defaults.headers.common["Authorization"];
	});

	describe("LogIn", () => {
		it("sets auth header and stores token in sessionStorage by default", async () => {
			const serverConfig = mockServerConfig();
			vi.mocked(api.get).mockResolvedValue({ data: serverConfig });

			const mockRouter = {
				push: vi.fn(),
				replace: vi.fn(),
				currentRoute: { value: { fullPath: "/" } },
			};

			Object.defineProperty(window, "location", {
				value: { href: "http://localhost/auth/login", origin: "http://localhost" },
				writable: true,
			});

			await authStore.LogIn(mockRouter as any, {
				username: "admin",
				password: "secret",
				remind: false,
			});

			const expectedToken = btoa("admin:secret");
			expect(api.defaults.headers.common.Authorization).toBe(
				`Basic ${expectedToken}`,
			);
			expect(sessionStorage.getItem("r2_explorer_session_token")).toBe(
				expectedToken,
			);
			expect(localStorage.getItem("r2_explorer_session_token")).toBeNull();
		});

		it("stores token in localStorage when remind=true", async () => {
			const serverConfig = mockServerConfig();
			vi.mocked(api.get).mockResolvedValue({ data: serverConfig });

			const mockRouter = {
				push: vi.fn(),
				replace: vi.fn(),
				currentRoute: { value: { fullPath: "/" } },
			};

			Object.defineProperty(window, "location", {
				value: { href: "http://localhost/auth/login", origin: "http://localhost" },
				writable: true,
			});

			await authStore.LogIn(mockRouter as any, {
				username: "admin",
				password: "secret",
				remind: true,
			});

			const expectedToken = btoa("admin:secret");
			expect(localStorage.getItem("r2_explorer_session_token")).toBe(
				expectedToken,
			);
		});

		it("throws and clears header on auth failure", async () => {
			vi.mocked(api.get).mockRejectedValue({
				response: { status: 401, data: "Unauthorized" },
			});

			const mockRouter = {
				push: vi.fn(),
				replace: vi.fn(),
				currentRoute: { value: { fullPath: "/" } },
			};

			await expect(
				authStore.LogIn(mockRouter as any, {
					username: "admin",
					password: "wrong",
					remind: false,
				}),
			).rejects.toThrow("Invalid username or password");

			expect(api.defaults.headers.common["Authorization"]).toBeUndefined();
		});
	});

	describe("CheckLoginInStorage", () => {
		it("returns false when no token in storage", async () => {
			const mockRouter = {
				push: vi.fn(),
				replace: vi.fn(),
				currentRoute: { value: { fullPath: "/" } },
			};

			const result = await authStore.CheckLoginInStorage(
				mockRouter as any,
				{ notify: vi.fn() },
			);

			expect(result).toBe(false);
			expect(api.get).not.toHaveBeenCalled();
		});

		it("uses sessionStorage token when available", async () => {
			const token = btoa("admin:secret");
			sessionStorage.setItem("r2_explorer_session_token", token);

			const serverConfig = mockServerConfig();
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

			await authStore.CheckLoginInStorage(mockRouter as any, {
				notify: vi.fn(),
			});

			expect(api.defaults.headers.common["Authorization"]).toBe(
				`Basic ${token}`,
			);
			expect(api.get).toHaveBeenCalled();
		});

		it("falls back to localStorage token", async () => {
			const token = btoa("admin:secret");
			localStorage.setItem("r2_explorer_session_token", token);

			const serverConfig = mockServerConfig();
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

			await authStore.CheckLoginInStorage(mockRouter as any, {
				notify: vi.fn(),
			});

			expect(api.defaults.headers.common["Authorization"]).toBe(
				`Basic ${token}`,
			);
		});

		it("clears auth header when stored token fails validation", async () => {
			const token = btoa("admin:expired");
			sessionStorage.setItem("r2_explorer_session_token", token);

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

			const result = await authStore.CheckLoginInStorage(
				mockRouter as any,
				{ notify: vi.fn() },
			);

			expect(result).toBe(false);
			expect(api.defaults.headers.common["Authorization"]).toBeUndefined();
		});
	});

	describe("LogOut", () => {
		it("clears storage and redirects to login", async () => {
			sessionStorage.setItem("r2_explorer_session_token", "some-token");
			localStorage.setItem("r2_explorer_session_token", "some-token");

			const mockRouter = { replace: vi.fn() };

			await authStore.LogOut(mockRouter as any);

			expect(sessionStorage.getItem("r2_explorer_session_token")).toBeNull();
			expect(localStorage.getItem("r2_explorer_session_token")).toBeNull();
			expect(mockRouter.replace).toHaveBeenCalledWith({ name: "login" });
		});
	});
});
