import type { AppSettings, BucketAccess, Session, User } from "../types";

const SCHEMA = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- User bucket access (RBAC)
CREATE TABLE IF NOT EXISTS user_buckets (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bucket_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'write', 'read')),
    PRIMARY KEY (user_id, bucket_name)
);
CREATE INDEX IF NOT EXISTS idx_user_buckets_user_id ON user_buckets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_buckets_bucket_name ON user_buckets(bucket_name);

-- Runtime settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Password recovery tokens
CREATE TABLE IF NOT EXISTS recovery_tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_expires_at ON recovery_tokens(expires_at);
`;

// Session duration: 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
// Recovery token duration: 1 hour
const RECOVERY_TOKEN_DURATION_MS = 60 * 60 * 1000;

function generateId(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}

export class DatabaseService {
	private db: D1Database;
	private migrationRun = false;

	constructor(db: D1Database) {
		this.db = db;
	}

	// Migrations
	async runMigrations(): Promise<void> {
		if (this.migrationRun) return;

		const statements = SCHEMA.split(";")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		for (const statement of statements) {
			await this.db.prepare(statement).run();
		}

		this.migrationRun = true;
	}

	// Users
	async hasUsers(): Promise<boolean> {
		const result = await this.db
			.prepare("SELECT COUNT(*) as count FROM users")
			.first<{ count: number }>();
		return (result?.count || 0) > 0;
	}

	async createUser(
		email: string,
		passwordHash: string,
		isAdmin: boolean,
	): Promise<User> {
		const id = generateId();
		const now = Date.now();

		await this.db
			.prepare(
				"INSERT INTO users (id, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
			)
			.bind(id, email.toLowerCase(), passwordHash, isAdmin ? 1 : 0, now, now)
			.run();

		return {
			id,
			email: email.toLowerCase(),
			isAdmin,
			createdAt: now,
			updatedAt: now,
		};
	}

	async getUserById(id: string): Promise<User | null> {
		const result = await this.db
			.prepare(
				"SELECT id, email, is_admin, created_at, updated_at FROM users WHERE id = ?",
			)
			.bind(id)
			.first<{
				id: string;
				email: string;
				is_admin: number;
				created_at: number;
				updated_at: number;
			}>();

		if (!result) return null;

		return {
			id: result.id,
			email: result.email,
			isAdmin: result.is_admin === 1,
			createdAt: result.created_at,
			updatedAt: result.updated_at,
		};
	}

	async getUserByEmail(email: string): Promise<User | null> {
		const result = await this.db
			.prepare(
				"SELECT id, email, is_admin, created_at, updated_at FROM users WHERE email = ?",
			)
			.bind(email.toLowerCase())
			.first<{
				id: string;
				email: string;
				is_admin: number;
				created_at: number;
				updated_at: number;
			}>();

		if (!result) return null;

		return {
			id: result.id,
			email: result.email,
			isAdmin: result.is_admin === 1,
			createdAt: result.created_at,
			updatedAt: result.updated_at,
		};
	}

	async getUserWithPassword(
		email: string,
	): Promise<{ user: User; passwordHash: string } | null> {
		const result = await this.db
			.prepare(
				"SELECT id, email, password_hash, is_admin, created_at, updated_at FROM users WHERE email = ?",
			)
			.bind(email.toLowerCase())
			.first<{
				id: string;
				email: string;
				password_hash: string;
				is_admin: number;
				created_at: number;
				updated_at: number;
			}>();

		if (!result) return null;

		return {
			user: {
				id: result.id,
				email: result.email,
				isAdmin: result.is_admin === 1,
				createdAt: result.created_at,
				updatedAt: result.updated_at,
			},
			passwordHash: result.password_hash,
		};
	}

	async updatePassword(userId: string, passwordHash: string): Promise<void> {
		const now = Date.now();
		await this.db
			.prepare(
				"UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
			)
			.bind(passwordHash, now, userId)
			.run();
	}

	async listUsers(): Promise<User[]> {
		const result = await this.db
			.prepare(
				"SELECT id, email, is_admin, created_at, updated_at FROM users ORDER BY created_at DESC",
			)
			.all<{
				id: string;
				email: string;
				is_admin: number;
				created_at: number;
				updated_at: number;
			}>();

		return (result.results || []).map((row) => ({
			id: row.id,
			email: row.email,
			isAdmin: row.is_admin === 1,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}));
	}

	async updateUser(
		userId: string,
		updates: { email?: string; isAdmin?: boolean },
	): Promise<void> {
		const now = Date.now();
		const sets: string[] = ["updated_at = ?"];
		const values: (string | number)[] = [now];

		if (updates.email !== undefined) {
			sets.push("email = ?");
			values.push(updates.email.toLowerCase());
		}

		if (updates.isAdmin !== undefined) {
			sets.push("is_admin = ?");
			values.push(updates.isAdmin ? 1 : 0);
		}

		values.push(userId);

		await this.db
			.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`)
			.bind(...values)
			.run();
	}

	async deleteUser(userId: string): Promise<void> {
		await this.db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
	}

	// Sessions
	async createSession(
		userId: string,
		email: string,
		isAdmin: boolean,
	): Promise<Session> {
		const id = generateId();
		const now = Date.now();
		const expiresAt = now + SESSION_DURATION_MS;

		await this.db
			.prepare(
				"INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
			)
			.bind(id, userId, expiresAt, now)
			.run();

		return {
			id,
			userId,
			email,
			isAdmin,
			expiresAt,
		};
	}

	async getSession(sessionId: string): Promise<Session | null> {
		const result = await this.db
			.prepare(
				`SELECT s.id, s.user_id, s.expires_at, u.email, u.is_admin
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.expires_at > ?`,
			)
			.bind(sessionId, Date.now())
			.first<{
				id: string;
				user_id: string;
				expires_at: number;
				email: string;
				is_admin: number;
			}>();

		if (!result) return null;

		return {
			id: result.id,
			userId: result.user_id,
			email: result.email,
			isAdmin: result.is_admin === 1,
			expiresAt: result.expires_at,
		};
	}

	async deleteSession(sessionId: string): Promise<void> {
		await this.db
			.prepare("DELETE FROM sessions WHERE id = ?")
			.bind(sessionId)
			.run();
	}

	async deleteUserSessions(userId: string): Promise<void> {
		await this.db
			.prepare("DELETE FROM sessions WHERE user_id = ?")
			.bind(userId)
			.run();
	}

	async deleteExpiredSessions(): Promise<void> {
		await this.db
			.prepare("DELETE FROM sessions WHERE expires_at < ?")
			.bind(Date.now())
			.run();
	}

	// Bucket Access
	async grantAccess(
		userId: string,
		bucketName: string,
		role: BucketAccess["role"],
	): Promise<void> {
		await this.db
			.prepare(
				"INSERT OR REPLACE INTO user_buckets (user_id, bucket_name, role) VALUES (?, ?, ?)",
			)
			.bind(userId, bucketName, role)
			.run();
	}

	async revokeAccess(userId: string, bucketName: string): Promise<void> {
		await this.db
			.prepare("DELETE FROM user_buckets WHERE user_id = ? AND bucket_name = ?")
			.bind(userId, bucketName)
			.run();
	}

	async getUserAccess(
		userId: string,
		bucketName: string,
	): Promise<BucketAccess | null> {
		const result = await this.db
			.prepare(
				"SELECT user_id, bucket_name, role FROM user_buckets WHERE user_id = ? AND bucket_name = ?",
			)
			.bind(userId, bucketName)
			.first<{ user_id: string; bucket_name: string; role: string }>();

		if (!result) return null;

		return {
			userId: result.user_id,
			bucketName: result.bucket_name,
			role: result.role as BucketAccess["role"],
		};
	}

	async getUserBuckets(userId: string): Promise<BucketAccess[]> {
		const result = await this.db
			.prepare(
				"SELECT user_id, bucket_name, role FROM user_buckets WHERE user_id = ?",
			)
			.bind(userId)
			.all<{ user_id: string; bucket_name: string; role: string }>();

		return (result.results || []).map((row) => ({
			userId: row.user_id,
			bucketName: row.bucket_name,
			role: row.role as BucketAccess["role"],
		}));
	}

	// Settings
	async getSetting(key: string): Promise<string | null> {
		const result = await this.db
			.prepare("SELECT value FROM settings WHERE key = ?")
			.bind(key)
			.first<{ value: string }>();

		return result?.value || null;
	}

	async setSetting(key: string, value: string): Promise<void> {
		const now = Date.now();
		await this.db
			.prepare(
				"INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
			)
			.bind(key, value, now)
			.run();
	}

	async getAllSettings(): Promise<AppSettings> {
		const result = await this.db
			.prepare("SELECT key, value FROM settings")
			.all<{ key: string; value: string }>();

		const settingsMap = new Map<string, string>();
		for (const row of result.results || []) {
			settingsMap.set(row.key, row.value);
		}

		// Helper to check if a setting is explicitly set to false
		const isEnabled = (key: string, defaultValue = true): boolean => {
			const value = settingsMap.get(key);
			if (value === undefined) return defaultValue;
			return value === "true";
		};

		// Parse registerEnabled - undefined or "null" means smart mode (null)
		const registerEnabledValue = settingsMap.get("registerEnabled");
		let registerEnabled: boolean | null = null;
		if (
			registerEnabledValue !== undefined &&
			registerEnabledValue !== "null"
		) {
			registerEnabled = registerEnabledValue === "true";
		}

		return {
			showHiddenFiles: settingsMap.get("showHiddenFiles") === "true",
			registerEnabled,
			recoveryEmailFrom: settingsMap.get("recoveryEmailFrom") || null,
			recoveryEmailEnabled: settingsMap.get("recoveryEmailEnabled") === "true",
			// App toggles (default to true)
			appDriveEnabled: isEnabled("appDriveEnabled", true),
			appEmailEnabled: isEnabled("appEmailEnabled", true),
			appNotesEnabled: isEnabled("appNotesEnabled", true),
		};
	}

	// Recovery tokens
	async createRecoveryToken(userId: string): Promise<string> {
		const token = generateId();
		const now = Date.now();
		const expiresAt = now + RECOVERY_TOKEN_DURATION_MS;

		// Delete any existing tokens for this user
		await this.db
			.prepare("DELETE FROM recovery_tokens WHERE user_id = ?")
			.bind(userId)
			.run();

		await this.db
			.prepare(
				"INSERT INTO recovery_tokens (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
			)
			.bind(token, userId, expiresAt, now)
			.run();

		return token;
	}

	async getRecoveryToken(
		token: string,
	): Promise<{ userId: string; expiresAt: number } | null> {
		const result = await this.db
			.prepare(
				"SELECT user_id, expires_at FROM recovery_tokens WHERE token = ? AND expires_at > ?",
			)
			.bind(token, Date.now())
			.first<{ user_id: string; expires_at: number }>();

		if (!result) return null;

		return {
			userId: result.user_id,
			expiresAt: result.expires_at,
		};
	}

	async deleteRecoveryToken(token: string): Promise<void> {
		await this.db
			.prepare("DELETE FROM recovery_tokens WHERE token = ?")
			.bind(token)
			.run();
	}

	async deleteExpiredRecoveryTokens(): Promise<void> {
		await this.db
			.prepare("DELETE FROM recovery_tokens WHERE expires_at < ?")
			.bind(Date.now())
			.run();
	}
}
