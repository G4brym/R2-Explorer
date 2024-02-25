import { createRouter, createWebHashHistory } from "vue-router";
import StorageHomeView from '@/views/StorageHomeView'
import EmailHomeView from "@/views/EmailHomeView.vue";
import EmailDetailsView from "@/views/EmailDetailsView.vue";
import LoginView from "@/views/auth/LoginView.vue";

const routes = [
  {
    path: '/',
    name: 'home',
    component: StorageHomeView
  },
  {
    path: '/storage/:bucket',
    name: 'storage-home',
    component: StorageHomeView
  },
  {
    path: '/storage/:bucket/:folder',
    name: 'storage-folder',
    component: StorageHomeView
  },
  {
    path: '/storage/:bucket/:folder/:file',
    name: 'storage-file',
    component: StorageHomeView
  },
  {
    path: '/email/:bucket',
    name: 'email-home',
    component: EmailHomeView
  },
  {
    path: '/email/:bucket/:folder',
    name: 'email-folder',
    component: EmailHomeView
  },
  {
    path: '/email/:bucket/:folder/:file',
    name: 'email-file',
    component: EmailDetailsView
  },
  {
    path: '/auth/login',
    name: 'login',
    component: LoginView
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
