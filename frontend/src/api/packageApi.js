import axiosClient from './axiosClient';

export const packageApi = {
  getById: (id) => axiosClient.get(`/packages/${id}`),
};
