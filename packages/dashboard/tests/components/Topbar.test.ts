import { describe, it, expect, vi, beforeEach } from "vitest";
import Topbar from "components/main/Topbar.vue";
import { useMainStore } from "stores/main-store";
import { mountWithContext } from "../helpers";

describe("Topbar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the app title", async () => {
		const wrapper = await mountWithContext(Topbar, {
			initialRoute: "/my-bucket/files",
		});

		expect(wrapper.text()).toContain("R2-Explorer");
	});

	it("hides BucketPicker when only 1 bucket", async () => {
		const wrapper = await mountWithContext(Topbar, {
			initialRoute: "/my-bucket/files",
		});
		const store = useMainStore();
		store.buckets = [{ name: "only-one" }] as any;
		await wrapper.vm.$nextTick();

		expect(wrapper.findComponent({ name: "BucketPicker" }).exists()).toBe(
			false,
		);
	});

	it("shows BucketPicker when more than 1 bucket", async () => {
		const wrapper = await mountWithContext(Topbar, {
			initialRoute: "/my-bucket/files",
		});
		const store = useMainStore();
		store.buckets = [{ name: "bucket-a" }, { name: "bucket-b" }] as any;
		await wrapper.vm.$nextTick();

		expect(wrapper.findComponent({ name: "BucketPicker" }).exists()).toBe(true);
	});

	it("emits toggle event when menu button clicked", async () => {
		const wrapper = await mountWithContext(Topbar, {
			initialRoute: "/my-bucket/files",
		});

		// First QBtn in the template is the menu toggle button
		const btns = wrapper.findAllComponents({ name: "QBtn" });
		await btns[0].trigger("click");

		expect(wrapper.emitted("toggle")).toBeTruthy();
	});
});
