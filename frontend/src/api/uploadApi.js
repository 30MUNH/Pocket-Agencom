import axiosClient from './axiosClient';

export const uploadApi = {
  uploadSingle: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return axiosClient.post('/upload/single', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return axiosClient.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
