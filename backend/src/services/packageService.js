const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

async function getPackageById(id) {
  const pkg = await prisma.kolServicePackage.findFirst({
    where: { id: Number(id), status: 'active' },
    include: {
      kol: true
    }
  });

  if (!pkg) {
    throw new AppError('Service package not found or inactive', 404);
  }

  return {
    ...pkg,
    price: pkg.price ? Number(pkg.price) : 0,
  };
}

module.exports = { getPackageById };
