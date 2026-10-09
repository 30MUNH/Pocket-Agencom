const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcryptjs');

// Intercept Prisma before loading app
const prismaPath = require.resolve('../src/config/prisma');

// In-memory database simulation for thorough application integration testing
const passwordHash = bcrypt.hashSync('password123', 4);

const usersDb = [
  { id: 1, name: 'Normal User', email: 'user@example.com', passwordHash, role: 'user', status: 'active', phone: '0901234567' },
  { id: 2, name: 'Intruder User', email: 'intruder@example.com', passwordHash, role: 'user', status: 'active', phone: '0907654321' },
  { id: 3, name: 'Staff Member', email: 'staff@example.com', passwordHash, role: 'staff', status: 'active', phone: '0901112222' },
  { id: 4, name: 'Admin User', email: 'admin@example.com', passwordHash, role: 'admin', status: 'active', phone: '0903334444' },
  { id: 5, name: 'Archived KOL', email: 'former@example.com', passwordHash, role: 'user', status: 'archived', phone: '0905556666' },
];

const businessProfilesDb = [
  { id: 10, userId: 1, businessName: 'Coffee Shop', businessType: 'F&B', productDescription: 'Espresso & Pastries', targetCustomer: 'Young professionals', monthlyMarketingBudget: '20000000', socialPlatforms: [] },
  { id: 20, userId: 2, businessName: 'Fashion Boutique', businessType: 'Retail', productDescription: 'Clothing', targetCustomer: 'Students', monthlyMarketingBudget: '15000000', socialPlatforms: [] },
];

