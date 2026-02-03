import { boot } from "quasar/wrappers";
import { useAuthStore } from "stores/auth-store";
import { useMainStore } from "stores/main-store";

export default boot(async ({ app, router, store }) => {
	// Check if theres any auth token stored, if there is, try to fetch or redirect
	const authStore = useAuthStore(store);
	const authResp = await authStore.initialize();

	if (authResp === false) {
		// No auth token stored, try to fetch without auth or redirect
		const mainStore = useMainStore(store);
		await mainStore.loadServerConfigs(
			router,
			app.config.globalProperties.$q,
			true,
		);
	}
});
