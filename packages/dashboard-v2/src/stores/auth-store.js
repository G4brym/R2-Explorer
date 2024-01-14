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
    async LogIn(form) {
      const mainStore = useMainStore();
      const token = btoa(form.username + ':' + form.password)

      api.defaults.headers.common['Authorization'] = `Basic ${token}`;
      try {
        await mainStore.loadServerConfigs();
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

      this.router.replace(this.router.currentRoute.value.query?.next || '/');
    },
    async CheckLoginInStorage() {
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
        await mainStore.loadServerConfigs();
      } catch (e) {
        // Auth token expired
        delete api.defaults.headers.common['Authorization'];
        await this.router.replace({ name: 'login', query: { next: this.router.currentRoute.fullPath } });
        return
      }

      this.user = atob(token).split(':')[0];
      this.loginMethod = 'basic'
    },
    LogOut() {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);

      this.user = '';
      this.loginMethod = '';
      this.router.replace('/auth/login');
    },
  }
});