const marketingPlansDb = [
  {
    id: 101,
    userId: 1,
    businessProfileId: 10,
    goal: 'Summer Coffee Campaign',
    campaignType: 'Promotion',
    budget: 15000000,
    contentIdeas: JSON.stringify([{ title: 'Reel 1', channel: 'Instagram' }]),
    videoScripts: JSON.stringify([{ title: 'Morning Coffee', scene: '0-15s', action: 'Brewing' }]),
    checklist: JSON.stringify(['Prepare flyers', 'Launch ad']),
    playbook: JSON.stringify([{ phaseName: 'Phase 1', duration: 'Week 1', objective: 'Awareness' }]),
    seoKeywords: JSON.stringify(['coffee', 'espresso']),
    budgetBreakdown: null,
    hasLegacyContent: false,
    status: 'saved',
    reviewedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 102,
    userId: 1,
    businessProfileId: 10,
    goal: 'Draft Campaign',
    campaignType: 'Brand',
    budget: 5000000,
    contentIdeas: 'Plain historical text idea',
    videoScripts: 'Plain script text',
    checklist: 'Checklist plain text',
    playbook: 'Playbook summary text',
    seoKeywords: 'coffee beans',
    hasLegacyContent: true,
    status: 'draft',
    reviewedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const expensesDb = [
  { id: 1, marketingPlanId: 101, expenseType: 'Ads', amount: 5000000, note: 'Facebook Ads', date: new Date() },
  { id: 2, marketingPlanId: 101, expenseType: 'Custom', amount: 2000000, note: 'Print Materials', date: new Date() },
];

const scheduledPostsDb = [
  { id: 1, userId: 1, title: 'Summer Special', content: 'Try our iced latte', platform: 'Facebook', scheduledTime: new Date() },
];

const mediaAssetsDb = [
  { id: 1, userId: 1, name: 'banner.png', url: 'https://example.com/banner.png', fileType: 'image' },
];

const mockPrisma = {
  $transaction: async (fnOrArray) => {
    if (typeof fnOrArray === 'function') {
      return fnOrArray(mockPrisma);
    }
    return Promise.all(fnOrArray);
  },
  user: {
    findUnique: async ({ where }) => {
      if (where.id) return usersDb.find((u) => u.id === where.id) || null;
      if (where.email) return usersDb.find((u) => u.email === where.email) || null;
      return null;
    },
    create: async ({ data }) => {
      const newUser = { id: usersDb.length + 1, ...data };
      usersDb.push(newUser);
      return newUser;
    },
    findMany: async () => usersDb,
    update: async ({ where, data }) => {
      const u = usersDb.find((item) => item.id === where.id);
      if (!u) throw new Error('User not found');
      Object.assign(u, data);
      return u;
    },
    count: async () => usersDb.length,
  },
  businessProfile: {
    findUnique: async ({ where }) => {
      if (where.userId) {
        const bp = businessProfilesDb.find((b) => b.userId === where.userId);
        return bp ? { ...bp, socialPlatforms: [] } : null;
      }
      if (where.id) return businessProfilesDb.find((b) => b.id === where.id) || null;
      return null;
    },
    create: async ({ data }) => {
      const newBp = { id: businessProfilesDb.length + 10, ...data, socialPlatforms: [] };
      businessProfilesDb.push(newBp);
      return newBp;
    },
    upsert: async ({ create, update, where }) => {
      let bp = businessProfilesDb.find((b) => b.userId === where.userId);
      if (bp) {
        Object.assign(bp, update);
      } else {
        bp = { id: businessProfilesDb.length + 10, ...create, socialPlatforms: [] };
        businessProfilesDb.push(bp);
      }
      return bp;
    },
  },
  marketingPlan: {
    findUnique: async ({ where }) => {
      const plan = marketingPlansDb.find((p) => p.id === where.id);
      if (!plan) return null;
      const bp = businessProfilesDb.find((b) => b.id === plan.businessProfileId);
      const user = usersDb.find((u) => u.id === plan.userId);
      return { ...plan, businessProfile: bp, user };
    },
    findFirst: async ({ where }) => {
      const plan = marketingPlansDb.find((p) => {
        if (p.id !== where.id) return false;
        if (where.userId !== undefined && p.userId !== where.userId) return false;
        return true;
      });
      if (!plan) return null;
      const planExpenses = expensesDb.filter((e) => e.marketingPlanId === plan.id);
      return { ...plan, expenses: planExpenses };
    },
    findMany: async ({ where = {} }) => {
      return marketingPlansDb
        .filter((p) => {
          if (where.userId && p.userId !== where.userId) return false;
          if (where.status?.in && !where.status.in.includes(p.status)) return false;
          return true;
        })
        .map((plan) => {
          const bp = businessProfilesDb.find((b) => b.id === plan.businessProfileId);
          const user = usersDb.find((u) => u.id === plan.userId);
          return { ...plan, businessProfile: bp, user };
        });
    },
    create: async ({ data }) => {
      const newPlan = { id: marketingPlansDb.length + 100, ...data };
      marketingPlansDb.push(newPlan);
      return newPlan;
    },
    update: async ({ where, data }) => {
      const plan = marketingPlansDb.find((p) => p.id === where.id);
      if (!plan) throw new Error('Not found');
      Object.assign(plan, data);
      const bp = businessProfilesDb.find((b) => b.id === plan.businessProfileId);
      const user = usersDb.find((u) => u.id === plan.userId);
      return { ...plan, businessProfile: bp, user };
    },
    delete: async ({ where }) => {
      const idx = marketingPlansDb.findIndex((p) => p.id === where.id);
      if (idx !== -1) marketingPlansDb.splice(idx, 1);
      return { id: where.id };
    },
  },
  expense: {
    findMany: async ({ where = {} }) => {
      if (where.marketingPlanId?.in) {
        return expensesDb.filter((e) => where.marketingPlanId.in.includes(e.marketingPlanId));
      }
      return expensesDb;
    },
    create: async ({ data }) => {
      const newExpense = { id: expensesDb.length + 1, ...data };
      expensesDb.push(newExpense);
      return newExpense;
    },
  },
  scheduledPost: {
    findMany: async ({ where = {} }) => scheduledPostsDb.filter((p) => p.userId === where.userId),
    create: async ({ data }) => {
      const post = { id: scheduledPostsDb.length + 1, ...data };
      scheduledPostsDb.push(post);
      return post;
    },
  },
  mediaAsset: {
    findMany: async ({ where = {} }) => mediaAssetsDb.filter((m) => m.userId === where.userId),
    create: async ({ data }) => {
      const asset = { id: mediaAssetsDb.length + 1, ...data };
      mediaAssetsDb.push(asset);
      return asset;
    },
  },
  notification: {
    create: async ({ data }) => ({ id: Date.now(), ...data }),
  },
  socialPlatform: {
    deleteMany: async () => ({ count: 0 }),
    createMany: async () => ({ count: 0 }),
    findMany: async () => [],
  },
};

require.cache[prismaPath] = { exports: mockPrisma };

const { createApp } = require('../src/app');
const { signToken } = require('../src/utils/jwt');
const app = createApp();

const userToken = signToken({ userId: 1, role: 'user' });
const intruderToken = signToken({ userId: 2, role: 'user' });
const staffToken = signToken({ userId: 3, role: 'staff' });
const adminToken = signToken({ userId: 4, role: 'admin' });
const archivedToken = signToken({ userId: 5, role: 'user' });

// ── 1. Authentication & Authorization ───────────────────────────

test('HTTP: register creates user and rejects invalid inputs', async () => {
  const validRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'New Business',
      email: 'newbiz@example.com',
      password: 'securePassword123',
      phone: '0911223344',
      businessType: 'Bakery',
      productDescription: 'Artisan Sourdough bread',
      targetCustomer: 'Health-conscious families',
    });
  assert.equal(validRes.status, 201);
  assert.equal(validRes.body.success, true);
  assert.equal(validRes.body.data.user.email, 'newbiz@example.com');
  assert.equal(validRes.body.data.user.role, 'user');

  // Duplicate email rejects with 409
  const dupRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'New Business',
      email: 'newbiz@example.com',
      password: 'securePassword123',
    });
  assert.equal(dupRes.status, 409);

  // Rejected role: 'kol' fails validation with 422
  const kolRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'KOL Register Attempt',
      email: 'kolattempt@example.com',
      password: 'securePassword123',
      role: 'kol',
    });
  assert.equal(kolRes.status, 422);
});

