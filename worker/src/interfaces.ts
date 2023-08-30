export interface BasicAuth {
    username: string
    password: string
}

export interface R2ExplorerConfig {
    readonly?: boolean
    cors?: boolean
    cfAccessTeamName?: string
    dashboardUrl?: string
    emailRouting?: {
      targetBucket: string
    },
    showHiddenFiles?: string
    cacheAssets?: boolean
    // basicAuth?: BasicAuth | BasicAuth[]  // TODO
}

export interface Context {
    config: R2ExplorerConfig
    username?: string
    executionContext: ExecutionContext
}
