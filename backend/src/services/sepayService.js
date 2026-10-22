const crypto = require('node:crypto');
const { z } = require('zod');
const { AppError } = require('../middleware/errorHandler');

function getSepayConfig(env = process.env) {
  const config = {
    bank: env.SEPAY_BANK?.trim(),
    accountNumber: env.SEPAY_ACCOUNT_NUMBER?.trim(),
    accountName: env.SEPAY_ACCOUNT_NAME?.trim(),
    virtualAccount: env.SEPAY_VIRTUAL_ACCOUNT?.trim(),
    authMode: env.SEPAY_WEBHOOK_AUTH || 'apikey',
    secret: env.SEPAY_WEBHOOK_SECRET,
  };
  if (!config.bank || !config.accountNumber || !config.accountName || !config.virtualAccount ||
      !['apikey', 'hmac'].includes(config.authMode) || !config.secret || config.secret.length < 32) {
    throw new AppError('Thanh toán chưa được cấu hình. Vui lòng liên hệ quản trị viên.', 503);
  }
  return config;
}

function safeEqual(a, b) {
  const left = Buffer.from(a || '');
  const right = Buffer.from(b || '');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifySepayRequest(req, config, now = Date.now()) {
  if (config.authMode === 'apikey') {
    if (!safeEqual(req.get('authorization'), `Apikey ${config.secret}`)) {
      throw new AppError('Invalid SePay API key', 401);
    }
    return;
  }
  const timestamp = req.get('x-sepay-timestamp') || '';
  const signature = req.get('x-sepay-signature') || '';
  if (!/^\d{10}$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300 || !Buffer.isBuffer(req.rawBody)) {
    throw new AppError('Invalid or expired SePay signature', 401);
  }
  const expected = `sha256=${crypto.createHmac('sha256', config.secret)
    .update(`${timestamp}.`).update(req.rawBody).digest('hex')}`;
  if (!safeEqual(signature, expected)) throw new AppError('Invalid SePay signature', 401);
}

const webhookSchema = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  gateway: z.string().min(1).max(100),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
  accountNumber: z.string().min(1).max(100),
  subAccount: z.string().max(100).nullable().optional(),
  code: z.string().max(100).nullable().optional(),
  content: z.string().max(4000),
  transferType: z.enum(['in', 'out']),
  transferAmount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  referenceCode: z.string().max(255).nullable().optional(),
});

function parseSepayPayload(body, now = Date.now()) {
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) throw new AppError('Invalid SePay payload', 400);
  const payload = parsed.data;
  const transactionAt = new Date(`${payload.transactionDate.replace(' ', 'T')}+07:00`);
  if (Number.isNaN(transactionAt.getTime())) throw new AppError('Invalid SePay transaction date', 400);
  // Reject impossible dates (Date otherwise normalizes 30 February, for example).
  const roundTrip = new Date(transactionAt.getTime() + 7 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
  if (roundTrip !== payload.transactionDate || transactionAt.getTime() > now + 300000) {
    throw new AppError('Invalid SePay transaction date', 400);
  }
  return { ...payload, transactionAt };
}

function extractPaymentCode(payload) {
  const codes = new Set((`${payload.code || ''} ${payload.content}`).toUpperCase()
    .match(/(?<![A-Z0-9])PA\d{12}(?![A-Z0-9])/g) || []);
  return codes.size === 1 ? [...codes][0] : null;
}

function buildQrUrl(order) {
  const params = new URLSearchParams({
    acc: order.virtualAccount, bank: order.bank,
    amount: String(order.amount), des: order.paymentCode,
  });
  return `https://vietqr.app/img?${params}`;
}

module.exports = { getSepayConfig, verifySepayRequest, parseSepayPayload, extractPaymentCode, buildQrUrl };
