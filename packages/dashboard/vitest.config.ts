import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			src: resolve(__dirname, "src"),
			boot: resolve(__dirname, "src/boot"),
			components: resolve(__dirname, "src/components"),
			layouts: resolve(__dirname, "src/layouts"),
			pages: resolve(__dirname, "src/pages"),
			stores: resolve(__dirname, "src/stores"),
		},
	},
	test: {
		environment: "happy-dom",
		setupFiles: ["tests/setup.ts"],
		css: false,
		exclude: ["e2e/**", "node_modules/**"],
	},
});
