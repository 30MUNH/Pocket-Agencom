const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { registerSchema } = require('../src/validators/auth.validator');
const { signToken } = require('../src/utils/jwt');

test('registration accepts only the business-user role', () => {
  const base = {
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password123',
  };

  assert.equal(registerSchema.safeParse(base).success, true);
  assert.equal(registerSchema.safeParse({ ...base, role: 'user' }).success, true);
  assert.equal(registerSchema.safeParse({ ...base, role: 'kol' }).success, false);
  assert.equal(registerSchema.safeParse({ ...base, role: 'admin' }).success, false);
});

test('removed API namespaces return the standard 404 contract', async () => {
  const { createApp } = require('../src/app');
  const app = createApp();
  const paths = ['/api/kols', '/api/packages', '/api/bookings', '/api/kol-bookings', '/api/market'];

  for (const path of paths) {
    const response = await request(app).get(path);
    assert.equal(response.status, 404, path);
    assert.deepEqual(response.body, {
      success: false,
      data: null,
      error: { message: 'Route not found' },
    });
  }
});

test('a previously issued token cannot authenticate an archived account', async () => {
  const { createAuthMiddleware } = require('../src/middleware/authMiddleware');
  const fakePrisma = {
    user: {
      findUnique: async () => ({
        id: 41,
        name: 'Former account',
        email: 'former@example.com',
        role: 'user',
        status: 'archived',
      }),
    },
  };
  const app = express();
  app.get('/protected', createAuthMiddleware(fakePrisma), (req, res) => res.json(req.user));
  app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ error: error.message }));

  const staleToken = signToken({ userId: 41, role: 'kol' });
  const response = await request(app)
    .get('/protected')
    .set('Authorization', `Bearer ${staleToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.error.message, 'Account is inactive or not found');
});

test('login rejects archived accounts and preserves active retained roles', async () => {
  const bcrypt = require('bcryptjs');
  const { loginWithPrisma } = require('../src/services/authService');
  const passwordHash = await bcrypt.hash('password123', 4);
  const userFor = (role, status = 'active') => ({
    id: 7,
    name: `${role} account`,
    email: `${role}@example.com`,
    passwordHash,
    role,
    status,
  });

  for (const role of ['user', 'staff', 'admin']) {
    const result = await loginWithPrisma(
      { user: { findUnique: async () => userFor(role) } },
      `${role}@example.com`,
      'password123',
    );
    assert.equal(result.user.role, role);
    assert.ok(result.token);
  }

  await assert.rejects(
    loginWithPrisma(
      { user: { findUnique: async () => userFor('user', 'archived') } },
      'former@example.com',
      'password123',
    ),
    (error) => error.statusCode === 403,
  );
});

test('expense aggregation preserves totals and groups all non-ad spend under other', () => {
  const { summarizeMonthlySpend } = require('../src/services/budgetService');
  const expenses = [
    { expenseType: 'Ads', amount: 8_500_000 },
    { expenseType: 'Custom', amount: 3_200_000 },
    { expenseType: 'KOL', amount: 15_000_000 },
  ];

  assert.deepEqual(summarizeMonthlySpend(expenses, 50_000_000), {
    totalMonthlySpend: 26_700_000,
    monthlyBudgetGoal: 50_000_000,
    budgetUtilization: 53.4,
    breakdown: { adsSpend: 8_500_000, otherSpend: 18_200_000 },
  });
});

test('expense creation rejects categories outside the retained financial contract', async () => {
  const { addExpense } = require('../src/services/budgetService');
  await assert.rejects(
    addExpense(1, { marketingPlanId: 1, expenseType: 'Event', amount: 100_000 }),
    (error) => error.statusCode === 400 && /loại chi phí/i.test(error.message),
  );
});

test('budget reads and writes deny cross-user plan access', async () => {
  const { getCampaignBudget, addExpense } = require('../src/services/budgetService');
  const fakePrisma = {
    marketingPlan: {
      findFirst: async ({ where }) => where.userId === 9 ? null : { id: 4, userId: 4, budget: 1000, expenses: [] },
    },
    expense: { create: async () => assert.fail('expense must not be created') },
  };
  const intruder = { id: 9, role: 'user' };

  await assert.rejects(getCampaignBudget(4, intruder, fakePrisma), (error) => error.statusCode === 404);
  await assert.rejects(
    addExpense(intruder, { marketingPlanId: 4, expenseType: 'Custom', amount: 100 }, fakePrisma),
    (error) => error.statusCode === 404,
  );
});

test('business profile sync retains every supported social and commerce channel', () => {
  const { MANAGED_SOCIAL_PLATFORMS } = require('../src/services/authService');
  assert.deepEqual(MANAGED_SOCIAL_PLATFORMS, [
    'facebook', 'instagram', 'tiktok', 'youtube', 'threads',
    'shopee', 'lazada', 'tiki', 'tiktok_shop', 'chotot',
  ]);
});

test('marketing-plan responses preserve historical text and expose its legacy marker', () => {
  const { formatPlan } = require('../src/services/marketingPlanService');
  const contentIdeas = '[{"title":"Historical content"}]';
  const result = formatPlan({
    id: 3,
    budget: '1250000',
    contentIdeas,
    videoScripts: null,
    checklist: null,
    playbook: null,
    seoKeywords: null,
    budgetBreakdown: null,
    hasLegacyContent: true,
  });

  assert.equal(result.hasLegacyContent, true);
  assert.deepEqual(result.contentIdeas, [{ title: 'Historical content' }]);
  assert.equal(result.budget, 1_250_000);
});
