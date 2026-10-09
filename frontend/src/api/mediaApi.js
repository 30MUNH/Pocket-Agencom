import axiosClient from './axiosClient';

export const mediaApi = {
  getAssets: () => axiosClient.get('/media'),
  uploadAsset: (assetData) => axiosClient.post('/media', assetData),
  generateImage: (data) => axiosClient.post('/media/generate-image', data),
  deleteAsset: (id) => axiosClient.delete(`/media/${id}`),
};
