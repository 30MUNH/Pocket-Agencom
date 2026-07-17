import axiosClient from './axiosClient';

export const kolApi = {
  // Existing marketplace endpoints (protected)
  list: (params) => axiosClient.get('/kols', { params }),
  getById: (id) => axiosClient.get(`/kols/${id}`),

  // Public directory endpoint
  listDirectory: (params) => axiosClient.get('/kols/directory', { params }),

  // KOL self-serve profile endpoints
  getMyProfile: () => axiosClient.get('/kols/me'),
  updateMyProfile: (data) => axiosClient.put('/kols/me', data),
};
