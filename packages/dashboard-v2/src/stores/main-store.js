import { defineStore } from 'pinia';
import { api } from "boot/axios";
import router from "src/router";

export const useMainStore = defineStore('main', {
  state: () => ({
    configuration: {},
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

        console.log(response.data.config)
        this.configurations = response.data.config;

      } catch (error) {
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
            router.push({ name: 'login' })
          } else if (error.response.status === 302) {
          }

        } else {
          throw error

        }
      }

    },
  },
});
