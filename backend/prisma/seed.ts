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
        name: 'Quản trị viên Hệ thống',
        email: 'admin@pocketagencom.vn',
        passwordHash: demoPasswordHash,
        role: UserRole.admin,
        status: AccountStatus.active,
      },
      {
        name: 'Nhân viên Kiểm duyệt',
        email: 'staff@pocketagencom.vn',
        passwordHash: demoPasswordHash,
        role: UserRole.staff,
        status: AccountStatus.active,
      },
      {
        name: 'Khách hàng Demo',
        email: 'user@pocketagencom.vn',
        passwordHash: demoPasswordHash,
        role: UserRole.user,
        status: AccountStatus.active,
      },
    ],
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: 'user@pocketagencom.vn' },
  });
  const businessProfile = await prisma.businessProfile.create({
    data: {
      userId: user.id,
      businessName: 'Pocket Demo Store',
      businessType: 'Bán lẻ trực tuyến',
      productDescription: 'Sản phẩm tiêu dùng dành cho khách hàng thành thị.',
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
