import axiosClient from './axiosClient';

export const paymentApi = {
  catalog: () => axiosClient.get('/payments/catalog'),
  access: () => axiosClient.get('/payments/access'),
  billing: () => axiosClient.get('/payments/billing'),
  createOrder: (planId) => axiosClient.post('/payments/orders', { planId }),
  getOrder: (id) => axiosClient.get(`/payments/orders/${encodeURIComponent(id)}`),
  cancelOrder: (id) => axiosClient.post(`/payments/orders/${encodeURIComponent(id)}/cancel`, { confirmUnpaid: true }),
};
