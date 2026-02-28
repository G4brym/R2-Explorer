import { describe, it, expect, vi, beforeEach } from "vitest";
import LeftSidebar from "components/main/LeftSidebar.vue";
import { useMainStore } from "stores/main-store";
import { mountWithContext } from "../helpers";

describe("LeftSidebar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
		} as Response);
	});

	it("shows 'Read only' label when apiReadonly is true", async () => {
		const wrapper = await mountWithContext(LeftSidebar, {
			initialRoute: "/my-bucket/files",
		});
		const store = useMainStore();
		store.apiReadonly = true;
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain("Read only");
	});

	it("shows 'New' label when not readonly", async () => {
		const wrapper = await mountWithContext(LeftSidebar, {
			initialRoute: "/my-bucket/files",
		});
		const store = useMainStore();
		store.apiReadonly = false;
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain("New");
	});

	it("hides 'New' when readonly", async () => {
		const wrapper = await mountWithContext(LeftSidebar, {
			initialRoute: "/my-bucket/files",
		});
		const store = useMainStore();
		store.apiReadonly = true;
		await wrapper.vm.$nextTick();

		const btns = wrapper.findAllComponents({ name: "QBtn" });
		const newBtn = btns.find((b) => b.props("label") === "New");
		expect(newBtn).toBeUndefined();
	});

	it("shows Files button", async () => {
		const wrapper = await mountWithContext(LeftSidebar, {
			initialRoute: "/my-bucket/files",
		});

		expect(wrapper.text()).toContain("Files");
	});

	it("shows Email nav when emailRouting is enabled", async () => {
		const wrapper = await mountWithContext(LeftSidebar, {
			initialRoute: "/my-bucket/files",
		});
		const store = useMainStore();
		store.config = { emailRouting: true } as any;
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain("Email");
	});

	it("hides Email nav when emailRouting is false", async () => {
		const wrapper = await mountWithContext(LeftSidebar, {
			initialRoute: "/my-bucket/files",
		});
		const store = useMainStore();
		store.config = { emailRouting: false } as any;
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).not.toContain("Email");
	});

	it("shows Info button", async () => {
		const wrapper = await mountWithContext(LeftSidebar, {
			initialRoute: "/my-bucket/files",
		});

		expect(wrapper.text()).toContain("Info");
	});

	describe("isUpdateAvailable", () => {
		it("returns true when latest is newer major", async () => {
			const w = await mountWithContext(LeftSidebar, {
				initialRoute: "/my-bucket/files",
			});
			expect(w.vm.isUpdateAvailable("1.0.0", "2.0.0")).toBe(true);
		});

		it("returns true when latest is newer minor", async () => {
			const w = await mountWithContext(LeftSidebar, {
				initialRoute: "/my-bucket/files",
			});
			expect(w.vm.isUpdateAvailable("1.0.0", "1.1.0")).toBe(true);
		});

		it("returns true when latest is newer patch", async () => {
			const w = await mountWithContext(LeftSidebar, {
				initialRoute: "/my-bucket/files",
			});
			expect(w.vm.isUpdateAvailable("1.0.0", "1.0.1")).toBe(true);
		});

		it("returns false when versions are equal", async () => {
			const w = await mountWithContext(LeftSidebar, {
				initialRoute: "/my-bucket/files",
			});
			expect(w.vm.isUpdateAvailable("1.0.0", "1.0.0")).toBe(false);
		});

		it("returns false when current is newer", async () => {
			const w = await mountWithContext(LeftSidebar, {
				initialRoute: "/my-bucket/files",
			});
			expect(w.vm.isUpdateAvailable("2.0.0", "1.0.0")).toBe(false);
		});
	});
});
