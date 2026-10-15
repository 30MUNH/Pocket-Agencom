const { AppError } = require('../middleware/errorHandler');

async function requireOwnedBusinessProfile(userId, businessProfileId, prismaClient = require('../config/prisma')) {
  const text = String(businessProfileId ?? '');
  if (!/^[1-9]\d*$/.test(text) || !Number.isSafeInteger(Number(text))) {
    throw new AppError('Invalid business profile ID.', 400);
  }
  const profile = await prismaClient.businessProfile.findFirst({
    where: { id: Number(text), userId: Number(userId) },
  });
  if (!profile) throw new AppError('Business profile not found.', 404);
  return profile;
}

module.exports = { requireOwnedBusinessProfile };
