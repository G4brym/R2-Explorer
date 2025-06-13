console.log('[minimal-test-worker.ts] Script executed!'); // Crucial log

export default {
  async fetch(request: Request, env: any, ctx: any) {
    console.log('[minimal-test-worker.ts] Fetch handler called for URL: ' + request.url);
    return new Response('Minimal worker reporting for duty!', { status: 200 });
  }
};
