import { api } from "@/lib/api";
import axios from "axios";
import { defineStore } from "pinia";
import { computed, readonly, ref } from "vue";
import type { Router } from "vue-router";

const SESSION_KEY = "explorer_session_token";

// Unicode-safe base64 encoding (handles non-ASCII characters)
function utf8ToBase64(str: string): string {
	return btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
			String.fromCharCode(Number.parseInt(p1, 16)),
		),
	);
}

// Safe storage access (handles private browsing mode)
function safeGetItem(key: string): string | null {
	try {
		return sessionStorage.getItem(key) || localStorage.getItem(key);
	} catch {
		return null;
	}
}

function safeSetItem(
	storage: "local" | "session",
	key: string,
	value: string,
): boolean {
	try {
		if (storage === "local") {
			localStorage.setItem(key, value);
		} else {
			sessionStorage.setItem(key, value);
		}
		return true;
	} catch {
		console.warn("Storage not available (private browsing mode?)");
		return false;
	}
}

function safeRemoveItem(key: string): void {
	try {
		localStorage.removeItem(key);
		sessionStorage.removeItem(key);
	} catch {
		// Storage not available
	}
}

export const useAuthStore = defineStore("auth", () => {
	const user = ref<any>(null);

	const isAuthenticated = computed(() => !!user.value);

	async function login(
		router: Router,
		form: { username: string; password: string; remind: boolean },
	) {
		// Use Unicode-safe base64 encoding for credentials
		const token = utf8ToBase64(`${form.username}:${form.password}`);

		try {
			// Test authentication by setting the global axios header and making the request
			api.defaults.headers.common["Authorization"] = `Basic ${token}`;

			const response = await api.get("/server/config");

			// If successful, set the default header and store user info
			api.defaults.headers.common["Authorization"] = `Basic ${token}`;
			user.value = { username: form.username, ...response.data.auth };

			// Store token based on user preference (safe for private browsing)
			if (form.remind) {
				safeSetItem("local", SESSION_KEY, token);
			} else {
				safeSetItem("session", SESSION_KEY, token);
			}

			return true;
		} catch (e: any) {
			throw new Error(
				e.response?.data?.error || "Invalid username or password",
			);
		}
	}

	async function checkLoginInStorage(router: Router): Promise<boolean> {
		// Use safe storage access (handles private browsing)
		const token = safeGetItem(SESSION_KEY);

		if (!token) return false;

		api.defaults.headers.common["Authorization"] = `Basic ${token}`;

		try {
			const response = await api.get("/server/config");
			user.value = { username: response.data.auth?.username };
			return true;
		} catch (error) {
			delete api.defaults.headers.common["Authorization"];
			return false;
		}
	}

	async function logout(router: Router) {
		// Use safe storage removal (handles private browsing)
		safeRemoveItem(SESSION_KEY);
		delete api.defaults.headers.common["Authorization"];
		user.value = null;

		await router.push({ name: "login" });
	}

	return {
		user: readonly(user),
		isAuthenticated,
		login,
		checkLoginInStorage,
		logout,
	};
});
