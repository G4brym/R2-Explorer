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
        maxRetries: 1,
        endpoint: `https://${payload.accountId}.r2.cloudflarestorage.com/`,
        accessKeyId: payload.accessKey,
        secretAccessKey: payload.secretKey,
        s3DisableBodySigning: false,
        s3ForcePathStyle: true
      })
    }
  },
  actions: {
  },
  modules: {
  }
})
