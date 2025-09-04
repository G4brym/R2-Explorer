<template>
  <div class="space-y-4">
    <div 
      v-for="i in count" 
      :key="i"
      class="flex items-center p-3 rounded-lg border bg-card"
    >
      <!-- File/Folder Icon -->
      <LoadingSkeleton 
        variant="circular" 
        width="20px" 
        height="20px" 
        class="mr-3 flex-shrink-0"
      />
      
      <!-- File Info -->
      <div class="flex-1 space-y-2">
        <!-- Filename -->
        <LoadingSkeleton 
          variant="text" 
          :width="`${Math.floor(Math.random() * 40) + 120}px`"
          class="h-4"
        />
        <!-- File details -->
        <LoadingSkeleton 
          variant="text" 
          :width="`${Math.floor(Math.random() * 60) + 80}px`"
          class="h-3"
        />
      </div>
      
      <!-- Action button -->
      <LoadingSkeleton 
        variant="circular" 
        width="24px" 
        height="24px"
        class="flex-shrink-0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import LoadingSkeleton from './LoadingSkeleton.vue'

interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 5
})
</script>