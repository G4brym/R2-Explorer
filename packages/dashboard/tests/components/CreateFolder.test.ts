import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import CreateFolder from "components/files/CreateFolder.vue";
import { mountWithContext } from "../helpers";

// Mock the apiHandler module
vi.mock("src/appUtils", async (importOriginal) => {
	const actual = (await importOriginal()) as any;
	return {
		...actual,
		apiHandler: {
			...actual.apiHandler,
			createFolder: vi.fn().mockResolvedValue({}),
		},
	};
});

import { apiHandler } from "src/appUtils";

describe("CreateFolder", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("starts with modal closed", async () => {
		const wrapper = await mountWithContext(CreateFolder, {
			initialRoute: "/my-bucket/files",
		});

		expect(wrapper.vm.modal).toBe(false);
	});

	it("opens modal via open()", async () => {
		const wrapper = await mountWithContext(CreateFolder, {
			initialRoute: "/my-bucket/files",
		});

		wrapper.vm.open();
		expect(wrapper.vm.modal).toBe(true);
	});

	it("resets state on cancel", async () => {
		const wrapper = await mountWithContext(CreateFolder, {
			initialRoute: "/my-bucket/files",
		});

		wrapper.vm.open();
		wrapper.vm.newFolderName = "test-folder";
		wrapper.vm.cancel();

		expect(wrapper.vm.modal).toBe(false);
		expect(wrapper.vm.newFolderName).toBe("");
		expect(wrapper.vm.loading).toBe(false);
	});

	it("computes selectedBucket from route", async () => {
		const wrapper = await mountWithContext(CreateFolder, {
			initialRoute: "/my-bucket/files",
		});

		expect(wrapper.vm.selectedBucket).toBe("my-bucket");
	});

	it("calls apiHandler.createFolder on submit", async () => {
		const wrapper = await mountWithContext(CreateFolder, {
			initialRoute: "/my-bucket/files",
		});

		wrapper.vm.open();
		wrapper.vm.newFolderName = "new-folder";
		await wrapper.vm.onSubmit();
		await flushPromises();

		expect(apiHandler.createFolder).toHaveBeenCalledWith(
			"new-folder/",
			"my-bucket",
		);
	});

	it("emits fetchFiles via $bus after creating folder", async () => {
		const wrapper = await mountWithContext(CreateFolder, {
			initialRoute: "/my-bucket/files",
		});

		wrapper.vm.open();
		wrapper.vm.newFolderName = "new-folder";
		await wrapper.vm.onSubmit();
		await flushPromises();

		expect(wrapper.vm.$bus.emit).toHaveBeenCalledWith("fetchFiles");
	});

	it("closes modal after successful create", async () => {
		const wrapper = await mountWithContext(CreateFolder, {
			initialRoute: "/my-bucket/files",
		});

		wrapper.vm.open();
		wrapper.vm.newFolderName = "new-folder";
		await wrapper.vm.onSubmit();
		await flushPromises();

		expect(wrapper.vm.modal).toBe(false);
		expect(wrapper.vm.newFolderName).toBe("");
	});
});
