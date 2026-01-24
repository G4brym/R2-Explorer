import type { Context } from "hono";

// Auth modes - simplified: session or disabled only
export type AuthMode = "session" | "disabled";

// Minimal config - only essential settings
export type R2ExplorerConfig = {
	auth?: AuthMode;
	readonly?: boolean; // Default: true
	cors?: boolean; // Default: false
	emailRouting?:
		| {
				targetBucket: string;
		  }
		| false;
};

// Environment bindings
export type AppEnv = {
	ASSETS: Fetcher;
	R2_EXPLORER_DB?: D1Database; // Required for session auth
	[key: string]: R2Bucket | Fetcher | D1Database | undefined;
};

// Data models
export type User = {
	id: string;
	email: string;
	passwordHash?: string; // Only for internal use, not exposed in API
	isAdmin: boolean;
	createdAt: number;
	updatedAt: number;
};

export type Session = {
	id: string;
	userId: string;
	email: string;
	isAdmin: boolean;
	expiresAt: number;
};

export type BucketAccess = {
	userId: string;
	bucketName: string;
	role: "owner" | "admin" | "write" | "read";
};

export type AppSettings = {
	showHiddenFiles: boolean;
	registerEnabled: boolean | null; // null = smart mode (first user only)
	recoveryEmailFrom: string | null;
	recoveryEmailEnabled: boolean;
	// App toggles
	appDriveEnabled: boolean;
	appEmailEnabled: boolean;
	appNotesEnabled: boolean;
};

// Context variables
export type AppVariables = {
	config: R2ExplorerConfig;
	authMode: AuthMode;
	authentication_type?: "session";
	authentication_username?: string;
	session?: Session;
	user?: User;
	db?: D1Database;
};

export type AppContext = Context<{ Bindings: AppEnv; Variables: AppVariables }>;
