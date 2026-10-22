const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const request = require('supertest');
const { createPaymentTestHarness } = require('./helpers/createPaymentTestHarness');
const { getSepayConfig, parseSepayPayload, extractPaymentCode } = require('../src/services/sepayService');
const { createPaymentService } = require('../src/services/paymentService');

test('SePay payments: real Prisma + disposable PostgreSQL in memory', { timeout: 90000 }, async (t) => {
  const h = await createPaymentTestHarness();
  t.after(() => h.close());
  const create = (body = { planId: 'starter' }, userId = 100) => request(h.app).post('/api/payments/orders').set('Authorization', `Bearer ${h.token(userId)}`).send(body);
  const billing = () => request(h.app).get('/api/payments/billing').set('Authorization', `Bearer ${h.token()}`);
  const payload = (order, extra = {}) => ({ id: 92704, gateway: 'MBBank', transactionDate: '2025-10-22 14:01:00',
    accountNumber: h.config.accountNumber, subAccount: h.config.virtualAccount, code: null,
    content: `Thanh toan ${order.paymentCode}`, transferType: 'in', transferAmount: order.amount,
    referenceCode: 'TEST92704', ...extra });
  const deliver = (body, secret = h.config.secret) => request(h.app).post('/api/payments/webhooks/sepay').set('Authorization', `Apikey ${secret}`).send(body);
  async function subtest(name, fn) { await t.test(name, async () => { await h.reset(); await fn(); }); }

  await subtest('SQL is repeatable, RLS enabled, browser roles cannot write or read payments', async () => {
    await h.database.exec(h.migration);
    const tables = await h.database.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('payment_orders','user_subscriptions','sepay_webhook_events')");
    assert.equal(tables.rows.length, 3);
    assert.ok(tables.rows.every((row) => row.relrowsecurity));
    for (const role of ['anon', 'authenticated']) {
      const grants = await h.database.query(`SELECT has_table_privilege($1, 'payment_orders', 'INSERT') AS ins, has_table_privilege($1, 'user_subscriptions', 'UPDATE') AS upd, has_table_privilege($1, 'sepay_webhook_events', 'SELECT') AS sel`, [role]);
      assert.deepEqual(grants.rows[0], { ins: false, upd: false, sel: false });
    }
  });
  await subtest('real login required; staff and demo sessions cannot buy', async () => {
    assert.equal((await request(h.app).post('/api/payments/orders').send({ planId: 'starter' })).status, 401);
    assert.equal((await create({ planId: 'starter' }, 102)).status, 403);
    const previous = process.env.DEMO_AUTH_ENABLED;
    process.env.DEMO_AUTH_ENABLED = 'true';
    try {
      const demo = require('../src/services/demoAuth').getDemoUserById(3);
      // A demo JWT has no persisted user, and may never reach checkout.
      const demoToken = h.token(demo?.id || 99991, { demo: true, role: demo?.role || 'user' });
      assert.equal((await request(h.app).post('/api/payments/orders').set('Authorization', `Bearer ${demoToken}`).send({ planId: 'starter' })).status, 403);
    } finally {
      if (previous === undefined) delete process.env.DEMO_AUTH_ENABLED; else process.env.DEMO_AUTH_ENABLED = previous;
    }
    assert.equal(await h.db.paymentOrder.count(), 0);
  });
  await subtest('server owns prices, concurrent create reuses pending order, other plan conflicts', async () => {
    assert.equal((await create({ planId: '__proto__' })).status, 400);
    const results = await Promise.all([create({ planId: 'starter', amount: 1, durationDays: 365 }), create()]);
    assert.ok(results.every((res) => res.status === 201));
    const [order, second] = results.map((res) => res.body.data);
    assert.equal(order.id, second.id);
    assert.equal(order.amount, 199000);
    assert.equal(order.durationDays, 30);
    const qr = new URL(order.qrUrl);
    assert.equal(qr.searchParams.get('acc'), h.config.virtualAccount);
    assert.equal(qr.searchParams.get('des'), order.paymentCode);
    assert.equal(qr.searchParams.get('amount'), '199000');
    assert.equal((await create({ planId: 'pro' })).status, 409);
    const stolen = await request(h.app).get(`/api/payments/orders/${order.id}`).set('Authorization', `Bearer ${h.token(101)}`);
    assert.equal(stolen.status, 404);
    assert.equal((await request(h.app).get('/api/payments/orders/not-a-uuid').set('Authorization', `Bearer ${h.token()}`)).status, 400);
    assert.equal(await h.db.paymentOrder.count(), 1);
  });
  await subtest('API key authentication rejects forged webhook before database writes', async () => {
    const order = (await create()).body.data;
    assert.equal((await deliver(payload(order), 'wrong-secret')).status, 401);
    assert.equal(await h.db.sepayWebhookEvent.count(), 0);
    assert.equal(await h.db.userSubscription.count(), 0);
  });
  await subtest('valid webhook activates once across concurrent retry and replay', async () => {
    const order = (await create()).body.data;
    const results = await Promise.all([deliver(payload(order)), deliver(payload(order))]);
    for (const result of results) { assert.equal(result.status, 200); assert.deepEqual(result.body, { success: true }); }
    const subscription = (await billing()).body.data.subscription;
    assert.equal(subscription.planId, 'starter');
    assert.equal(subscription.expiresAt, '2025-11-21T07:00:00.000Z');
    assert.equal(await h.db.sepayWebhookEvent.count(), 1);
    assert.equal((await h.db.paymentOrder.findUnique({ where: { id: order.id } })).status, 'paid');
    await deliver(payload(order, { id: 92705 }));
    assert.equal((await billing()).body.data.subscription.expiresAt, subscription.expiresAt);
    assert.equal((await h.db.sepayWebhookEvent.findUnique({ where: { transactionId: '92705' } })).outcome, 'review_already_paid');
  });
  for (const [name, extra, outcome] of [
    ['wrong VA', { subAccount: 'ANOTHER-VA' }, 'review_wrong_account'],
    ['wrong bank account', { accountNumber: 'OTHER' }, 'review_wrong_account'],
    ['wrong bank', { gateway: 'BIDV' }, 'review_wrong_account'],
    ['underpayment', { transferAmount: 1000 }, 'review_wrong_amount'],
    ['overpayment', { transferAmount: 200000 }, 'review_wrong_amount'],
    ['money out', { transferType: 'out' }, 'ignored_outgoing'],
    ['missing memo', { content: 'no order code' }, 'unmatched_code'],
    ['unknown order', { content: 'PA999999999999' }, 'unmatched_order'],
    ['ambiguous memo', { code: 'PA999999999999' }, 'unmatched_code'],
    ['bank payment after expiry', { transactionDate: '2025-10-22 14:16:00' }, 'review_outside_window'],
    ['bank payment before order', { transactionDate: '2025-10-22 13:59:59' }, 'review_outside_window'],
  ]) {
    await subtest(`${name}: acknowledge and persist reconciliation reason without activation`, async () => {
      const order = (await create()).body.data;
      assert.equal((await deliver(payload(order, extra))).status, 200);
      assert.equal(await h.db.userSubscription.count(), 0);
      const event = await h.db.sepayWebhookEvent.findUnique({ where: { transactionId: '92704' } });
      assert.equal(event.outcome, outcome);
      assert.equal((await h.db.paymentOrder.findUnique({ where: { id: order.id } })).status, 'pending');
    });
  }
  await subtest('late delivery still pays an expired checkout if bank transaction was on time', async () => {
    const order = (await create()).body.data;
    h.setNow('2025-10-22T07:30:00Z');
    assert.equal((await billing()).body.data.orders[0].status, 'expired');
    assert.equal((await deliver(payload(order))).status, 200);
    assert.equal((await billing()).body.data.orders[0].status, 'paid');
  });
  await subtest('renewal adds 30 days, changing plan starts a new cycle; expired subscription is hidden', async () => {
    let order = (await create()).body.data;
    await deliver(payload(order));
    h.setNow('2025-10-23T07:00:00Z');
    order = (await create()).body.data;
    await deliver(payload(order, { id: 92705, transactionDate: '2025-10-23 14:01:00' }));
    assert.equal((await billing()).body.data.subscription.expiresAt, '2025-12-21T07:00:00.000Z');
    order = (await create({ planId: 'pro' })).body.data;
    await deliver(payload(order, { id: 92706, transactionDate: '2025-10-23 14:01:00' }));
    const subscription = (await billing()).body.data.subscription;
    assert.equal(subscription.planId, 'pro');
    assert.equal(subscription.expiresAt, '2025-11-22T07:00:00.000Z');
    h.setNow('2027-01-01T00:00:00Z');
    assert.equal((await billing()).body.data.subscription, null);
  });
  await subtest('database failure rolls back event and subscription so the same delivery can retry', async () => {
    const order = (await create()).body.data;
    const failingDb = { sepayWebhookEvent: h.db.sepayWebhookEvent };
    failingDb.$transaction = (fn, options) => h.db.$transaction((tx) => fn(new Proxy(tx, {
      get(target, key) {
        if (key === 'paymentOrder') return { ...target.paymentOrder, update: async () => { throw new Error('injected database failure'); } };
        return target[key];
      },
    })), options);
    const failing = createPaymentService(failingDb, () => h.config);
    await assert.rejects(failing.processWebhook(parseSepayPayload(payload(order))), /injected database failure/);
    assert.equal(await h.db.sepayWebhookEvent.count(), 0);
    assert.equal(await h.db.userSubscription.count(), 0);
    assert.equal((await deliver(payload(order))).status, 200);
    assert.equal(await h.db.userSubscription.count(), 1);
  });
  await subtest('HMAC validates raw JSON bytes and rejects stale or changed payloads', async () => {
    h.config.authMode = 'hmac';
    const order = (await create()).body.data;
    const raw = JSON.stringify(payload(order), null, 2);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const sign = (time, body) => `sha256=${crypto.createHmac('sha256', h.config.secret).update(`${time}.${body}`).digest('hex')}`;
    const send = (time, signature, body) => request(h.app).post('/api/payments/webhooks/sepay')
      .set('Content-Type', 'application/json').set('X-SePay-Timestamp', time).set('X-SePay-Signature', signature).send(body);
    assert.equal((await send(timestamp, sign(timestamp, raw), raw.replace('199000', '1'))).status, 401);
    const old = String(Number(timestamp) - 301);
    assert.equal((await send(old, sign(old, raw), raw)).status, 401);
    assert.deepEqual((await send(timestamp, sign(timestamp, raw), raw)).body, { success: true });
  });
  await subtest('invalid payload and date cannot reach persistence', async () => {
    const order = (await create()).body.data;
    for (const extra of [{ id: '92704' }, { transferAmount: -1 }, { transactionDate: '2025-02-30 14:00:00' }, { transactionDate: '2025-13-01 14:00:00' }]) {
      assert.equal((await deliver(payload(order, extra))).status, 400);
    }
    assert.equal(await h.db.sepayWebhookEvent.count(), 0);
  });
});

test('SePay configuration fails closed and payment-code extraction is unambiguous', () => {
  assert.throws(() => getSepayConfig({}), (err) => err.statusCode === 503);
  assert.throws(() => getSepayConfig({ SEPAY_WEBHOOK_SECRET: 'short' }), (err) => err.statusCode === 503);
  assert.equal(extractPaymentCode({ code: null, content: 'PA123456789012' }), 'PA123456789012');
  assert.equal(extractPaymentCode({ code: 'PA123456789012', content: 'PA123456789013' }), null);
  assert.equal(extractPaymentCode({ content: 'PA1234567890123' }), null);
});
