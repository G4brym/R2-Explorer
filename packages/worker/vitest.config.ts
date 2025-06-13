// packages/worker/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // No pool configuration needed, tests run in Node.js environment by default
    globalSetup: ['./tests/setup.ts'], // Path relative to vitest.config.ts
    globalTeardown: ['./tests/teardown.ts'], // Path relative to vitest.config.ts
    // testTimeout: 10000, // Optional: increase timeout if Miniflare setup is slow
    // clearMocks: true, // Optional
    // setupFiles: [], // For per-test-file setup, if needed later
  },
  // resolve: {
  //   alias: {
  //     // Define any aliases if your source code uses them and Vitest needs to know
  //   }
  // }
});
