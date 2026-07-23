const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fastUpdatePrices() {
  console.log('=== BẮT ĐẦU CẬP NHẬT GIÁ NHANH (SQL RAW) XUỐNG DƯỚI 600K ===');

  // 1. Cập nhật kol_profiles
  // Quy đổi toàn bộ price_from và booking_price về dải [100.000đ - 480.000đ] (strictly < 600.000đ)
  const sqlUpdateKols = `
    UPDATE kol_profiles
    SET 
      price_from = LEAST(580000, GREATEST(100000, ROUND((100000 + (LEAST(COALESCE(price_from, 1000000), 50000000) / 50000000.0) * 380000) / 10000) * 10000)),
      "bookingPrice" = CASE 
        WHEN "bookingPrice" IS NOT NULL THEN LEAST(580000, GREATEST(100000, ROUND((100000 + (LEAST("bookingPrice"::numeric, 50000000) / 50000000.0) * 380000) / 10000) * 10000))
        ELSE NULL 
      END;
  `;

  const updatedKols = await prisma.$executeRawUnsafe(sqlUpdateKols);
  console.log(`Đã cập nhật ${updatedKols} hồ sơ KOL/KOC trong kol_profiles.`);

  // 2. Cập nhật kol_service_packages
  const sqlUpdatePackages = `
    UPDATE kol_service_packages sp
    SET price = LEAST(590000, GREATEST(100000, 
      CASE 
        WHEN sp.package_name LIKE '%Cơ Bản%' THEN COALESCE(kp.price_from, 200000)
        ELSE LEAST(590000, ROUND((COALESCE(kp.price_from, 200000) * 1.25) / 10000) * 10000)
      END
    ))
    FROM kol_profiles kp
    WHERE sp.kol_id = kp.id;
  `;

  const updatedPkgs = await prisma.$executeRawUnsafe(sqlUpdatePackages);
  console.log(`Đã cập nhật ${updatedPkgs} gói dịch vụ trong kol_service_packages.`);

  console.log('=== THÀNH CÔNG ===');
}

fastUpdatePrices()
  .catch(e => {
    console.error('Lỗi khi cập nhật SQL:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
