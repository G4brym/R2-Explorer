// @ts-ignore
const fs = require("fs");

const R2EXPLORER_WORKER_NAME = process.env.R2EXPLORER_WORKER_NAME;
const R2EXPLORER_BUCKETS = process.env.R2EXPLORER_BUCKETS;
const R2EXPLORER_CONFIG = process.env.R2EXPLORER_CONFIG;
const R2EXPLORER_DOMAIN = process.env.R2EXPLORER_DOMAIN;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

if (!R2EXPLORER_WORKER_NAME) {
  console.error("R2EXPLORER_WORKER_NAME variable is required to continue!");
  process.exit(1);
}

if (!R2EXPLORER_BUCKETS) {
  console.error("R2EXPLORER_BUCKETS variable is required to continue!");
  process.exit(1);
}

if (!R2EXPLORER_CONFIG) {
  console.error("R2EXPLORER_CONFIG variable is required to continue!");
  process.exit(1);
}

if (!CF_API_TOKEN) {
  console.error("CF_API_TOKEN variable is required to continue!");
  process.exit(1);
}

let wranglerConfig = `
name = "${R2EXPLORER_WORKER_NAME}"
compatibility_date = "2023-05-12"
main = "src/index.ts"
`;

if (R2EXPLORER_DOMAIN) {
  wranglerConfig += `
workers_dev = false
routes = [
  { pattern = "${R2EXPLORER_DOMAIN}", custom_domain = true }
]
`;
} else {
  wranglerConfig += `
workers_dev = true
`;
}

for (const bucket of R2EXPLORER_BUCKETS.split("\n")) {
  const split = bucket.trim().split(":");
  if (split.length !== 2) {
    console.error("R2EXPLORER_BUCKETS is not set correctly!");
    console.error(`"${split}" is not in the correct format`);
    process.exit(1);
  }

  wranglerConfig += `
[[r2_buckets]]
binding = '${split[0]}'
bucket_name = '${split[1]}'
preview_bucket_name = '${split[1]}'
`;

}

console.log(wranglerConfig)
fs.writeFileSync(__dirname + "/wrangler.toml", wranglerConfig);

if (!fs.existsSync(__dirname + "/src/")){
    fs.mkdirSync(__dirname + "/src/");
}

console.log(`
import { R2Explorer } from "r2-explorer";

export default R2Explorer(${R2EXPLORER_CONFIG});
`)
fs.writeFileSync(__dirname + "/src/index.ts", `
import { R2Explorer } from "r2-explorer";

export default R2Explorer(${R2EXPLORER_CONFIG});
`);
