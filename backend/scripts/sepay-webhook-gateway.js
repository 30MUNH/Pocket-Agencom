const http = require('node:http');

// The public development tunnel exposes only SePay's webhook, not the application's APIs.
function createWebhookGateway({ upstream = 'http://127.0.0.1:5000', fetchImpl = fetch } = {}) {
  return http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const reply = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (req.method === 'GET' && pathname === '/health') return reply(200, { success: true, gateway: 'sepay-local' });
    if (req.method !== 'POST' || pathname !== '/api/payments/webhooks/sepay') return reply(404, { success: false });
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 100 * 1024) return reply(413, { success: false });
        chunks.push(chunk);
      }
      const headers = {};
      for (const name of ['content-type', 'authorization', 'x-sepay-signature', 'x-sepay-timestamp']) {
        if (typeof req.headers[name] === 'string') headers[name] = req.headers[name];
      }
      const response = await fetchImpl(new URL('/api/payments/webhooks/sepay', upstream), {
        method: 'POST', headers, body: Buffer.concat(chunks), signal: AbortSignal.timeout(20000),
      });
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      res.end(await response.text());
    } catch {
      if (!res.headersSent) reply(502, { success: false }); else res.end();
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.SEPAY_GATEWAY_PORT || 5001);
  const server = createWebhookGateway();
  server.listen(port, '127.0.0.1', () => console.log(`SePay webhook gateway listening on http://127.0.0.1:${port}`));
  server.on('error', (error) => { console.error(`Webhook gateway could not start (${error.code}).`); process.exitCode = 1; });
}

module.exports = { createWebhookGateway };
