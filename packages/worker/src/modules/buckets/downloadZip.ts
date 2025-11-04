import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { zip } from "fflate";
import type { AppContext } from "../../types";

export class DownloadZip extends OpenAPIRoute {
	schema = {
		operationId: "download-bucket-zip",
		tags: ["Buckets"],
		summary: "Download all files in a folder as ZIP",
		request: {
			params: z.object({
				bucket: z.string(),
			}),
			query: z.object({
				prefix: z
					.string()
					.nullable()
					.optional()
					.describe("base64 encoded folder path to download"),
			}),
		},
		responses: {
			"200": {
				description: "ZIP file containing all files",
				schema: z.string().openapi({ format: "binary" }),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const bucketName = data.params.bucket;
		const bucket = c.env[bucketName] as R2Bucket | undefined;

		if (!bucket) {
			throw new HTTPException(500, {
				message: `Bucket binding not found: ${bucketName}`,
			});
		}

		// Decode prefix (folder path)
		let prefix = data.query.prefix
			? decodeURIComponent(escape(atob(data.query.prefix)))
			: "";

		// SpendRule: Apply health group filtering
		const healthGroupFilter = c.get("health_group_filter");
		const userHealthGroup = c.get("user_health_group");

		// Non-admin users should only download their health group folder
		if (healthGroupFilter && userHealthGroup !== "admin") {
			if (!prefix) {
				prefix = `${healthGroupFilter}/`;
			} else if (!prefix.startsWith(`${healthGroupFilter}/`)) {
				prefix = `${healthGroupFilter}/${prefix}`;
			}
		}

		// Ensure prefix ends with / if it exists
		if (prefix && !prefix.endsWith("/")) {
			prefix = `${prefix}/`;
		}

		// List all objects in the folder recursively
		const allObjects: R2Object[] = [];
		let cursor: string | undefined = undefined;

		do {
			const result = await bucket.list({
				prefix: prefix,
				cursor: cursor,
				limit: 1000, // Max items per request
			});

			allObjects.push(...result.objects);
			cursor = result.truncated ? result.cursor : undefined;
		} while (cursor);

		// Filter out folder markers (keys ending with /)
		const files = allObjects.filter((obj) => !obj.key.endsWith("/"));

		if (files.length === 0) {
			throw new HTTPException(404, {
				message: "No files found in the specified folder",
			});
		}

		// Download all files in parallel (batched to avoid memory limits)
		const BATCH_SIZE = 50; // Process 50 files at a time
		const zipFiles: Record<string, Uint8Array> = {};

		// Process files in batches for better performance
		for (let i = 0; i < files.length; i += BATCH_SIZE) {
			const batch = files.slice(i, i + BATCH_SIZE);

			// Download batch in parallel
			const batchPromises = batch.map(async (file) => {
				try {
					const object = await bucket.get(file.key);

					if (object && object.body) {
						// Get relative path within the folder
						let relativePath = file.key;
						if (prefix) {
							relativePath = file.key.substring(prefix.length);
						}

						// Read the file body as ArrayBuffer
						const arrayBuffer = await object.arrayBuffer();
						return { relativePath, data: new Uint8Array(arrayBuffer) };
					}
				} catch (error) {
					console.error(`Failed to download ${file.key}:`, error);
				}
				return null;
			});

			// Wait for batch to complete
			const results = await Promise.all(batchPromises);

			// Add successful downloads to ZIP files object
			for (const result of results) {
				if (result) {
					zipFiles[result.relativePath] = result.data;
				}
			}
		}

		// Create ZIP archive asynchronously with minimal compression for speed
		const zippedData = await new Promise<Uint8Array>((resolve, reject) => {
			zip(zipFiles, {
				level: 1, // Fast compression (was 6, now 1 for speed)
			}, (err, data) => {
				if (err) reject(err);
				else resolve(data);
			});
		});

		// Generate ZIP filename based on folder
		let zipFilename = "download.zip";
		if (prefix) {
			const folderName = prefix.replace(/\/$/, "").split("/").pop() || "download";
			zipFilename = `${folderName}.zip`;
		} else if (userHealthGroup && userHealthGroup !== "admin") {
			zipFilename = `${userHealthGroup}.zip`;
		}

		// Return ZIP file
		return new Response(zippedData, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="${zipFilename}"`,
				"Content-Length": zippedData.length.toString(),
			},
		});
	}
}
