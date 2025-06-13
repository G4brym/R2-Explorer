// packages/worker/tests/setup.ts
import { Miniflare } from 'miniflare';
import { R2Explorer } from '../src/index';

export default async function setup() {
  console.log('Global setup: Starting Miniflare for bucket tests...');

  const explorer = R2Explorer({
    readonly: false, // Allow writes for bucket tests
    // No basicAuth or cfAccess for initial tests
  });

  const mf = new Miniflare({
    fetch: explorer.fetch,
    r2Buckets: ["TEST_BUCKET"], // This makes env.TEST_BUCKET available to the worker
    // Optionally, persist R2 data to file system for inspection or across runs (dev only)
    // r2Persist: "./r2-data",
    compatibilityFlags: ['nodejs_compat'],
    compatibilityDate: '2023-12-01',
    // bindings: { /* any other necessary environment variables for the worker */ }
  });

  try {
    const url = await mf.ready;
    (globalThis as any).MF_INSTANCE = mf;
    (globalThis as any).MF_URL = url.toString();
    console.log(`Global setup: Miniflare ready at ${(globalThis as any).MF_URL} with TEST_BUCKET`);
  } catch (e) {
    console.error("Miniflare failed to start in setup for bucket tests:", e);
    throw e;
  }
}
