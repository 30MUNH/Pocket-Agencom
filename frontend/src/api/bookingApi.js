import axiosClient from './axiosClient';

export const bookingApi = {
  list: () => axiosClient.get('/bookings'),
  getById: (id) => axiosClient.get(`/bookings/${id}`),
  create: (data) => axiosClient.post('/bookings', data),
  updateStatus: (id, data) => axiosClient.patch(`/bookings/${id}/status`, data),
};
