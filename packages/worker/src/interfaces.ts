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
    showHiddenFiles?: boolean
    cacheAssets?: boolean
    basicAuth?: BasicAuth | BasicAuth[]
}

export interface Context {
    config: R2ExplorerConfig
    username?: string
    executionContext: ExecutionContext
}
