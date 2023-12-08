import { defineStore } from 'pinia';
import { api } from "boot/axios";

export const useMainStore = defineStore('main', {
  state: () => ({
    // Config
    readonly: true,
    dashboardUrl: '',
    showHiddenFiles: false,

    // Frontend data
    buckets: [],
  }),
  getters: {
  },
  actions: {
    async loadUserDisks() {
      const response = await api.get('/buckets')

      this.buckets = response.data.buckets
      return response.data.buckets
    },
    async loadServerConfigs(handleError = false) {
      // This is the initial requests to server, that also checks if user needs auth

      try {
        const response = await api.get('/server/config', {
          validateStatus: function (status) {
            return status >= 200 && status < 300
          }
        })

        this.readonly = response.data.config.readonly;
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
          // console.log(error)
          if (error.response?.status === 401) {
            await this.router.push({ name: 'login' })
            return
          }

        } else {
          throw error

        }
      }

    },
  },
});
