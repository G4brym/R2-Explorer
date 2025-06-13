console.log('[test-worker.ts] Starting test worker initialization');
import { R2Explorer } from './index';
import type { AppEnv } from './types';
import type { ExecutionContext } from 'hono'; // Hono's ExecutionContext

let explorerInstance: any; // Use 'any' for simplicity in debugging
let initializationError: Error | null = null;

try {
    console.log('[test-worker.ts] Calling R2Explorer()...');
    explorerInstance = R2Explorer({
        readonly: true,
    });
    console.log('[test-worker.ts] R2Explorer() call completed.');
    if (!explorerInstance || typeof explorerInstance.fetch !== 'function') {
        console.error('[test-worker.ts] R2Explorer() did not return a valid instance with a fetch method.');
        initializationError = new Error('R2Explorer() did not return a valid instance with a fetch method.');
    }
} catch (e: any) {
    console.error('[test-worker.ts] Error during R2Explorer() initialization:');
    console.error('Error Name:', e.name);
    console.error('Error Message:', e.message);
    console.error('Error Stack:', e.stack);
    initializationError = e;
}

export default {
    fetch: async (request: Request, env: AppEnv, ctx: ExecutionContext) => {
        console.log(`[test-worker.ts fetch] Received request for: ${request.url}, Method: ${request.method}`);
        if (initializationError) {
            console.error('[test-worker.ts fetch] Initialization error encountered. Returning 500.');
            return new Response(`Worker initialization failed: ${(initializationError as Error).message}`, { status: 500 });
        }
        if (!explorerInstance || typeof explorerInstance.fetch !== 'function') {
            console.error('[test-worker.ts fetch] explorerInstance.fetch is not available. Returning 500.');
            return new Response('Worker instance or fetch method not available.', { status: 500 });
        }

        console.log('[test-worker.ts fetch] Forwarding to R2Explorer instance fetch...');
        try {
            const response = await explorerInstance.fetch(request, env, ctx);
            console.log(`[test-worker.ts fetch] Response status from R2Explorer: ${response.status}`);
            return response;
        } catch (e: any) {
            console.error('[test-worker.ts fetch] Error during explorerInstance.fetch:');
            console.error('Error Name:', e.name);
            console.error('Error Message:', e.message);
            console.error('Error Stack:', e.stack);
            return new Response(`Error during request processing: ${(e as Error).message}`, { status: 500 });
        }
    },
};

console.log('[test-worker.ts] Test worker initialization script finished.');
