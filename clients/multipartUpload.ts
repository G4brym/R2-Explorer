/**
 * Multipart uploader for R2-Explorer endpoints
 * - Works in browsers (File/Blob) and Node (Buffer/streams)
 * - Handles chunking, concurrency, retries, and completion
 */

export type BasicAuth = { username: string; password: string };

export type UploadOptions = {
  apiBaseUrl: string; // e.g. "https://your-worker.example.com"
  bucket: string; // e.g. "secure-uploads"
  key: string; // final object key (not base64); middleware may adjust path server-side
  file: Blob; // Browser: File/Blob; Node: Blob (new global in Node 18+)
  partSizeBytes?: number; // default 16 MiB
  concurrency?: number; // default 6
  headers?: Record<string, string>; // extra headers; merged with auth
  auth?: BasicAuth; // basic auth support
  retry?: { attempts?: number; baseMs?: number; maxMs?: number };
  signal?: AbortSignal;
  onProgress?: (info: { uploadedBytes: number; totalBytes: number; percentage: number }) => void;
};

export type UploadResult = {
  success: boolean;
  key: string;
  uploadId: string;
  size: number;
  parts: { partNumber: number; etag: string }[];
  complete: any;
};

const DEFAULT_PART_SIZE = 16 * 1024 * 1024; // 16 MiB
const MIN_PART_SIZE = 5 * 1024 * 1024; // 5 MiB (S3-compatible minimum)

function toBase64(str: string): string {
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(str)));
  // Node
  // @ts-ignore Node types are not guaranteed here
  return Buffer.from(str, "utf8").toString("base64");
}

function basicAuthHeader(auth?: BasicAuth): Record<string, string> {
  if (!auth) return {};
  const token = toBase64(`${auth.username}:${auth.password}`);
  return { Authorization: `Basic ${token}` };
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchJSON(url: string, init: RequestInit, expectedOk = true) {
  const res = await fetch(url, init);
  if (expectedOk && !res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  // Some endpoints may return different; fallback to text
  return res.text();
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4, baseMs = 250, maxMs = 2000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = Math.min(maxMs, baseMs * Math.pow(2, i));
      await sleep(delay);
    }
  }
  throw lastErr;
}

function buildHeaders(opts: UploadOptions, extra?: Record<string, string>) {
  return {
    ...(opts.headers || {}),
    ...basicAuthHeader(opts.auth),
    ...(extra || {}),
  } as Record<string, string>;
}

