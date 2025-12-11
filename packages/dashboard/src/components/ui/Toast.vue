<template>
  <div
    v-if="isVisible"
    class="fixed top-4 right-4 z-50 min-w-[300px] max-w-[500px] animate-in slide-in-from-top-2"
    :class="toastClasses"
  >
    <Card>
      <CardContent class="flex items-start space-x-3 p-4">
        <component :is="iconComponent" class="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div class="flex-1">
          <h4 v-if="title" class="font-semibold text-sm mb-1">{{ title }}</h4>
          <p class="text-sm" :class="{ 'text-muted-foreground': !title }">{{ message }}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6 opacity-70 hover:opacity-100"
          @click="dismiss"
        >
          <XIcon class="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import CardContent from "@/components/ui/CardContent.vue";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	CheckCircleIcon,
	InfoIcon,
	XIcon,
} from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";

export interface ToastProps {
	type?: "success" | "error" | "warning" | "info";
	title?: string;
	message: string;
	duration?: number;
	onDismiss?: () => void;
}

const props = withDefaults(defineProps<ToastProps>(), {
	type: "info",
	duration: 5000,
});

const emit = defineEmits<{
	dismiss: [];
}>();

const isVisible = ref(true);
let dismissTimeout: ReturnType<typeof setTimeout> | null = null;

const iconComponent = computed(() => {
	switch (props.type) {
		case "success":
			return CheckCircleIcon;
		case "error":
			return AlertCircleIcon;
		case "warning":
			return AlertTriangleIcon;
		default:
			return InfoIcon;
	}
});

const toastClasses = computed(() => {
	const baseClasses = "border-l-4";

	switch (props.type) {
		case "success":
			return `${baseClasses} border-l-green-500 bg-green-50 dark:bg-green-950`;
		case "error":
			return `${baseClasses} border-l-red-500 bg-red-50 dark:bg-red-950`;
		case "warning":
			return `${baseClasses} border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950`;
		default:
			return `${baseClasses} border-l-blue-500 bg-blue-50 dark:bg-blue-950`;
	}
});

function dismiss() {
	isVisible.value = false;
	emit("dismiss");
	props.onDismiss?.();
}

onMounted(() => {
	if (props.duration > 0) {
		dismissTimeout = setTimeout(() => {
			dismiss();
		}, props.duration);
	}
});

onUnmounted(() => {
	if (dismissTimeout) {
		clearTimeout(dismissTimeout);
		dismissTimeout = null;
	}
});
</script>