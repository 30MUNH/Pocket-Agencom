const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const { createPaymentTestHarness } = require('./helpers/createPaymentTestHarness');
const { createSubscriptionService, paymentSetupError } = require('../src/services/subscriptionService');
const { createGenerateHandler } = require('../src/controllers/marketingPlanController');
const { createAuthMiddleware } = require('../src/middleware/authMiddleware');
const { errorHandler } = require('../src/middleware/errorHandler');

test('checkout completion and paid access use the same PostgreSQL transactions', { timeout: 90000 }, async (t) => {
  const h = await createPaymentTestHarness();
  t.after(() => h.close());
  let now = new Date('2025-10-22T07:00:00Z');
  const subscriptions = createSubscriptionService(h.db, () => now);
  const user = { id: 100, role: 'user' };
  const create = (planId = 'starter') => h.service.createOrder(100, planId);
  const bankPayload = (order, extra = {}) => ({ id: 10001, gateway: h.config.bank, accountNumber: h.config.accountNumber,
    subAccount: h.config.virtualAccount, content: order.paymentCode, transferType: 'in', transferAmount: order.amount,
    transactionAt: new Date('2025-10-22T07:01:00Z'), ...extra });
  const cancel = (id, body = { confirmUnpaid: true }, userId = 100) => request(h.app)
    .post(`/api/payments/orders/${id}/cancel`).set('Authorization', `Bearer ${h.token(userId)}`).send(body);
  const consume = () => h.db.$transaction((tx) => subscriptions.consumeKit(tx, user));
  async function scenario(name, fn) { await t.test(name, async () => { await h.reset(); now = new Date('2025-10-22T07:00:00Z'); await fn(); }); }

  await scenario('catalog contains authoritative prices without requiring login or exposing configuration', async () => {
    const res = await request(h.app).get('/api/payments/catalog');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((p) => p.amount), [199000, 499000, 890000]);
    assert.equal(res.body.data[0].kitLimit, 3);
    assert.doesNotMatch(res.text, /secret|0911266029|VQRQAMZKV7190/);
  });
  await scenario('cancel requires unpaid acknowledgement and ownership; replacement order is permitted', async () => {
    const order = await create();
    assert.equal((await cancel(order.id, {})).status, 400);
    assert.equal((await cancel(order.id, { confirmUnpaid: true }, 101)).status, 404);
    assert.equal((await cancel('bad-id')).status, 400);
    assert.equal((await cancel(order.id)).body.data.status, 'cancelled');
    assert.equal((await create('pro')).planId, 'pro');
    await h.service.processWebhook(bankPayload(order));
    assert.equal(await h.db.userSubscription.count(), 0);
    assert.equal((await h.db.sepayWebhookEvent.findUnique({ where: { transactionId: '10001' } })).outcome, 'review_cancelled');
  });
  await scenario('review is visible to the owner and prevents cancelling an already received transfer', async () => {
    const order = await create();
    await h.service.processWebhook(bankPayload(order, { transferAmount: 1000 }));
    const read = await h.service.getOrder(100, order.id);
    assert.equal(read.review.receivedAmount, 1000);
    assert.match(read.review.message, /Số tiền/);
    assert.equal((await cancel(order.id)).status, 409);
  });
  await scenario('paid orders cannot be cancelled', async () => {
    const order = await create();
    await h.service.processWebhook(bankPayload(order));
    assert.equal((await cancel(order.id)).status, 409);
  });
  await scenario('unpaid and expired users cannot generate; successful payment unlocks Starter', async () => {
    await assert.rejects(subscriptions.requireAccess(user), (e) => e.statusCode === 402 && e.details.code === 'SUBSCRIPTION_REQUIRED');
    const order = await create();
    await h.service.processWebhook(bankPayload(order));
    const access = await subscriptions.requireAccess(user);
    assert.equal(access.kitLimit, 3);
    assert.equal(access.remaining, 3);
    assert.equal(access.features.videoScripts, false);
    now = new Date('2025-11-22T07:00:00Z');
    await assert.rejects(subscriptions.requireAccess(user), { statusCode: 402 });
  });
  await scenario('Starter cannot exceed three completed kits even with simultaneous requests', async () => {
    const order = await create();
    await h.service.processWebhook(bankPayload(order));
    const results = await Promise.allSettled([consume(), consume(), consume(), consume()]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 3);
    const denied = results.find((r) => r.status === 'rejected');
    assert.equal(denied.reason.details.code, 'SUBSCRIPTION_QUOTA_EXCEEDED');
    assert.equal((await h.service.getBilling(100)).access.used, 3);
    assert.equal((await subscriptions.getAccess(user)).canGenerate, false);
  });
  await scenario('failed plan persistence rolls back the kit counter', async () => {
    const order = await create();
    await h.service.processWebhook(bankPayload(order));
    await assert.rejects(h.db.$transaction(async (tx) => { await subscriptions.consumeKit(tx, user); throw new Error('plan persistence failure'); }), /plan persistence failure/);
    assert.equal((await subscriptions.getAccess(user)).used, 0);
  });
  await scenario('early renewal preserves current usage; next 30-day period resets it', async () => {
    let order = await create();
    await h.service.processWebhook(bankPayload(order));
    await consume(); await consume(); await consume();
    h.setNow('2025-10-23T07:00:00Z');
    order = await create();
    await h.service.processWebhook(bankPayload(order, { id: 10002, transactionAt: new Date('2025-10-23T07:01:00Z') }));
    now = new Date('2025-10-23T07:00:00Z');
    assert.equal((await subscriptions.getAccess(user)).remaining, 0);
    now = new Date('2025-11-21T07:00:00Z');
    assert.equal((await subscriptions.getAccess(user)).remaining, 3);
    await consume();
    assert.equal((await subscriptions.getAccess(user)).used, 1);
  });
  await scenario('Pro and Advanced remove kit cap and expose paid features', async () => {
    let order = await create('pro');
    await h.service.processWebhook(bankPayload(order));
    for (let i = 0; i < 5; i++) await consume();
    assert.equal((await subscriptions.getAccess(user)).remaining, null);
    assert.equal((await subscriptions.getAccess(user)).features.videoScripts, true);
    order = await create('advanced');
    await h.service.processWebhook(bankPayload(order, { id: 10002, transactionAt: new Date('2025-10-22T07:02:00Z') }));
    assert.equal((await subscriptions.getAccess(user)).features.customStrategy, true);
  });
  await scenario('late older-plan webhook cannot replace a newer plan already paid', async () => {
    const old = await create();
    h.setNow('2025-10-22T07:20:00Z');
    const newer = await create('advanced');
    await h.service.processWebhook(bankPayload(newer, { transactionAt: new Date('2025-10-22T07:21:00Z') }));
    await h.service.processWebhook(bankPayload(old, { id: 10002, transactionAt: new Date('2025-10-22T07:10:00Z') }));
    assert.equal((await h.service.getBilling(100)).subscription.planId, 'advanced');
    assert.equal((await h.db.sepayWebhookEvent.findUnique({ where: { transactionId: '10002' } })).outcome, 'review_out_of_order');
  });
  await scenario('public generation handler denies unpaid users before any AI work; accepts after webhook', async () => {
    let generationCalls = 0;
    const handler = createGenerateHandler({ subscriptions, marketing: {
      generatePlan: async (userId, data, context) => {
        generationCalls++;
        assert.equal(context.access.planId, 'starter');
        await h.db.$transaction((tx) => subscriptions.consumeKit(tx, context.user));
        return { id: 1, userId, goal: data.goal };
      },
    } });
    const app = express(); app.use(express.json());
    app.post('/generate', createAuthMiddleware(h.db), handler); app.use(errorHandler);
    const generate = () => request(app).post('/generate').set('Authorization', `Bearer ${h.token()}`).send({ goal: 'Test' });
    assert.equal((await generate()).status, 402);
    assert.equal(generationCalls, 0);
    const order = await create(); await h.service.processWebhook(bankPayload(order));
    assert.equal((await generate()).status, 201);
    assert.equal(generationCalls, 1);
    assert.equal((await subscriptions.getAccess(user)).used, 1);
  });
});

test('missing payment schema is reported as setup required; unrelated table errors are preserved', () => {
  const missing = { code: 'P2021', message: 'The table public.payment_orders does not exist' };
  assert.equal(paymentSetupError(missing).details.code, 'PAYMENT_SETUP_REQUIRED');
  const unrelated = { code: 'P2021', message: 'The table users does not exist' };
  assert.equal(paymentSetupError(unrelated), unrelated);
});
