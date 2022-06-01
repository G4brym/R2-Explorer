import { createStore } from 'vuex'
import S3 from 'aws-sdk/clients/s3'
import * as AWS from 'aws-sdk'

export default createStore({
  state: {
    user: {
      accountId: null,
      accessKey: null,
      secretKey: null
    },
    s3: null,
    activeBucket: 'homebox',
    currentFolder: '',
    files: [],
    folder: [],
    buckets: []
  },
  getters: {},
  mutations: {
    loadUserFromKeys (state, payload) {
      state.user = payload
      const self = this

      AWS.config.update({
        region: 'auto',
        accessKeyId: payload.accessKey,
        secretAccessKey: payload.secretKey,
        maxRetries: 2,
        endpoint: `https://${payload.accountId}.r2.cloudflarestorage.com/`,
        s3DisableBodySigning: false,
        s3ForcePathStyle: true
      })

      state.s3 = new S3({})

      state.s3.listBuckets({}, function (err, data) {
        if (err) {
          console.log('Error loading buckets', err)
        } else {
          state.buckets = data.Buckets
          state.activeBucket = data.Buckets[0].Name
          self.commit('refreshObjects')
        }
      })
    },
    refreshObjects (state) {
      state.s3.listObjects({
        Bucket: state.activeBucket,
        Prefix: state.currentFolder,
        Delimiter: '/'
      }, function (err, data) {
        if (err) {
          console.log('Error loading objects', err)
        } else {
          const files = data.Contents.filter(function (obj) {
            return !obj.Key.endsWith('/')
          })
          state.files = files.map(function (obj) {
            return {
              ...obj,
              name: obj.Key.replace(state.currentFolder, '')
            }
          })

          state.folders = data.CommonPrefixes.map(function (obj) {
            const split = obj.Prefix.split('/')

            return {
              ...obj,
              name: split[split.length - 2]
            }
          })
        }
      })
    },
    changeBucket (state, payload) {
      state.activeBucket = payload
      this.commit('refreshObjects')
    },
    goTo (state, folder) {
      state.currentFolder = folder
    }
  },
  actions: {
    navigate (context, folder) {
      if (folder === '/') {
        folder = ''
      }
      context.commit('goTo', folder)
      context.commit('refreshObjects')
    }
  },
  modules: {}
})
