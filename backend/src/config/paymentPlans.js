// Prices are owned by the server. Never accept an amount or duration from a client.
const PAYMENT_PLANS = Object.freeze({
  starter: { id: 'starter', name: 'Cơ bản (Starter)', amount: 199000, durationDays: 30, kitLimit: 3,
    features: ['3 Bộ công cụ Marketing / 30 ngày', 'Ý tưởng Nội dung', 'Hỗ trợ qua Email'] },
  pro: { id: 'pro', name: 'Chuyên nghiệp (Pro)', amount: 499000, durationDays: 30, kitLimit: null,
    features: ['Không giới hạn Bộ công cụ', 'Kịch bản Video AI', 'Phân tích hiệu quả', 'Hỗ trợ Ưu tiên'] },
  advanced: { id: 'advanced', name: 'Nâng cao (Advanced)', amount: 890000, durationDays: 30, kitLimit: null,
    features: ['Tất cả tính năng gói Pro', 'Lộ trình tiếp thị riêng', 'Quản lý nội dung đa kênh'] },
});

module.exports = { PAYMENT_PLANS };
