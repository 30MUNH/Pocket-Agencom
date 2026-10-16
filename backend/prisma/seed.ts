import { AccountStatus, PlanStatus, PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();
const demoPasswordHash = '$2b$10$EPf05LJ15R.W8F.22Qo1Hu65P0y4v82S502a5K2V5f/QcO2h.C8fG';

async function main() {
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error(
      'Seed refused: set ALLOW_DESTRUCTIVE_SEED=true only for an approved disposable database.',
    );
  }

  await prisma.$transaction([
    prisma.expense.deleteMany(),
    prisma.mediaAsset.deleteMany(),
    prisma.scheduledPost.deleteMany(),
    prisma.socialPlatform.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.supportTicket.deleteMany(),
    prisma.marketingPlan.deleteMany(),
    prisma.businessProfile.deleteMany(),
    prisma.template.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.user.createMany({
    data: [
      {
        name: 'Trần Văn An',
        email: 'admin@pocketagencom.vn',
        passwordHash: demoPasswordHash,
        role: UserRole.admin,
        status: AccountStatus.active,
      },
      {
        name: 'Lê Thị Bích',
        email: 'staff@pocketagencom.vn',
        passwordHash: demoPasswordHash,
        role: UserRole.staff,
        status: AccountStatus.active,
      },
      {
        name: 'Nguyễn Lan Anh',
        email: 'lananh.tiemlen@gmail.com',
        passwordHash: demoPasswordHash,
        role: UserRole.user,
        status: AccountStatus.active,
      },
      {
        name: 'Trần Minh Đức',
        email: 'duc.coffee@thecoffeelab.vn',
        passwordHash: demoPasswordHash,
        role: UserRole.user,
        status: AccountStatus.active,
      },
      {
        name: 'Phạm Thu Hạnh',
        email: 'hanh.beauty@gmail.com',
        passwordHash: demoPasswordHash,
        role: UserRole.user,
        status: AccountStatus.active,
      },
      {
        name: 'Vũ Hải Đăng',
        email: 'haidang.media@pocketagencom.vn',
        passwordHash: demoPasswordHash,
        role: UserRole.staff,
        status: AccountStatus.active,
      },
      {
        name: 'Hoàng Quốc Bảo',
        email: 'baophong.audio@gmail.com',
        passwordHash: demoPasswordHash,
        role: UserRole.user,
        status: AccountStatus.inactive,
      },
      {
        name: 'Đỗ Mỹ Linh',
        email: 'linh.florist@dalatflowers.vn',
        passwordHash: demoPasswordHash,
        role: UserRole.user,
        status: AccountStatus.active,
      },
      {
        name: 'Bùi Phương Thảo',
        email: 'thaobakes@morangpastry.com',
        passwordHash: demoPasswordHash,
        role: UserRole.user,
        status: AccountStatus.active,
      },
      {
        name: 'Đặng Tiến Dũng',
        email: 'gomsudung@battrangcraft.vn',
        passwordHash: demoPasswordHash,
        role: UserRole.user,
        status: AccountStatus.banned,
      },
    ],
  });

  const lanAnh = await prisma.user.findUniqueOrThrow({
    where: { email: 'lananh.tiemlen@gmail.com' },
  });
  const businessProfile = await prisma.businessProfile.create({
    data: {
      userId: lanAnh.id,
      businessName: 'Tiệm Len Xinh Handmade',
      businessType: 'Thời trang & Quà tặng thủ công',
      productDescription: 'Sản phẩm len đan móc thủ công tinh tế cho giới trẻ.',
      targetCustomer: 'Khách hàng 20–35 tuổi mua sắm trực tuyến.',
      marketingGoal: 'Tăng doanh số và tỷ lệ khách hàng quay lại.',
      budgetRange: '20M - 50M VNĐ',
      location: 'TP. Hồ Chí Minh',
      brandVoice: 'Thân thiện, rõ ràng và hữu ích',
    },
  });

  await prisma.marketingPlan.create({
    data: {
      userId: user.id,
      businessProfileId: businessProfile.id,
      goal: 'Tăng doanh số trực tuyến trong 30 ngày',
      campaignType: 'Chiến dịch nội dung đa kênh',
      budget: 30_000_000,
      contentIdeas: 'Chuỗi nội dung hướng dẫn, giải đáp và giới thiệu lợi ích sản phẩm.',
      checklist: 'Hoàn thiện thông điệp; chuẩn bị nội dung; lên lịch; đo lường chuyển đổi.',
      deploymentChannels: 'Facebook, TikTok, email và gian hàng thương mại điện tử',
      status: PlanStatus.saved,
    },
  });

  console.log('Seeded marketing-only demo accounts and data.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
