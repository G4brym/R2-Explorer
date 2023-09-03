import { R2Explorer } from "../src";

export default R2Explorer({
  readonly: false,
  cors: true,
  dashboardUrl: "https://dev.r2-explorer-dashboard.pages.dev/",
  basicAuth: {
    username: 'teste',
    password: 'abc'
  }
});
