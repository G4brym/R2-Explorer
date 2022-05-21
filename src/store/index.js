import { createStore } from 'vuex'
import S3 from 'aws-sdk/clients/s3'

export default createStore({
  state: {
    user: {
      accountId: null,
      accessKey: null,
      secretKey: null
    },
    s3: null
  },
  getters: {
  },
  mutations: {
    loadUserFromKeys (state, payload) {
      state.user = payload
      state.s3 = new S3({
        region: 'auto',
        maxRetries: 3,
        endpoint: 'https://0983f9c21d0167d8d677be145016932e.r2.cloudflarestorage.com/homebox/',
        accessKeyId: payload.accessKey,
        secretAccessKey: payload.secretKey
      })
      console.log(state.s3)
      state.s3.listObjects({
        Bucket: 'homebox'
      }, function (err, data) {
        if (err) {
          console.log('Error', err)
        } else {
          console.log('Success', data)
        }
      })
    }
  },
  actions: {
  },
  modules: {
  }
})
