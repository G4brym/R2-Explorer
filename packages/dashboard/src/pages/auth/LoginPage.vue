<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <Card class="w-full max-w-md mx-4">
      <CardHeader class="text-center">
        <div class="flex justify-center mb-4">
          <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <FolderIcon class="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
        <h1 class="text-2xl font-bold">Welcome to Explorer</h1>
        <p class="text-muted-foreground">SpendRule Document Management System</p>
      </CardHeader>
      
      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <label for="username" class="text-sm font-medium">Username</label>
            <Input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="Enter your username"
              required
              :disabled="loading"
              class="w-full"
            />
          </div>
          
          <div class="space-y-2">
            <label for="password" class="text-sm font-medium">Password</label>
            <Input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Enter your password"
              required
              :disabled="loading"
              class="w-full"
            />
          </div>
          
          <div class="flex items-center space-x-2">
            <input
              id="remember"
              v-model="form.remind"
              type="checkbox"
              class="rounded border-input"
              :disabled="loading"
            />
            <label for="remember" class="text-sm">Remember me</label>
          </div>
          
          <Button
            type="submit"
            class="w-full"
            :disabled="loading"
          >
            <LoaderIcon v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </Button>
          
          <div v-if="error" class="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {{ error }}
          </div>
        </form>
        
        <div class="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>Health groups upload contracts, invoices, and workflow documents</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { FolderIcon, LoaderIcon } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: '',
  remind: false
})

const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (loading.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login(router, form.value)
    
    // Redirect to next page or default
    const next = route.query.next as string
    if (next) {
      await router.push(next)
    } else {
      await router.push({ name: 'files', params: { bucket: 'secure-uploads' } })
    }
  } catch (e: any) {
    error.value = e.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>