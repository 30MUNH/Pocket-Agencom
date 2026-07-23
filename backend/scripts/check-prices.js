const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPrices() {
  try {
    const kols = await prisma.kolProfile.findMany({
      select: {
        id: true,
        name: true,
        priceFrom: true,
        bookingPrice: true,
      }
    });

    console.log(`Total KOL profiles: ${kols.length}`);
    const kolsAbove600k = kols.filter(k => (Number(k.priceFrom) >= 600000 || (k.bookingPrice && k.bookingPrice >= 600000)));
    console.log(`KOL profiles with price >= 600k: ${kolsAbove600k.length}`);
    
    if (kols.length > 0) {
      console.log('Sample KOL prices before update:');
      kols.slice(0, 5).forEach(k => console.log(`ID: ${k.id}, Name: ${k.name}, priceFrom: ${k.priceFrom}, bookingPrice: ${k.bookingPrice}`));
    }

    const packages = await prisma.kolServicePackage.findMany({
      select: {
        id: true,
        packageName: true,
        price: true,
      }
    });

    console.log(`Total Service Packages: ${packages.length}`);
    const pkgsAbove600k = packages.filter(p => Number(p.price) >= 600000);
    console.log(`Service Packages with price >= 600k: ${pkgsAbove600k.length}`);

    if (packages.length > 0) {
      console.log('Sample Package prices before update:');
      packages.slice(0, 5).forEach(p => console.log(`ID: ${p.id}, Name: ${p.packageName}, price: ${p.price}`));
    }

  } catch (error) {
    console.error('Error checking prices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrices();
