<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div 
      class="animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary"
      :class="spinnerClass"
    />
    <span v-if="message" class="ml-3 text-muted-foreground" :class="messageClass">
      {{ message }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  center?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  center: true
})

const spinnerClass = computed(() => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  return sizeMap[props.size]
})

const messageClass = computed(() => {
  const sizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }
  return sizeMap[props.size]
})

const containerClass = computed(() => {
  return props.center ? 'justify-center' : 'justify-start'
})
</script>

<script lang="ts">
import { computed } from 'vue'
</script>