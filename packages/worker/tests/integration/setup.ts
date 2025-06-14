import { R2Explorer } from "../../src";
import type { R2ExplorerConfig } from "../../src/types";

/**
 * Creates an instance of the R2Explorer application for testing.
 *
 * @param config - Optional configuration to override defaults.
 * @returns The R2Explorer app instance (fetch and email handlers).
 */
export function createTestApp(config?: Partial<R2ExplorerConfig>) {
	const defaultConfig: R2ExplorerConfig = {
		readonly: false, // Default to mutable for most tests, can be overridden
		cors: true, // Enable CORS for testing API endpoints
		// basicAuth: undefined, // Default to no basic auth
		// cfAccessTeamName: undefined, // Default to no CF Access
		// Other default configurations can be added here
	};

	return R2Explorer({ ...defaultConfig, ...config });
}

/**
 * Helper to create a Request object for testing.
 * @param path - The path for the request (e.g., /api/server/config)
 * @param method - HTTP method (e.g., GET, POST)
 * @param body - Optional request body
 * @param headers - Optional request headers
 * @returns A Request object
 */
export function createTestRequest(
	path: string,
	method = "GET",
	body?: any,
	headers?: HeadersInit,
): Request {
	const url = new URL(`http://localhost${path}`); // Base URL doesn't matter much for worker tests
	let bodyInit: BodyInit | undefined = undefined;
	const reqHeaders = new Headers(headers);

	if (body) {
		if (typeof body === "object" && !reqHeaders.has("Content-Type")) {
			reqHeaders.set("Content-Type", "application/json");
			bodyInit = JSON.stringify(body);
		} else {
			bodyInit = body as BodyInit;
		}
	}

	return new Request(url.toString(), {
		method,
		headers: reqHeaders,
		body: bodyInit,
	});
}
