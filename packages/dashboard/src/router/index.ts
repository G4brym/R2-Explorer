import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'files', params: { bucket: 'secure-uploads' } }
      },
      {
        path: 'files/:bucket',
        name: 'files',
        component: () => import('@/pages/files/FilesPage.vue')
      },
      {
        path: 'files/:bucket/:pathMatch(.*)*',
        name: 'folder',
        component: () => import('@/pages/files/FilesPage.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if user is authenticated on app start
  if (!authStore.isAuthenticated) {
    const isLoggedIn = await authStore.checkLoginInStorage(router)
    if (!isLoggedIn && to.meta.requiresAuth) {
      return next({ name: 'login', query: { next: to.fullPath } })
    }
  }
  
  // Redirect authenticated users away from login page
  if (authStore.isAuthenticated && to.meta.requiresGuest) {
    return next({ name: 'files', params: { bucket: 'secure-uploads' } })
  }
  
  // Require authentication for protected routes
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { next: to.fullPath } })
  }
  
  next()
})

export default router