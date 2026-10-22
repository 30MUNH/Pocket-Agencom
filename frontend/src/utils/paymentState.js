export function isPendingPayment(order, now = Date.now()) {
  return order?.status === 'pending' && new Date(order.expiresAt).getTime() > now;
}

export function shouldPollPayment(order, now = Date.now()) {
  if (!order) return true;
  if (order.status === 'paid' || order.status === 'cancelled') return false;
  // Keep checking briefly after expiry so a delayed bank notification can still update the screen.
  return now < new Date(order.expiresAt).getTime() + 120000;
}

export function paymentErrorMessage(error) {
  if (error?.details?.code === 'PAYMENT_SETUP_REQUIRED') return 'Thanh toán đang được thiết lập. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
  if (error?.details?.code === 'DATABASE_UNAVAILABLE') return 'Chưa kết nối được dữ liệu thanh toán. Bấm thử lại để kiểm tra kết nối.';
  return error?.message || 'Chưa thể tải thông tin thanh toán. Vui lòng thử lại.';
}
