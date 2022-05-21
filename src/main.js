import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import '../scss/app.scss'
import '../scss/styles.scss'

const app = createApp(App)

app.use(store)
app.use(router)

app.mount('#app')

store.commit('loadUserFromKeys', {
  accountId: '',
  accessKey: '',
  secretKey: ''
})
