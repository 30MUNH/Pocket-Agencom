const { randomInt } = require('node:crypto');
const prisma = require('../config/prisma');
const { PAYMENT_PLANS } = require('../config/paymentPlans');
const { AppError } = require('../middleware/errorHandler');
const { getSepayConfig, extractPaymentCode, buildQrUrl } = require('./sepayService');
const { createSubscriptionService } = require('./subscriptionService');

const DAY = 86400000;
const ORDER_TTL = 15 * 60000;
const withRecentEvents = { events: { where: { outcome: { startsWith: 'review_' } }, orderBy: { createdAt: 'desc' }, take: 1 } };
const REVIEW_MESSAGES = {
  review_wrong_account: 'Thông tin tài khoản nhận tiền chưa khớp. Vui lòng liên hệ hỗ trợ.',
  review_wrong_amount: 'Số tiền nhận được chưa khớp với đơn. Vui lòng liên hệ hỗ trợ trước khi chuyển thêm.',
  review_outside_window: 'Giao dịch được ghi nhận ngoài thời hạn đơn. Vui lòng liên hệ hỗ trợ.',
  review_already_paid: 'Đơn đã thanh toán trước đó; giao dịch phát sinh cần được kiểm tra.',
  review_cancelled: 'Đã nhận giao dịch cho đơn bị hủy. Vui lòng liên hệ hỗ trợ.',
  review_out_of_order: 'Giao dịch đến sau một lần đổi gói khác và cần được hỗ trợ đối soát.',
};

function presentOrder(order, now = new Date()) {
  return {
    id: order.id, paymentCode: order.paymentCode, planId: order.planId,
    planName: PAYMENT_PLANS[order.planId]?.name, amount: order.amount, currency: 'VND',
    durationDays: order.durationDays,
    status: order.status === 'pending' && order.expiresAt <= now ? 'expired' : order.status,
    bank: order.bank, virtualAccount: order.virtualAccount, accountName: order.accountName,
    qrUrl: buildQrUrl(order), createdAt: order.createdAt, expiresAt: order.expiresAt, paidAt: order.paidAt,
    review: order.events?.[0] ? { message: REVIEW_MESSAGES[order.events[0].outcome] || 'Giao dịch cần được kiểm tra. Vui lòng liên hệ hỗ trợ.',
      receivedAmount: Number(order.events[0].amount) } : null,
  };
}

function presentSubscription(subscription, now = new Date()) {
  if (!subscription || subscription.expiresAt <= now) return null;
  return { planId: subscription.planId, planName: PAYMENT_PLANS[subscription.planId]?.name,
    startsAt: subscription.startsAt, expiresAt: subscription.expiresAt };
}

