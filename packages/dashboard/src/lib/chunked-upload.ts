import { api } from "./api";
import { safeBase64Decode } from "./browser";

/**
 * Chunked upload for files larger than 100MB
 * Uses R2 multipart upload API with parallel uploads
 */

// Tuned defaults: smaller parts for better parallelism and fewer timeouts
const CHUNK_SIZE = 16 * 1024 * 1024; // 16MB chunks
const FILE_SIZE_THRESHOLD = 64 * 1024 * 1024; // 64MB threshold to switch to multipart
const MAX_CONCURRENT_UPLOADS = 6; // Upload up to 6 chunks in parallel

interface UploadProgress {
	loaded: number;
	total: number;
	percentage: number;
}

interface ChunkedUploadOptions {
	bucket: string;
	key: string; // Already base64 encoded
	file: File;
	onProgress?: (progress: UploadProgress) => void;
}

export async function uploadFile(options: ChunkedUploadOptions) {
	const { bucket, key, file, onProgress } = options;

	// For files under 100MB, use regular upload
	if (file.size < FILE_SIZE_THRESHOLD) {
		return regularUpload(options);
	}

	// For files >= 100MB, use chunked multipart upload
	return chunkedMultipartUpload(options);
}

/**
 * Regular upload for files < 100MB
 */
async function regularUpload({
	bucket,
	key,
	file,
	onProgress,
}: ChunkedUploadOptions) {
	// Send raw bytes directly; server expects application/octet-stream with base64 key param
	const response = await api.post(`/buckets/${bucket}/upload`, file, {
		headers: {
			"Content-Type": "application/octet-stream",
		},
		params: { key },
		onUploadProgress: (progressEvent) => {
			if (onProgress && typeof progressEvent.loaded === "number") {
				const total = progressEvent.total || file.size;
				onProgress({
					loaded: progressEvent.loaded,
					total,
					percentage: Math.min(
						100,
						Math.round((progressEvent.loaded * 100) / total),
					),
				});
			}
		},
	});

	return response.data;
}

/**
 * Chunked multipart upload for files >= 100MB
 */
async function chunkedMultipartUpload({
	bucket,
	key,
	file,
	onProgress,
}: ChunkedUploadOptions) {
	try {
		// Step 1: Create multipart upload
		console.log(
			`Starting multipart upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
		);

		const createResponse = await api.post(
			`/buckets/${bucket}/multipart/create`,
			null,
			{
				params: { key },
			},
		);

		const uploadId = createResponse.data.uploadId;
		console.log(`Multipart upload created with ID: ${uploadId}`);

		// Step 2: Upload chunks in parallel (limit concurrency to MAX_CONCURRENT_UPLOADS)
		const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
		const parts: Array<{ partNumber: number; etag: string }> = [];
		const chunkProgress: Record<number, number> = {}; // Track progress per chunk

		console.log(
			`Uploading ${totalChunks} chunks with ${MAX_CONCURRENT_UPLOADS} concurrent uploads...`,
		);

		// Helper function to upload a single chunk
		const uploadChunk = async (chunkIndex: number) => {
			const start = chunkIndex * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunk = file.slice(start, end);
			const partNumber = chunkIndex + 1;

			console.log(
				`Starting chunk ${partNumber}/${totalChunks} (${(chunk.size / 1024 / 1024).toFixed(2)}MB)`,
			);

			const partResponse = await api.post(
				`/buckets/${bucket}/multipart/upload`,
				chunk,
				{
					headers: {
						"Content-Type": "application/octet-stream",
					},
					params: {
						key,
						uploadId,
						partNumber,
					},
					onUploadProgress: (progressEvent) => {
						// Update this chunk's progress
						chunkProgress[chunkIndex] = progressEvent.loaded;

						// Calculate total progress across all chunks
						const totalLoaded = Object.values(chunkProgress).reduce(
							(sum, val) => sum + val,
							0,
						);

						if (onProgress) {
							onProgress({
								loaded: totalLoaded,
								total: file.size,
								percentage: Math.round((totalLoaded * 100) / file.size),
							});
						}
					},
				},
			);

			console.log(
				`Chunk ${partNumber}/${totalChunks} uploaded, etag: ${partResponse.data.etag}`,
			);

			return {
				partNumber,
				etag: partResponse.data.etag,
			};
		};

		// Upload chunks in parallel batches
		for (let i = 0; i < totalChunks; i += MAX_CONCURRENT_UPLOADS) {
			const batch = [];
			for (let j = 0; j < MAX_CONCURRENT_UPLOADS && i + j < totalChunks; j++) {
				batch.push(uploadChunk(i + j));
			}

			// Wait for this batch to complete before starting the next
			const batchResults = await Promise.all(batch);
			parts.push(...batchResults);
		}

		// Sort parts by part number (important for R2)
		parts.sort((a, b) => a.partNumber - b.partNumber);

		// Step 3: Complete multipart upload
		console.log(`Completing multipart upload with ${parts.length} parts`);

		const completeResponse = await api.post(
			`/buckets/${bucket}/multipart/complete`,
			{
				uploadId,
				key,
				parts,
			},
		);

		console.log(`Multipart upload completed successfully`);

		return {
			success: true,
			result: completeResponse.data,
			path: safeBase64Decode(key), // Decode key to show path (Unicode-safe)
		};
	} catch (error: any) {
		console.error("Chunked upload failed:", error);
		throw error;
	}
}
