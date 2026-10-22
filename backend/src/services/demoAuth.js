const DEMO_USERS = Object.freeze({
  'admin@pocketagencom.vn': Object.freeze({
    id: 1,
    name: 'Quản trị viên Hệ thống',
    email: 'admin@pocketagencom.vn',
    role: 'admin',
    status: 'active',
  }),
  'staff@pocketagencom.vn': Object.freeze({
    id: 2,
    name: 'Nhân viên Kiểm duyệt',
    email: 'staff@pocketagencom.vn',
    role: 'staff',
    status: 'active',
  }),
  'user@pocketagencom.vn': Object.freeze({
    id: 3,
    name: 'Khách hàng Demo',
    email: 'user@pocketagencom.vn',
    role: 'user',
    status: 'active',
  }),
});

function isDemoAuthEnabled(env = process.env) {
  return env.NODE_ENV !== 'production' && env.DEMO_AUTH_ENABLED === 'true';
}

function getDemoUserByEmail(email) {
  if (typeof email !== 'string') return null;
  const user = DEMO_USERS[email.trim().toLowerCase()];
  return user ? { ...user } : null;
}

function getDemoUserById(userId) {
  const numericId = Number(userId);
  const user = Object.values(DEMO_USERS).find((candidate) => candidate.id === numericId);
  return user ? { ...user } : null;
}

module.exports = {
  isDemoAuthEnabled,
  getDemoUserByEmail,
  getDemoUserById,
};
