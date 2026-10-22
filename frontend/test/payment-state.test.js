import test from 'node:test';
import assert from 'node:assert/strict';
import { isPendingPayment, shouldPollPayment, paymentErrorMessage } from '../src/utils/paymentState.js';

test('expired pending records no longer lock the checkout button', () => {
  const now = Date.parse('2025-10-22T07:15:00Z');
  const order = { status: 'pending', expiresAt: '2025-10-22T07:15:00Z' };
  assert.equal(isPendingPayment(order, now - 1), true);
  assert.equal(isPendingPayment(order, now), false);
  assert.equal(isPendingPayment({ ...order, status: 'cancelled' }, now - 1), false);
});

test('polling covers delayed notification after expiry but stops for paid or cancelled orders', () => {
  const order = { status: 'expired', expiresAt: '2025-10-22T07:15:00Z' };
  assert.equal(shouldPollPayment(order, Date.parse('2025-10-22T07:16:00Z')), true);
  assert.equal(shouldPollPayment(order, Date.parse('2025-10-22T07:17:00Z')), false);
  assert.equal(shouldPollPayment({ ...order, status: 'paid' }), false);
  assert.equal(shouldPollPayment({ ...order, status: 'cancelled' }), false);
});

test('setup and network failures explain why checkout is not available', () => {
  assert.match(paymentErrorMessage({ details: { code: 'PAYMENT_SETUP_REQUIRED' } }), /được thiết lập/);
  assert.match(paymentErrorMessage({ details: { code: 'DATABASE_UNAVAILABLE' } }), /kết nối/);
  assert.equal(paymentErrorMessage({ message: 'Real account required' }), 'Real account required');
});
