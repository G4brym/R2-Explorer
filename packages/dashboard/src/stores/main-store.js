import { api } from "boot/axios";
import { defineStore } from "pinia";
import { useAuthStore } from "stores/auth-store";

export const useMainStore = defineStore("main", {
	state: () => ({
		// Config
		apiReadonly: true,
		auth: {},
		config: {},
		version: "",
		showHiddenFiles: false,

		// Frontend data
		buckets: [],

		// Admin settings (for admin users)
		adminSettings: {
			showHiddenFiles: false,
			registerEnabled: null,
			recoveryEmailFrom: null,
			recoveryEmailEnabled: false,
		},
	}),

	getters: {
		serverUrl() {
			if (process.env.NODE_ENV === "development") {
				return process.env.VUE_APP_SERVER_URL || "http://localhost:8787";
			}
			return window.location.origin;
		},
	},

	actions: {
		async loadServerConfigs(router, q) {
			const authStore = useAuthStore();

			try {
				const response = await api.get("/server/config", {
					validateStatus: (status) => status >= 200 && status < 300,
				});

				this.apiReadonly = response.data.config.readonly;
				this.config = response.data.config;
				this.auth = response.data.auth;
				this.version = response.data.version;
				this.showHiddenFiles = response.data.config.showHiddenFiles;
				this.buckets = response.data.buckets;

				const url = new URL(window.location.href);
				if (url.searchParams.get("next")) {
					await router.replace(url.searchParams.get("next"));
				} else if (url.pathname === "/" || url.pathname.startsWith("/auth/")) {
					if (this.buckets.length > 0) {
						await router.push({
							name: "files-home",
							params: { bucket: this.buckets[0].name },
						});
					}
				}

				return true;
			} catch (error) {
				console.log(error);

				// Handle authentication errors
				if (error.response?.status === 401) {
					// Not authenticated - redirect to login
					await router.push({
						name: "login",
						query: { next: router.currentRoute.value.fullPath },
					});
					return false;
				}

				if (error.response?.status === 302) {
					// Handle cloudflare access login page
					const nextUrl = error.response.headers.Location;
					if (nextUrl) {
						window.location.replace(nextUrl);
					}
				}

				if (q) {
					q.notify({
						type: "negative",
						message: error.response?.data?.error || error.message,
						timeout: 10000,
					});
				}

				return false;
			}
		},

		/**
		 * Load admin settings (admin only)
		 */
		async loadAdminSettings() {
			const authStore = useAuthStore();

			if (!authStore.isAdmin || authStore.authMode !== "session") {
				return;
			}

			try {
				const response = await api.get("/v1/settings");
				if (response.data.success) {
					this.adminSettings = {
						showHiddenFiles: response.data.settings.showHiddenFiles,
						registerEnabled: response.data.settings?.registerEnabled ?? null,
						recoveryEmailFrom:
							response.data.settings?.recoveryEmailFrom ?? null,
						recoveryEmailEnabled:
							response.data.settings?.recoveryEmailEnabled ?? false,
					};
				}
			} catch (error) {
				console.error("Failed to load admin settings:", error);
			}
		},

		/**
		 * Update admin settings (admin only)
		 */
		async updateAdminSettings(settings) {
			const authStore = useAuthStore();

			if (!authStore.isAdmin || authStore.authMode !== "session") {
				throw new Error("Admin privileges required");
			}

			try {
				const response = await api.put("/v1/settings", settings);
				if (response.data.success) {
					this.adminSettings = response.data.settings;
					// Also update showHiddenFiles in main config
					if (settings.showHiddenFiles !== undefined) {
						this.showHiddenFiles = settings.showHiddenFiles;
					}
					return true;
				}
				throw new Error(response.data.error || "Failed to update settings");
			} catch (error) {
				throw new Error(error.response?.data?.error || error.message);
			}
		},
	},
});
