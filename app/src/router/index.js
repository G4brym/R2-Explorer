import { createRouter, createWebHistory } from 'vue-router'
import BucketHomeView from '@/views/BucketHomeView'

const routes = [
  {
    path: '/',
    name: 'home',
    component: BucketHomeView
  },
  {
    path: '/:bucket',
    name: 'bucket-home',
    component: BucketHomeView
  },
  {
    path: '/:bucket/:folder',
    name: 'bucket-folder',
    component: BucketHomeView
  },
  {
    path: '/:bucket/:folder/:file',
    name: 'bucket-file',
    component: BucketHomeView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