function createPaymentService(db = prisma, configProvider = getSepayConfig, clock = () => new Date()) {
  const subscriptions = createSubscriptionService(db, clock);
  function getCatalog() {
    return Object.values(PAYMENT_PLANS).map((plan) => ({ ...plan, isPopular: plan.id === 'pro', currency: 'VND' }));
  }
  async function createOrder(userId, planId) {
    if (!Object.hasOwn(PAYMENT_PLANS, planId || '')) throw new AppError('Gói dịch vụ không hợp lệ.', 400);
    const config = configProvider();
    const plan = PAYMENT_PLANS[planId];
    // One pending checkout per user; a user row lock also serializes concurrent button clicks.
    return db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM public.users WHERE id = ${userId} FOR UPDATE`;
      const now = clock();
      const existing = await tx.paymentOrder.findFirst({
        where: { userId, status: 'pending', expiresAt: { gt: now } }, orderBy: { createdAt: 'desc' }, include: withRecentEvents,
      });
      if (existing) {
        if (existing.planId !== planId) {
          throw new AppError('Bạn đang có đơn chờ thanh toán. Hãy thanh toán hoặc đợi đơn hết hạn trước khi đổi gói.', 409);
        }
        return presentOrder(existing, now);
      }
      const order = await tx.paymentOrder.create({ data: {
        userId, planId, amount: plan.amount, durationDays: plan.durationDays,
        paymentCode: `PA${String(randomInt(0, 1000000000000)).padStart(12, '0')}`,
        bank: config.bank, accountNumber: config.accountNumber,
        accountName: config.accountName, virtualAccount: config.virtualAccount,
        createdAt: now, expiresAt: new Date(now.getTime() + ORDER_TTL),
      } });
      return presentOrder(order, now);
    });
  }

  async function getOrder(userId, id) {
    const order = await db.paymentOrder.findFirst({ where: { id, userId }, include: withRecentEvents });
    if (!order) throw new AppError('Không tìm thấy đơn thanh toán.', 404);
    return presentOrder(order, clock());
  }

  async function getBilling(userId) {
    const now = clock();
    const [subscription, orders, access] = await Promise.all([
      db.userSubscription.findUnique({ where: { userId } }),
      db.paymentOrder.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10, include: withRecentEvents }),
      subscriptions.getAccess({ id: userId, role: 'user' }),
    ]);
    return { subscription: presentSubscription(subscription, now), access, orders: orders.map((order) => presentOrder(order, now)) };
  }

  async function cancelOrder(userId, id) {
    return db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM public.users WHERE id = ${userId} FOR UPDATE`;
      const order = await tx.paymentOrder.findFirst({ where: { id, userId }, include: withRecentEvents });
      if (!order) throw new AppError('Không tìm thấy đơn thanh toán.', 404);
      if (order.status === 'paid') throw new AppError('Đơn đã thanh toán không thể hủy.', 409);
      if (order.events.length) throw new AppError('Đơn có giao dịch cần kiểm tra. Vui lòng liên hệ hỗ trợ để đối soát.', 409);
      const updated = await tx.paymentOrder.update({ where: { id }, data: { status: 'cancelled' } });
      return presentOrder(updated, clock());
    });
  }

  async function processWebhook(payload) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await db.$transaction(async (tx) => {
          // The insert and activation commit together. A failure rolls back the dedup key as well.
          await tx.sepayWebhookEvent.create({ data: {
            transactionId: String(payload.id), amount: BigInt(payload.transferAmount),
            accountNumber: payload.accountNumber, virtualAccount: payload.subAccount || null,
            paymentCode: extractPaymentCode(payload), referenceCode: payload.referenceCode || null,
            transactionAt: payload.transactionAt, outcome: 'received',
          } });
          const finish = async (outcome, orderId = null) => {
            await tx.sepayWebhookEvent.update({ where: { transactionId: String(payload.id) }, data: { outcome, orderId } });
            return { outcome };
          };
          if (payload.transferType !== 'in') return finish('ignored_outgoing');
          const paymentCode = extractPaymentCode(payload);
          if (!paymentCode) return finish('unmatched_code');
          let order = await tx.paymentOrder.findUnique({ where: { paymentCode } });
          if (!order) return finish('unmatched_order');
          await tx.$queryRaw`SELECT id FROM public.users WHERE id = ${order.userId} FOR UPDATE`;
          // Reload after locking: another transaction may have paid this order in the meantime.
          order = await tx.paymentOrder.findUnique({ where: { id: order.id } });
          if (order.accountNumber !== payload.accountNumber || order.virtualAccount !== payload.subAccount ||
              order.bank.toLowerCase() !== payload.gateway.toLowerCase()) {
            return finish('review_wrong_account', order.id);
          }
          if (payload.transferAmount !== order.amount) return finish('review_wrong_amount', order.id);
          if (order.status === 'paid') return finish('review_already_paid', order.id);
          if (order.status === 'cancelled') return finish('review_cancelled', order.id);
          if (payload.transactionAt.getTime() < Math.floor(order.createdAt.getTime() / 1000) * 1000 ||
              payload.transactionAt > order.expiresAt) return finish('review_outside_window', order.id);
          const now = clock();
          const current = await tx.userSubscription.findUnique({ where: { userId: order.userId }, include: { lastOrder: true } });
          if (current && current.planId !== order.planId && current.lastOrder?.bankPaidAt > payload.transactionAt) {
            return finish('review_out_of_order', order.id);
          }
          const renewal = current?.planId === order.planId && current.expiresAt > now;
          const expiresAt = new Date((renewal ? current.expiresAt : now).getTime() + order.durationDays * DAY);
          await tx.userSubscription.upsert({
            where: { userId: order.userId },
            create: { userId: order.userId, planId: order.planId, startsAt: now, expiresAt, lastOrderId: order.id },
            update: { planId: order.planId, startsAt: renewal ? current.startsAt : now, expiresAt, lastOrderId: order.id },
          });
          await tx.paymentOrder.update({ where: { id: order.id }, data: { status: 'paid', paidAt: now, bankPaidAt: payload.transactionAt } });
          return finish('paid', order.id);
        }, { maxWait: 5000, timeout: 15000 });
      } catch (err) {
        if (err.code === 'P2002') {
          const event = await db.sepayWebhookEvent.findUnique({ where: { transactionId: String(payload.id) } });
          if (event) return { outcome: 'duplicate' };
        }
        if (err.code === 'P2034' && attempt < 2) continue;
        throw err;
      }
    }
  }

  return { getCatalog, getAccess: subscriptions.getAccess, createOrder, getOrder, getBilling, cancelOrder, processWebhook };
}

module.exports = { createPaymentService };
