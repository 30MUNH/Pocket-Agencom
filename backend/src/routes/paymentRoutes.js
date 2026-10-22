const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');
const { createPaymentService } = require('../services/paymentService');
const { getSepayConfig, verifySepayRequest, parseSepayPayload } = require('../services/sepayService');
const { paymentSetupError } = require('../services/subscriptionService');

function createPaymentRouter({ service = createPaymentService(), authenticate = authMiddleware, configProvider = getSepayConfig } = {}) {
  const router = express.Router();
  const run = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch((error) => next(paymentSetupError(error)));
  const validOrderId = (req, res, next) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) return next(new AppError('Mã đơn không hợp lệ.', 400));
    next();
  };

  router.get('/catalog', (req, res) => success(res, service.getCatalog()));

  // This route uses SePay authentication, never the customer's JWT.
  router.post('/webhooks/sepay', run(async (req, res) => {
    verifySepayRequest(req, configProvider());
    const payload = parseSepayPayload(req.body);
    await service.processWebhook(payload);
    res.status(200).json({ success: true });
  }));

  router.use(authenticate, requireRole('user'));
  router.get('/access', run(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    success(res, await service.getAccess(req.user));
  }));
  router.use((req, res, next) => {
    if (req.user.isDemo) return next(new AppError('Vui lòng đăng nhập bằng tài khoản thật để thanh toán.', 403));
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/billing', run(async (req, res) => success(res, await service.getBilling(req.user.id))));
  router.post('/orders', run(async (req, res) => {
    if (typeof req.body?.planId !== 'string') throw new AppError('Vui lòng chọn gói dịch vụ.', 400);
    success(res, await service.createOrder(req.user.id, req.body.planId), 201);
  }));
  router.get('/orders/:id', validOrderId, run(async (req, res) => {
    success(res, await service.getOrder(req.user.id, req.params.id));
  }));
  router.post('/orders/:id/cancel', validOrderId, run(async (req, res) => {
    if (req.body?.confirmUnpaid !== true) throw new AppError('Chỉ hủy đơn nếu bạn chưa chuyển tiền.', 400);
    success(res, await service.cancelOrder(req.user.id, req.params.id));
  }));
  return router;
}

module.exports = { createPaymentRouter };