test('HTTP: login authenticates active user and rejects archived account', async () => {
  const successRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@example.com', password: 'password123' });
  assert.equal(successRes.status, 200);
  assert.ok(successRes.body.data.token);
  assert.equal(successRes.body.data.user.role, 'user');

  // Archived account rejected with 403
  const archivedRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'former@example.com', password: 'password123' });
  assert.equal(archivedRes.status, 403);
  assert.match(archivedRes.body.error.message, /inactive or banned/i);

  // Wrong password returns 401
  const wrongPwdRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@example.com', password: 'wrongpassword' });
  assert.equal(wrongPwdRes.status, 401);
});

test('HTTP: GET /api/auth/me enforces authentication and reloads user', async () => {
  const okRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(okRes.status, 200);
  assert.equal(okRes.body.data.email, 'user@example.com');

  // Unauthenticated request returns 401
  const noAuthRes = await request(app).get('/api/auth/me');
  assert.equal(noAuthRes.status, 401);

  // Stale token for archived account returns 403
  const archivedRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${archivedToken}`);
  assert.equal(archivedRes.status, 403);
});

test('HTTP: role enforcement blocks unauthorized actions', async () => {
  // Regular user cannot call staff review
  const userReviewRes = await request(app)
    .patch('/api/marketing-plans/101/review')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ action: 'approve' });
  assert.equal(userReviewRes.status, 403);
  assert.equal(userReviewRes.body.error.message, 'Insufficient permissions');

  // Staff cannot call user post generation
  const staffGenRes = await request(app)
    .post('/api/marketing-plans/generate-post')
    .set('Authorization', `Bearer ${staffToken}`)
    .send({
      ideaTitle: 'Summer Post',
      ideaDescription: 'Post description',
      platform: 'Facebook',
      businessProfileId: 10,
    });
  assert.equal(staffGenRes.status, 403);
});

// ── 2. Marketing Plans & Review ─────────────────────────────────

test('HTTP: marketing plan retrieval enforces ownership and exposes review to staff', async () => {
  // Owner reads own plan
  const ownerRes = await request(app)
    .get('/api/marketing-plans/101')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(ownerRes.status, 200);
  assert.equal(ownerRes.body.data.goal, 'Summer Coffee Campaign');

  // Intruder denied with 403
  const intruderRes = await request(app)
    .get('/api/marketing-plans/101')
    .set('Authorization', `Bearer ${intruderToken}`);
  assert.equal(intruderRes.status, 403);

  // Staff can read plan for review
  const staffRes = await request(app)
    .get('/api/marketing-plans/101')
    .set('Authorization', `Bearer ${staffToken}`);
  assert.equal(staffRes.status, 200);
});

test('HTTP: historical marketing plan retrieval preserves legacy flag and plain-text fields', async () => {
  const legacyRes = await request(app)
    .get('/api/marketing-plans/102')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(legacyRes.status, 200);
  assert.equal(legacyRes.body.data.id, 102);
  assert.equal(legacyRes.body.data.hasLegacyContent, true);
  assert.equal(legacyRes.body.data.contentIdeas, 'Plain historical text idea');
  assert.equal(legacyRes.body.data.videoScripts, 'Plain script text');
  assert.equal(legacyRes.body.data.checklist, 'Checklist plain text');
  assert.equal(legacyRes.body.data.playbook, 'Playbook summary text');
});

test('HTTP: staff plan review transitions status and validates transition rules', async () => {
  // Staff reviews plan
  const approveRes = await request(app)
    .patch('/api/marketing-plans/101/review')
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ action: 'approve' });
  assert.equal(approveRes.status, 200);
  assert.equal(approveRes.body.data.status, 'approved');

  // Invalid transition: approving an already approved plan returns 422
  const reApproveRes = await request(app)
    .patch('/api/marketing-plans/101/review')
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ action: 'approve' });
  assert.equal(reApproveRes.status, 422);
});

test('HTTP: save and delete marketing plans enforce owner authorization', async () => {
  // Intruder cannot save user 1 draft
  const intruderSave = await request(app)
    .post('/api/marketing-plans/102/save')
    .set('Authorization', `Bearer ${intruderToken}`);
  assert.equal(intruderSave.status, 403);

  // Owner saves plan
  const ownerSave = await request(app)
    .post('/api/marketing-plans/102/save')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(ownerSave.status, 200);
  assert.equal(ownerSave.body.data.status, 'saved');

  // Intruder cannot delete user 1 plan
  const intruderDelete = await request(app)
    .delete('/api/marketing-plans/102')
    .set('Authorization', `Bearer ${intruderToken}`);
  assert.equal(intruderDelete.status, 403);

  // Owner deletes plan
  const ownerDelete = await request(app)
    .delete('/api/marketing-plans/102')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(ownerDelete.status, 200);
  assert.equal(ownerDelete.body.data.deleted, true);
});

// ── 3. Content, Scheduling & Media ──────────────────────────────

test('HTTP: scheduled posts and media list endpoints respond for authenticated user', async () => {
  const postsRes = await request(app)
    .get('/api/scheduled-posts')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(postsRes.status, 200);
  assert.ok(Array.isArray(postsRes.body.data));

  const mediaRes = await request(app)
    .get('/api/media')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(mediaRes.status, 200);
  assert.ok(Array.isArray(mediaRes.body.data));
});

// ── 4. Budget & Expenses ────────────────────────────────────────

test('HTTP: budget and expense endpoints enforce plan ownership and contract', async () => {
  // Monthly spend overview returns ads/other breakdown
  const spendRes = await request(app)
    .get('/api/dashboard/monthly-spend')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(spendRes.status, 200);
  assert.equal(spendRes.body.data.breakdown.adsSpend, 5000000);
  assert.equal(spendRes.body.data.breakdown.otherSpend, 2000000);
  assert.equal(spendRes.body.data.totalMonthlySpend, 7000000);

  // Owner can access campaign budget
  const budgetRes = await request(app)
    .get('/api/campaigns/101/budget')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(budgetRes.status, 200);
  assert.equal(budgetRes.body.data.campaignId, 101);

  // Intruder cannot access campaign budget (404)
  const intruderBudgetRes = await request(app)
    .get('/api/campaigns/101/budget')
    .set('Authorization', `Bearer ${intruderToken}`);
  assert.equal(intruderBudgetRes.status, 404);

  // Owner adds valid expense
  const addExpenseRes = await request(app)
    .post('/api/expenses')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      marketingPlanId: 101,
      expenseType: 'Ads',
      amount: 1500000,
      note: 'Instagram Boost',
    });
  assert.equal(addExpenseRes.status, 201);

  // Staff cannot log expenses (403)
  const staffExpenseRes = await request(app)
    .post('/api/expenses')
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ marketingPlanId: 101, expenseType: 'Ads', amount: 500000 });
  assert.equal(staffExpenseRes.status, 403);

  // Intruder cannot log expense against user 1 plan (404)
  const intruderExpenseRes = await request(app)
    .post('/api/expenses')
    .set('Authorization', `Bearer ${intruderToken}`)
    .send({ marketingPlanId: 101, expenseType: 'Ads', amount: 500000 });
  assert.equal(intruderExpenseRes.status, 404);

  // Invalid expense category rejected with 400
  const invalidTypeRes = await request(app)
    .post('/api/expenses')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ marketingPlanId: 101, expenseType: 'InvalidType', amount: 500000 });
  assert.equal(invalidTypeRes.status, 400);
});

// ── 5. Removed Marketplace Routes ───────────────────────────────

test('HTTP: removed marketplace namespaces return standard 404 contract across methods', async () => {
  const removedRoutes = [
    { method: 'get', path: '/api/kols' },
    { method: 'post', path: '/api/kols' },
    { method: 'get', path: '/api/packages' },
    { method: 'get', path: '/api/bookings' },
    { method: 'post', path: '/api/bookings' },
    { method: 'get', path: '/api/kol-bookings' },
    { method: 'get', path: '/api/market' },
    { method: 'get', path: '/api/campaigns/101/applications' },
  ];

  for (const { method, path } of removedRoutes) {
    const res = await request(app)[method](path);
    assert.equal(res.status, 404, `${method.toUpperCase()} ${path} should return 404`);
    assert.deepEqual(res.body, {
      success: false,
      data: null,
      error: { message: 'Route not found' },
    });
  }
});

// ── 6. Admin User Management & Password Change ───────────────────

test('HTTP: admin user management enforces admin role and updates user status and role', async () => {
  // Non-admin user gets 403
  const forbiddenRes = await request(app)
    .get('/api/admin/users')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(forbiddenRes.status, 403);

  // Admin user gets 200 and list of users
  const adminRes = await request(app)
    .get('/api/admin/users')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(adminRes.status, 200);
  assert.equal(adminRes.body.success, true);
  assert.ok(Array.isArray(adminRes.body.data.users));
  assert.ok(adminRes.body.data.total >= 1);

  // Admin cannot self-deactivate
  const selfDeactivateRes = await request(app)
    .patch('/api/admin/users/4/status')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'inactive' });
  assert.equal(selfDeactivateRes.status, 400);

  // Admin updates normal user status to inactive
  const statusRes = await request(app)
    .patch('/api/admin/users/1/status')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'inactive' });
  assert.equal(statusRes.status, 200);
  assert.equal(statusRes.body.data.status, 'inactive');

  // Admin updates user role
  const roleRes = await request(app)
    .patch('/api/admin/users/1/role')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ role: 'staff' });
  assert.equal(roleRes.status, 200);
  assert.equal(roleRes.body.data.role, 'staff');

  // Reset back to active user
  await request(app)
    .patch('/api/admin/users/1/status')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'active' });
  await request(app)
    .patch('/api/admin/users/1/role')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ role: 'user' });
});

test('HTTP: password change requires valid current password and updates password', async () => {
  // Incorrect current password
  const badPassRes = await request(app)
    .put('/api/auth/change-password')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ currentPassword: 'wrongPassword', newPassword: 'newSecretPassword123' });
  assert.equal(badPassRes.status, 400);

  // Correct current password
  const goodPassRes = await request(app)
    .put('/api/auth/change-password')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ currentPassword: 'password123', newPassword: 'newSecretPassword123' });
  assert.equal(goodPassRes.status, 200);
  assert.equal(goodPassRes.body.success, true);

  // Reset password back for other tests
  await request(app)
    .put('/api/auth/change-password')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ currentPassword: 'newSecretPassword123', newPassword: 'password123' });
});
