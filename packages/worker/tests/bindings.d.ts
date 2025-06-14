export type Env = {
  ASSETS: Fetcher;
	MY_TEST_BUCKET_1: R2Bucket;
	MY_TEST_BUCKET_2: R2Bucket;
};

declare module "cloudflare:test" {
	interface ProvidedEnv extends Env {}
}
