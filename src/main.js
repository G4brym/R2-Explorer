import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import '../scss/app.scss'
import '../scss/styles.scss'

import VueToast from 'vue-toast-notification'
// Import one of the available themes
// import 'vue-toast-notification/dist/theme-default.css';
import 'vue-toast-notification/dist/theme-sugar.css'
import 'sweetalert2/src/sweetalert2.scss'

require('bootstrap/js/dist/dropdown')
require('bootstrap/js/dist/modal')

const app = createApp(App)

app.use(store)
app.use(router)
app.use(VueToast)

app.mount('#app')

store.commit('loadUserFromKeys', {
  accountId: '0983f9c21d0167d8d677be145016932e',
  accessKey: '112326db443e709a2e6ea23bc2af7754',
  secretKey: 'e6892b8890a2e4d889eecf903bf8e476fa2f6d3f460f3286684c7d9dd39cfb47'
})
