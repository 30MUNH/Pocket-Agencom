const { z } = require('zod');

const addMediaSchema = z.object({
  mediaUrl: z.string().url('URL truyền thông không hợp lệ'),
  mediaType: z.enum(['IMAGE', 'VIDEO'], {
    errorMap: () => ({ message: 'mediaType phải là IMAGE hoặc VIDEO' }),
  }),
  isFullBody: z.boolean().optional().default(false),
});

const addReviewSchema = z.object({
  rating: z.number().int().min(1, 'Đánh giá tối thiểu là 1 sao').max(5, 'Đánh giá tối đa là 5 sao'),
  content: z.string().min(3, 'Nội dung nhận xét tối thiểu 3 ký tự'),
});

const addPerformanceSchema = z.object({
  postUrl: z.string().url('URL bài viết không hợp lệ'),
  engagementRate: z.number().min(0, 'Tỷ lệ tương tác không được âm'),
  conversions: z.number().int().min(0, 'Số lượt chuyển đổi không được âm').optional().default(0),
  platform: z.string().min(1, 'Nền tảng là bắt buộc'),
});

module.exports = {
  addMediaSchema,
  addReviewSchema,
  addPerformanceSchema,
};
