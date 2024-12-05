import type { Context } from "hono";

export type BasicAuth = {
	username: string;
	password: string;
};

export type R2ExplorerConfig = {
	readonly?: boolean;
	cors?: boolean;
	cfAccessTeamName?: string;
	dashboardUrl?: string;
	emailRouting?: {
		targetBucket: string;
	};
	showHiddenFiles?: boolean;
	cacheAssets?: boolean;
	basicAuth?: BasicAuth | BasicAuth[];
};

export type AppEnv = {
	[key: string]: R2Bucket;
};
export type AppVariables = {
	config: R2ExplorerConfig;
	username?: string;
};
export type AppContext = Context<{ Bindings: AppEnv; Variables: AppVariables }>;
