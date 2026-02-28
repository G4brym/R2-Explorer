import { mount, type ComponentMountingOptions } from "@vue/test-utils";
import { createPinia } from "pinia";
import { vi } from "vitest";
import {
	createRouter,
	createMemoryHistory,
	type RouteRecordRaw,
} from "vue-router";
import routes from "src/router/routes";
import type { Component } from "vue";

/** Create an in-memory router using the real app routes */
export function createTestRouter(initialRoute = "/") {
	const router = createRouter({
		history: createMemoryHistory(),
		routes: routes as RouteRecordRaw[],
	});
	router.push(initialRoute);
	return router;
}

/**
 * Mount a component with Pinia, Router, and mocked $bus.
 * Returns a Promise — await it to ensure the router is resolved before assertions.
 */
export async function mountWithContext<T extends Component>(
	component: T,
	options: ComponentMountingOptions<T> & { initialRoute?: string } = {},
) {
	const { initialRoute = "/", ...mountOptions } = options;
	const { global: globalOverrides, ...restMountOptions } =
		mountOptions as any;
	const router = createTestRouter(initialRoute);
	await router.isReady();
	const pinia = createPinia();

	const wrapper = mount(component, {
		global: {
			plugins: [pinia, router, ...(globalOverrides?.plugins ?? [])],
			mocks: {
				$bus: {
					emit: vi.fn(),
					on: vi.fn(),
					off: vi.fn(),
				},
				...(globalOverrides?.mocks ?? {}),
			},
			stubs: {
				// Stub heavy sub-components that aren't under test
				PdfViewer: true,
				EmailViewer: true,
				LogGz: true,
				...(globalOverrides?.stubs ?? {}),
			},
		},
		...restMountOptions,
	} as any);

	return wrapper;
}

/** Factory for a typical server config API response */
export function mockServerConfig(overrides: Record<string, any> = {}) {
	return {
		config: {
			readonly: false,
			showHiddenFiles: false,
			emailRouting: true,
			...overrides.config,
		},
		auth: { type: "basic", username: "admin", ...overrides.auth },
		version: overrides.version ?? "1.0.0",
		buckets: overrides.buckets ?? [
			{ name: "my-bucket" },
			{ name: "other-bucket" },
		],
	};
}

/** Factory for a file list API response */
export function mockFileList(
	files: Record<string, any>[] = [],
	folders: string[] = [],
	truncated = false,
) {
	return {
		data: {
			objects: files.map((f) => ({
				key: f.key ?? f.name ?? "file.txt",
				size: f.size ?? 1024,
				uploaded: f.uploaded ?? "2024-01-15T10:30:00Z",
				httpMetadata: f.httpMetadata ?? {},
				customMetadata: f.customMetadata ?? {},
				...f,
			})),
			delimitedPrefixes: folders,
			truncated,
			cursor: truncated ? "next-cursor" : null,
		},
	};
}
