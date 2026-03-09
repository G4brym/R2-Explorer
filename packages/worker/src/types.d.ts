import type { CloudflareAccessVariables } from "@hono/cloudflare-access";
import type { Context } from "hono";

export type BasicAuthType = {
	username: string;
	password: string;
};

export type BucketConfig = {
	publicUrl?: string;
};

export type R2ExplorerConfig = {
	readonly?: boolean;
	cors?: boolean;
	cfAccessTeamName?: string;
	dashboardUrl?: string;
	emailRouting?:
		| {
				targetBucket: string;
		  }
		| false;
	showHiddenFiles?: boolean;
	basicAuth?: BasicAuth | BasicAuth[];
	buckets?: Record<string, BucketConfig>;
};

export type ShareMetadata = {
	bucket: string;
	key: string;
	expiresAt?: number;
	passwordHash?: string;
	maxDownloads?: number;
	currentDownloads: number;
	createdBy: string;
	createdAt: number;
};

export type AppEnv = {
	ASSETS: Fetcher;
	[key: string]: R2Bucket;
};
export type AppVariables = {
	config: R2ExplorerConfig;
	authentication_type?: string;
	authentication_username?: string;
} & CloudflareAccessVariables;
export type AppContext = Context<{ Bindings: AppEnv; Variables: AppVariables }>;
