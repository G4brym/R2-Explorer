<template>
  <div 
    v-if="show"
    class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    @click="!persistent && $emit('dismiss')"
  >
    <Card class="w-full max-w-sm mx-4">
      <CardContent class="p-6">
        <div class="flex flex-col items-center space-y-4">
          <LoadingSpinner size="xl" />
          <div class="text-center space-y-2">
            <h3 class="font-semibold">{{ title }}</h3>
            <p v-if="message" class="text-sm text-muted-foreground">{{ message }}</p>
            <div v-if="progress !== undefined" class="w-full">
              <div class="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{{ progress }}%</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div 
                  class="bg-primary h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${progress}%` }"
                />
              </div>
            </div>
          </div>
          <Button 
            v-if="!persistent && allowCancel"
            variant="outline"
            size="sm"
            @click="$emit('cancel')"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import LoadingSpinner from './LoadingSpinner.vue'
import Card from './Card.vue'
import CardContent from './CardContent.vue'
import Button from './Button.vue'

interface Props {
  show: boolean
  title: string
  message?: string
  progress?: number
  persistent?: boolean
  allowCancel?: boolean
}

withDefaults(defineProps<Props>(), {
  persistent: false,
  allowCancel: false
})

defineEmits<{
  dismiss: []
  cancel: []
}>()
</script>