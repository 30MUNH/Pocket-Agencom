const path = require('path');
// Load environment variables from backend/.env relative to this script
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { saveToKnowledgeBase } = require('../src/services/ragService');
const prisma = require('../src/config/prisma');

const seedData = [
  {
    content: `# Khung Chiến Lược Fastvertising - Case Study: KitKat "Thông báo mất tích"\n\n` +
      `## Tổng quan Chiến dịch\n` +
      `Chiến dịch Fastvertising nổi bật từ Nestlé KitKat xoay quanh vụ việc thực tế thất lạc 12 tấn kẹo KitKat trong quá trình vận chuyển. Thay vì che giấu sự cố, KitKat đã biến nó thành cơ hội truyền thông vàng bằng cách đăng tải các "Thông báo mất tích" hài hước trên mạng xã hội, kêu gọi cộng đồng mạng tìm kiếm.\n\n` +
      `## Giá trị Cốt lõi & Công thức Fastvertising\n` +
      `1. **Phản ứng siêu tốc (Speed-to-Market)**: Nắm bắt các sự cố nội bộ hoặc xu hướng đang nóng của xã hội và biến chúng thành nội dung trong vòng 24 - 48 giờ.\n` +
      `2. **Hài hước hóa sự cố (Humorous Self-deprecation)**: Tự trào và biến vấn đề thành một cuộc trò chuyện vui vẻ, giảm thiểu khủng hoảng và gia tăng sự thiện cảm của khách hàng.\n` +
      `3. **Mời gọi tương tác (Collaborative Engagement)**: Tạo điều kiện để người tiêu dùng và các thương hiệu khác cùng tham gia "tìm kiếm" hoặc bình luận chéo (Cross-commenting).\n` +
      `4. **Bán hàng lồng ghép khéo léo**: Sử dụng mã giảm giá hoặc chương trình khuyến mãi đi kèm (ví dụ: tặng kẹo cho ai tìm ra dấu vết) để chuyển đổi tương tác thành doanh thu.\n\n` +
      `## Cách áp dụng cho doanh nghiệp vừa và nhỏ (SMEs)\n` +
      `- Theo dõi các sự kiện hoặc sự cố thường ngày (ví dụ: mất điện, hết hàng đột xuất, shipper giao nhầm) để thiết kế những nội dung vui vẻ, gần gũi.\n` +
      `- Sử dụng các hashtag thời sự kết hợp khuyến mãi nhằm thu hút lưu lượng truy cập tự nhiên.`,
    metadata: {
      niche: "F&B",
      campaignType: "awareness",
      tags: ["Fastvertising", "KitKat", "ViralContent"]
    }
  },
  {
    content: `# Công thức "Feature-to-Feeling" (Từ Tính Năng Đến Cảm Xúc) - Case Study: Bất động sản Văn Phú - Invest\n\n` +
      `## Tổng quan Khung Phương Pháp\n` +
      `Hầu hết các chiến dịch marketing bất động sản hoặc sản phẩm kỹ thuật cao thường tập trung vào thông số kỹ thuật (diện tích, giá bán, tiện ích, vị trí). Công thức "Feature-to-Feeling" chuyển dịch trọng tâm từ "Sản phẩm có tính năng gì?" sang "Khách hàng cảm thấy thế nào khi sử dụng nó?". Đối với Văn Phú - Invest, họ không bán những bức tường bê tông, họ bán "Tổ ấm bình yên" và "Sự an tâm bền vững".\n\n` +
      `## Các bước triển khai công thức\n` +
      `1. **Xác định tính năng (Feature)**: Liệt kê các thuộc tính vật lý của sản phẩm (ví dụ: hệ thống an ninh 3 lớp, thiết kế xanh, vật liệu cách âm).\n` +
      `2. **Dịch nghĩa công năng (Benefit)**: Giải thích tính năng đó giải quyết vấn đề gì (giúp nhà yên tĩnh, ngăn trộm, tiết kiệm điện).\n` +
      `3. **Chuyển hóa cảm xúc (Feeling)**: Chỉ ra cảm giác mà lợi ích đó mang lại cho khách hàng (ví dụ: cảm giác an toàn khi con trẻ tự chơi ở sân, giấc ngủ ngon trọn vẹn sau ngày làm việc căng thẳng, niềm tự hào khi đón tiếp bạn bè).\n` +
      `4. **Xây dựng thông điệp chủ đạo (Core Message)**: Kết nối cảm xúc với thương hiệu qua câu chuyện kể (Storytelling) tập trung vào con người.\n\n` +
      `## Ví dụ ứng dụng thực tế\n` +
      `- Thay vì quảng cáo "Căn hộ cách âm 38dB", hãy viết: "Nơi tiếng còi xe inh ỏi của phố thị nhường chỗ cho tiếng cười trong trẻo của con trẻ và tiếng thì thầm yêu thương của gia đình."`,
    metadata: {
      niche: "Real Estate",
      campaignType: "sales",
      tags: ["FeatureToFeeling", "Storytelling", "Copywriting"]
    }
  },
  {
    content: `# Công thức "Cultural Flip" (Thu Mua Nỗi Đau / Chuyển Hướng Văn Hóa) - Case Study: Mirinda "Tết cười thả ga"\n\n` +
      `## Tổng quan Khung Phương Pháp\n` +
      `Công thức "Cultural Flip" (Thu mua nỗi đau) tập trung vào việc nhận diện các áp lực xã hội, định kiến văn hóa hoặc những "nỗi đau" (pain points) thường nhật của nhóm khách hàng mục tiêu, sau đó đảo ngược góc nhìn bằng một thái độ tích cực, vui vẻ, giải tỏa căng thẳng. Mirinda đã áp dụng xuất sắc công thức này trong các chiến dịch Tết bằng cách biến những câu hỏi tra khảo, so sánh ngày Tết (lương bổng, kết hôn, công việc) thành những tràng cười sảng khoái và thông điệp giải tỏa áp lực.\n\n` +
      `## Các bước triển khai công thức\n` +
      `1. **Lắng nghe nỗi đau văn hóa (Cultural Pain Point)**: Tìm kiếm những vấn đề nhạy cảm, gây mệt mỏi trong đời sống văn hóa hoặc thói quen của người dùng (ví dụ: dọn nhà ngày Tết, hỏi han thiếu tế nhị, áp lực điểm số).\n` +
      `2. **Khơi gợi sự thấu cảm (Empathy)**: Thể hiện rằng thương hiệu hoàn toàn hiểu và đồng hành cùng khách hàng đối mặt với áp lực đó.\n` +
      `3. **Đảo ngược tình thế (The Flip)**: Đưa ra giải pháp hài hước hoặc một lăng kính mới lạc quan để hóa giải sự khó chịu (ví dụ: biến việc bị hỏi han thành cái cớ để cùng uống nước ngọt và cười vang).\n` +
      `4. **Lời kêu gọi hành động tích cực (Call to Action)**: Thúc đẩy khách hàng hành động để lan tỏa niềm vui thay vì giữ sự bực bội.\n\n` +
      `## Ví dụ ứng dụng thực tế\n` +
      `- Đối với ngành dịch vụ ăn uống hoặc làm đẹp: Biến áp lực "phải đẹp hoàn hảo" thành thông điệp "đẹp tự tin, thoải mái ăn uống cùng bạn bè".`,
    metadata: {
      niche: "F&B",
      campaignType: "awareness",
      tags: ["CulturalFlip", "PainPoint", "Mirinda"]
    }
  },
  {
    content: `# Công thức "Gamification" (Trò Chơi Hóa Bản Sắc) - Case Study: Play Together VNG\n\n` +
      `## Tổng quan Khung Phương Pháp\n` +
      `Gamification (Trò chơi hóa) không chỉ là việc tạo ra các trò chơi nhỏ mà là ứng dụng các yếu tố và cơ chế của game (điểm số, bảng xếp hạng, thử thách, phần thưởng) vào các hoạt động phi trò chơi để thúc đẩy hành vi của khách hàng. Play Together đã tận dụng triệt để cơ chế này nhằm giữ chân hàng triệu người chơi thông qua việc liên kết trò chơi ảo với các hoạt động tương tác thực tế từ các thương hiệu đối tác.\n\n` +
      `## Các cơ chế chính trong Gamification\n` +
      `1. **Thách thức & Mục tiêu rõ ràng**: Đưa ra các nhiệm vụ cụ thể để người dùng thực hiện (ví dụ: đăng nhập liên tục 7 ngày, chia sẻ bài viết để nhận quà).\n` +
      `2. **Phần thưởng tức thì (Instant Gratification)**: Tặng quà ảo, voucher giảm giá hoặc huy hiệu số ngay khi người dùng hoàn thành một cột mốc.\n` +
      `3. **Tương tác xã hội & Cạnh tranh**: Thiết lập bảng xếp hạng (Leaderboards) hoặc cơ chế rủ bạn bè cùng chơi để kích thích tính tự tôn và lan truyền tự nhiên.\n` +
      `4. **Trải nghiệm cá nhân hóa**: Cho phép người dùng tùy biến nhân vật, không gian cá nhân để phản ánh bản sắc của họ.\n\n` +
      `## Cách ứng dụng cho doanh nghiệp vừa và nhỏ\n` +
      `- Tích hợp vòng quay may mắn trên website, thẻ tích điểm số hóa, hoặc tổ chức cuộc thi ảnh/video ngắn có xếp hạng tuần trên mạng xã hội để kích thích khách hàng cũ quay lại mua sắm.`,
    metadata: {
      niche: "Gaming & Technology",
      campaignType: "retention",
      tags: ["Gamification", "Engagement", "PlayTogether"]
    }
  },
  {
    content: `# Công thức "Destination-Driven" (Trực Quan Hóa Khao Khát / Du Lịch Ảo) - Case Study: Sunsilk\n\n` +
      `## Tổng quan Khung Phương Pháp\n` +
      `Công thức "Destination-Driven" dịch chuyển sự chú ý của người tiêu dùng từ bản thân sản phẩm sang "điểm đến ước mơ" hoặc "trạng thái lý tưởng" mà sản phẩm giúp họ đạt được. Bằng cách vẽ nên một viễn cảnh sống động về tự do, du lịch và trải nghiệm không giới hạn, thương hiệu kích thích khao khát sâu kín của người tiêu dùng. Sunsilk đã áp dụng rất thành công khi định vị mái tóc mượt mà là chìa khóa giúp các cô gái tự tin khám phá những vùng đất mới, tham gia những chuyến đi xa mà không lo ngại hư tổn tóc.\n\n` +
      `## Các bước triển khai công thức\n` +
      `1. **Xác định khát vọng tự do (Visualizing the Dream)**: Khảo sát và tìm ra điểm đến hoặc hoạt động trải nghiệm đang thu hút nhóm khách hàng mục tiêu nhất (du lịch biển, trekking, tham gia lễ hội âm nhạc).\n` +
      `2. **Liên kết sản phẩm với hành trình (Connecting the Product)**: Định vị sản phẩm là người đồng hành không thể thiếu để bảo vệ hoặc nâng tầm trải nghiệm trong chuyến đi đó.\n` +
      `3. **Trực quan hóa phong cách sống (Lifestyle Visuals)**: Sử dụng hình ảnh và video có màu sắc rực rỡ, góc quay rộng, thể hiện năng lượng tích cực và sự tự do tự tại.\n` +
      `4. **Tạo chiến dịch trải nghiệm thực tế ảo hoặc mini-game**: Kêu gọi người dùng chia sẻ "hành trình mơ ước" của họ để nhận cơ hội trải nghiệm thực tế.\n\n` +
      `## Ví dụ ứng dụng thực tế\n` +
      `- Thương hiệu thời trang thay vì đăng ảnh chụp studio đơn thuần, hãy chụp bộ sưu tập mới tại các địa điểm du lịch nổi tiếng đi kèm cẩm nang mix đồ du lịch cho từng điểm đến.`,
    metadata: {
      niche: "Beauty & Cosmetics",
      campaignType: "sales",
      tags: ["DestinationDriven", "Lifestyle", "Sunsilk"]
    }
  },
  {
    content: `# Công thức "Reframe Definition" (Tái Định Nghĩa Định Kiến) - Case Study: Kotex "Hội Máu Chiến"\n\n` +
      `## Tổng quan Khung Phương Pháp\n` +
      `"Reframe Definition" là công thức marketing thách thức các quan niệm truyền thống, định kiến xã hội hoặc những cấm kỵ (taboos), từ đó tái định nghĩa chúng dưới một góc nhìn tích cực, hiện đại và tràn đầy sức mạnh. Chiến dịch "Hội Máu Chiến" của Kotex là một minh chứng xuất sắc khi biến từ "máu" (vốn mang tính nhạy cảm, cấm kỵ trong các quảng cáo sản phẩm vệ sinh phụ nữ) thành biểu tượng của tinh thần chiến đấu, lòng nhiệt huyết và bản lĩnh vượt qua mọi giới hạn của phụ nữ thế hệ mới.\n\n` +
      `## Các bước triển khai công thức\n` +
      `1. **Tìm kiếm rào cản hoặc định kiến xã hội (Identifying Taboos/Stereotypes)**: Xác định những từ ngữ hoặc quan niệm đang kìm hãm hay tạo cảm giác e ngại cho nhóm khách hàng mục tiêu.\n` +
      `2. **Thách thức trực diện (Direct Confrontation)**: Sử dụng ngôn từ mạnh mẽ để phá vỡ sự e ngại, mang vấn đề ra ánh sáng một cách tự hào.\n` +
      `3. **Tái định nghĩa bằng giá trị mới (Reframing)**: Gán cho từ ngữ hoặc khái niệm đó một lớp ý nghĩa mới đại diện cho sức mạnh, sự tự do hoặc lòng tự hào (ví dụ: biến "ngày ấy" từ mệt mỏi thành cơ hội thể hiện tinh thần "máu chiến").\n` +
      `4. **Xây dựng cộng đồng đồng hành (Community Building)**: Tạo không gian (như group, hashtag, sự kiện) để người dùng chia sẻ câu chuyện vượt qua định kiến của chính mình.\n\n` +
      `## Ví dụ ứng dụng thực tế\n` +
      `- Ngành tuyển dụng/nhân sự: Tái định nghĩa từ "nhảy việc" (job hopping) từ sự thiếu trung thành thành "khát vọng trải nghiệm và tìm kiếm môi trường phù hợp nhất".`,
    metadata: {
      niche: "Personal Care",
      campaignType: "awareness",
      tags: ["ReframeDefinition", "Empowerment", "Kotex"]
    }
  },
  {
    content: `# Công thức "SEO & Ads Rules" (Quy Tắc Hashtag 3:2:1 & Chính Sách Quảng Cáo An Toàn)\n\n` +
      `## Quy tắc Hashtag 3:2:1 trong tối ưu hóa nội dung mạng xã hội\n` +
      `Để tối đa hóa phạm vi tiếp cận tự nhiên và SEO trên các nền tảng mạng xã hội như TikTok, Facebook, Instagram, hãy áp dụng tỷ lệ hashtag 3:2:1:\n` +
      `- **3 Hashtag Ngành/Sản phẩm (Broad)**: Nhắm vào danh mục lớn để định hình chủ đề chung (ví dụ: #ChamSocDa, #ThoiTrangNam, #AmThuc).\n` +
      `- **2 Hashtag Thương hiệu/Chiến dịch (Branded/Campaign)**: Nhắm vào nhận diện thương hiệu riêng hoặc tên chiến dịch cụ thể (ví dụ: #KitKatVietNam, #BatTrendMatTich).\n` +
      `- **1 Hashtag Xu hướng/Tập trung (Niche/Trending)**: Nhắm vào tệp khách hàng cụ thể hoặc trào lưu đang thịnh hành để bắt sóng thuật toán hiển thị (ví dụ: #KitKat12Tan, #BlindBoxUnboxing).\n\n` +
      `## Ngôn ngữ An toàn (Safety Language) & Tuân thủ Chính sách Quảng cáo (Ads Policy)\n` +
      `Khi chạy quảng cáo trên Facebook/Google, việc sử dụng các từ ngữ cam kết quá đà hoặc phân biệt đối xử sẽ khiến tài khoản bị khóa. Hãy áp dụng các quy tắc sau:\n` +
      `1. **Tránh từ ngữ cam kết tuyệt đối**: Không dùng "100%", "trị dứt điểm", "cam kết hoàn tiền", "chắc chắn thành công". Thay vào đó hãy dùng: "hỗ trợ cải thiện", "giải pháp tối ưu", "đồng hành cùng bạn".\n` +
      `2. **Không quy chụp đặc điểm cá nhân**: Không viết "Bạn đang béo phì?", "Bạn bị rụng tóc?". Hãy viết: "Giải pháp cho mái tóc thưa thớt", "Bí quyết duy trì vóc dáng thon gọn tại nhà".\n` +
      `3. **Tránh so sánh trước - sau (Before-After) quá đà**: Không sử dụng hình ảnh so sánh cơ thể trực quan gây phản cảm. Hãy tập trung vào việc mô tả hành trình trải nghiệm sản phẩm một cách chân thực.`,
    metadata: {
      niche: "Digital Marketing",
      campaignType: "sales",
      tags: ["SEORules", "AdsPolicy", "Hashtags"]
    }
  }
];

async function runSeed() {
  console.log("🚀 Bắt đầu quá trình nạp dữ liệu mẫu vào RAG Knowledge Base...\n");

  try {
    // Dọn dẹp dữ liệu cũ để tránh trùng lặp
    console.log("🧹 Đang dọn dẹp dữ liệu cũ...");
    await prisma.knowledgeBase.deleteMany({});
    console.log("🧹 Dọn dẹp hoàn tất!\n");

    for (const item of seedData) {
      const mainTag = item.metadata.tags[0] || 'Unknown';
      console.log(`Đang nạp: [${mainTag}] - ${item.metadata.niche}`);
      
      await saveToKnowledgeBase(item.content, item.metadata);
    }
    
    console.log("\n✅ Nạp dữ liệu mẫu RAG hoàn tất thành công!");
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Đã xảy ra lỗi trong quá trình nạp dữ liệu:");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runSeed();
