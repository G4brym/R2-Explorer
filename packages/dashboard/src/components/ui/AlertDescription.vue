<template>
  <div :class="cn('text-sm [&_p]:leading-relaxed', $attrs.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from "@/lib/utils";
</script>