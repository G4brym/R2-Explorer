<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <h2 class="text-2xl font-semibold mb-2">Page not found</h2>
      <p class="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
      <Button @click="$router.push('/')">
        Go Home
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/Button.vue";
</script>