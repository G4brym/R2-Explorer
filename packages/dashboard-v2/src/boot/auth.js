import { boot } from 'quasar/wrappers';
import { useAuthStore } from 'stores/auth-store';
import { useMainStore } from "stores/main-store";
import store from 'stores/index'

export default boot(async ({router}) => {
  // Check if theres any auth token stored, if there is, try to fetch or redirect
  const authStore = useAuthStore(store());
  const authResp = await authStore.CheckLoginInStorage(router);

  if (authResp === false) {  // No auth token stored, try to fetch without auth or redirect
    const mainStore = useMainStore(store())
    await mainStore.loadServerConfigs(router, true)
  }
});
