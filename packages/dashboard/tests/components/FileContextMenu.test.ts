import { describe, it, expect, vi, beforeEach } from "vitest";
import FileContextMenu from "pages/files/FileContextMenu.vue";
import { useMainStore } from "stores/main-store";
import { mountWithContext } from "../helpers";

const fileProp = {
	row: {
		key: "photos/image.jpg",
		name: "image.jpg",
		nameHash: "aW1hZ2UuanBn",
		type: "file",
		icon: "article",
		color: "grey",
	},
};

const folderProp = {
	row: {
		key: "photos/",
		name: "photos/",
		type: "folder",
		icon: "folder",
		color: "orange",
	},
};

describe("FileContextMenu", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows file-specific items for a file", async () => {
		const wrapper = await mountWithContext(FileContextMenu, {
			props: { prop: fileProp },
			initialRoute: "/my-bucket/files",
		});

		const text = wrapper.text();
		expect(text).toContain("Open");
		expect(text).toContain("Download");
		expect(text).toContain("Rename");
		expect(text).toContain("Update Metadata");
		expect(text).toContain("Delete");
		expect(text).toContain("Create Share Link");
	});

	it("hides file-only items for a folder", async () => {
		const wrapper = await mountWithContext(FileContextMenu, {
			props: { prop: folderProp },
			initialRoute: "/my-bucket/files",
		});

		const text = wrapper.text();
		expect(text).toContain("Open");
		expect(text).toContain("Delete");
		expect(text).not.toContain("Download");
		expect(text).not.toContain("Rename");
		expect(text).not.toContain("Update Metadata");
		expect(text).not.toContain("Create Share Link");
	});

	it("shows Copy Public URL when bucket has publicUrl", async () => {
		const wrapper = await mountWithContext(FileContextMenu, {
			props: { prop: fileProp },
			initialRoute: "/my-bucket/files",
		});

		const store = useMainStore();
		store.buckets = [
			{ name: "my-bucket", publicUrl: "https://cdn.example.com" },
		] as any;
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain("Copy Public URL");
	});

	it("hides Copy Public URL when no publicUrl", async () => {
		const wrapper = await mountWithContext(FileContextMenu, {
			props: { prop: fileProp },
			initialRoute: "/my-bucket/files",
		});

		const store = useMainStore();
		store.buckets = [{ name: "my-bucket" }] as any;
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).not.toContain("Copy Public URL");
	});

	it("emits openObject when Open is clicked", async () => {
		const wrapper = await mountWithContext(FileContextMenu, {
			props: { prop: fileProp },
			initialRoute: "/my-bucket/files",
		});

		// Find the QItem stub containing "Open" and click it
		const items = wrapper.findAllComponents({ name: "QItem" });
		const openItem = items.find((i) => i.text().includes("Open"));
		await openItem!.trigger("click");

		expect(wrapper.emitted("openObject")).toBeTruthy();
	});

	it("emits deleteObject when Delete is clicked", async () => {
		const wrapper = await mountWithContext(FileContextMenu, {
			props: { prop: fileProp },
			initialRoute: "/my-bucket/files",
		});

		const items = wrapper.findAllComponents({ name: "QItem" });
		const deleteItem = items.find((i) => i.text().includes("Delete"));
		await deleteItem!.trigger("click");

		expect(wrapper.emitted("deleteObject")).toBeTruthy();
	});

	it("computes selectedBucket from route", async () => {
		const wrapper = await mountWithContext(FileContextMenu, {
			props: { prop: fileProp },
			initialRoute: "/my-bucket/files",
		});

		expect(wrapper.vm.selectedBucket).toBe("my-bucket");
	});
});
