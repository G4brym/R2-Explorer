import { describe, it, expect, vi, beforeEach } from "vitest";
import BucketPicker from "components/main/BucketPicker.vue";
import { useMainStore } from "stores/main-store";
import { mountWithContext } from "../helpers";

describe("BucketPicker", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("computes selectedBucket from route params", async () => {
		const wrapper = await mountWithContext(BucketPicker, {
			initialRoute: "/my-bucket/files",
		});

		expect(wrapper.vm.selectedBucket).toBe("my-bucket");
	});

	it("computes selectedApp from route name", async () => {
		const wrapper = await mountWithContext(BucketPicker, {
			initialRoute: "/my-bucket/files",
		});

		expect(wrapper.vm.selectedApp).toBe("files");
	});

	it("changeBucket navigates to the new bucket", async () => {
		const wrapper = await mountWithContext(BucketPicker, {
			initialRoute: "/my-bucket/files",
		});
		const store = useMainStore();
		store.buckets = [{ name: "bucket-a" }, { name: "bucket-b" }] as any;

		const routerPush = vi.spyOn(wrapper.vm.$router, "push");

		wrapper.vm.changeBucket("bucket-b");

		expect(routerPush).toHaveBeenCalledWith({
			name: "files-home",
			params: { bucket: "bucket-b" },
		});
	});

	it("renders the bucket select stub", async () => {
		const wrapper = await mountWithContext(BucketPicker, {
			initialRoute: "/my-bucket/files",
		});
		const store = useMainStore();
		store.buckets = [{ name: "bucket-a" }, { name: "bucket-b" }] as any;

		// QSelect stub should exist in the rendered output
		expect(wrapper.findComponent({ name: "QSelect" }).exists()).toBe(true);
	});
});
