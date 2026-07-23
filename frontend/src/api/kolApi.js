import axiosClient from './axiosClient';

export const kolApi = {
  // Existing marketplace endpoints
  list: (params) => axiosClient.get('/kols', { params }),
  getById: (id) => axiosClient.get(`/kols/${id}`),

  // Public directory endpoint
  listDirectory: (params) => axiosClient.get('/kols/directory', { params }),

  // KOL self-serve profile endpoints
  getMyProfile: () => axiosClient.get('/kols/me'),
  updateMyProfile: (data) => axiosClient.put('/kols/me', data),

  // New Profile Extensions (Media, Reviews, Performance)
  getProfileDetails: (id) => axiosClient.get(`/kols/${id}/profile-details`),
  addMedia: (id, data) => axiosClient.post(`/kols/${id}/media`, data),
  deleteMedia: (id, mediaId) => axiosClient.delete(`/kols/${id}/media/${mediaId}`),
  addReview: (id, data) => axiosClient.post(`/kols/${id}/reviews`, data),
  addPerformance: (id, data) => axiosClient.post(`/kols/${id}/performance`, data),
};
