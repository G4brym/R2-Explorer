import { api } from "@/lib/api";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Router } from "vue-router";

export interface Bucket {
	name: string;
}

export interface ServerConfig {
	readonly: boolean;
	cors: boolean;
	showHiddenFiles: boolean;
	emailRouting: boolean;
}

export const useMainStore = defineStore("main", () => {
	const config = ref<ServerConfig | null>(null);
	const buckets = ref<Bucket[]>([]);
	const version = ref<string>("");
	const auth = ref<any>(null);

	const apiReadonly = computed(() => config.value?.readonly ?? true);
	const showHiddenFiles = computed(
		() => config.value?.showHiddenFiles ?? false,
	);

	const serverUrl = computed(() => {
		if (import.meta.env.DEV) {
			return import.meta.env.VITE_SERVER_URL || "http://localhost:8787";
		}
		return "https://spendrule-doc-upload-dashboard.oluwamakinwa.workers.dev";
	});

	async function loadServerConfigs(
		router: Router,
		handleError = false,
	): Promise<boolean> {
		try {
			const response = await api.get("/server/config");

			config.value = response.data.config;
			auth.value = response.data.auth;
			version.value = response.data.version;
			buckets.value = response.data.buckets || [];

			// Navigate to files if needed
			const url = new URL(window.location.href);
			if (url.searchParams.get("next")) {
				await router.replace(url.searchParams.get("next")!);
			} else if (url.pathname === "/" || url.pathname === "/login") {
				if (buckets.value.length > 0) {
					await router.push({
						name: "files",
						params: { bucket: buckets.value[0].name },
					});
				}
			}

			return true;
		} catch (error: any) {
			console.error("Failed to load server config:", error);

			if (handleError) {
				const respText = error.response?.data || error.message;
				if (respText === "Authentication error: Basic Auth required") {
					await router.push({
						name: "login",
						query: { next: router.currentRoute.value.fullPath },
					});
					return false;
				}
			} else {
				throw error;
			}

			return false;
		}
	}

	return {
		config: readonly(config),
		buckets: readonly(buckets),
		version: readonly(version),
		auth: readonly(auth),
		apiReadonly,
		showHiddenFiles,
		serverUrl,
		loadServerConfigs,
	};
});
