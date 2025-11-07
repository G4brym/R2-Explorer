import { api } from "./api";

/**
 * Chunked upload for files larger than 100MB
 * Uses R2 multipart upload API
 */

const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks (well under 100MB limit)
const FILE_SIZE_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold

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
async function regularUpload({ bucket, key, file, onProgress }: ChunkedUploadOptions) {
	const formData = new FormData();
	formData.append("file", file);

	const response = await api.post(`/buckets/${bucket}/upload`, formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
		params: {
			key,
		},
		onUploadProgress: (progressEvent) => {
			if (progressEvent.total && onProgress) {
				onProgress({
					loaded: progressEvent.loaded,
					total: progressEvent.total,
					percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
				});
			}
		},
	});

	return response.data;
}

/**
 * Chunked multipart upload for files >= 100MB
 */
async function chunkedMultipartUpload({ bucket, key, file, onProgress }: ChunkedUploadOptions) {
	try {
		// Step 1: Create multipart upload
		console.log(`Starting multipart upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

		const createResponse = await api.post(`/buckets/${bucket}/multipart/create`, null, {
			params: { key },
		});

		const uploadId = createResponse.data.uploadId;
		console.log(`Multipart upload created with ID: ${uploadId}`);

		// Step 2: Upload chunks in parallel (limit concurrency to 3)
		const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
		const parts: Array<{ partNumber: number; etag: string }> = [];
		let uploadedBytes = 0;

		console.log(`Uploading ${totalChunks} chunks...`);

		// Upload chunks sequentially for now (can optimize with parallel later)
		for (let i = 0; i < totalChunks; i++) {
			const start = i * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunk = file.slice(start, end);
			const partNumber = i + 1;

			console.log(`Uploading chunk ${partNumber}/${totalChunks} (${(chunk.size / 1024 / 1024).toFixed(2)}MB)`);

			// Upload this chunk
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
						const chunkProgress = progressEvent.loaded;
						const totalProgress = uploadedBytes + chunkProgress;

						if (onProgress) {
							onProgress({
								loaded: totalProgress,
								total: file.size,
								percentage: Math.round((totalProgress * 100) / file.size),
							});
						}
					},
				}
			);

			parts.push({
				partNumber,
				etag: partResponse.data.etag,
			});

			uploadedBytes += chunk.size;
			console.log(`Chunk ${partNumber}/${totalChunks} uploaded, etag: ${partResponse.data.etag}`);
		}

		// Step 3: Complete multipart upload
		console.log(`Completing multipart upload with ${parts.length} parts`);

		const completeResponse = await api.post(`/buckets/${bucket}/multipart/complete`, {
			uploadId,
			key,
			parts,
		});

		console.log(`Multipart upload completed successfully`);

		return {
			success: true,
			result: completeResponse.data,
			path: atob(key), // Decode key to show path
		};
	} catch (error: any) {
		console.error("Chunked upload failed:", error);
		throw error;
	}
}
