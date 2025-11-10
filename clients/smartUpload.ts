/**
 * Smart uploader that picks single PUT for small files
 * and multipart upload for large files, using existing endpoints.
 *
 * - Browser: pass a File/Blob via `file`
 * - Node: pass a file path via `filePath`
 */

import { uploadMultipart, uploadMultipartFromFilePath, type UploadResult, type UploadOptions } from "./multipartUpload";

export type BasicAuth = { username: string; password: string };

export type SmartUploadOptionsBase = {
  apiBaseUrl: string;
  bucket: string;
  key: string; // final object key (not base64)
  headers?: Record<string, string>;
  auth?: BasicAuth;
  retry?: { attempts?: number; baseMs?: number; maxMs?: number };
  signal?: AbortSignal;
  // Optional metadata sent via query params (base64 JSON encoded)
  customMetadata?: Record<string, unknown>;
  httpMetadata?: Record<string, unknown>;
  // Threshold to switch to multipart
  thresholdBytes?: number; // default 64 MiB
  // Multipart tuning
  partSizeBytes?: number;
  concurrency?: number;
};

export type SmartUploadOptionsBrowser = SmartUploadOptionsBase & { file: Blob; filePath?: never };
export type SmartUploadOptionsNode = SmartUploadOptionsBase & { filePath: string; file?: never };
export type SmartUploadOptions = SmartUploadOptionsBrowser | SmartUploadOptionsNode;

export type SinglePutResult = {
  mode: "single";
  size: number;
  path: string;
  response: any;
};

export type SmartUploadResult = SinglePutResult | ({ mode: "multipart" } & UploadResult);

function toBase64(str: string): string {
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(str)));
  // @ts-ignore Node Buffer
  return Buffer.from(str, "utf8").toString("base64");
}

function basicAuthHeader(auth?: BasicAuth): Record<string, string> {
  if (!auth) return {};
  const token = toBase64(`${auth.username}:${auth.password}`);
  return { Authorization: `Basic ${token}` };
}

function buildHeaders(opts: SmartUploadOptions, extra?: Record<string, string>) {
  return {
    ...(opts.headers || {}),
    ...basicAuthHeader(opts.auth),
    ...(extra || {}),
  } as Record<string, string>;
}

function encodeQueryMetadata(obj?: Record<string, unknown>): string | undefined {
  if (!obj) return undefined;
  const json = JSON.stringify(obj);
  return toBase64(json); // URLSearchParams will take care of encoding
}

function buildUploadUrl(opts: SmartUploadOptions): string {
  const base = opts.apiBaseUrl.replace(/\/$/, "");
  const keyB64 = toBase64(opts.key);
  const params = new URLSearchParams({ key: keyB64 });
  const cm = encodeQueryMetadata(opts.customMetadata);
  const hm = encodeQueryMetadata(opts.httpMetadata);
  if (cm) params.set("customMetadata", cm);
  if (hm) params.set("httpMetadata", hm);
  return `${base}/api/buckets/${encodeURIComponent(opts.bucket)}/upload?${params.toString()}`;
}

async function fetchJSON(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

async function uploadSingleBrowser(opts: SmartUploadOptionsBrowser): Promise<SinglePutResult> {
  const url = buildUploadUrl(opts);
  const resp = await fetchJSON(url, {
    method: "POST",
    body: opts.file,
    headers: buildHeaders(opts, { "Content-Type": "application/octet-stream" }),
    signal: opts.signal,
  });
  const size = opts.file.size;
  const path = (resp as any)?.path ?? opts.key;
  return { mode: "single", size, path, response: resp };
}

async function uploadSingleNode(opts: SmartUploadOptionsNode): Promise<SinglePutResult> {
  const url = buildUploadUrl(opts);
  // @ts-ignore lazy import
  const fs = await import("node:fs");
  // @ts-ignore lazy import
  const fsp = await import("node:fs/promises");
  const st = await fsp.stat(opts.filePath);
  const stream = fs.createReadStream(opts.filePath);
  const resp = await fetchJSON(url, {
    method: "POST",
    // @ts-ignore undici accepts Node readable
    body: stream,
    headers: buildHeaders(opts, {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(st.size),
    }),
    signal: opts.signal,
  });
  const path = (resp as any)?.path ?? opts.key;
  return { mode: "single", size: st.size, path, response: resp };
}

export async function uploadWithThreshold(opts: SmartUploadOptions): Promise<SmartUploadResult> {
  const threshold = Math.max(5 * 1024 * 1024, opts.thresholdBytes ?? 64 * 1024 * 1024);

  if ("file" in opts && opts.file) {
    const size = opts.file.size;
    if (size <= threshold) {
      return uploadSingleBrowser(opts);
    }
    // Multipart for browser
    const mp = await uploadMultipart({
      apiBaseUrl: opts.apiBaseUrl,
      bucket: opts.bucket,
      key: opts.key,
      file: opts.file,
      partSizeBytes: opts.partSizeBytes,
      concurrency: opts.concurrency,
      headers: opts.headers,
      auth: opts.auth,
      retry: opts.retry,
      signal: opts.signal,
    } as UploadOptions);
    return { mode: "multipart", ...mp };
  }

  // Node path
  const fsp = await import("node:fs/promises");
  const st = await fsp.stat((opts as SmartUploadOptionsNode).filePath);
  if (st.size <= threshold) {
    return uploadSingleNode(opts as SmartUploadOptionsNode);
  }
  const mp = await uploadMultipartFromFilePath({
    apiBaseUrl: opts.apiBaseUrl,
    bucket: opts.bucket,
    key: opts.key,
    filePath: (opts as SmartUploadOptionsNode).filePath,
    partSizeBytes: opts.partSizeBytes,
    concurrency: opts.concurrency,
    headers: opts.headers,
    auth: opts.auth,
    retry: opts.retry,
    signal: opts.signal,
  } as any);
  return { mode: "multipart", ...mp };
}
