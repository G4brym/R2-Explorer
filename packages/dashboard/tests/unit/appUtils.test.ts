import { describe, it, expect, vi } from "vitest";
import { encode, decode, bytesToSize, sleep, retryWithBackoff } from "src/appUtils";

describe("encode / decode", () => {
	it("round-trips a simple key", () => {
		const key = "photos/vacation.jpg";
		expect(decode(encode(key))).toBe(key);
	});

	it("strips leading slash before encoding", () => {
		const result = decode(encode("/leading-slash.txt"));
		expect(result).toBe("leading-slash.txt");
	});

	it("does not strip slash from bare /", () => {
		// "/" is a valid prefix meaning root
		const encoded = encode("/");
		expect(decode(encoded)).toBe("/");
	});

	it("handles unicode characters", () => {
		const key = "docs/résumé-日本語.pdf";
		expect(decode(encode(key))).toBe(key);
	});

	it("handles empty string", () => {
		expect(decode(encode(""))).toBe("");
	});
});

describe("bytesToSize", () => {
	it("returns '0 Byte' for 0", () => {
		expect(bytesToSize(0)).toBe("0 Byte");
	});

	it("returns bytes for small values", () => {
		expect(bytesToSize(500)).toBe("500 Bytes");
	});

	it("converts to KB", () => {
		expect(bytesToSize(1024)).toBe("1 KB");
	});

	it("converts to MB", () => {
		expect(bytesToSize(1024 * 1024)).toBe("1 MB");
	});

	it("converts to GB", () => {
		expect(bytesToSize(1024 * 1024 * 1024)).toBe("1 GB");
	});

	it("rounds appropriately", () => {
		expect(bytesToSize(1536)).toBe("2 KB"); // 1.5 KB rounds to 2
	});
});

describe("sleep", () => {
	it("resolves after the given delay", async () => {
		vi.useFakeTimers();
		const promise = sleep(100);
		vi.advanceTimersByTime(100);
		await promise; // should resolve without timing out
		vi.useRealTimers();
	});
});

describe("retryWithBackoff", () => {
	it("returns the result on first success", async () => {
		const op = vi.fn().mockResolvedValue("ok");
		const result = await retryWithBackoff(op);
		expect(result).toBe("ok");
		expect(op).toHaveBeenCalledTimes(1);
	});

	it("retries on failure and succeeds on second attempt", async () => {
		const op = vi
			.fn()
			.mockRejectedValueOnce(new Error("fail"))
			.mockResolvedValue("ok");

		// Use tiny real delays so the test finishes quickly
		const result = await retryWithBackoff(op, 3, 10, 50, 2);
		expect(result).toBe("ok");
		expect(op).toHaveBeenCalledTimes(2);
	});

	it("throws after exhausting all attempts", async () => {
		const op = vi.fn().mockRejectedValue(new Error("always fails"));

		await expect(retryWithBackoff(op, 3, 10, 50, 2)).rejects.toThrow(
			"always fails",
		);
		expect(op).toHaveBeenCalledTimes(3);
	});

	it("converts non-Error throws to Error instances", async () => {
		const op = vi.fn().mockRejectedValue("string error");

		await expect(retryWithBackoff(op, 1)).rejects.toThrow("string error");
	});
});
