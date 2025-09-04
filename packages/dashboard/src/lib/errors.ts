import { toast } from '@/lib/toast'
import { router } from '@/lib/router'

export interface ErrorContext {
  operation?: string
  component?: string
  retry?: () => Promise<void> | void
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public context?: ErrorContext
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network connection failed', context?: ErrorContext) {
    super(message, 'NETWORK_ERROR', 0, context)
    this.name = 'NetworkError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: ErrorContext) {
    super(message, 'AUTH_ERROR', 401, context)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'VALIDATION_ERROR', 400, context)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: ErrorContext) {
    super(message, 'NOT_FOUND', 404, context)
    this.name = 'NotFoundError'
  }
}

export class PermissionError extends AppError {
  constructor(message: string = 'Permission denied', context?: ErrorContext) {
    super(message, 'PERMISSION_ERROR', 403, context)
    this.name = 'PermissionError'
  }
}

// Network connectivity detection
let isOnline = navigator.onLine

window.addEventListener('online', () => {
  isOnline = true
  toast.success('Connection restored')
})

window.addEventListener('offline', () => {
  isOnline = false
  toast.warning('Connection lost. Some features may not work.')
})

export const networkStatus = {
  get isOnline() {
    return isOnline
  }
}

// Enhanced error parsing from API responses
export function parseApiError(error: any): AppError {
  // Network error (no response)
  if (!error.response) {
    if (!networkStatus.isOnline) {
      return new NetworkError('You are currently offline. Please check your internet connection.')
    }
    return new NetworkError('Unable to connect to server. Please try again.')
  }

  const { status, data } = error.response
  const message = data?.error || data?.message || error.message || 'An error occurred'

  switch (status) {
    case 400:
      return new ValidationError(message)
    case 401:
      return new AuthenticationError(message)
    case 403:
      return new PermissionError(message)
    case 404:
      return new NotFoundError(message)
    case 429:
      return new AppError('Too many requests. Please wait a moment.', 'RATE_LIMIT', status)
    case 500:
      return new AppError('Server error. Please try again later.', 'SERVER_ERROR', status)
    case 503:
      return new AppError('Service temporarily unavailable.', 'SERVICE_UNAVAILABLE', status)
    default:
      return new AppError(message, 'UNKNOWN_ERROR', status)
  }
}

// Retry wrapper with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number
    baseDelay?: number
    maxDelay?: number
    context?: ErrorContext
  } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000, context } = options
  
  let lastError: any
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry for certain error types
      const appError = parseApiError(error)
      if (appError instanceof AuthenticationError || 
          appError instanceof ValidationError || 
          appError instanceof PermissionError) {
        throw appError
      }
      
      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        throw appError
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      console.warn(`Retrying operation (attempt ${attempt + 1}/${maxAttempts}) after ${delay}ms`)
    }
  }
  
  throw parseApiError(lastError)
}

// Global error handler with user-friendly notifications
export function handleError(error: any, context?: ErrorContext): void {
  const appError = error instanceof AppError ? error : parseApiError(error)
  
  console.error('Application error:', {
    error: appError,
    context,
    stack: appError.stack
  })
  
  // Show appropriate toast notification
  switch (appError.constructor) {
    case AuthenticationError:
      toast.error(appError.message, 'Authentication Error')
      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      break
      
    case NetworkError:
      toast.error(appError.message, 'Connection Error')
      break
      
    case ValidationError:
      toast.warning(appError.message, 'Invalid Input')
      break
      
    case PermissionError:
      toast.error(appError.message, 'Access Denied')
      break
      
    case NotFoundError:
      toast.error(appError.message, 'Not Found')
      break
      
    default:
      // For unknown errors, provide a helpful message with retry option
      const title = context?.operation ? `${context.operation} Failed` : 'Error'
      
      if (context?.retry) {
        toast.error(
          `${appError.message} Click here to try again.`,
          title
        )
      } else {
        toast.error(appError.message, title)
      }
  }
}

// Wrap async operations with error handling
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ErrorContext
) {
  return async (...args: T): Promise<R | void> => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, context)
    }
  }
}

// Loading state manager with error handling
export class OperationManager {
  private operations = new Map<string, { loading: boolean; error: string | null }>()
  
  async execute<T>(
    operationId: string,
    operation: () => Promise<T>,
    options: {
      context?: ErrorContext
      retry?: boolean
      maxAttempts?: number
    } = {}
  ): Promise<T | void> {
    const { context, retry = true, maxAttempts = 3 } = options
    
    // Set loading state
    this.operations.set(operationId, { loading: true, error: null })
    
    try {
      const result = retry 
        ? await withRetry(operation, { maxAttempts, context })
        : await operation()
      
      // Clear loading state on success
      this.operations.set(operationId, { loading: false, error: null })
      return result
    } catch (error) {
      // Set error state
      const appError = error instanceof AppError ? error : parseApiError(error)
      this.operations.set(operationId, { loading: false, error: appError.message })
      
      handleError(error, context)
    }
  }
  
  getOperation(operationId: string) {
    return this.operations.get(operationId) || { loading: false, error: null }
  }
  
  isLoading(operationId: string): boolean {
    return this.getOperation(operationId).loading
  }
  
  getError(operationId: string): string | null {
    return this.getOperation(operationId).error
  }
  
  clearError(operationId: string): void {
    const op = this.operations.get(operationId)
    if (op) {
      this.operations.set(operationId, { ...op, error: null })
    }
  }
}

// Global operation manager instance
export const operationManager = new OperationManager()

// Error boundary for Vue components
export const errorBoundaryMixin = {
  errorCaptured(error: any, instance: any, info: string) {
    console.error('Component error boundary:', { error, instance, info })
    
    handleError(error, {
      component: instance?.$options?.name || 'Unknown',
      operation: `Component lifecycle (${info})`
    })
    
    // Prevent the error from propagating further
    return false
  }
}