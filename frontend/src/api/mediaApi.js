import axiosClient from './axiosClient';

export const mediaApi = {
  getAssets: () => axiosClient.get('/media'),
  uploadAsset: (assetData) => axiosClient.post('/media', assetData),
  deleteAsset: (id) => axiosClient.delete(`/media/${id}`),
};
