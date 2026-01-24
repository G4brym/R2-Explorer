import { route } from "quasar/wrappers";
import { useAuthStore } from "stores/auth-store";
import {
	createMemoryHistory,
	createRouter,
	createWebHashHistory,
	createWebHistory,
} from "vue-router";
import routes from "./routes";

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route((/* { store, ssrContext } */) => {
	const createHistory = process.env.SERVER
		? createMemoryHistory
		: process.env.VUE_ROUTER_MODE === "history"
			? createWebHistory
			: createWebHashHistory;

	const Router = createRouter({
		scrollBehavior: () => ({ left: 0, top: 0 }),
		routes,

		// Leave this as is and make changes in quasar.conf.js instead!
		// quasar.conf.js -> build -> vueRouterMode
		// quasar.conf.js -> build -> publicPath
		history: createHistory(process.env.VUE_ROUTER_BASE),
	});

	// Navigation guards
	Router.beforeEach(async (to, from, next) => {
		const authStore = useAuthStore();

		// Public routes that don't require authentication
		const publicRoutes = [
			"login",
			"register",
			"forgot-password",
			"reset-password",
		];

		// Initialize auth state if not already done
		if (authStore.authMode === null) {
			await authStore.initialize();
		}

		// If auth is disabled, allow all routes
		if (authStore.isDisabled) {
			next();
			return;
		}

		// Check if route is public
		if (publicRoutes.includes(to.name)) {
			// If already authenticated and trying to access login/register, redirect to home
			if (
				authStore.isAuthenticated &&
				(to.name === "login" || to.name === "register")
			) {
				next({ name: "home" });
				return;
			}
			next();
			return;
		}

		// Check authentication for protected routes
		if (!authStore.isAuthenticated) {
			next({
				name: "login",
				query: { next: to.fullPath },
			});
			return;
		}

		// Check admin requirement
		if (to.meta.requiresAdmin && !authStore.isAdmin) {
			next({ name: "home" });
			return;
		}

		next();
	});

	return Router;
});
