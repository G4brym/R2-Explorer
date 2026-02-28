import { type APIRequestContext } from "@playwright/test";

const BASE = "http://localhost:8787";
const BUCKET = "MY_BUCKET";

/** Base64-encode a key the same way the dashboard does. */
function encodeKey(key: string): string {
	return btoa(unescape(encodeURIComponent(key)));
}

/**
 * Upload a file to the test bucket via the worker API.
 * The upload endpoint expects raw binary body (application/octet-stream).
 */
export async function uploadFile(
	request: APIRequestContext,
	key: string,
	content: string | Buffer,
	contentType = "text/plain",
) {
	const encoded = encodeKey(key);
	const body =
		typeof content === "string" ? Buffer.from(content, "utf-8") : content;

	const resp = await request.post(
		`${BASE}/api/buckets/${BUCKET}/upload?key=${encoded}`,
		{
			data: body,
			headers: {
				"Content-Type": "application/octet-stream",
			},
		},
	);
	if (!resp.ok()) {
		throw new Error(
			`Upload failed for ${key}: ${resp.status()} ${await resp.text()}`,
		);
	}
}

/**
 * Create a folder in the test bucket.
 */
export async function createFolder(
	request: APIRequestContext,
	folderKey: string,
) {
	const encoded = encodeKey(
		folderKey.endsWith("/") ? folderKey : `${folderKey}/`,
	);
	const resp = await request.post(`${BASE}/api/buckets/${BUCKET}/folder`, {
		data: { key: encoded },
	});
	if (!resp.ok()) {
		throw new Error(
			`Create folder failed for ${folderKey}: ${resp.status()} ${await resp.text()}`,
		);
	}
}

/**
 * Delete an object from the test bucket.
 */
export async function deleteObject(
	request: APIRequestContext,
	key: string,
) {
	const encoded = encodeKey(key);
	await request.post(`${BASE}/api/buckets/${BUCKET}/delete`, {
		data: { key: encoded },
	});
}

/**
 * Upload a test email JSON with proper metadata.
 * Emails are stored at .r2-explorer/emails/inbox/{name}.json
 */
export async function seedEmail(
	request: APIRequestContext,
	name: string,
	opts: {
		subject: string;
		fromName: string;
		fromAddress: string;
		toAddress?: string;
		body?: string;
		html?: string;
		read?: boolean;
		hasAttachments?: boolean;
		date?: string;
	},
) {
	const emailJson = JSON.stringify({
		subject: opts.subject,
		from: { name: opts.fromName, address: opts.fromAddress },
		to: [{ name: "", address: opts.toAddress ?? "test@example.com" }],
		date: opts.date ?? new Date().toISOString(),
		text: opts.body ?? `Body of: ${opts.subject}`,
		html: opts.html ?? `<p>${opts.body ?? opts.subject}</p>`,
		attachments: [],
	});

	const key = `.r2-explorer/emails/inbox/${name}.json`;

	// Upload with custom metadata in the same request (as the receiveEmail handler does)
	const customMeta = {
		subject: opts.subject,
		from_address: opts.fromAddress,
		from_name: opts.fromName,
		to_address: opts.toAddress ?? "test@example.com",
		has_attachments: String(opts.hasAttachments ?? false),
		read: String(opts.read ?? false),
		timestamp: String(Date.now()),
	};

	const encodedKey = encodeKey(key);
	const encodedMeta = btoa(
		unescape(encodeURIComponent(JSON.stringify(customMeta))),
	);

	const resp = await request.post(
		`${BASE}/api/buckets/${BUCKET}/upload?key=${encodedKey}&customMetadata=${encodedMeta}`,
		{
			data: Buffer.from(emailJson, "utf-8"),
			headers: {
				"Content-Type": "application/octet-stream",
			},
		},
	);
	if (!resp.ok()) {
		throw new Error(
			`Seed email failed for ${name}: ${resp.status()} ${await resp.text()}`,
		);
	}
}

/**
 * Clean up all objects with a given prefix.
 */
export async function cleanupPrefix(
	request: APIRequestContext,
	prefix: string,
) {
	const resp = await request.get(
		`${BASE}/api/buckets/${BUCKET}?prefix=${encodeKey(prefix)}&delimiter=/`,
	);
	if (resp.ok()) {
		const data = await resp.json();
		for (const obj of data.objects ?? []) {
			await deleteObject(request, obj.key);
		}
	}
}

export { BUCKET };
