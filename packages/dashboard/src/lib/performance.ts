// Performance optimization utilities

// Request deduplication to prevent multiple identical API calls
const requestCache = new Map<string, Promise<any>>()

export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl: number = 5000
): Promise<T> {
  // Check if request is already in progress
  if (requestCache.has(key)) {
    return requestCache.get(key)!
  }
  
  // Execute request and cache promise
  const promise = requestFn()
    .finally(() => {
      // Remove from cache after TTL
      setTimeout(() => {
        requestCache.delete(key)
      }, ttl)
    })
  
  requestCache.set(key, promise)
  return promise
}

// Image lazy loading utility
export function createLazyImageObserver(
  callback: (entries: IntersectionObserverEntry[]) => void
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px',
    threshold: 0.1
  })
}

// Virtual scrolling utility for large lists
export class VirtualScrollManager {
  private itemHeight: number
  private containerHeight: number
  private totalItems: number
  private scrollTop: number = 0
  private overscan: number = 5

  constructor(
    itemHeight: number,
    containerHeight: number,
    totalItems: number,
    overscan: number = 5
  ) {
    this.itemHeight = itemHeight
    this.containerHeight = containerHeight
    this.totalItems = totalItems
    this.overscan = overscan
  }

  updateScroll(scrollTop: number): void {
    this.scrollTop = scrollTop
  }

  getVisibleRange(): { start: number; end: number; offset: number } {
    const start = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.overscan)
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight)
    const end = Math.min(this.totalItems, start + visibleCount + this.overscan * 2)
    const offset = start * this.itemHeight

    return { start, end, offset }
  }

  getTotalHeight(): number {
    return this.totalItems * this.itemHeight
  }

  updateItemCount(count: number): void {
    this.totalItems = count
  }
}

// Memory cleanup utilities
export function createMemoryManager() {
  const cleanup = new Set<() => void>()
  
  function addCleanup(fn: () => void): void {
    cleanup.add(fn)
  }
  
  function runCleanup(): void {
    cleanup.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.warn('Cleanup function failed:', error)
      }
    })
    cleanup.clear()
  }
  
  return { addCleanup, runCleanup }
}

// Throttled resize observer
export function createThrottledResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  delay: number = 100
): ResizeObserver {
  let timeoutId: number | null = null
  
  return new ResizeObserver((entries) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = window.setTimeout(() => {
      callback(entries)
      timeoutId = null
    }, delay)
  })
}

// Bundle chunk preloading for better perceived performance
export function preloadRoute(routeName: string): Promise<any> {
  const routeMap: Record<string, () => Promise<any>> = {
    'FilesPage': () => import('@/pages/files/FilesPage.vue'),
    'LoginPage': () => import('@/pages/auth/LoginPage.vue'),
    'NotFoundPage': () => import('@/pages/NotFoundPage.vue')
  }
  
  const loader = routeMap[routeName]
  if (loader) {
    return loader()
  }
  
  return Promise.resolve()
}

// Efficient event delegation for file lists
export function createEventDelegator(
  container: HTMLElement,
  handlers: Record<string, (event: Event, target: HTMLElement) => void>
): () => void {
  function handleEvent(event: Event): void {
    const target = event.target as HTMLElement
    
    for (const [selector, handler] of Object.entries(handlers)) {
      if (target.matches(selector) || target.closest(selector)) {
        handler(event, target)
        break
      }
    }
  }
  
  Object.keys(handlers).forEach(eventType => {
    if (eventType.includes(':')) {
      const [type] = eventType.split(':')
      container.addEventListener(type, handleEvent, { passive: true })
    }
  })
  
  return () => {
    Object.keys(handlers).forEach(eventType => {
      if (eventType.includes(':')) {
        const [type] = eventType.split(':')
        container.removeEventListener(type, handleEvent)
      }
    })
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  
  startTiming(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }
  
  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    
    const values = this.metrics.get(label)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }
  
  getMetrics(label: string): { avg: number; min: number; max: number } | null {
    const values = this.metrics.get(label)
    if (!values || values.length === 0) {
      return null
    }
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    return { avg, min, max }
  }
  
  logReport(): void {
    console.group('Performance Report')
    for (const [label, _values] of this.metrics) {
      const metrics = this.getMetrics(label)
      if (metrics) {
        console.log(`${label}: avg=${metrics.avg.toFixed(2)}ms, min=${metrics.min.toFixed(2)}ms, max=${metrics.max.toFixed(2)}ms`)
      }
    }
    console.groupEnd()
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Optimize large file lists rendering
export function optimizeFileListRendering(
  files: any[],
  containerRef: { value: HTMLElement | null },
  itemHeight: number = 60
): {
  visibleItems: any[]
  totalHeight: number
  offsetY: number
} {
  if (!containerRef.value || files.length < 50) {
    // Don't virtualize small lists
    return {
      visibleItems: files,
      totalHeight: files.length * itemHeight,
      offsetY: 0
    }
  }
  
  const containerHeight = containerRef.value.clientHeight
  const scrollTop = containerRef.value.scrollTop
  
  const virtualScroll = new VirtualScrollManager(
    itemHeight,
    containerHeight,
    files.length
  )
  
  virtualScroll.updateScroll(scrollTop)
  const { start, end, offset } = virtualScroll.getVisibleRange()
  
  return {
    visibleItems: files.slice(start, end),
    totalHeight: virtualScroll.getTotalHeight(),
    offsetY: offset
  }
}