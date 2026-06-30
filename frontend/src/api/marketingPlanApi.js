import axiosClient from './axiosClient';

export const marketingPlanApi = {
  list: () => axiosClient.get('/marketing-plans'),
  getById: (id) => axiosClient.get(`/marketing-plans/${id}`),
  generate: (data) => axiosClient.post('/marketing-plans/generate', data),
  save: (id) => axiosClient.post(`/marketing-plans/${id}/save`),
  review: (id, data) => axiosClient.patch(`/marketing-plans/${id}/review`, data),
  remove: (id) => axiosClient.delete(`/marketing-plans/${id}`),
};
