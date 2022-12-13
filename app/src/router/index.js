import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
// import BucketHomeView from '@/views/BucketHomeView'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  }
  // {
  //   path: '/:bucket',
  //   name: 'bucket-home',
  //   component: BucketHomeView
  // }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
