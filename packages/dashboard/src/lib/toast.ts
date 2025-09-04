import { ref, readonly } from 'vue'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
}

const toasts = ref<Toast[]>([])

let toastIdCounter = 0

export function useToast() {
  function addToast(toast: Omit<Toast, 'id'>) {
    const id = `toast-${++toastIdCounter}`
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    }
    
    toasts.value.push(newToast)
    
    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
    
    return id
  }
  
  function removeToast(id: string) {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  function success(message: string, title?: string) {
    return addToast({ type: 'success', message, title })
  }
  
  function error(message: string, title?: string) {
    return addToast({ type: 'error', message, title })
  }
  
  function warning(message: string, title?: string) {
    return addToast({ type: 'warning', message, title })
  }
  
  function info(message: string, title?: string) {
    return addToast({ type: 'info', message, title })
  }
  
  function clear() {
    toasts.value = []
  }
  
  return {
    toasts: readonly(toasts),
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clear
  }
}

// Global toast instance
export const toast = useToast()