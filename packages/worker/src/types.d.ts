import type { CloudflareAccessVariables } from "@hono/cloudflare-access";
import type { Context } from "hono";

export type BasicAuthType = {
	username: string;
	password: string;
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
	basicAuth?: BasicAuthType | BasicAuthType[];
};

export type AppEnv = {
	ASSETS: Fetcher;
	AI: Ai;
	[key: string]: R2Bucket;
};
export type AppVariables = {
	config: R2ExplorerConfig;
	authentication_type?: string;
	authentication_username?: string;
	// SpendRule-specific variables
	user_health_group?: string;
	health_group_filter?: string;
	suggested_path?: string;
	document_type?: string;
	original_filename?: string;
	sanitized_filename?: string;
	document_metadata?: {
		healthGroup: string;
		documentType: string;
		originalFilename: string;
		sanitizedFilename: string;
		uploadedAt: string;
		fileSize?: number;
	};
} & CloudflareAccessVariables;
export type AppContext = Context<{ Bindings: AppEnv; Variables: AppVariables }>;
