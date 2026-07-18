import axiosClient from './axiosClient';

export const marketingPlanApi = {
  list: () => axiosClient.get('/marketing-plans'),
  getById: (id) => axiosClient.get(`/marketing-plans/${id}`),
  generate: (data) => axiosClient.post('/marketing-plans/generate', data),
  generatePost: (data) => axiosClient.post('/marketing-plans/generate-post', data),
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
      timeout: 120000,
    });
  },
  save: (id) => axiosClient.post(`/marketing-plans/${id}/save`),
  review: (id, data) => axiosClient.patch(`/marketing-plans/${id}/review`, data),
  remove: (id) => axiosClient.delete(`/marketing-plans/${id}`),
};
