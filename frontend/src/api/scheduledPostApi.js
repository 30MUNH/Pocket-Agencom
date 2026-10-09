import axiosClient from './axiosClient';

export const scheduledPostApi = {
  getPosts: () => axiosClient.get('/scheduled-posts'),
  createPost: (postData) => axiosClient.post('/scheduled-posts', postData),
  updatePost: (id, postData) => axiosClient.patch(`/scheduled-posts/${id}`, postData),
  updateStatus: (id, status) => axiosClient.patch(`/scheduled-posts/${id}/status`, { status }),
  deletePost: (id) => axiosClient.delete(`/scheduled-posts/${id}`),
};
