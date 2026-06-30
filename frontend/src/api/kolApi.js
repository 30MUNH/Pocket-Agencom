import axiosClient from './axiosClient';

export const kolApi = {
  list: (params) => axiosClient.get('/kols', { params }),
  getById: (id) => axiosClient.get(`/kols/${id}`),
};
