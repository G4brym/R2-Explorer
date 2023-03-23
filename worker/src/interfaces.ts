export interface R2ExplorerConfig {
  readonly?: boolean
  cors?: boolean
  cfAccessTeamName?: string
}

export interface Context {
  config: R2ExplorerConfig
  userEmail?: string
}

