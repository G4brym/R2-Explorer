<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from "@/lib/utils";

interface Props {
	variant?: "default" | "secondary" | "destructive" | "outline";
}

const props = withDefaults(defineProps<Props>(), {
	variant: "default",
});

const classes = cn(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		"border-transparent bg-primary text-primary-foreground hover:bg-primary/80":
			props.variant === "default",
		"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80":
			props.variant === "secondary",
		"border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80":
			props.variant === "destructive",
		"text-foreground border-border bg-background hover:bg-accent hover:text-accent-foreground":
			props.variant === "outline",
	},
);
</script>