import type { AppContext, R2ExplorerConfig } from "../../types";

export const TRASH_PREFIX = ".r2-explorer/trash/";
export const EXPLORER_PREFIX = ".r2-explorer/";

export type TrashMetadata = {
	trashOriginalKey: string;
	trashDeletedAt: string;
	trashDeletedBy: string;
};

export function isTrashEnabled(config: R2ExplorerConfig): boolean {
	return config.trash !== false;
}

export function getRetentionDays(config: R2ExplorerConfig): number {
	if (
		config.trash &&
		typeof config.trash === "object" &&
		config.trash.retentionDays
	) {
		return config.trash.retentionDays;
	}
	return 30;
}

export function isExplorerKey(key: string): boolean {
	return key.startsWith(EXPLORER_PREFIX);
}

export function generateTrashId(): string {
	return crypto.randomUUID().replace(/-/g, "").substring(0, 10);
}

export function getTrashKey(originalKey: string, trashId?: string): string {
	const id = trashId || generateTrashId();
	return `${TRASH_PREFIX}${id}/${originalKey}`;
}

export function parseTrashKey(
	trashKey: string,
): { trashId: string; originalKey: string } | null {
	if (!trashKey.startsWith(TRASH_PREFIX)) {
		return null;
	}

	const withoutPrefix = trashKey.slice(TRASH_PREFIX.length);
	const firstSlash = withoutPrefix.indexOf("/");
	if (firstSlash === -1) {
		return null;
	}

	const trashId = withoutPrefix.slice(0, firstSlash);
	const originalKey = withoutPrefix.slice(firstSlash + 1);
	return { trashId, originalKey };
}

export async function moveToTrash(
	bucket: R2Bucket,
	key: string,
	trashId: string,
	deletedBy: string,
): Promise<{ trashKey: string }> {
	const object = await bucket.get(key);

	if (object === null) {
		throw new Error(`Object not found: ${key}`);
	}

	const trashKey = getTrashKey(key, trashId);
	const deletedAt = Date.now().toString();

	const customMetadata: Record<string, string> = {
		...(object.customMetadata || {}),
		trashOriginalKey: key,
		trashDeletedAt: deletedAt,
		trashDeletedBy: deletedBy,
	};

	try {
		await bucket.put(trashKey, object.body, {
			customMetadata,
			httpMetadata: object.httpMetadata,
		});
	} catch (error) {
		// Large objects (>5GB or multipart) cannot always be copied via put().
		// Re-throw a clear error so callers can fall back to hard delete.
		throw new Error(
			`Failed to copy object to trash (object may be too large to copy in one request): ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	await bucket.delete(key);

	return { trashKey };
}

export async function restoreFromTrash(
	bucket: R2Bucket,
	trashKey: string,
): Promise<{ restoredKey: string }> {
	const object = await bucket.get(trashKey);

	if (object === null) {
		throw new Error(`Trashed object not found: ${trashKey}`);
	}

	const customMetadata = { ...(object.customMetadata || {}) };
	let originalKey = customMetadata.trashOriginalKey;
	delete customMetadata.trashOriginalKey;
	delete customMetadata.trashDeletedAt;
	delete customMetadata.trashDeletedBy;

	if (!originalKey) {
		const parsed = parseTrashKey(trashKey);
		if (!parsed) {
			throw new Error(`Invalid trash key: ${trashKey}`);
		}
		originalKey = parsed.originalKey;
	}

	let restoredKey = originalKey;
	const existing = await bucket.head(originalKey);
	if (existing) {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const lastSlash = originalKey.lastIndexOf("/");
		if (lastSlash !== -1 && originalKey.endsWith("/")) {
			// folder marker
			restoredKey = `${originalKey.slice(0, -1)} (restored ${timestamp})/`;
		} else if (lastSlash !== -1) {
			const folder = originalKey.slice(0, lastSlash + 1);
			const name = originalKey.slice(lastSlash + 1);
			const lastDot = name.lastIndexOf(".");
			if (lastDot > 0) {
				restoredKey = `${folder}${name.slice(0, lastDot)} (restored ${timestamp})${name.slice(lastDot)}`;
			} else {
				restoredKey = `${folder}${name} (restored ${timestamp})`;
			}
		} else {
			const lastDot = originalKey.lastIndexOf(".");
			if (lastDot > 0) {
				restoredKey = `${originalKey.slice(0, lastDot)} (restored ${timestamp})${originalKey.slice(lastDot)}`;
			} else {
				restoredKey = `${originalKey} (restored ${timestamp})`;
			}
		}
	}

	await bucket.put(restoredKey, object.body, {
		customMetadata,
		httpMetadata: object.httpMetadata,
	});

	await bucket.delete(trashKey);

	return { restoredKey };
}

export async function purgeTrash(
	bucket: R2Bucket,
	trashKey?: string,
): Promise<{ deleted: number }> {
	if (trashKey) {
		await bucket.delete(trashKey);
		return { deleted: 1 };
	}

	let deleted = 0;
	let truncated = true;
	let cursor: string | undefined;

	while (truncated) {
		const list = await bucket.list({
			prefix: TRASH_PREFIX,
			cursor,
		});

		const keys = list.objects.map((obj) => obj.key);
		if (keys.length > 0) {
			await bucket.delete(keys);
			deleted += keys.length;
		}

		truncated = list.truncated;
		cursor = list.truncated ? list.cursor : undefined;
	}

	return { deleted };
}

export async function purgeExpiredTrash(
	bucket: R2Bucket,
	retentionDays: number,
	now = Date.now(),
): Promise<{ deleted: number }> {
	const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;
	let deleted = 0;
	let truncated = true;
	let cursor: string | undefined;

	while (truncated) {
		const list = await bucket.list({
			prefix: TRASH_PREFIX,
			include: ["customMetadata"],
			cursor,
		});

		const keysToDelete: string[] = [];
		for (const obj of list.objects) {
			const deletedAt = obj.customMetadata?.trashDeletedAt;
			if (deletedAt && Number.parseInt(deletedAt, 10) < cutoff) {
				keysToDelete.push(obj.key);
			}
		}

		if (keysToDelete.length > 0) {
			await bucket.delete(keysToDelete);
			deleted += keysToDelete.length;
		}

		truncated = list.truncated;
		cursor = list.truncated ? list.cursor : undefined;
	}

	return { deleted };
}

export function assertNotTrashDestination(key: string) {
	if (key.startsWith(TRASH_PREFIX)) {
		throw new Error("Cannot move or copy objects into the trash area directly");
	}
}
