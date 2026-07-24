import axiosClient from './axiosClient';

export const kolBookingApi = {
  getBookings: () => axiosClient.get('/kol-bookings'),
  createBooking: (bookingData) => axiosClient.post('/kol-bookings', bookingData),
  updateStatus: (id, status) => axiosClient.patch(`/kol-bookings/${id}/status`, { status }),
  deleteBooking: (id) => axiosClient.delete(`/kol-bookings/${id}`),
};
