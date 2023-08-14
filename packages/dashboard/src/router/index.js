import { createRouter, createWebHistory } from 'vue-router'
import StorageHomeView from '@/views/StorageHomeView'
import EmailHomeView from "@/views/EmailHomeView.vue";
import EmailDetailsView from "@/views/EmailDetailsView.vue";

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
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
