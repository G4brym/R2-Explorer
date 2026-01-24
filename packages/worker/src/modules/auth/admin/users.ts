import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { DatabaseService } from "../../../services/database";
import type { AppContext } from "../../../types";
import { hashPassword } from "../../../utils/password";

export class ListUsers extends OpenAPIRoute {
	schema = {
		operationId: "admin-list-users",
		tags: ["Admin"],
		summary: "List all users (admin only)",
		responses: {
			"200": {
				description: "List of users",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							users: z.array(
								z.object({
									id: z.string(),
									email: z.string(),
									isAdmin: z.boolean(),
									createdAt: z.number(),
									updatedAt: z.number(),
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

		const dbService = new DatabaseService(db);
		const users = await dbService.listUsers();

		return c.json({
			success: true,
			users,
		});
	}
}

export class CreateUser extends OpenAPIRoute {
	schema = {
		operationId: "admin-create-user",
		tags: ["Admin"],
		summary: "Create a new user (admin only)",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							email: z.string().email(),
							password: z.string().min(8),
							isAdmin: z.boolean().optional().default(false),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "User created",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							user: z.object({
								id: z.string(),
								email: z.string(),
								isAdmin: z.boolean(),
							}),
						}),
					},
				},
			},
			"400": {
				description: "User creation failed",
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
		const { email, password, isAdmin } = data.body;

		const dbService = new DatabaseService(db);

		// Check if user already exists
		const existingUser = await dbService.getUserByEmail(email);
		if (existingUser) {
			return c.json(
				{
					success: false,
					error: "A user with this email already exists",
				},
				{ status: 400 },
			);
		}

		const passwordHash = await hashPassword(password);
		const user = await dbService.createUser(email, passwordHash, isAdmin);

		return c.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				isAdmin: user.isAdmin,
			},
		});
	}
}

export class UpdateUser extends OpenAPIRoute {
	schema = {
		operationId: "admin-update-user",
		tags: ["Admin"],
		summary: "Update a user (admin only)",
		request: {
			params: z.object({
				userId: z.string(),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							email: z.string().email().optional(),
							password: z.string().min(8).optional(),
							isAdmin: z.boolean().optional(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "User updated",
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
		const { userId } = data.params;
		const { email, password, isAdmin } = data.body;

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

		// Check email uniqueness if changing
		if (email && email !== user.email) {
			const existingUser = await dbService.getUserByEmail(email);
			if (existingUser) {
				return c.json(
					{
						success: false,
						error: "A user with this email already exists",
					},
					{ status: 400 },
				);
			}
		}

		// Update user
		if (email !== undefined || isAdmin !== undefined) {
			await dbService.updateUser(userId, { email, isAdmin });
		}

		// Update password if provided
		if (password) {
			const passwordHash = await hashPassword(password);
			await dbService.updatePassword(userId, passwordHash);
		}

		return c.json({
			success: true,
		});
	}
}

export class DeleteUser extends OpenAPIRoute {
	schema = {
		operationId: "admin-delete-user",
		tags: ["Admin"],
		summary: "Delete a user (admin only)",
		request: {
			params: z.object({
				userId: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "User deleted",
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

		// Prevent deleting self
		const session = c.get("session");
		if (session && session.userId === userId) {
			return c.json(
				{
					success: false,
					error: "Cannot delete your own account",
				},
				{ status: 400 },
			);
		}

		await dbService.deleteUser(userId);

		return c.json({
			success: true,
		});
	}
}
