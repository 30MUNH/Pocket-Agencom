import { PrismaClient, UserRole, AccountStatus, PlanStatus, KolType, KolStatus, ServiceType, BookingStatus, TemplateStatus } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/vi';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU SEED DỮ LIỆU ===');
  
  // 1. Dọn dẹp cơ sở dữ liệu cũ
  console.log('1. Đang dọn dẹp cơ sở dữ liệu cũ...');
  await prisma.marketingPlan.deleteMany({});
  await prisma.kolBooking.deleteMany({});
  await prisma.kolServicePackage.deleteMany({});
  await prisma.kolPlatformAccount.deleteMany({});
  await prisma.kolProfile.deleteMany({});
  await prisma.businessProfile.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Dọn dẹp cơ sở dữ liệu hoàn tất!');

  // 2. Tạo các tài khoản cố định (để kiểm thử đăng nhập)
  console.log('2. Đang tạo các tài khoản cố định...');
  const fixedUsers = [
    {
      name: 'Quản trị viên Hệ thống',
      email: 'admin@pocketagencom.vn',
      passwordHash: '$2b$10$EPf05LJ15R.W8F.22Qo1Hu65P0y4v82S502a5K2V5f/QcO2h.C8fG', // password123
      role: UserRole.admin,
      status: AccountStatus.active,
      phone: '0901234567',
    },
    {
      name: 'Nhân viên Kiểm duyệt',
      email: 'staff@pocketagencom.vn',
      passwordHash: '$2b$10$EPf05LJ15R.W8F.22Qo1Hu65P0y4v82S502a5K2V5f/QcO2h.C8fG', // password123
      role: UserRole.staff,
      status: AccountStatus.active,
      phone: '0907654321',
    },
    {
      name: 'Khách hàng Demo',
      email: 'user@pocketagencom.vn',
      passwordHash: '$2b$10$EPf05LJ15R.W8F.22Qo1Hu65P0y4v82S502a5K2V5f/QcO2h.C8fG', // password123
      role: UserRole.user,
      status: AccountStatus.active,
      phone: '0912345678',
    }
  ];

  // 3. Tạo 200 tài khoản User (Brand) ngẫu nhiên
  console.log('3. Đang tạo 200 tài khoản User (Brand) ngẫu nhiên...');
  const emailsSet = new Set<string>();
  emailsSet.add('admin@pocketagencom.vn');
  emailsSet.add('staff@pocketagencom.vn');
  emailsSet.add('user@pocketagencom.vn');

  const randomUsersData: any[] = [];
  for (let i = 0; i < 200; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${lastName} ${firstName}`;
    
    // Đảm bảo email là duy nhất
    let email = '';
    do {
      const fName = faker.person.firstName().toLowerCase().replace(/[^a-z0-9]/g, '');
      const lName = faker.person.lastName().toLowerCase().replace(/[^a-z0-9]/g, '');
      email = `${lName}.${fName}.${faker.number.int({ min: 1000, max: 9999 })}@pocketagencom.vn`;
    } while (emailsSet.has(email));
    
    emailsSet.add(email);

    randomUsersData.push({
      name: fullName,
      email,
      passwordHash: '$2b$10$EPf05LJ15R.W8F.22Qo1Hu65P0y4v82S502a5K2V5f/QcO2h.C8fG', // password123
      role: UserRole.user,
      status: faker.helpers.weightedArrayElement([
        { value: AccountStatus.active, weight: 90 },
        { value: AccountStatus.inactive, weight: 8 },
        { value: AccountStatus.banned, weight: 2 },
      ]),
      phone: faker.phone.number(),
    });
  }

  // Chèn toàn bộ Users vào DB
  await prisma.user.createMany({
    data: [...fixedUsers, ...randomUsersData],
  });

  // Truy vấn lại toàn bộ Users vừa tạo để lấy ID phục vụ các liên kết khóa ngoại
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  const staffUsers = allUsers.filter(u => u.role === UserRole.staff);
  const normalUsers = allUsers.filter(u => u.role === UserRole.user);

  // 4. Tạo Hồ sơ doanh nghiệp (BusinessProfile) cho tất cả các User (Brand)
  console.log('4. Đang tạo Hồ sơ doanh nghiệp cho các User...');
  const businessTypes = ['Thời trang & Phụ kiện', 'Công nghệ & Thiết bị', 'Mỹ phẩm & Làm đẹp', 'Ẩm thực & Đồ uống (F&B)', 'Giáo dục & Khóa học', 'Du lịch & Khách sạn', 'Sức khỏe & Gym'];
  const marketingGoals = ['Tăng nhận diện thương hiệu', 'Tăng lượt bán hàng trực tuyến', 'Thu hút leads đăng ký', 'Ra mắt sản phẩm mới', 'Tăng tương tác mạng xã hội'];
  const budgetRanges = ['5M - 20M VNĐ', '20M - 50M VNĐ', '50M - 100M VNĐ', '100M - 500M VNĐ', '500M+ VNĐ'];
  const locations = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương'];

  const businessProfilesData = normalUsers.map(user => {
    return {
      userId: user.id,
      businessName: faker.company.name(),
      businessType: faker.helpers.arrayElement(businessTypes),
      productDescription: faker.commerce.productDescription() || 'Dòng sản phẩm chất lượng cao hướng đến người tiêu dùng Việt.',
      targetCustomer: 'Khách hàng trẻ độ tuổi từ 18-35, sống tại các thành phố lớn.',
      marketingGoal: faker.helpers.arrayElement(marketingGoals),
      budgetRange: faker.helpers.arrayElement(budgetRanges),
      location: faker.helpers.arrayElement(locations),
    };
  });

  await prisma.businessProfile.createMany({
    data: businessProfilesData,
  });

  // Truy vấn hồ sơ doanh nghiệp
  const allBusinessProfiles = await prisma.businessProfile.findMany({ select: { id: true, userId: true } });
  const userToProfileMap = new Map<number, number>();
  allBusinessProfiles.forEach(bp => {
    userToProfileMap.set(bp.userId, bp.id);
  });

  // 5. Tạo 500 hồ sơ Creators (KOL/KOC)
  console.log('5. Đang tạo 500 hồ sơ Creators (KOL/KOC)...');
  const niches = ['Thời trang & Lối sống', 'Công nghệ & Đồ chơi số', 'Mỹ phẩm & Làm đẹp', 'Ẩm thực & Du lịch', 'Giáo dục & Phát triển bản thân', 'Sức khỏe & Thể thao'];
  const kolTypes = [
    KolType.nano_koc,
    KolType.micro_kol,
    KolType.local_influencer,
    KolType.reviewer,
    KolType.livestream_seller,
    KolType.content_creator
  ];

  const kolsData: any[] = [];
  for (let i = 0; i < 500; i++) {
    const name = faker.person.fullName();
    const followerCount = faker.number.int({ min: 10000, max: 5000000 });
    const engagementRate = faker.number.float({ min: 0.8, max: 15.0 });
    const rating = faker.number.float({ min: 3.8, max: 5.0 });
    const completedCampaigns = faker.number.int({ min: 3, max: 180 });
    const priceFrom = Math.round(faker.number.int({ min: 1000000, max: 50000000 }) / 500000) * 500000;

    kolsData.push({
      name,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      coverUrl: `https://picsum.photos/seed/${i}/800/250`,
      bio: `Xin chào, mình là ${name}. Chuyên chia sẻ nội dung về ${faker.helpers.arrayElement(niches).toLowerCase()}. Liên hệ công việc qua email hoặc số điện thoại bên dưới.`,
      kolType: faker.helpers.arrayElement(kolTypes),
      niche: faker.helpers.arrayElement(niches),
      location: faker.helpers.arrayElement(['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng']),
      followerCount,
      engagementRate: engagementRate.toFixed(2),
      rating: rating.toFixed(1),
      completedCampaigns,
      audienceGender: faker.helpers.arrayElement(['60% Nữ, 40% Nam', '70% Nữ, 30% Nam', '50% Nữ, 50% Nam']),
      audienceAgeRange: faker.helpers.arrayElement(['18-24 tuổi (50%), 25-34 tuổi (30%)', '18-24 tuổi (40%), 13-17 tuổi (35%)']),
      audienceLocation: faker.helpers.arrayElement(['TP. Hồ Chí Minh (45%), Hà Nội (35%)', 'Hà Nội (50%), TP. Hồ Chí Minh (30%)']),
      audienceInterests: 'Mua sắm, Công nghệ, Ăn uống, Thời trang, Chăm sóc bản thân',
      priceFrom,
      isVerified: faker.datatype.boolean(0.15),
      status: faker.helpers.weightedArrayElement([
        { value: KolStatus.active, weight: 90 },
        { value: KolStatus.inactive, weight: 5 },
        { value: KolStatus.pending, weight: 5 }
      ]),
    });
  }

  await prisma.kolProfile.createMany({
    data: kolsData,
  });

  const allKols = await prisma.kolProfile.findMany({ select: { id: true, name: true, followerCount: true, priceFrom: true, engagementRate: true } });

  // 6. Tạo tài khoản nền tảng & các gói dịch vụ (Service Packages) cho KOLs
  console.log('6. Đang tạo các gói dịch vụ và tài khoản mạng xã hội cho KOLs...');
  const platformAccountsData: any[] = [];
  const servicePackagesData: any[] = [];

  for (const kol of allKols) {
    // 6a. Tài khoản mạng xã hội
    const platforms = ['TikTok', 'Instagram', 'YouTube', 'Facebook'];
    const activePlatforms = faker.helpers.arrayElements(platforms, { min: 1, max: 3 });

    activePlatforms.forEach(platform => {
      const username = kol.name.toLowerCase().replace(/\s+/g, '') + '_' + platform.toLowerCase();
      let profileUrl = '';
      if (platform === 'TikTok') profileUrl = `https://tiktok.com/@${username}`;
      else if (platform === 'Instagram') profileUrl = `https://instagram.com/${username}`;
      else if (platform === 'Facebook') profileUrl = `https://facebook.com/${username}`;
      else if (platform === 'YouTube') profileUrl = `https://youtube.com/c/${username}`;

      platformAccountsData.push({
        kolId: kol.id,
        platform,
        profileUrl,
        username,
        followerCount: Math.round(kol.followerCount * faker.number.float({ min: 0.5, max: 1.2 })),
        engagementRate: kol.engagementRate,
        averageViews: faker.number.int({ min: 1000, max: 200000 }),
        averageLikes: faker.number.int({ min: 500, max: 50000 }),
        averageComments: faker.number.int({ min: 50, max: 2000 }),
      });
    });

    // 6b. Tạo 2 gói dịch vụ: Gói Cơ Bản & Gói Combo Nâng Cao
    const serviceType1 = faker.helpers.arrayElement([ServiceType.tiktok_video, ServiceType.instagram_reels, ServiceType.facebook_post, ServiceType.product_review]);
    const price1 = Number(kol.priceFrom) || faker.number.int({ min: 1000000, max: 10000000 });
    
    servicePackagesData.push({
      kolId: kol.id,
      packageName: `Gói Cơ Bản - ${serviceType1.toString().replace('_', ' ').toUpperCase()}`,
      serviceType: serviceType1,
      description: `1 bài đăng/video trên kênh mạng xã hội chính thức của KOL. Hỗ trợ chỉnh sửa tối đa 1 lần theo feedback thương hiệu.`,
      deliverables: `1 Video hoặc 1 Bài viết hình ảnh chất lượng cao.`,
      deliveryTime: `5-7 ngày`,
      revisionPolicy: `Chỉnh sửa tối đa 1 lần trước khi phát hành nếu có lỗi nhãn hàng.`,
      price: price1,
      status: TemplateStatus.active,
    });

    const serviceType2 = faker.helpers.arrayElement([ServiceType.combo, ServiceType.livestream, ServiceType.unboxing]);
    const price2 = Math.round((price1 * faker.number.float({ min: 1.5, max: 2.5 })) / 500000) * 500000;
    
    servicePackagesData.push({
      kolId: kol.id,
      packageName: `Gói Nâng Cao - Combo ${serviceType2.toString().replace('_', ' ').toUpperCase()}`,
      serviceType: serviceType2,
      description: `Chiến dịch truyền thông toàn diện gồm nhiều ấn phẩm, livestream tương tác trực tiếp hoặc buổi unboxing chuyên sâu.`,
      deliverables: `1 Livestream (hoặc Video chi tiết) + 1 Bài viết PR + Kèm Story chia sẻ link mua hàng.`,
      deliveryTime: `7-10 ngày`,
      revisionPolicy: `Chỉnh sửa tối đa 2 lần, tư vấn và hỗ trợ kịch bản tối ưu chuyển đổi số.`,
      price: price2,
      status: TemplateStatus.active,
    });
  }

  await prisma.kolPlatformAccount.createMany({ data: platformAccountsData });
  await prisma.kolServicePackage.createMany({ data: servicePackagesData });

  // Truy vấn gói dịch vụ để làm liên kết đặt lịch (Booking)
  const allPackages = await prisma.kolServicePackage.findMany({ select: { id: true, kolId: true, price: true } });
  const kolToPackagesMap = new Map<number, { id: number, price: number }[]>();
  
  allPackages.forEach(pkg => {
    const current = kolToPackagesMap.get(pkg.kolId) || [];
    current.push({ id: pkg.id, price: Number(pkg.price) });
    kolToPackagesMap.set(pkg.kolId, current);
  });

  // 7. Tạo 2,000 Đơn Đặt Lịch (Bookings) ngẫu nhiên
  console.log('7. Đang tạo 2,000 Đơn Đặt Lịch (Bookings)...');
  const campaigns = [
    { name: 'Chiến dịch Thu Đông 2026', cat: 'Thời trang', prod: 'Áo khoác gió & Hoodie' },
    { name: 'Ra mắt Son Môi Velvet', cat: 'Mỹ phẩm', prod: 'Son kem lì Velvet Edition' },
    { name: 'Khai trương Chi Nhánh Mới', cat: 'F&B', prod: 'Menu trà sữa Matcha Latte' },
    { name: 'Review Tai Nghe Không Dây Pro', cat: 'Công nghệ', prod: 'Tai nghe Bluetooth Lumina Noise-cancelling' },
    { name: 'Ưu Đãi Khóa Học Thiết Kế Web', cat: 'Giáo dục', prod: 'Khóa học lập trình React & Node.js' },
    { name: 'Quảng bá Serum Phục Hồi Da', cat: 'Mỹ phẩm', prod: 'Serum B5 Recovery' },
    { name: 'Trải nghiệm Bàn Phím Cơ Silent', cat: 'Công nghệ', prod: 'Bàn phím cơ không dây Silent Blue' },
  ];

  const bookingsData: any[] = [];
  for (let i = 0; i < 2000; i++) {
    const user = faker.helpers.arrayElement(normalUsers);
    const kol = faker.helpers.arrayElement(allKols);
    const pkgs = kolToPackagesMap.get(kol.id) || [];
    if (pkgs.length === 0) continue;
    const pkg = faker.helpers.arrayElement(pkgs);
    const staff = faker.helpers.arrayElement(staffUsers);
    const camp = faker.helpers.arrayElement(campaigns);

    bookingsData.push({
      userId: user.id,
      kolId: kol.id,
      packageId: pkg.id,
      assignedStaffId: faker.datatype.boolean(0.8) ? staff.id : null,
      campaignName: `${camp.name} #${faker.number.int({ min: 1000, max: 9999 })}`,
      campaignGoal: 'Tăng tương tác xã hội, thúc đẩy lượt nhấp và doanh số bán hàng trong chiến dịch truyền thông.',
      productName: camp.prod,
      productDescription: 'Dòng sản phẩm tiên phong sở hữu nhiều cải tiến độc quyền, chất lượng vượt trội.',
      productCategory: camp.cat,
      targetCustomer: 'Khách hàng trẻ độ tuổi từ 18-35 tuổi tại các thành phố lớn.',
      campaignPlatform: faker.helpers.arrayElement(['TikTok', 'Instagram', 'Facebook', 'YouTube']),
      campaignDate: faker.date.future(),
      budget: pkg.price,
      contentRequirements: 'Sản xuất video trải nghiệm sản phẩm trung thực, tối thiểu 60s, nêu rõ lợi ích chính và đính kèm link mua sắm.',
      doAndDontNotes: 'Nên: Setup góc quay sáng, nói năng lưu loát. Tránh: Nhắc tới đối thủ cạnh tranh.',
      deliveryAddress: faker.location.streetAddress() + ', ' + faker.location.city(),
      referenceLink: faker.internet.url(),
      productImages: 'https://picsum.photos/seed/product/400/400',
      status: faker.helpers.weightedArrayElement([
        { value: BookingStatus.pending, weight: 10 },
        { value: BookingStatus.staff_reviewing, weight: 10 },
        { value: BookingStatus.need_more_info, weight: 5 },
        { value: BookingStatus.approved, weight: 15 },
        { value: BookingStatus.confirmed, weight: 10 },
        { value: BookingStatus.in_progress, weight: 20 },
        { value: BookingStatus.content_submitted, weight: 5 },
        { value: BookingStatus.completed, weight: 20 },
        { value: BookingStatus.cancelled, weight: 5 }
      ]),
      createdAt: faker.date.past(),
    });
  }

  await prisma.kolBooking.createMany({ data: bookingsData });

  // 8. Tạo 1,000 Kế Hoạch Tiếp Thị (MarketingPlans) giả lập AI
  console.log('8. Đang tạo 1,000 Kế Hoạch Tiếp Thị (MarketingPlans) giả lập AI...');
  const plansData: any[] = [];

  for (let i = 0; i < 1000; i++) {
    const user = faker.helpers.arrayElement(normalUsers);
    const profileId = userToProfileMap.get(user.id);
    if (!profileId) continue;
    const staff = faker.helpers.arrayElement(staffUsers);
    const budget = Math.round(faker.number.int({ min: 10000000, max: 200000000 }) / 5000000) * 5000000;

    plansData.push({
      userId: user.id,
      businessProfileId: profileId,
      goal: faker.helpers.arrayElement(['Tăng trưởng 200% doanh thu trong quý này', 'Phát triển thương hiệu mới', 'Tiếp cận tập khách hàng miền Nam', 'Ra mắt sản phẩm thế hệ mới']),
      campaignType: faker.helpers.arrayElement(['TikTok Viral Campaign', 'KOL Reviewer Hub', 'Combo Livestream Bán Hàng', 'Social Post & Minigame']),
      budget,
      contentIdeas: JSON.stringify([
        { title: 'Video Unboxing & Đập Hộp Trực Quan', channel: 'TikTok/Shorts', format: 'Short Video (60s)' },
        { title: 'Bài viết chia sẻ kiến thức, lợi ích sản phẩm', channel: 'Facebook', format: 'Hình ảnh kèm bài viết dài' },
        { title: 'Trải nghiệm sử dụng thực tế sau 2 tuần', channel: 'YouTube', format: 'Vlog review chi tiết' }
      ]),
      videoScripts: JSON.stringify([
        { scene: '0-5s', action: 'KOL đập hộp sản phẩm với hiệu ứng âm thanh sống động', dialogue: 'Chào cả nhà! Hôm nay mình sẽ unbox siêu phẩm đang cực kỳ hot...' },
        { scene: '5-45s', action: 'Quay cận cảnh sản phẩm, KOL dùng thử trực tiếp', dialogue: 'Như các bạn thấy, kết cấu sản phẩm mỏng nhẹ, độ thẩm thấu cực nhanh...' },
        { scene: '45-60s', action: 'KOL đưa ra ưu đãi độc quyền và lời kêu gọi', dialogue: 'Ưu đãi đặc biệt giảm 25% kèm quà tặng chỉ dành riêng cho bạn nào mua ở link bio của mình thôi nha!' }
      ]),
      checklist: JSON.stringify([
        'Chuẩn bị và chuyển giao mẫu thử sản phẩm cho KOL/KOC trước ngày bắt đầu chiến dịch 3 ngày',
        'Kiểm duyệt kịch bản sơ bộ và bản nháp video từ phía KOL gửi sang',
        'Cung cấp mã giảm giá riêng (Affiliate Code) để KOL chèn vào bài truyền thông',
        'Lên lịch đăng bài khớp giờ vàng tương tác và đo lường báo cáo chỉ số CTR'
      ]),
      playbook: 'Quy trình hoạt động tiêu chuẩn: 1. Thương lượng thỏa thuận -> 2. Nhận & duyệt sản phẩm -> 3. Phê duyệt kịch bản -> 4. KOL gửi demo & sửa đổi -> 5. Đăng bài -> 6. Tổng hợp số liệu và thanh toán hoa hồng.',
      status: faker.helpers.weightedArrayElement([
        { value: PlanStatus.draft, weight: 10 },
        { value: PlanStatus.saved, weight: 35 },
        { value: PlanStatus.reviewed, weight: 15 },
        { value: PlanStatus.approved, weight: 30 },
        { value: PlanStatus.need_revision, weight: 10 }
      ]),
      reviewedById: faker.datatype.boolean(0.6) ? staff.id : null,
      createdAt: faker.date.past(),
    });
  }

  await prisma.marketingPlan.createMany({ data: plansData });

  console.log('=== SEED DỮ LIỆU THÀNH CÔNG RỰC RỠ ===');
  console.log(`- Đã tạo: 203 Users (gồm 3 tài khoản cố định login)`);
  console.log(`- Đã tạo: 201 Business Profiles`);
  console.log(`- Đã tạo: 500 KOL Profiles`);
  console.log(`- Đã tạo: ~1,000 Social Accounts cho KOLs`);
  console.log(`- Đã tạo: 1,000 Service Packages cho KOLs`);
  console.log(`- Đã tạo: 2,000 Bookings`);
  console.log(`- Đã tạo: 1,000 Marketing Plans`);
}

main()
  .catch((e) => {
    console.error('Lỗi xảy ra trong quá trình seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
