import axiosClient from './axiosClient';

export const supportTicketApi = {
  getTickets: () => axiosClient.get('/support/tickets'),
  createTicket: (data) => axiosClient.post('/support/tickets', data),
  updateTicketStatus: (id, status) => axiosClient.patch(`/support/tickets/${id}/status`, { status }),
};
