import { api } from "boot/axios";
import { defineStore } from "pinia";
import { useMainStore } from "stores/main-store";

const SESSION_KEY = "r2_explorer_session_token";

export const useAuthStore = defineStore("auth", {
	state: () => ({}),
	getters: {
		isAuthenticated: (state) => !!state.user,
		StateUser: (state) => state.user,
	},
	actions: {
		async LogIn(router, form) {
			const mainStore = useMainStore();
			const token = btoa(`${form.username}:${form.password}`);

			api.defaults.headers.common["Authorization"] = `Basic ${token}`;
			try {
				await mainStore.loadServerConfigs(router, this.q);
			} catch (e) {
				console.log(e);
				delete api.defaults.headers.common["Authorization"];
				throw new Error("Invalid username or password");
			}

			api.defaults.headers.common.Authorization = `Basic ${token}`;

			if (form.remind === true) {
				localStorage.setItem(SESSION_KEY, token);
			} else {
				sessionStorage.setItem(SESSION_KEY, token);
			}
		},
		async CheckLoginInStorage(router, q) {
			let token = sessionStorage.getItem(SESSION_KEY);
			let authed = false;
			if (!token) {
				token = localStorage.getItem(SESSION_KEY);
			}

			if (!token) {
				return false;
			}

			const mainStore = useMainStore();
			api.defaults.headers.common["Authorization"] = `Basic ${token}`;

			try {
				authed = await mainStore.loadServerConfigs(router, q, true);
				if (!authed) {
					delete api.defaults.headers.common["Authorization"];
					return false;
				}
				return true; // Return true when authentication succeeds
			} catch (error) {
				console.log("Auth check failed:", error);
				delete api.defaults.headers.common["Authorization"];
				return false;
			}
		},
		async LogOut(router) {
			localStorage.removeItem(SESSION_KEY);
			sessionStorage.removeItem(SESSION_KEY);

			await router.replace({ name: "login" });
		},
	},
});
