import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { DatabaseService } from "../../../services/database";
import type { AppContext } from "../../../types";

const roleEnum = z.enum(["owner", "admin", "write", "read"]);

export class ListUserAccess extends OpenAPIRoute {
	schema = {
		operationId: "admin-list-user-access",
		tags: ["Admin"],
		summary: "List bucket access for a user (admin only)",
		request: {
			params: z.object({
				userId: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "List of bucket access",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							access: z.array(
								z.object({
									bucketName: z.string(),
									role: roleEnum,
								}),
							),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.R2_EXPLORER_DB;
		if (!db) {
			return c.json(
				{
					success: false,
					error: "Database not configured",
				},
				{ status: 500 },
			);
		}

		const data = await this.getValidatedData<typeof this.schema>();
		const { userId } = data.params;

		const dbService = new DatabaseService(db);

		// Check if user exists
		const user = await dbService.getUserById(userId);
		if (!user) {
			return c.json(
				{
					success: false,
					error: "User not found",
				},
				{ status: 404 },
			);
		}

		const buckets = await dbService.getUserBuckets(userId);

		return c.json({
			success: true,
			access: buckets.map((b) => ({
				bucketName: b.bucketName,
				role: b.role,
			})),
		});
	}
}

export class GrantAccess extends OpenAPIRoute {
	schema = {
		operationId: "admin-grant-access",
		tags: ["Admin"],
		summary: "Grant bucket access to a user (admin only)",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							userId: z.string(),
							bucketName: z.string(),
							role: roleEnum,
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Access granted",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
						}),
					},
				},
			},
			"404": {
				description: "User not found",
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.R2_EXPLORER_DB;
		if (!db) {
			return c.json(
				{
					success: false,
					error: "Database not configured",
				},
				{ status: 500 },
			);
		}

		const data = await this.getValidatedData<typeof this.schema>();
		const { userId, bucketName, role } = data.body;

		const dbService = new DatabaseService(db);

		// Check if user exists
		const user = await dbService.getUserById(userId);
		if (!user) {
			return c.json(
				{
					success: false,
					error: "User not found",
				},
				{ status: 404 },
			);
		}

		// Verify bucket exists in the environment
		const bucket = c.env[bucketName];
		if (!bucket || bucket.constructor.name !== "R2Bucket") {
			return c.json(
				{
					success: false,
					error: "Bucket not found",
				},
				{ status: 404 },
			);
		}

		await dbService.grantAccess(userId, bucketName, role);

		return c.json({
			success: true,
		});
	}
}

export class RevokeAccess extends OpenAPIRoute {
	schema = {
		operationId: "admin-revoke-access",
		tags: ["Admin"],
		summary: "Revoke bucket access from a user (admin only)",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							userId: z.string(),
							bucketName: z.string(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Access revoked",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.R2_EXPLORER_DB;
		if (!db) {
			return c.json(
				{
					success: false,
					error: "Database not configured",
				},
				{ status: 500 },
			);
		}

		const data = await this.getValidatedData<typeof this.schema>();
		const { userId, bucketName } = data.body;

		const dbService = new DatabaseService(db);
		await dbService.revokeAccess(userId, bucketName);

		return c.json({
			success: true,
		});
	}
}
