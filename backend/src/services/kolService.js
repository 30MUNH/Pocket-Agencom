const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

function formatKol(kol) {
  return {
    ...kol,
    priceFrom: kol.priceFrom ? Number(kol.priceFrom) : null,
    engagementRate: kol.engagementRate ? Number(kol.engagementRate) : null,
    rating: kol.rating ? Number(kol.rating) : null,
    servicePackages: kol.servicePackages?.map((p) => ({
      ...p,
      price: Number(p.price),
    })),
    platformAccounts: kol.platformAccounts?.map((a) => ({
      ...a,
      engagementRate: a.engagementRate ? Number(a.engagementRate) : null,
    })),
  };
}

async function listKols(filters = {}) {
  const { niche, maxPrice, search, page = 1, limit = 20 } = filters;

  const where = { status: 'active' };

  if (niche) {
    where.niche = { contains: niche, mode: 'insensitive' };
  }
  if (maxPrice) {
    where.priceFrom = { lte: maxPrice };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { niche: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [kols, total] = await Promise.all([
    prisma.kolProfile.findMany({
      where,
      include: {
        platformAccounts: true,
        servicePackages: { where: { status: 'active' }, take: 2 },
      },
      orderBy: { rating: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.kolProfile.count({ where }),
  ]);

  return {
    data: kols.map(formatKol),
    pagination: { page: Number(page), limit: Number(limit), total },
  };
}

async function getKolById(id) {
  const kol = await prisma.kolProfile.findFirst({
    where: { id: Number(id), status: 'active' },
    include: {
      platformAccounts: true,
      servicePackages: { where: { status: 'active' } },
      availabilitySlots: { where: { isAvailable: true }, take: 10 },
    },
  });

  if (!kol) {
    throw new AppError('KOL not found', 404);
  }

  return formatKol(kol);
}

module.exports = { listKols, getKolById };
