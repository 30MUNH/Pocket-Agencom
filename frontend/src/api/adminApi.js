import axiosClient from './axiosClient';

export const adminApi = {
  getUsers: (params) => axiosClient.get('/admin/users', { params }),
  getUserAvatarAccess: (userId) => axiosClient.get(`/admin/users/${userId}/avatar-access`),
  updateUserStatus: (id, status) => axiosClient.patch(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id, role) => axiosClient.patch(`/admin/users/${id}/role`, { role }),
};
