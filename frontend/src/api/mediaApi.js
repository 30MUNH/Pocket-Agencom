import axiosClient from './axiosClient';

export const mediaApi = {
  getAssets: () => axiosClient.get('/media'),
  getAssetAccess: (id, { download = false } = {}) => axiosClient.get(`/media/${id}/access`, { params: download ? { download: 'true' } : undefined }),
  uploadAsset: (assetData) => axiosClient.post('/media', assetData),
  generateImage: (data) => axiosClient.post('/media/generate-image', data),
  deleteAsset: (id) => axiosClient.delete(`/media/${id}`),
};
