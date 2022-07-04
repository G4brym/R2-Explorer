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
import axios from 'axios'

require('bootstrap/js/dist/dropdown')
require('bootstrap/js/dist/modal')

// axios.defaults.baseURL = 'http://localhost:8787'
axios.defaults.baseURL = 'https://be-drive.massadas.com'
// axios.defaults.withCredentials = true

const app = createApp(App)

app.use(store)
app.use(router)
app.use(VueToast)

app.mount('#app')
