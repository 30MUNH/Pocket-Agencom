const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const OpenRouterProvider = require('../src/services/ai/providers/openRouterProvider');
const aiConfig = require('../src/services/ai/aiConfig');
process.env.NODE_ENV = 'test';
process.env.PA_TEST_DATABASE_URL ||= 'postgresql://test:test@127.0.0.1:5432/pocket_agencom_unit_test';
const aiService = require('../src/services/ai/aiService');

async function startDelayedServer() {
  let requestClosed;
  let requestCount = 0;
  const closed = new Promise((resolve) => { requestClosed = resolve; });
  const server = http.createServer((req, res) => {
    requestCount += 1;
    res.on('close', () => requestClosed());
    // Deliberately hold the response open so only cancellation can finish it.
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.flushHeaders();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    closed,
    get requestCount() { return requestCount; },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

test('OpenRouter provider cancels an in-flight request when its operation signal aborts', async (t) => {
  const delayed = await startDelayedServer();
  t.after(delayed.close);
  const provider = new OpenRouterProvider('test-key', 'openrouter/free');
  provider.baseUrl = delayed.url;
  const controller = new AbortController();
  const startedAt = Date.now();
  const request = provider.generateText({ prompt: 'minimal', signal: controller.signal, timeoutMs: 2000 });
  setTimeout(() => controller.abort(new Error('test deadline')), 75);

  await assert.rejects(request);
  await Promise.race([
    delayed.closed,
    new Promise((_, reject) => setTimeout(() => reject(new Error('server request was not cancelled')), 500)),
  ]);
  assert.ok(Date.now() - startedAt < 500, 'provider should stop promptly after cancellation');
});

test('AI operation deadline aborts the provider request and bounds the whole operation', async (t) => {
  const delayed = await startDelayedServer();
  t.after(delayed.close);
  const original = {
    requestTimeoutMs: aiConfig.limits.requestTimeoutMs,
    operationTimeoutMs: aiConfig.limits.operationTimeoutMs,
    maxRetries: aiConfig.limits.maxRetries,
  };
  t.after(() => Object.assign(aiConfig.limits, original));
  aiConfig.limits.requestTimeoutMs = 2000;
  aiConfig.limits.operationTimeoutMs = 100;
  aiConfig.limits.maxRetries = 3;

  const provider = new OpenRouterProvider('test-key', 'openrouter/free');
  provider.baseUrl = delayed.url;
  const service = new aiService.AIService();
  service.getTextProvidersInPriority = () => [{ name: 'openrouter', instance: provider }];
  const startedAt = Date.now();

  await assert.rejects(service.generateText({ prompt: 'minimal' }));
  await Promise.race([
    delayed.closed,
    new Promise((_, reject) => setTimeout(() => reject(new Error('server request was not cancelled')), 500)),
  ]);
  assert.ok(Date.now() - startedAt < 500, 'operation should honor its total deadline');
  assert.equal(delayed.requestCount, 1, 'a total-deadline abort must prevent further provider retries');
  assert.equal(service.getUsageStats().activeGenerations, 0, 'concurrency slot should be released');
});
