<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from "@/lib/utils";

interface Props {
	variant?: "default" | "destructive";
}

const props = withDefaults(defineProps<Props>(), {
	variant: "default",
});

const classes = cn(
	"relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
	{
		"bg-background text-foreground border-border": props.variant === "default",
		"border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive":
			props.variant === "destructive",
	},
);
</script>