const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePricesUnder600k() {
  console.log('=== BẮT ĐẦU CẬP NHẬT GIÁ KOL/KOC XUỐNG DƯỚI 600K ===');

  // 1. Lấy toàn bộ KolProfile
  const kols = await prisma.kolProfile.findMany();
  console.log(`Tìm thấy ${kols.length} KOL profiles.`);

  let updatedKolsCount = 0;
  for (const kol of kols) {
    let origPrice = Number(kol.priceFrom) || 1000000;
    // Map giá ban đầu sang dải [100.000đ - 480.000đ] (đảm bảo strictly dưới 600k)
    let newPriceFrom = Math.round((100000 + (Math.min(origPrice, 50000000) / 50000000) * 380000) / 10000) * 10000;
    if (newPriceFrom >= 600000) newPriceFrom = 580000;
    if (newPriceFrom < 100000) newPriceFrom = 100000;

    let newBookingPrice = kol.bookingPrice 
      ? Math.min(580000, Math.round((kol.bookingPrice / 50000000) * 380000 / 10000) * 10000 + 100000) 
      : null;

    await prisma.kolProfile.update({
      where: { id: kol.id },
      data: {
        priceFrom: newPriceFrom,
        bookingPrice: newBookingPrice
      }
    });
    updatedKolsCount++;
  }
  console.log(`Đã cập nhật ${updatedKolsCount} KOL profiles thành công.`);

  // 2. Lấy toàn bộ KolServicePackage
  const packages = await prisma.kolServicePackage.findMany({
    select: {
      id: true,
      packageName: true,
      kolId: true,
      price: true,
      kol: {
        select: {
          priceFrom: true
        }
      }
    }
  });
  console.log(`Tìm thấy ${packages.length} gói dịch vụ.`);

  let updatedPackagesCount = 0;
  for (const pkg of packages) {
    let kolPriceFrom = Number(pkg.kol?.priceFrom) || 200000;
    let newPkgPrice;
    
    if (pkg.packageName.includes('Cơ Bản')) {
      newPkgPrice = kolPriceFrom;
    } else {
      // Gói Nâng Cao / Combo: cao hơn gói cơ bản nhưng đảm bảo <= 590.000đ (dưới 600k)
      newPkgPrice = Math.min(590000, Math.round((kolPriceFrom * 1.25) / 10000) * 10000);
    }

    if (newPkgPrice >= 600000) newPkgPrice = 590000;

    await prisma.kolServicePackage.update({
      where: { id: pkg.id },
      data: {
        price: newPkgPrice
      }
    });
    updatedPackagesCount++;
  }
  console.log(`Đã cập nhật ${updatedPackagesCount} gói dịch vụ thành công.`);

  console.log('=== HOÀN THÀNH CẬP NHẬT GIÁ ===');
}

updatePricesUnder600k()
  .catch(e => {
    console.error('Lỗi khi cập nhật:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
