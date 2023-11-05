import { R2Explorer } from "../src";

export default R2Explorer({
  readonly: false,
  cors: true,
  showHiddenFiles: true,
  dashboardUrl: "https://dashboard-v2.r2-explorer-dashboard.pages.dev/",
  basicAuth: [{
    username: 'teste',
    password: 'abc'
  },{
    username: 'teste33',
    password: 'abcdd'
  },{
    username: 'teste55',
    password: 'abchh'
  }]
});
