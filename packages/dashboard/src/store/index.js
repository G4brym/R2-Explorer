import { createStore } from 'vuex'
import axios from 'axios'
import repo from '@/api'
import router from "@/router";

export default createStore({
  state: {
    user: {
      username: "test@example.com"
    },
    config: {},
    activeBucket: null,
    currentFolder: '',
    files: [],
    folders: [],
    buckets: [],
    toastMessage: null,
    toastSpin: false,
    uploadingFiles: {},
    mobileSidebar: false,
    serverVersion: null,
    serverVersionInt: 0,
    activeTab: 'storage',
    serverUrl: null,
  },
  getters: {},
  mutations: {
    setServerUrl (state, serverUrl) {
      state.serverUrl = serverUrl
    },
    loadObjects (state, payload) {
      state.files = payload.files
      state.folders = payload.folders
    },
    toggleMobileSidebar (state, payload) {
      if (payload !== true && payload !== false) {
        state.mobileSidebar = !state.mobileSidebar
      } else {
        state.mobileSidebar = payload
      }
    },
    changeBucket (state, payload) {
      state.activeBucket = payload
      state.currentFolder = ''
    },
    changeTab (state, payload) {
      if (payload === state.activeTab) {
        return
      }

      state.activeTab = payload
      state.currentFolder = ''

      // state.files = []
      // state.folders = []
    },
    goTo (state, folder) {
      state.currentFolder = folder
    },
    loadUserDisks (state, data) {
      state.buckets = data.buckets

      if (state.activeBucket === null && data.buckets.length > 0) {
        router.push({name: 'storage-home', params: {bucket: data.buckets[0].name}})
      }
    },
    loadServerConfigs (state, data) {
      state.user = data.user
      state.config = data.config
      state.serverVersion = data.version
      state.serverVersionInt = parseInt(data.version.replace('v', '').replaceAll('.', ''))
    },
    changeToastMessage (state, { message, spin }) {
      state.toastMessage = message
      state.toastSpin = spin || false
    },
    addUploadingFiles (state, filenames) {
      for (const filename of filenames) {
        state.uploadingFiles[filename] = {}
      }
    },
    clearUploadingFiles (state) {
      state.uploadingFiles = {}
    },
    setUploadProgress (state, { filename, progress }) {
      if (state.uploadingFiles[filename] === undefined) { return }

      state.uploadingFiles[filename].progress = Math.ceil(progress)
    }
  },
  actions: {
    makeToast (context, { message, timeout, spin }) {
      context.commit('changeToastMessage', {
        message, spin
      })

      if (timeout !== null && timeout !== undefined) {
        setTimeout(() => {
          context.commit('changeToastMessage', {
            message: null, spin: false
          })
        }, timeout)
      }
    },
    async navigate (context, folder) {
      if (folder === '/') {
        folder = ''
      }
      context.commit('goTo', folder)
      await context.dispatch('refreshObjects')
    },
    navigateToHash (context, folder) {
      folder = decodeURIComponent(escape(atob(folder)))
      context.dispatch('navigate', folder)
    },
    addUploadingFiles (context, filenames) {
      context.commit('addUploadingFiles', filenames)
    },
    clearUploadingFiles (context, filenames) {
      context.commit('clearUploadingFiles')
    },
    setUploadProgress (context, { filename, progress }) {
      context.commit('setUploadProgress', { filename, progress })
    },
    loadUserDisks ({ commit }) {
      axios.get('/api/buckets').then((response) => {
        commit('loadUserDisks', response.data)
      })
    },
    loadServerConfigs ({ commit }) {
      axios.get('/api/server/config').then((response) => {
        commit('loadServerConfigs', response.data)
      })
    },
    async refreshObjects ({ commit }) {
      await commit('loadObjects', await repo.listObjects())
    }
  },
  modules: {}
})
