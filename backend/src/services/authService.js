const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function register(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: 'user',
        status: 'active',
      },
    });

    await tx.businessProfile.create({
      data: {
        userId: newUser.id,
        businessType: data.businessType || 'General',
        productDescription: data.productDescription || 'Pending profile setup',
        targetCustomer: data.targetCustomer || 'General audience',
      },
    });

    return newUser;
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { user: sanitizeUser(user), token };
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status !== 'active') {
    throw new AppError('Account is inactive or banned', 403);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { user: sanitizeUser(user), token };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatarUrl: true,
      phone: true,
      createdAt: true,
      businessProfile: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

module.exports = { register, login, getMe };
