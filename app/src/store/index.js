import { createStore } from 'vuex'
import axios from 'axios'
import repo from '@/api'

export default createStore({
  state: {
    user: null,
    activeBucket: null,
    currentFolder: '',
    files: [],
    folders: [],
    buckets: [],
    toastMessage: null,
    toastSpin: false,
    uploadingFiles: {},
    mobileSidebar: false,
  },
  getters: {},
  mutations: {
    loadObjects (state, payload) {
      state.files = payload.files
      state.folders = payload.folders
    },
    toggleMobileSidebar (state, payload) {
      state.mobileSidebar = payload || !state.mobileSidebar
    },
    changeBucket (state, payload) {
      state.activeBucket = payload
      state.currentFolder = ''
    },
    goTo (state, folder) {
      state.currentFolder = folder
    },
    loadUserDisks (state, data) {
      state.buckets = data.Buckets
      state.user = data.user
      state.config = data.config

      // this.commit('changeBucket', data.Buckets[0].Name)
      // this.dispatch('refreshObjects')
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
    navigate (context, folder) {
      if (folder === '/') {
        folder = ''
      }
      context.commit('goTo', folder)
      context.dispatch('refreshObjects')
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
    async refreshObjects ({ commit }) {
      commit('loadObjects', await repo.listObjects())
    }
  },
  modules: {}
})
