<template>
  <teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <Toast
        v-for="toastItem in toasts"
        :key="toastItem.id"
        :type="toastItem.type"
        :title="toastItem.title"
        :message="toastItem.message"
        :duration="0"
        @dismiss="removeToast(toastItem.id)"
      />
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { toast } from "@/lib/toast";
import Toast from "./Toast.vue";

const { toasts, removeToast } = toast;
</script>