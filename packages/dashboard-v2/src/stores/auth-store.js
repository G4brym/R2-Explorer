import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { useMainStore } from "stores/main-store";

const SESSION_KEY = 'r2_explorer_session_token';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: '',
    loginMethod: '',
  }),
  getters: {
    isAuthenticated: state => !!state.user,
    StateUser: state => state.user
  },
  actions: {
    async LogIn(router, form) {
      const mainStore = useMainStore();
      const token = btoa(form.username + ':' + form.password)

      api.defaults.headers.common['Authorization'] = `Basic ${token}`;
      try {
        await mainStore.loadServerConfigs(router);
      } catch (e) {
        console.log(e)
        delete api.defaults.headers.common['Authorization'];
        throw new Error('Invalid username or password')
      }

      api.defaults.headers.common.Authorization = `Basic ${token}`

      this.loginMethod = 'basic'
      this.user = form.email

      if (form.remind === true) {
        localStorage.setItem(SESSION_KEY, token);
      } else {
        sessionStorage.setItem(SESSION_KEY, token);
      }

      router.replace(router.currentRoute.value.query?.next || '/');
    },
    async CheckLoginInStorage(router) {
      let token = sessionStorage.getItem(SESSION_KEY);
      if (!token) {
        token = localStorage.getItem(SESSION_KEY);
      }

      if (!token) {
        return false;
      }

      const mainStore = useMainStore();
      api.defaults.headers.common['Authorization'] = `Basic ${token}`;

      try {
        await mainStore.loadServerConfigs(router);
      } catch (e) {
        // Auth token expired
        delete api.defaults.headers.common['Authorization'];
        await router.replace({ name: 'login', query: { next: router.currentRoute.fullPath } });
        return
      }

      this.user = atob(token).split(':')[0];
      this.loginMethod = 'basic'
    },
    async LogOut(router) {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);

      this.user = '';
      this.loginMethod = '';
      await router.replace({ name: 'login'});
    },
  }
});
