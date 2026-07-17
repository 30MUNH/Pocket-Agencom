import axiosClient from './axiosClient';

export const socialApi = {
  getPlatforms: () => axiosClient.get('/social-platforms'),
  addPlatform: (data) => axiosClient.post('/social-platforms', data),
  deletePlatform: (id) => axiosClient.delete(`/social-platforms/${id}`),
  analyzePlatform: (id) => axiosClient.post(`/social-platforms/${id}/analyze`),
};
