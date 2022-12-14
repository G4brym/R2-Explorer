import { createStore } from 'vuex'
import axios from 'axios'
import repo from '@/repo'

export default createStore({
  state: {
    user: null,
    activeBucket: null,
    currentFolder: '',
    files: [],
    folders: [],
    buckets: []
  },
  getters: {},
  mutations: {
    loadObjects (state, payload) {
      state.files = payload.files
      state.folders = payload.folders
    },
    changeBucket (state, payload) {
      state.activeBucket = payload
      state.currentFolder = ''
      this.dispatch('refreshObjects')
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
    }
  },
  actions: {
    navigate (context, folder) {
      if (folder === '/') {
        folder = ''
      }
      context.commit('goTo', folder)
      context.dispatch('refreshObjects')
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
