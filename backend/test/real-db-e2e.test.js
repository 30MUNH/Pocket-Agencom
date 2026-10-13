const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const dotenv = require('dotenv');

if (process.env.PA_REAL_DB_E2E !== 'true') {
  throw new Error('This suite requires PA_REAL_DB_E2E=true and the dedicated real database runner.');
}

dotenv.config({ path: path.resolve(__dirname, '../.env') });
process.env.FREE_ONLY_MODE = 'true';
process.env.AI_ALLOW_PAID_MODELS = 'false';

const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const aiService = require('../src/services/ai/aiService');
const aiConfig = require('../src/services/ai/aiConfig');

const runPrefix = `pa-realdb-e2e-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const password = `RealDb-${crypto.randomBytes(9).toString('hex')}!`;
const emails = {
  owner: `${runPrefix}-owner@example.test`,
  other: `${runPrefix}-other@example.test`,
  archived: `${runPrefix}-archived@example.test`,
  staff: `${runPrefix}-staff@example.test`,
  admin: `${runPrefix}-admin@example.test`,
};
let server;
let baseUrl;
let owner;
let other;
let staff;
let planId;
let postId;
let mediaId;
let ticketId;
let testStaffNotificationIds = [];

async function startBackend() {
  const app = createApp();
  server = await new Promise((resolve, reject) => {
    const httpServer = app.listen(0, '127.0.0.1', () => resolve(httpServer));
    httpServer.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

async function stopBackend() {
  if (!server) return;
  const active = server;
  server = null;
  await new Promise((resolve, reject) => active.close((error) => error ? reject(error) : resolve()));
}

async function api(method, route, token, body) {
  const response = await fetch(`${baseUrl}/api${route}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json();
  return { status: response.status, payload };
}

async function register(email, name) {
  const result = await api('POST', '/auth/register', null, {
    email,
    name,
    password,
    businessType: 'Test studio',
    productDescription: `${runPrefix} synthetic test business`,
    targetCustomer: 'Synthetic test audience',
  });
  assert.equal(result.status, 201, JSON.stringify(result.payload));
  return { id: result.payload.data.user.id, token: result.payload.data.token };
}

