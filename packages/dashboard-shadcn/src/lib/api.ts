import axios from 'axios'

// SpendRule: Point to the worker API URL - always use deployed version for now
let url = "https://spendrule-doc-upload-dashboard.oluwamakinwa.workers.dev"
// For development, we'll use the deployed API since local worker isn't running
// if (import.meta.env.DEV) {
//   url = import.meta.env.VITE_SERVER_URL || "http://localhost:8787"
// }

export const api = axios.create({ 
  baseURL: `${url}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to ensure auth headers are always sent
api.interceptors.request.use((config) => {
  // Log requests in development
  if (import.meta.env.DEV) {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
  }
  return config
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response?.data || error.message)
    }
    
    // Handle auth errors
    if (error.response?.status === 401) {
      // Clear stored tokens on auth error
      localStorage.removeItem('explorer_session_token')
      sessionStorage.removeItem('explorer_session_token')
    }
    
    return Promise.reject(error)
  }
)