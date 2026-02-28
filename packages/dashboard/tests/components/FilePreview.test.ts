import { describe, it, expect, vi, beforeEach } from "vitest";
import FilePreview from "components/preview/FilePreview.vue";
import { mountWithContext } from "../helpers";

describe("FilePreview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getType", () => {
		let wrapper: any;

		beforeEach(async () => {
			wrapper = await mountWithContext(FilePreview, {
				initialRoute: "/my-bucket/files",
			});
		});

		it("detects image types", () => {
			expect(wrapper.vm.getType("photo.png")).toEqual({
				type: "image",
				downloadType: "objectUrl",
			});
			expect(wrapper.vm.getType("photo.jpg")).toEqual({
				type: "image",
				downloadType: "objectUrl",
			});
			expect(wrapper.vm.getType("photo.jpeg")).toEqual({
				type: "image",
				downloadType: "objectUrl",
			});
			expect(wrapper.vm.getType("photo.webp")).toEqual({
				type: "image",
				downloadType: "objectUrl",
			});
			expect(wrapper.vm.getType("photo.avif")).toEqual({
				type: "image",
				downloadType: "objectUrl",
			});
		});

		it("detects audio types", () => {
			expect(wrapper.vm.getType("song.mp3")).toEqual({
				type: "audio",
				downloadType: "objectUrl",
			});
		});

		it("detects video types", () => {
			expect(wrapper.vm.getType("video.mp4")).toEqual({
				type: "video",
				downloadType: "objectUrl",
			});
			expect(wrapper.vm.getType("video.ogg")).toEqual({
				type: "video",
				downloadType: "objectUrl",
			});
		});

		it("detects PDF", () => {
			expect(wrapper.vm.getType("document.pdf")).toEqual({
				type: "pdf",
				downloadType: "objectUrl",
			});
		});

		it("detects text files", () => {
			expect(wrapper.vm.getType("readme.txt")).toEqual({
				type: "text",
				downloadType: "text",
			});
		});

		it("detects markdown", () => {
			expect(wrapper.vm.getType("README.md")).toEqual({
				type: "markdown",
				downloadType: "text",
			});
		});

		it("detects CSV", () => {
			expect(wrapper.vm.getType("data.csv")).toEqual({
				type: "csv",
				downloadType: "text",
			});
		});

		it("detects JSON", () => {
			expect(wrapper.vm.getType("config.json")).toEqual({
				type: "json",
				downloadType: "text",
			});
		});

		it("detects HTML", () => {
			expect(wrapper.vm.getType("page.html")).toEqual({
				type: "html",
				downloadType: "text",
			});
		});

		it("detects log.gz files", () => {
			expect(wrapper.vm.getType("app.log.gz")).toEqual({
				type: "logs",
				downloadType: "blob",
			});
		});

		it("detects email files", () => {
			expect(wrapper.vm.getType("message.eml")).toEqual({
				type: "email",
				downloadType: "text",
			});
		});

		it("returns unknown for unrecognized extensions", () => {
			expect(wrapper.vm.getType("archive.tar.bz2")).toEqual({
				type: "unknown",
				downloadType: "text",
			});
		});

		it("is case-insensitive", () => {
			expect(wrapper.vm.getType("Photo.PNG")).toEqual({
				type: "image",
				downloadType: "objectUrl",
			});
			expect(wrapper.vm.getType("DATA.CSV")).toEqual({
				type: "csv",
				downloadType: "text",
			});
		});
	});

	describe("validateEdit", () => {
		let wrapper: any;

		beforeEach(async () => {
			wrapper = await mountWithContext(FilePreview, {
				initialRoute: "/my-bucket/files",
			});
		});

		it("validates correct JSON", () => {
			expect(wrapper.vm.validateEdit("json", '{"key": "value"}')).toBe(true);
		});

		it("rejects invalid JSON", () => {
			expect(wrapper.vm.validateEdit("json", "not json")).toBe(false);
		});

		it("accepts any content for non-JSON types", () => {
			expect(wrapper.vm.validateEdit("text", "anything")).toBe(true);
			expect(wrapper.vm.validateEdit("html", "<div>test</div>")).toBe(true);
		});
	});

	it("starts with modal closed", async () => {
		const wrapper = await mountWithContext(FilePreview, {
			initialRoute: "/my-bucket/files",
		});

		expect(wrapper.vm.open).toBe(false);
	});

	describe("csvParser", () => {
		let wrapper: any;

		beforeEach(async () => {
			wrapper = await mountWithContext(FilePreview, {
				initialRoute: "/my-bucket/files",
			});
		});

		it("creates table with headers from first row", () => {
			const result = wrapper.vm.csvParser("name,age\nAlice,30");
			expect(result).toContain("<table");
			expect(result).toContain("<th>");
			expect(result).toContain("name");
			expect(result).toContain("age");
		});
	});
});
