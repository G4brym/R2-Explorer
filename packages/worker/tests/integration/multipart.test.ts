import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp, createTestRequest } from "./setup";
import { env, createExecutionContext } from "cloudflare:test";
import { Buffer } from "node:buffer"; // For btoa

// Helper to create a part for upload
async function createPart(content: string): Promise<Blob> {
    return new Blob([content]);
}

describe("Multipart Upload Endpoints", () => {
    let app: ReturnType<typeof createTestApp>;
    let MY_TEST_BUCKET_1: R2Bucket;
    const BUCKET_NAME = "MY_TEST_BUCKET_1"; // Consistent bucket name

    beforeEach(async () => {
        app = createTestApp();
        MY_TEST_BUCKET_1 = env.MY_TEST_BUCKET_1;

        if (MY_TEST_BUCKET_1) {
            const listed = await MY_TEST_BUCKET_1.list();
            const keysToDelete = listed.objects.map((obj) => obj.key);
            if (keysToDelete.length > 0) {
                await MY_TEST_BUCKET_1.delete(keysToDelete);
            }
            // Abort lingering multipart uploads - this needs to be conditional
            // as listMultipartUploads might not be available in all test envs or fully mocked.
            // if (typeof MY_TEST_BUCKET_1.listMultipartUploads === 'function') {
            //     const multipartUploads = await MY_TEST_BUCKET_1.listMultipartUploads();
            //     for (const upload of multipartUploads.uploads) {
            //        if (typeof MY_TEST_BUCKET_1.abortMultipartUpload === 'function') {
            //             await MY_TEST_BUCKET_1.abortMultipartUpload(upload.key, upload.uploadId);
            //        }
            //     }
            // }
        } else {
            console.warn("MY_TEST_BUCKET_1 binding not found in beforeEach.");
        }
    });

    afterEach(async () => {
        if (MY_TEST_BUCKET_1) {
            const listed = await MY_TEST_BUCKET_1.list();
            const keysToDelete = listed.objects.map((obj) => obj.key);
            if (keysToDelete.length > 0) {
                await MY_TEST_BUCKET_1.delete(keysToDelete);
            }
            // if (typeof MY_TEST_BUCKET_1.listMultipartUploads === 'function') {
            //     const multipartUploads = await MY_TEST_BUCKET_1.listMultipartUploads();
            //     for (const upload of multipartUploads.uploads) {
            //         if (typeof MY_TEST_BUCKET_1.abortMultipartUpload === 'function') {
            //             await MY_TEST_BUCKET_1.abortMultipartUpload(upload.key, upload.uploadId);
            //         }
            //     }
            // }
        }
    });

    describe("CreateUpload (POST /api/buckets/:bucket/multipart/create)", () => {
        it("should successfully create a multipart upload", async () => {
            if (!MY_TEST_BUCKET_1) throw new Error("MY_TEST_BUCKET_1 not available");

            const objectKey = "multipart-test.dat";
            const base64ObjectKey = btoa(objectKey);

            const request = createTestRequest(
                `/api/buckets/${BUCKET_NAME}/multipart/create?key=${encodeURIComponent(base64ObjectKey)}`,
                "POST",
                undefined,
                { "Content-Type": "application/json" }
            );

            const response = await app.fetch(request, env, createExecutionContext());
            expect(response.status).toBe(200);

            const body = await response.json() as { key: string; uploadId: string };
            expect(body.key).toBe(objectKey);
            expect(body.uploadId).toBeDefined();
            expect(typeof body.uploadId).toBe("string");
        });

        it("should return 500 for a non-existent bucket", async () => {
            const objectKey = "multipart-test-nobucket.dat";
            const base64ObjectKey = btoa(objectKey);

            const request = createTestRequest(
                `/api/buckets/NON_EXISTENT_BUCKET/multipart/create?key=${encodeURIComponent(base64ObjectKey)}`,
                "POST",
                undefined,
                { "Content-Type": "application/json" }
            );

            const response = await app.fetch(request, env, createExecutionContext());
            expect(response.status).toBe(500);
            const errorText = await response.text();
            expect(errorText).toContain("Internal Server Error");
        });

        it("should return 400 if key is missing", async () => {
            const request = createTestRequest(
                `/api/buckets/${BUCKET_NAME}/multipart/create`,
                "POST",
                undefined,
                { "Content-Type": "application/json" }
            );

            const response = await app.fetch(request, env, createExecutionContext());
            expect(response.status).toBe(400);
        });
    });

    describe("PartUpload (POST /api/buckets/:bucket/multipart/upload)", () => {
        let uploadId: string;
        let objectKey: string;
        let base64ObjectKey: string;

        beforeEach(async () => {
            if (!MY_TEST_BUCKET_1) throw new Error("MY_TEST_BUCKET_1 not available for PartUpload beforeEach");
            objectKey = "part-upload-test.dat";
            base64ObjectKey = btoa(objectKey);

            // Create an upload
            const createResponse = await app.fetch(createTestRequest(
                `/api/buckets/${BUCKET_NAME}/multipart/create?key=${encodeURIComponent(base64ObjectKey)}`,
                "POST", undefined, { "Content-Type": "application/json" }
            ), env, createExecutionContext());
            const createBody = await createResponse.json() as { key: string; uploadId: string };
            uploadId = createBody.uploadId;
        });

        it("should successfully upload a part", async () => {
            const partNumber = 1;
            const partDataString = "This is part one.";
            const partData = await createPart(partDataString);

            const request = createTestRequest(
                `/api/buckets/${BUCKET_NAME}/multipart/upload?key=${encodeURIComponent(base64ObjectKey)}&uploadId=${uploadId}&partNumber=${partNumber}`,
                "POST",
                partData,
                { "Content-Type": "application/octet-stream" }
            );

            const response = await app.fetch(request, env, createExecutionContext());
            expect(response.status).toBe(200);
            const body = await response.json() as { etag: string, partNumber: number };
            expect(body.etag).toBeTypeOf("string");
            expect(body.etag).not.toBe("");
            expect(body.partNumber).toBe(partNumber);
        });

        it("should return 400 for a non-existent uploadId", async () => {
            const partNumber = 1;
            const partData = await createPart("data");
            const fakeUploadId = "fake-upload-id";

            const request = createTestRequest(
                `/api/buckets/${BUCKET_NAME}/multipart/upload?key=${encodeURIComponent(base64ObjectKey)}&uploadId=${fakeUploadId}&partNumber=${partNumber}`,
                "POST",
                partData,
                { "Content-Type": "application/octet-stream" }
            );
            const response = await app.fetch(request, env, createExecutionContext());
            expect(response.status).toBe(400); // R2 typically errors if uploadId is not found
            const errorText = await response.text();
            expect(errorText).toMatch(/The specified multipart upload does not exist/i);
        });

        it("should return 400 if partNumber is missing", async () => {
            const partData = await createPart("data");
            const request = createTestRequest(
                `/api/buckets/${BUCKET_NAME}/multipart/upload?key=${encodeURIComponent(base64ObjectKey)}&uploadId=${uploadId}`, // Missing partNumber
                "POST",
                partData,
                { "Content-Type": "application/octet-stream" }
            );
            const response = await app.fetch(request, env, createExecutionContext());
            expect(response.status).toBe(400); // Zod validation
        });

        it("should return 500 for a non-existent bucket", async () => {
            const partNumber = 1;
            const partData = await createPart("data");
            const request = createTestRequest(
                `/api/buckets/NON_EXISTENT_BUCKET/multipart/upload?key=${encodeURIComponent(base64ObjectKey)}&uploadId=${uploadId}&partNumber=${partNumber}`,
                "POST",
                partData,
                { "Content-Type": "application/octet-stream" }
            );
            const response = await app.fetch(request, env, createExecutionContext());
            expect(response.status).toBe(500);
            const errorText = await response.text();
            expect(errorText).toContain("Internal Server Error");
        });
    });

    describe("CompleteUpload (POST /api/buckets/:bucket/multipart/complete)", () => {
        let uploadId: string;
        let objectKey: string;
        let base64ObjectKey: string;
        let part1Etag: string;
        const part1Content = "This is the first part.";
        const part1Number = 1;

        beforeEach(async () => {
            if (!MY_TEST_BUCKET_1) throw new Error("MY_TEST_BUCKET_1 not available for CompleteUpload beforeEach");
            objectKey = "complete-upload-test.txt";
            base64ObjectKey = btoa(objectKey);

            // 1. Create an upload
            const createResponse = await app.fetch(createTestRequest(
                `/api/buckets/${BUCKET_NAME}/multipart/create?key=${encodeURIComponent(base64ObjectKey)}`,
                "POST", undefined, { "Content-Type": "application/json" }
            ), env, createExecutionContext());
            const createBody = await createResponse.json() as { key: string; uploadId: string };
            uploadId = createBody.uploadId;

            // 2. Upload a part
            const partData = await createPart(part1Content);
            const partUploadRequest = createTestRequest(
                `/api/buckets/${BUCKET_NAME}/multipart/upload?key=${encodeURIComponent(base64ObjectKey)}&uploadId=${uploadId}&partNumber=${part1Number}`,
                "POST", partData, { "Content-Type": "application/octet-stream" }
            );
            const partUploadResponse = await app.fetch(partUploadRequest, env, createExecutionContext());
            const partUploadBody = await partUploadResponse.json() as { etag: string, partNumber: number };
            part1Etag = partUploadBody.etag;
        });

        it("should successfully complete a multipart upload", async () => {
            const completeBody = {
                key: base64ObjectKey,
                uploadId: uploadId,
                parts: [{ partNumber: part1Number, etag: part1Etag }]
            };
            const request = createTestRequest(
                `/api/buckets/${BUCKET_NAME}/multipart/complete`,
                "POST",
                completeBody,
                { "Content-Type": "application/json" }
            );

            const response = await app.fetch(request, env, createExecutionContext());
            expect(response.status).toBe(200);
            const responseBody = await response.json() as { success: boolean, str: any }; // str should be R2Object
            expect(responseBody.success).toBe(true);
            expect(responseBody.str.key).toBe(objectKey);
            expect(responseBody.str.size).toBe(part1Content.length);

            // Verify object content in R2 (requires R2 get to be working in test env)
            // const r2Object = await MY_TEST_BUCKET_1.get(objectKey);
            // expect(r2Object).not.toBeNull();
            // if (r2Object) {
            //     const text = await r2Object.text();
            //     expect(text).toBe(part1Content);
            // }
        });

        it("should return 400 for completion with incorrect ETag", async () => {
            const completeBody = {
                key: base64ObjectKey,
                uploadId: uploadId,
                parts: [{ partNumber: part1Number, etag: "fake-etag-does-not-exist-123" }]
            };
            const request = createTestRequest(
                `/api/buckets/${BUCKET_NAME}/multipart/complete`,
                "POST", completeBody, { "Content-Type": "application/json" }
            );
            const response = await app.fetch(request, env, createExecutionContext());
            expect(response.status).toBe(400);
            const errorBody = await response.json() as {msg: string};
            // R2 error messages can vary, check for common patterns
            expect(errorBody.msg).toMatch(/One or more of the specified parts could not be found/i);
        });

        it("should return 400 for completion with non-existent uploadId", async () => {
            const completeBody = {
                key: base64ObjectKey,
                uploadId: "fake-upload-id-does-not-exist",
                parts: [{ partNumber: part1Number, etag: part1Etag }]
            };
            const request = createTestRequest(
                `/api/buckets/${BUCKET_NAME}/multipart/complete`,
                "POST", completeBody, { "Content-Type": "application/json" }
            );
            const response = await app.fetch(request, env, createExecutionContext());
            expect(response.status).toBe(400); // The handler catches errors and returns 400 with JSON
            const errorBody = await response.json() as {msg: string};
             expect(errorBody.msg).toMatch(/We encountered an internal error/i); // Or more specific if R2 changes
        });

        it("should return 500 for completion on a non-existent bucket", async () => {
            const completeBody = {
                key: base64ObjectKey,
                uploadId: uploadId,
                parts: [{ partNumber: part1Number, etag: part1Etag }]
            };
            const request = createTestRequest(
                `/api/buckets/NON_EXISTENT_BUCKET/multipart/complete`,
                "POST", completeBody, { "Content-Type": "application/json" }
            );
            const response = await app.fetch(request, env, createExecutionContext());
            expect(response.status).toBe(500);
            const errorText = await response.text();
            expect(errorText).toContain("Internal Server Error");
        });
    });
});
