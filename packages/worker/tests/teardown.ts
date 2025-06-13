// packages/worker/tests/teardown.ts
import type { Miniflare } from 'miniflare';

export default async function teardown() {
  console.log('Global teardown: Disposing Miniflare...');
  const mf = (globalThis as any).MF_INSTANCE as Miniflare | undefined;
  if (mf) {
    try {
      await mf.dispose();
      console.log('Global teardown: Miniflare disposed.');
    } catch (e) {
      console.error("Miniflare failed to dispose:", e);
    }
  } else {
    console.log('Global teardown: No Miniflare instance found.');
  }
}
