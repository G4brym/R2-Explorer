// packages/worker/tests/buckets.test.ts
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type { Miniflare } from 'miniflare'; // For type hinting MF_INSTANCE
import type { R2Bucket } from '@cloudflare/workers-types'; // For type hinting r2Bucket

const BASE_URL = (globalThis as any).MF_URL as string | undefined;
const BUCKET_BINDING_NAME = "TEST_BUCKET"; // Must match r2Buckets in setup.ts

describe('Bucket Endpoints (with Miniflare)', () => {
  if (!BASE_URL) {
    // This check will run when the file is imported. If MF_URL isn't set, tests can't run.
    // Consider making this a beforeAll check if describe block needs to be conditional.
    throw new Error('Miniflare base URL (MF_URL) not found. Check tests/setup.ts.');
  }

  let r2Bucket: R2Bucket; // To interact directly with R2 for setup/cleanup

  beforeAll(async () => {
    const mf = (globalThis as any).MF_INSTANCE as Miniflare | undefined;
    if (mf) {
      r2Bucket = await mf.getR2Bucket(BUCKET_BINDING_NAME);
    } else {
      throw new Error("Miniflare instance (MF_INSTANCE) not found. Cannot get R2 bucket for test setup.");
    }
  });

  // Clear the R2 bucket before each test to ensure a clean state
  beforeEach(async () => {
    const listedObjects = await r2Bucket.list();
    const keysToDelete = listedObjects.objects.map(obj => obj.key);
    if (keysToDelete.length > 0) {
      await r2Bucket.delete(keysToDelete);
    }
    // Also clear any multipart uploads if necessary, though not covered by this simple delete
  });

  describe('ListObjects (GET /api/buckets/:bucket)', () => {
    it('should return an empty list for an empty bucket', async () => {
      const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}`, BASE_URL).toString();
      const response = await fetch(targetUrl);

      expect(response.status).toBe(200);
      const json: any = await response.json();

      expect(json.objects).toEqual([]);
      expect(json.truncated).toBe(false);
      expect(json.delimitedPrefixes).toEqual([]);
    });

    it('should list objects correctly', async () => {
      // Arrange: Put some files into the R2 bucket directly
      await r2Bucket.put('file1.txt', 'This is file1');
      await r2Bucket.put('another-file.md', 'Markdown content');
      await r2Bucket.put('folder/nested.txt', 'Inside a folder');

      const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}`, BASE_URL).toString();
      const response = await fetch(targetUrl);

      expect(response.status).toBe(200);
      const json: any = await response.json();

      expect(json.objects).toBeInstanceOf(Array);
      expect(json.objects.length).toBe(3);
      // Order isn't guaranteed, so check for presence
      expect(json.objects.some((o: any) => o.key === 'file1.txt')).toBe(true);
      expect(json.objects.some((o: any) => o.key === 'another-file.md')).toBe(true);
      expect(json.objects.some((o: any) => o.key === 'folder/nested.txt')).toBe(true);

      // Check properties of one object (optional, depends on what ListObjects returns)
      const file1 = json.objects.find((o: any) => o.key === 'file1.txt');
      expect(file1.size).toBe('This is file1'.length); // R2Object includes size
      // Add more checks for etag, uploaded time if available and stable for tests
    });
  });

// ----- Start of content to append -----

describe('PutObject (POST /api/buckets/:bucket/upload)', () => {
  it('should upload a file to the root of the bucket', async () => {
    const fileName = 'test-upload.txt';
    const fileContent = 'Hello R2!';
    const file = new File([fileContent], fileName, { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', file);

    const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}/upload`, BASE_URL).toString();
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(201);
    const json: any = await response.json();
    expect(json.key).toBe(fileName);
    expect(json.size).toBe(fileContent.length);

    const r2Object = await r2Bucket.get(fileName);
    expect(r2Object).not.toBeNull();
    expect(await r2Object?.text()).toBe(fileContent);
    expect(r2Object?.httpMetadata?.contentType).toBe('text/plain');
  });

  it('should upload a file to a specified path (folder)', async () => {
    const fileName = 'file-in-folder.txt';
    const folderName = 'my-folder';
    const fileContent = 'Content in a folder';
    const file = new File([fileContent], fileName, { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', folderName + '/');

    const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}/upload`, BASE_URL).toString();
    const response = await fetch(targetUrl, { method: 'POST', body: formData });

    expect(response.status).toBe(201);
    const json: any = await response.json();
    const expectedKey = `${folderName}/${fileName}`;
    expect(json.key).toBe(expectedKey);

    const r2Object = await r2Bucket.get(expectedKey);
    expect(r2Object).not.toBeNull();
    expect(await r2Object?.text()).toBe(fileContent);
  });
});

