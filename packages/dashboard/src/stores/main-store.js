import { defineStore } from 'pinia';
import { api } from "boot/axios";

export const useMainStore = defineStore('main', {
  state: () => ({
    // Config
    apiReadonly: true,
    username: '',
    version: '',
    dashboardUrl: '',
    showHiddenFiles: false,

    // Frontend data
    buckets: [],
  }),
  getters: {
    serverUrl() {
      if (process.env.NODE_ENV === 'development') {
        return process.env.VUE_APP_SERVER_URL || 'http://localhost:8787'
      }
      return window.location.origin
    }
  },
  actions: {
    async loadUserDisks() {
      const response = await api.get('/buckets')

      this.buckets = response.data.buckets
      return response.data.buckets
    },
    async loadServerConfigs(router, handleError = false) {
      // This is the initial requests to server, that also checks if user needs auth

      try {
        const response = await api.get('/server/config', {
          validateStatus: function (status) {
            return status >= 200 && status < 300
          }
        })

        this.apiReadonly = response.data.config.readonly;
        this.username = response.data.config.user?.username;
        this.version = response.data.config.version;
        this.dashboardUrl = response.data.config.dashboardUrl;
        this.showHiddenFiles = response.data.config.showHiddenFiles;

      } catch (error) {
        console.log(error)
        if (error.response.status === 302) {
          // Handle cloudflare access login page
          const nextUrl = error.response.headers.Location
          if (nextUrl) {
            window.location.replace(nextUrl)
          }
        }

        if (handleError) {
          if (error.response?.status === 401) {
            await router.push({ name: 'login', query: { next: router.currentRoute.value.fullPath } })
            return
          }

        } else {
          throw error

        }
      }

    },
  },
});
