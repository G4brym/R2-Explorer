import { boot } from 'quasar/wrappers';
import { useAuthStore } from 'stores/auth-store';
import { useMainStore } from "stores/main-store";

export default boot(async () => {

  // Check if theres any auth token stored, if there is, try to fetch or redirect
  const store = useAuthStore();
  const authResp = await store.CheckLoginInStorage();

  if (authResp === false) {  // No auth token stored, try to fetch without auth or redirect
    const mainStore = useMainStore()
    await mainStore.loadServerConfigs()
  }
});