async function cleanup() {
  if (testStaffNotificationIds.length) {
    await prisma.notification.deleteMany({ where: { id: { in: testStaffNotificationIds } } });
    testStaffNotificationIds = [];
  }
  const users = await prisma.user.findMany({
    where: { email: { startsWith: runPrefix } },
    select: { id: true },
  });
  const userIds = users.map(({ id }) => id);
  if (userIds.length) {
    const plans = await prisma.marketingPlan.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
    const planIds = plans.map(({ id }) => id);
    if (planIds.length) await prisma.expense.deleteMany({ where: { marketingPlanId: { in: planIds } } });
    await prisma.marketingPlan.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.scheduledPost.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.mediaAsset.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.supportTicket.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.supportTicket.deleteMany({ where: { assignedStaffId: { in: userIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.aiQuotaUsage.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.socialPlatform.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.template.deleteMany({ where: { createdById: { in: userIds } } });
    await prisma.businessProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

test('real PostgreSQL application workflows persist and enforce ownership', { timeout: 180000 }, async (t) => {
  t.after(async () => {
    await stopBackend();
    try {
      await cleanup();
      const remaining = await prisma.user.count({ where: { email: { startsWith: runPrefix } } });
      assert.equal(remaining, 0, 'all run-owned synthetic users must be removed');
    } finally {
      await prisma.$disconnect();
    }
  });

  await startBackend();
  owner = await register(emails.owner, `${runPrefix} Owner`);
  other = await register(emails.other, `${runPrefix} Other`);
  const archived = await register(emails.archived, `${runPrefix} Archived`);

  await t.test('authentication, profile, password change, and archived-account rejection', async () => {
    const login = await api('POST', '/auth/login', null, { email: emails.owner, password });
    assert.equal(login.status, 200);
    owner.token = login.payload.data.token;
    const profile = await api('GET', '/auth/me', owner.token);
    assert.equal(profile.status, 200);
    assert.equal(profile.payload.data.email, emails.owner);

    const invalidLogin = await api('POST', '/auth/login', null, { email: emails.owner, password: 'incorrect' });
    assert.equal(invalidLogin.status, 401);

    const updatedProfile = await api('PUT', '/auth/business-profile', owner.token, {
      businessName: `${runPrefix} Business`,
      businessType: 'Synthetic test',
      productDescription: `${runPrefix} profile persistence`,
      targetCustomer: 'Test audience',
      socialLinks: [],
    });
    assert.equal(updatedProfile.status, 200);
    const storedProfile = await prisma.businessProfile.findUnique({ where: { userId: owner.id } });
    assert.equal(storedProfile.businessName, `${runPrefix} Business`);

    const changedPassword = `Changed-${crypto.randomBytes(9).toString('hex')}!`;
    const change = await api('PUT', '/auth/change-password', owner.token, { currentPassword: password, newPassword: changedPassword });
    assert.equal(change.status, 200);
    assert.equal((await api('POST', '/auth/login', null, { email: emails.owner, password })).status, 401);
    const newLogin = await api('POST', '/auth/login', null, { email: emails.owner, password: changedPassword });
    assert.equal(newLogin.status, 200);
    owner.token = newLogin.payload.data.token;

    await prisma.user.update({ where: { id: archived.id }, data: { status: 'archived' } });
    const archivedLogin = await api('POST', '/auth/login', null, { email: emails.archived, password });
    assert.ok([401, 403].includes(archivedLogin.status));
    assert.equal((await api('GET', '/admin/users', owner.token)).status, 403);
  });

  await t.test('AI quota increments are atomic, bounded, and survive a backend restart', async () => {
    const limit = aiConfig.userQuotas.dailyGenerationsLimit;
    assert.ok(Number.isInteger(limit) && limit > 1);
    for (let i = 0; i < limit - 1; i += 1) await aiService.checkAndIncrementUserQuota(other.id, 'text');

    const concurrent = await Promise.allSettled(
      Array.from({ length: 5 }, () => aiService.checkAndIncrementUserQuota(other.id, 'text')),
    );
    const row = await prisma.aiQuotaUsage.findUnique({
      where: { userId_dateKey_type: { userId: other.id, dateKey: new Date().toISOString().slice(0, 10), type: 'text' } },
    });
    assert.equal(row.count, limit);
    assert.equal(concurrent.filter((item) => item.status === 'fulfilled').length, 1);

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await prisma.aiQuotaUsage.create({ data: { userId: other.id, dateKey: yesterday, type: 'image', count: 999 } });
    const statusBeforeRestart = await aiService.getUserQuotaStatus(other.id);
    assert.equal(statusBeforeRestart.image.used, 0);

    await stopBackend();
    await prisma.$disconnect();
    await prisma.$connect();
    await startBackend();
    const statusAfterRestart = await aiService.getUserQuotaStatus(other.id);
    assert.equal(statusAfterRestart.text.used, limit);
  });

  await t.test('marketing plan generation, ownership, save, and staff review persist', { timeout: 120000 }, async () => {
    const generated = await api('POST', '/marketing-plans/generate', owner.token, {
      businessType: 'Tiệm cà phê thử nghiệm',
      campaignType: 'social awareness',
      productDescription: `${runPrefix} cà phê rang xay cho khách hàng địa phương`,
      targetCustomer: 'Người đi làm từ 22 đến 35 tuổi tại khu vực gần quán',
      goal: 'Tăng khách ghé quán trong tháng này',
      budget: 1000000,
      deploymentChannels: 'Facebook, TikTok',
      existingResources: 'Ảnh sản phẩm tổng hợp',
      campaignReason: 'Kiểm tra luồng sinh kế hoạch thật',
    });
    assert.equal(generated.status, 201, JSON.stringify(generated.payload));
    planId = generated.payload.data.id;
    assert.ok(planId);

    let stored = await prisma.marketingPlan.findUnique({ where: { id: planId } });
    assert.equal(stored.userId, owner.id);
    assert.match(stored.goal, /Tăng khách ghé quán/);
    assert.ok(stored.contentIdeas);

    const revised = await api('POST', `/marketing-plans/${planId}/refine`, owner.token, {
      instruction: 'Rút gọn kế hoạch và thêm một lời kêu gọi ghé quán rõ ràng.',
    });
    assert.equal(revised.status, 200, JSON.stringify(revised.payload));
    stored = await prisma.marketingPlan.findUnique({ where: { id: planId } });
    assert.equal(stored.userId, owner.id);
    assert.ok(stored.updatedAt >= stored.createdAt);

    const otherAccess = await api('GET', `/marketing-plans/${planId}`, other.token);
    assert.ok([403, 404].includes(otherAccess.status));

    const forbiddenReview = await api('PATCH', `/marketing-plans/${planId}/review`, owner.token, { action: 'reviewed' });
    assert.equal(forbiddenReview.status, 403);
    const priorNotificationMax = await prisma.notification.aggregate({ _max: { id: true } });
    const save = await api('POST', `/marketing-plans/${planId}/save`, owner.token, {});
    assert.equal(save.status, 200);
    const newStaffNotifications = await prisma.notification.findMany({
      where: {
        id: { gt: priorNotificationMax._max.id || 0 },
        title: 'Plan ready for review',
        message: 'Marketing plan from user requires staff review.',
      },
      select: { id: true },
    });
    testStaffNotificationIds = newStaffNotifications.map(({ id }) => id);
    stored = await prisma.marketingPlan.findUnique({ where: { id: planId } });
    assert.equal(stored.status, 'saved');

    const staffPassword = `Staff-${crypto.randomBytes(9).toString('hex')}!`;
    const passwordHash = await bcrypt.hash(staffPassword, 10);
    await prisma.user.create({ data: { name: `${runPrefix} Staff`, email: emails.staff, passwordHash, role: 'staff', status: 'active' } });
    const staffLogin = await api('POST', '/auth/login', null, { email: emails.staff, password: staffPassword });
    assert.equal(staffLogin.status, 200);
    staff = { id: (await prisma.user.findUnique({ where: { email: emails.staff }, select: { id: true } })).id, token: staffLogin.payload.data.token };
    const review = await api('PATCH', `/marketing-plans/${planId}/review`, staff.token, { action: 'reviewed', note: `${runPrefix} verified` });
    assert.equal(review.status, 200);
    stored = await prisma.marketingPlan.findUnique({ where: { id: planId } });
    assert.equal(stored.status, 'reviewed');

    const adminPassword = `Admin-${crypto.randomBytes(9).toString('hex')}!`;
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({ data: { name: `${runPrefix} Admin`, email: emails.admin, passwordHash: adminPasswordHash, role: 'admin', status: 'active' } });
    const adminLogin = await api('POST', '/auth/login', null, { email: emails.admin, password: adminPassword });
    assert.equal(adminLogin.status, 200);
    const adminToken = adminLogin.payload.data.token;

    const userList = await api('GET', '/admin/users', adminToken);
    assert.equal(userList.status, 200);
    assert.ok(userList.payload.data.users.some((item) => item.id === owner.id));

    const promote = await api('PATCH', `/admin/users/${other.id}/role`, adminToken, { role: 'staff' });
    assert.equal(promote.status, 200);
    assert.equal((await prisma.user.findUnique({ where: { id: other.id }, select: { role: true } })).role, 'staff');
    const restoreRole = await api('PATCH', `/admin/users/${other.id}/role`, adminToken, { role: 'user' });
    assert.equal(restoreRole.status, 200);
    assert.equal((await prisma.user.findUnique({ where: { id: other.id }, select: { role: true } })).role, 'user');

    const archivedRoleChange = await api('PATCH', `/admin/users/${archived.id}/role`, adminToken, { role: 'staff' });
    assert.equal(archivedRoleChange.status, 400);
    assert.equal((await prisma.user.findUnique({ where: { id: archived.id }, select: { role: true, status: true } })).status, 'archived');
  });

  await t.test('scheduled posts, media, and support tickets use persisted rows', async () => {
    const me = await api('GET', '/auth/me', owner.token);
    const businessProfileId = me.payload.data.businessProfile.id;

    const createPost = await api('POST', '/scheduled-posts', owner.token, {
      title: `${runPrefix} scheduled post`,
      content: `${runPrefix} original caption`,
      platform: 'Facebook',
      scheduledTime: new Date(Date.now() + 3600000).toISOString(),
      businessProfileId,
      imageUrl: 'https://example.test/phase4-image.png',
    });
    assert.equal(createPost.status, 201);
    postId = createPost.payload.data.id;
    let storedPost = await prisma.scheduledPost.findUnique({ where: { id: postId } });
    assert.equal(storedPost.imageUrl, 'https://example.test/phase4-image.png');
    const updatePost = await api('PATCH', `/scheduled-posts/${postId}`, owner.token, {
      title: `${runPrefix} edited post`,
      content: `${runPrefix} edited caption`,
      scheduledTime: new Date(Date.now() + 7200000).toISOString(),
    });
    assert.equal(updatePost.status, 200);
    storedPost = await prisma.scheduledPost.findUnique({ where: { id: postId } });
    assert.equal(storedPost.title, `${runPrefix} edited post`);
    assert.equal(storedPost.imageUrl, 'https://example.test/phase4-image.png');

    const createdMedia = await api('POST', '/media', owner.token, {
      name: `${runPrefix} media metadata`,
      url: 'https://example.test/phase4-media.png',
      fileType: 'image/png',
      sizeBytes: 128,
      businessProfileId,
    });
    assert.equal(createdMedia.status, 201);
    mediaId = createdMedia.payload.data.id;
    assert.equal(await prisma.mediaAsset.count({ where: { id: mediaId, userId: owner.id } }), 1);
    assert.equal((await api('DELETE', `/media/${mediaId}`, other.token)).status, 404);

    const ticket = await api('POST', '/support/tickets', owner.token, {
      subject: `${runPrefix} support ticket`,
      message: 'Synthetic persistence verification only.',
      category: 'technical',
    });
    assert.equal(ticket.status, 201);
    ticketId = ticket.payload.data.id;
    assert.equal(await prisma.supportTicket.count({ where: { id: ticketId, userId: owner.id } }), 1);
    const listedTickets = await api('GET', '/support/tickets', owner.token);
    assert.ok(listedTickets.payload.data.some((item) => item.id === ticketId));

    const deletedPost = await api('DELETE', `/scheduled-posts/${postId}`, owner.token);
    assert.equal(deletedPost.status, 200);
    assert.equal(await prisma.scheduledPost.count({ where: { id: postId } }), 0);
    const deletedMedia = await api('DELETE', `/media/${mediaId}`, owner.token);
    assert.equal(deletedMedia.status, 200);
    assert.equal(await prisma.mediaAsset.count({ where: { id: mediaId } }), 0);
  });
});
