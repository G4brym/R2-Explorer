import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { zipSync } from "fflate";
import type { AppContext } from "../../types";

export class DownloadAllGroups extends OpenAPIRoute {
	schema = {
		operationId: "download-all-groups-zip",
		tags: ["Buckets"],
		summary: "Download all health group files as ZIP (Admin only)",
		request: {
			params: z.object({
				bucket: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "ZIP file containing all health group files",
				schema: z.string().openapi({ format: "binary" }),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		// Admin-only check
		const username = c.get("authentication_username");
		const adminUsers = ["spendrule_admin"];
		if (!username || !adminUsers.includes(username)) {
			throw new HTTPException(403, {
				message: "Access denied. Admin privileges required.",
			});
		}

		const bucketName = data.params.bucket;
		const bucket = c.env[bucketName] as R2Bucket | undefined;

		if (!bucket) {
			throw new HTTPException(500, {
				message: `Bucket binding not found: ${bucketName}`,
			});
		}

		// List all objects in the entire bucket
		const allObjects: R2Object[] = [];
		let cursor: string | undefined = undefined;

		console.log("Starting to list all objects in bucket...");

		do {
			const result = await bucket.list({
				cursor: cursor,
				limit: 1000, // Max items per request
			});

			allObjects.push(...result.objects);
			cursor = result.truncated ? result.cursor : undefined;

			console.log(`Listed ${allObjects.length} objects so far...`);
		} while (cursor);

		console.log(`Total objects found: ${allObjects.length}`);

		// Filter out folder markers (keys ending with /)
		const files = allObjects.filter((obj) => !obj.key.endsWith("/"));

		if (files.length === 0) {
			throw new HTTPException(404, {
				message: "No files found in the bucket",
			});
		}

		console.log(`Processing ${files.length} files for ZIP...`);

		// Download all files and prepare for ZIP
		const zipFiles: Record<string, Uint8Array> = {};
		let processedCount = 0;

		for (const file of files) {
			try {
				const object = await bucket.get(file.key);

				if (object && object.body) {
					// Keep the full path structure (including health group folders)
					const arrayBuffer = await object.arrayBuffer();
					zipFiles[file.key] = new Uint8Array(arrayBuffer);

					processedCount++;
					if (processedCount % 10 === 0) {
						console.log(`Processed ${processedCount}/${files.length} files...`);
					}
				}
			} catch (error) {
				console.error(`Failed to download ${file.key}:`, error);
				// Continue with other files even if one fails
			}
		}

		console.log(`Creating ZIP archive with ${Object.keys(zipFiles).length} files...`);

		// Create ZIP archive
		const zippedData = zipSync(zipFiles, {
			level: 6, // Compression level (0-9)
		});

		console.log(`ZIP created successfully, size: ${zippedData.length} bytes`);

		// Generate ZIP filename with timestamp
		const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
		const zipFilename = `all_health_groups_${timestamp}.zip`;

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
