import axiosClient from './axiosClient';

export const uploadApi = {
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
