const prisma = require('../config/prisma');
const { PAYMENT_PLANS } = require('../config/paymentPlans');
const { AppError } = require('../middleware/errorHandler');

const CYCLE_MS = 30 * 86400000;
const emptyAccess = { planId: null, planName: null, canGenerate: false, kitLimit: 0, used: 0, remaining: 0,
  features: { videoScripts: false, multiChannel: false, customStrategy: false } };

function paymentSetupError(error) {
  if (['P2021', 'P2022'].includes(error?.code) && /payment_orders|user_subscriptions|sepay_webhook_events|subscription_usage|bank_paid_at/i.test(error.message || '')) {
    return new AppError('Thanh toán đang được thiết lập. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.', 503, { code: 'PAYMENT_SETUP_REQUIRED' });
  }
  return error;
}

function createSubscriptionService(db = prisma, clock = () => new Date()) {
  async function getAccess(user, client = db) {
    if (user.role === 'admin' || user.role === 'staff') return { ...emptyAccess, canGenerate: true, kitLimit: null, remaining: null,
      features: { videoScripts: true, multiChannel: true, customStrategy: true }, internal: true };
    if (user.isDemo) return { ...emptyAccess, reason: 'DEMO_ACCOUNT' };
    try {
      const subscription = await client.userSubscription.findUnique({ where: { userId: user.id } });
      const now = clock();
      const plan = subscription && PAYMENT_PLANS[subscription.planId];
      if (!plan || subscription.startsAt > now || subscription.expiresAt <= now) return { ...emptyAccess, reason: 'SUBSCRIPTION_REQUIRED' };
      const cycle = Math.floor((now - subscription.startsAt) / CYCLE_MS);
      const periodStart = new Date(subscription.startsAt.getTime() + cycle * CYCLE_MS);
      const periodEnd = new Date(Math.min(periodStart.getTime() + CYCLE_MS, subscription.expiresAt.getTime()));
      const periodKey = `${plan.id}:${periodStart.toISOString()}`;
      const usage = await client.subscriptionUsage.findUnique({ where: { userId_periodKey: { userId: user.id, periodKey } } });
      const used = usage?.count || 0;
      const remaining = plan.kitLimit === null ? null : Math.max(0, plan.kitLimit - used);
      return { planId: plan.id, planName: plan.name, canGenerate: remaining === null || remaining > 0,
        kitLimit: plan.kitLimit, used, remaining, periodKey, periodStart, periodEnd, expiresAt: subscription.expiresAt,
        reason: remaining === 0 ? 'SUBSCRIPTION_QUOTA_EXCEEDED' : null,
        features: { videoScripts: plan.id !== 'starter', multiChannel: plan.id === 'advanced', customStrategy: plan.id === 'advanced' } };
    } catch (error) { throw paymentSetupError(error); }
  }

  function assertAccess(access) {
    if (!access.canGenerate) throw new AppError(access.reason === 'SUBSCRIPTION_QUOTA_EXCEEDED'
      ? 'Bạn đã dùng hết số bộ Marketing trong kỳ này. Vui lòng nâng cấp hoặc chờ kỳ tiếp theo.'
      : 'Bạn cần mua gói dịch vụ còn hiệu lực để tạo bộ Marketing.', 402, {
      code: access.reason || 'SUBSCRIPTION_REQUIRED', upgradeUrl: '/upgrade',
    });
  }

  async function requireAccess(user) {
    const access = await getAccess(user);
    assertAccess(access);
    return access;
  }

  async function consumeKit(client, user) {
    if (user.role === 'admin' || user.role === 'staff') return getAccess(user, client);
    // Runs inside the MarketingPlan creation transaction; failed generation never consumes a kit.
    await client.$queryRaw`SELECT id FROM public.users WHERE id = ${user.id} FOR UPDATE`;
    const access = await getAccess(user, client);
    assertAccess(access);
    await client.subscriptionUsage.upsert({ where: { userId_periodKey: { userId: user.id, periodKey: access.periodKey } },
      create: { userId: user.id, periodKey: access.periodKey, count: 1 }, update: { count: { increment: 1 } } });
    return access;
  }

  return { getAccess, requireAccess, consumeKit };
}

module.exports = { createSubscriptionService, paymentSetupError };
