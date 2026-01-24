import { api } from "boot/axios";
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
	state: () => ({
		// Current session/user info
		user: null,
		authenticated: false,

		// Server auth configuration
		authMode: null, // 'session' | 'disabled'
		registrationOpen: false,
		recoveryEmailEnabled: false,

		// Loading states
		loading: false,
		error: null,
	}),

	getters: {
		isAuthenticated: (state) => state.authenticated,
		isAdmin: (state) => state.user?.isAdmin || false,
		currentUser: (state) => state.user,
		canRegister: (state) =>
			state.authMode === "session" && state.registrationOpen,
		canResetPassword: (state) =>
			state.authMode === "session" && state.recoveryEmailEnabled,
		isSessionAuth: (state) => state.authMode === "session",
		isDisabled: (state) => state.authMode === "disabled",
	},

	actions: {
		/**
		 * Initialize auth state - fetch settings and check current session
		 */
		async initialize() {
			this.loading = true;
			this.error = null;

			try {
				// First, fetch public settings to know auth mode
				const settingsResponse = await api.get("/v1/settings");
				const settings = settingsResponse.data;

				this.authMode = settings.authMode;
				this.registrationOpen = settings.registrationOpen;
				this.recoveryEmailEnabled =
					settings.settings?.recoveryEmailEnabled || false;

				// If auth is disabled, we're automatically "authenticated"
				if (this.authMode === "disabled") {
					this.authenticated = true;
					this.user = null;
					return true;
				}

				// For cloudflare-access, check if we have a session via /me
				// For session auth, also check via /me
				const meResponse = await api.get("/v1/auth/me");
				const meData = meResponse.data;

				this.authenticated = meData.authenticated;
				this.user = meData.user;

				return this.authenticated;
			} catch (error) {
				console.error("Auth initialization error:", error);
				this.error = error.message;
				this.authenticated = false;
				this.user = null;
				return false;
			} finally {
				this.loading = false;
			}
		},

		/**
		 * Login with email and password (session auth only)
		 */
		async login(email, password, remember = true) {
			if (this.authMode !== "session") {
				throw new Error("Login is only available with session authentication");
			}

			this.loading = true;
			this.error = null;

			try {
				const response = await api.post("/v1/auth/login", {
					email,
					password,
					remember,
				});

				if (response.data.success) {
					this.authenticated = true;
					this.user = response.data.user;
					return true;
				}

				throw new Error(response.data.error || "Login failed");
			} catch (error) {
				this.error = error.response?.data?.error || error.message;
				throw new Error(this.error);
			} finally {
				this.loading = false;
			}
		},

		/**
		 * Register a new account (session auth only)
		 */
		async register(email, password) {
			if (this.authMode !== "session") {
				throw new Error(
					"Registration is only available with session authentication",
				);
			}

			if (!this.registrationOpen) {
				throw new Error("Registration is currently closed");
			}

			this.loading = true;
			this.error = null;

			try {
				const response = await api.post("/v1/auth/register", {
					email,
					password,
				});

				if (response.data.success) {
					this.authenticated = true;
					this.user = response.data.user;
					return true;
				}

				throw new Error(response.data.error || "Registration failed");
			} catch (error) {
				this.error = error.response?.data?.error || error.message;
				throw new Error(this.error);
			} finally {
				this.loading = false;
			}
		},

		/**
		 * Request password reset email
		 */
		async forgotPassword(email) {
			if (this.authMode !== "session") {
				throw new Error(
					"Password reset is only available with session authentication",
				);
			}

			this.loading = true;
			this.error = null;

			try {
				const response = await api.post("/v1/auth/forgot-password", {
					email,
				});

				return response.data.message;
			} catch (error) {
				this.error = error.response?.data?.error || error.message;
				throw new Error(this.error);
			} finally {
				this.loading = false;
			}
		},

		/**
		 * Reset password with token
		 */
		async resetPassword(token, newPassword) {
			if (this.authMode !== "session") {
				throw new Error(
					"Password reset is only available with session authentication",
				);
			}

			this.loading = true;
			this.error = null;

			try {
				const response = await api.post("/v1/auth/reset-password", {
					token,
					password: newPassword,
				});

				if (response.data.success) {
					this.authenticated = true;
					this.user = response.data.user;
					return true;
				}

				throw new Error(response.data.error || "Password reset failed");
			} catch (error) {
				this.error = error.response?.data?.error || error.message;
				throw new Error(this.error);
			} finally {
				this.loading = false;
			}
		},

		/**
		 * Logout and clear session
		 */
		async logout(router) {
			this.loading = true;

			try {
				await api.post("/v1/auth/logout");
			} catch (error) {
				// Ignore logout errors
				console.error("Logout error:", error);
			}

			this.authenticated = false;
			this.user = null;
			this.loading = false;

			if (router) {
				await router.replace({ name: "login" });
			}
		},

		/**
		 * Check if user has access to a specific bucket
		 */
		hasBucketAccess(bucketName, requiredRole = "read") {
			// Admins have full access
			if (this.user?.isAdmin) {
				return true;
			}

			// For now, basic implementation - can be enhanced with bucket-specific RBAC
			return this.authenticated;
		},
	},
});
