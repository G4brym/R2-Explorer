import { R2Explorer } from "../src";

const baseConfig = {
  readonly: false,
  cors: true,
  showHiddenFiles: true,
  dashboardUrl: "https://dev.r2-explorer-dashboard.pages.dev/",
  cacheAssets: false,
};

export default {
  async email(event, env, context) {
    await R2Explorer(baseConfig).email(event, env, context);
  },
  async fetch(request, env, context) {
    return R2Explorer({
      ...baseConfig,
      basicAuth: {
        username: env.BASIC_USERNAME,
        password: env.BASIC_PASSWORD
      }
    }).fetch(request, env, context);
  }
};
