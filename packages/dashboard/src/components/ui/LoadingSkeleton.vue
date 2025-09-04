<template>
  <div 
    class="animate-pulse bg-muted rounded"
    :class="skeletonClass"
    :style="customStyle"
  />
</template>

<script setup lang="ts">
interface Props {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  lines?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'rectangular',
  lines: 1
})

const skeletonClass = computed(() => {
  const classes = []
  
  switch (props.variant) {
    case 'circular':
      classes.push('rounded-full')
      break
    case 'text':
      classes.push('h-4')
      break
    case 'rounded':
      classes.push('rounded-lg')
      break
    case 'rectangular':
    default:
      break
  }
  
  return classes
})

const customStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  return style
})
</script>

<script lang="ts">
import { computed } from 'vue'
</script>