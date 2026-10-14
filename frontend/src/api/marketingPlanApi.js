import axiosClient from './axiosClient';

// Backend text generation allows up to three 45-second provider attempts plus backoff.
const AI_TEXT_REQUEST_TIMEOUT_MS = 150000;

export const marketingPlanApi = {
  list: () => axiosClient.get('/marketing-plans'),
  getById: (id) => axiosClient.get(`/marketing-plans/${id}`),
  generate: (data) => axiosClient.post('/marketing-plans/generate', data, { timeout: AI_TEXT_REQUEST_TIMEOUT_MS }),
  generatePost: (data) => axiosClient.post('/marketing-plans/generate-post', data, { timeout: AI_TEXT_REQUEST_TIMEOUT_MS }),
  generatePostWithImage: ({ file, ...data }) => {
    const formData = new FormData();
    formData.append('image', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    return axiosClient.post('/marketing-plans/generate-post-with-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: AI_TEXT_REQUEST_TIMEOUT_MS,
    });
  },
  save: (id) => axiosClient.post(`/marketing-plans/${id}/save`),
  attachAssets: (id, mediaAssetIds) => axiosClient.put(`/marketing-plans/${id}/assets`, { mediaAssetIds }),
  detachAsset: (id, assetId) => axiosClient.delete(`/marketing-plans/${id}/assets/${assetId}`),
  refine: (id, data) => axiosClient.post(`/marketing-plans/${id}/refine`, data, { timeout: AI_TEXT_REQUEST_TIMEOUT_MS }),
  generateImagePrompt: (data) => axiosClient.post('/marketing-plans/generate-image-prompt', data, { timeout: AI_TEXT_REQUEST_TIMEOUT_MS }),
  generateImage: (data) => axiosClient.post('/marketing-plans/generate-image', data),
  review: (id, data) => axiosClient.patch(`/marketing-plans/${id}/review`, data),
  remove: (id) => axiosClient.delete(`/marketing-plans/${id}`),
  getTrends: () => axiosClient.get('/marketing-plans/trends'),
  refreshTrends: () => axiosClient.post('/marketing-plans/trends/refresh'),
};
