import { describe, it, expect } from 'vitest';
import { settings } from '../src/foundation/settings'; // Path relative to packages/worker/tests/server.test.ts

// Access the Miniflare URL set in the global setup file (tests/setup.ts)
const BASE_URL = (globalThis as any).MF_URL as string | undefined;

describe('Server Endpoints (with Miniflare)', () => {
  it('GET /api/server/config should return server configuration', async () => {
    if (!BASE_URL) {
      throw new Error('Miniflare base URL (MF_URL) not found in globalThis. Check tests/setup.ts.');
    }

    // MF_URL from Miniflare v3's mf.ready includes a trailing slash (e.g., "http://localhost:12345/")
    // So, the path should not start with a slash if concatenating.
    const targetUrl = new URL('api/server/config', BASE_URL).toString();
    // Or ensure no double slashes: `${BASE_URL.replace(/\/$/, '')}/api/server/config`
    // Using new URL() is safer for joining.

    console.log(`[Test] Fetching URL: ${targetUrl}`);

    const response = await fetch(targetUrl);

    expect(response.status).toBe(200);

    const json: any = await response.json(); // Or define a more specific type

    // These assertions depend on the R2Explorer config in tests/setup.ts
    expect(json.version).toBe(settings.version);
    expect(json.readonly).toBe(true); // Based on R2Explorer({ readonly: true }) in setup.ts
    expect(json.basicAuth).toBe(false); // Default if not configured in setup.ts
    expect(json.cfAccess).toBe(false); // Default if not configured in setup.ts
    expect(json.serverName).toBeUndefined(); // Default if not configured in setup.ts
  });
});