describe('GetObject (GET /api/buckets/:bucket/:key)', () => {
  it('should download an existing file', async () => {
    const fileName = 'download-me.txt';
    const fileContent = 'File content to download';
    await r2Bucket.put(fileName, fileContent, {
      httpMetadata: { contentType: 'text/plain' },
    });

    const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}/${encodeURIComponent(fileName)}`, BASE_URL).toString();
    const response = await fetch(targetUrl);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(fileContent);
    expect(response.headers.get('content-type')).toContain('text/plain');
  });

  it('should return 404 for a non-existent file', async () => {
    const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}/non-existent-file.txt`, BASE_URL).toString();
    const response = await fetch(targetUrl);
    expect(response.status).toBe(404);
  });
});

describe('DeleteObject (POST /api/buckets/:bucket/delete)', () => {
  it('should delete specified files', async () => {
    const file1 = 'to-delete-1.txt';
    const file2 = 'folder/to-delete-2.txt';
    await r2Bucket.put(file1, 'delete content 1');
    await r2Bucket.put(file2, 'delete content 2');

    const deletePayload = { keys: [file1, file2] };
    const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}/delete`, BASE_URL).toString();
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deletePayload),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.deleted.map((d: any) => d.key).sort()).toEqual([file1, file2].sort());
    expect(json.failed).toEqual([]);

    expect(await r2Bucket.get(file1)).toBeNull();
    expect(await r2Bucket.get(file2)).toBeNull();
  });

  it('should handle deletion of non-existent keys gracefully', async () => {
    const file1 = 'exists-for-delete.txt';
    await r2Bucket.put(file1, 'delete content');
    const nonExistentFile = 'does-not-exist.txt';

    const deletePayload = { keys: [file1, nonExistentFile] };
    const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}/delete`, BASE_URL).toString();
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deletePayload),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.deleted.map((d: any) => d.key)).toEqual([file1]);
    expect(json.failed.length).toBe(1);
    expect(json.failed[0].key).toBe(nonExistentFile);

    expect(await r2Bucket.get(file1)).toBeNull();
  });
});

describe('HeadObject (HEAD /api/buckets/:bucket/:key)', () => {
  it('should return headers for an existing file', async () => {
    const fileName = 'head-test.txt';
    const fileContent = 'content for head test';
    const contentType = 'text/plain; charset=custom';
    const r2PutResponse = await r2Bucket.put(fileName, fileContent, {
      httpMetadata: { contentType },
    });

    const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}/${encodeURIComponent(fileName)}`, BASE_URL).toString();
    const response = await fetch(targetUrl, { method: 'HEAD' });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(contentType);
    expect(response.headers.get('content-length')).toBe(String(fileContent.length));
    expect(response.headers.get('etag')).toBe(r2PutResponse.httpEtag);
    expect(await response.text()).toBe('');
  });

  it('should return 404 for a non-existent file (HEAD)', async () => {
    const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}/non-existent-head.txt`, BASE_URL).toString();
    const response = await fetch(targetUrl, { method: 'HEAD' });
    expect(response.status).toBe(404);
  });
});

describe('GetObjectHead (GET /api/buckets/:bucket/:key/head)', () => {
  it('should return headers for an existing file using GET alias', async () => {
    const fileName = 'get-head-test.txt';
    const fileContent = 'content for get-head test';
    const contentType = 'application/octet-stream';
    const r2PutResponse = await r2Bucket.put(fileName, fileContent, {
      httpMetadata: { contentType },
    });

    const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}/${encodeURIComponent(fileName)}/head`, BASE_URL).toString();
    const response = await fetch(targetUrl, { method: 'GET' });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(contentType);
    expect(response.headers.get('content-length')).toBe(String(fileContent.length));
    expect(response.headers.get('etag')).toBe(r2PutResponse.httpEtag);
    expect(await response.text()).toBe('');
  });
});

describe('CreateFolder (POST /api/buckets/:bucket/folder)', () => {
  it('should create a new folder (zero-byte object with trailing slash)', async () => {
    const folderPath = 'newly-created-folder/';

    const createFolderPayload = { path: folderPath };
    const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}/folder`, BASE_URL).toString();
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createFolderPayload),
    });

    expect(response.status).toBe(201);
    const json: any = await response.json();
    expect(json.key).toBe(folderPath);
    expect(json.size).toBe(0);

    const r2Object = await r2Bucket.get(folderPath);
    expect(r2Object).not.toBeNull();
    expect(r2Object?.size).toBe(0);
  });

  it('should return 400 if path is missing or not ending with /', async () => {
    const targetUrl = new URL(`api/buckets/${BUCKET_BINDING_NAME}/folder`, BASE_URL).toString();

    let res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Missing path
    });
    expect(res.status).toBe(400);

    res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'not-a-folder' }), // Path not ending with /
    });
    expect(res.status).toBe(400);
  });
});

// ----- End of content to append -----
});
