import { describe, it, expect, vi, beforeEach } from "vitest";
import MainLayout from "layouts/MainLayout.vue";
import { mountWithContext } from "../helpers";

describe("MainLayout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// LeftSidebar fetches GitHub releases on mount
		vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
		} as Response);
	});

	it("renders the layout with key child components", async () => {
		const wrapper = await mountWithContext(MainLayout, {
			initialRoute: "/my-bucket/files",
			global: {
				stubs: {
					// Stub router-view to prevent child page components from rendering
					RouterView: { name: "RouterView", template: "<div />" },
				},
			},
		});

		expect(wrapper.findComponent({ name: "QLayout" }).exists()).toBe(true);
		expect(wrapper.findComponent({ name: "QHeader" }).exists()).toBe(true);
		expect(wrapper.findComponent({ name: "QDrawer" }).exists()).toBe(true);
		expect(wrapper.findComponent({ name: "QPageContainer" }).exists()).toBe(
			true,
		);
	});

	it("contains TopBar component", async () => {
		const wrapper = await mountWithContext(MainLayout, {
			initialRoute: "/my-bucket/files",
			global: {
				stubs: {
					RouterView: { name: "RouterView", template: "<div />" },
				},
			},
		});

		expect(wrapper.findComponent({ name: "TopBar" }).exists()).toBe(true);
	});

	it("contains LeftSidebar component", async () => {
		const wrapper = await mountWithContext(MainLayout, {
			initialRoute: "/my-bucket/files",
			global: {
				stubs: {
					RouterView: { name: "RouterView", template: "<div />" },
				},
			},
		});

		expect(wrapper.findComponent({ name: "LeftSidebar" }).exists()).toBe(true);
	});

	it("toggles left drawer", async () => {
		const wrapper = await mountWithContext(MainLayout, {
			initialRoute: "/my-bucket/files",
			global: {
				stubs: {
					RouterView: { name: "RouterView", template: "<div />" },
				},
			},
		});

		expect(wrapper.vm.leftDrawerOpen).toBe(false);
		wrapper.vm.toggleLeftDrawer();
		expect(wrapper.vm.leftDrawerOpen).toBe(true);

		wrapper.vm.toggleLeftDrawer();
		expect(wrapper.vm.leftDrawerOpen).toBe(false);
	});
});