export async function uploadMultipart(opts: UploadOptions): Promise<UploadResult> {
  const {
    apiBaseUrl,
    bucket,
    key,
    file,
    partSizeBytes = DEFAULT_PART_SIZE,
    concurrency = 6,
    retry = {},
    signal,
  } = opts;

  if (!(file instanceof Blob)) {
    throw new Error("opts.file must be a Blob/File in both browser and Node 18+");
  }

  const partSize = Math.max(MIN_PART_SIZE, partSizeBytes);
  const keyB64 = toBase64(key);
  const base = apiBaseUrl.replace(/\/$/, "");

  // 1) Create upload
  const createUrl = `${base}/api/buckets/${encodeURIComponent(bucket)}/multipart/create?key=${encodeURIComponent(keyB64)}`;
  const createResp = await withRetry(
    () => fetchJSON(createUrl, { method: "POST", headers: buildHeaders(opts) }),
    retry.attempts ?? 3,
    retry.baseMs ?? 200,
    retry.maxMs ?? 1500,
  );

  const uploadId = (createResp as any).uploadId as string;
  if (!uploadId) throw new Error("createMultipartUpload did not return uploadId");

  // 2) Prepare parts
  const totalSize = file.size;
  const partsCount = Math.max(1, Math.ceil(totalSize / partSize));
  const partsMeta: { partNumber: number; etag: string }[] = new Array(partsCount);

  let nextPart = 1;
  let uploaded = 0;

  async function uploadOne(partNumber: number) {
    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, totalSize);
    const chunk = file.slice(start, end);
    const url = `${base}/api/buckets/${encodeURIComponent(bucket)}/multipart/upload?key=${encodeURIComponent(
      keyB64,
    )}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`;

    const doUpload = async () => {
      const res = await fetch(url, {
        method: "POST",
        body: chunk,
        headers: buildHeaders(opts, { "Content-Type": "application/octet-stream" }),
        signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Part ${partNumber} failed: HTTP ${res.status} ${res.statusText}: ${text}`);
      }
      const body = await res.json().catch(() => ({}));
      const etag = (body as any).etag as string;
      if (!etag) throw new Error(`Part ${partNumber} missing ETag in response`);
      partsMeta[partNumber - 1] = { partNumber, etag };
      uploaded += chunk.size;
      if (opts.onProgress) {
        const pct = Math.floor((uploaded / totalSize) * 100);
        opts.onProgress({ uploadedBytes: uploaded, totalBytes: totalSize, percentage: pct });
      }
      return body;
    };

    return withRetry(doUpload, retry.attempts ?? 4, retry.baseMs ?? 250, retry.maxMs ?? 2000);
  }

  // Simple promise pool
  const workers: Promise<any>[] = [];
  for (let i = 0; i < Math.min(concurrency, partsCount); i++) {
    workers.push(
      (async function runner() {
        while (true) {
          const current = nextPart++;
          if (current > partsCount) break;
          await uploadOne(current);
        }
      })(),
    );
  }
  await Promise.all(workers);

  // 3) Complete upload
  const completeUrl = `${base}/api/buckets/${encodeURIComponent(bucket)}/multipart/complete`;
  const completeBody = { key: keyB64, uploadId, parts: partsMeta };
  const completeResp = await withRetry(
    () =>
      fetchJSON(
        completeUrl,
        {
          method: "POST",
          headers: buildHeaders(opts, { "Content-Type": "application/json" }),
          body: JSON.stringify(completeBody),
          signal,
        },
        true,
      ),
    retry.attempts ?? 3,
    retry.baseMs ?? 200,
    retry.maxMs ?? 1500,
  );

  return {
    success: true,
    key,
    uploadId,
    size: totalSize,
    parts: partsMeta,
    complete: completeResp,
  };
}

// Convenience: Node-only helper to upload from a file path by constructing a Blob
// Requires Node 18+ where Blob is available globally
export async function uploadMultipartFromFilePath(options: Omit<UploadOptions, "file"> & { filePath: string }): Promise<UploadResult> {
  const {
    apiBaseUrl,
    bucket,
    key,
    filePath,
    partSizeBytes = DEFAULT_PART_SIZE,
    concurrency = 6,
    retry = {},
    signal,
  } = options as any;

  // Lazy import Node modules
  // @ts-ignore
  const fs = await import("node:fs");
  // @ts-ignore
  const fsp = await import("node:fs/promises");

  const stat = await fsp.stat(filePath);
  const totalSize = stat.size;
  const partSize = Math.max(MIN_PART_SIZE, partSizeBytes);
  const partsCount = Math.max(1, Math.ceil(totalSize / partSize));
  const keyB64 = toBase64(key);
  const base = apiBaseUrl.replace(/\/$/, "");

  // 1) Create upload
  const createUrl = `${base}/api/buckets/${encodeURIComponent(bucket)}/multipart/create?key=${encodeURIComponent(keyB64)}`;
  const createResp = await withRetry(
    () => fetchJSON(createUrl, { method: "POST", headers: buildHeaders(options) }),
    retry.attempts ?? 3,
    retry.baseMs ?? 200,
    retry.maxMs ?? 1500,
  );
  const uploadId = (createResp as any).uploadId as string;
  if (!uploadId) throw new Error("createMultipartUpload did not return uploadId");

  const partsMeta: { partNumber: number; etag: string }[] = new Array(partsCount);
  let nextPart = 1;
  let uploaded = 0;

  async function uploadOne(partNumber: number) {
    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, totalSize);
    const chunkSize = end - start;
    const url = `${base}/api/buckets/${encodeURIComponent(bucket)}/multipart/upload?key=${encodeURIComponent(
      keyB64,
    )}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`;

    const doUpload = async () => {
      const stream = fs.createReadStream(filePath, { start, end: end - 1 });
      const res = await fetch(url, {
        method: "POST",
        // @ts-ignore undici/Node fetch accepts Node Readable as body
        body: stream,
        headers: buildHeaders(options, {
          "Content-Type": "application/octet-stream",
          "Content-Length": String(chunkSize),
        }),
        signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Part ${partNumber} failed: HTTP ${res.status} ${res.statusText}: ${text}`);
      }
      const body = await res.json().catch(() => ({}));
      const etag = (body as any).etag as string;
      if (!etag) throw new Error(`Part ${partNumber} missing ETag in response`);
      partsMeta[partNumber - 1] = { partNumber, etag };
      uploaded += chunkSize;
      if (options.onProgress) {
        const pct = Math.floor((uploaded / totalSize) * 100);
        options.onProgress({ uploadedBytes: uploaded, totalBytes: totalSize, percentage: pct });
      }
      return body;
    };

    return withRetry(doUpload, retry.attempts ?? 4, retry.baseMs ?? 250, retry.maxMs ?? 2000);
  }

  const workers: Promise<any>[] = [];
  for (let i = 0; i < Math.min(concurrency, partsCount); i++) {
    workers.push(
      (async function runner() {
        while (true) {
          const current = nextPart++;
          if (current > partsCount) break;
          await uploadOne(current);
        }
      })(),
    );
  }
  await Promise.all(workers);

  // 3) Complete upload
  const completeUrl = `${base}/api/buckets/${encodeURIComponent(bucket)}/multipart/complete`;
  const completeBody = { key: keyB64, uploadId, parts: partsMeta };
  const completeResp = await withRetry(
    () =>
      fetchJSON(
        completeUrl,
        {
          method: "POST",
          headers: buildHeaders(options, { "Content-Type": "application/json" }),
          body: JSON.stringify(completeBody),
          signal,
        },
        true,
      ),
    retry.attempts ?? 3,
    retry.baseMs ?? 200,
    retry.maxMs ?? 1500,
  );

  return {
    success: true,
    key,
    uploadId,
    size: totalSize,
    parts: partsMeta,
    complete: completeResp,
  };
}
