import store from '@/store'

export default {
  listBuckets: () => {
    return store.state.s3
  }
}
