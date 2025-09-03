import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import axios from 'axios'
import { api } from '@/lib/api'
import type { Router } from 'vue-router'

const SESSION_KEY = "explorer_session_token"

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  
  const isAuthenticated = computed(() => !!user.value)
  
  async function login(router: Router, form: { username: string, password: string, remind: boolean }) {
    const token = btoa(`${form.username}:${form.password}`)
    
    try {
      // Test authentication by setting the global axios header and making the request
      api.defaults.headers.common["Authorization"] = `Basic ${token}`
      
      const response = await api.get('/server/config')
      
      // If successful, set the default header and store user info
      api.defaults.headers.common["Authorization"] = `Basic ${token}`
      user.value = { username: form.username, ...response.data.auth }
      
      // Store token based on user preference
      if (form.remind) {
        localStorage.setItem(SESSION_KEY, token)
      } else {
        sessionStorage.setItem(SESSION_KEY, token)
      }
      
      return true
    } catch (e: any) {
      throw new Error(e.response?.data?.error || "Invalid username or password")
    }
  }
  
  async function checkLoginInStorage(router: Router): Promise<boolean> {
    let token = sessionStorage.getItem(SESSION_KEY)
    if (!token) {
      token = localStorage.getItem(SESSION_KEY)
    }
    
    if (!token) return false
    
    api.defaults.headers.common["Authorization"] = `Basic ${token}`
    
    try {
      const response = await api.get('/server/config')
      user.value = { username: response.data.auth?.username }
      return true
    } catch (error) {
      delete api.defaults.headers.common["Authorization"]
      return false
    }
  }
  
  async function logout(router: Router) {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    delete api.defaults.headers.common["Authorization"]
    user.value = null
    
    await router.push({ name: 'login' })
  }
  
  return {
    user: readonly(user),
    isAuthenticated,
    login,
    checkLoginInStorage,
    logout
  }
})