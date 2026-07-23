const { z } = require('zod');

const applyCampaignSchema = z.object({
  coverLetter: z.string().max(2000, 'Thư giới thiệu không được quá 2000 ký tự').optional().or(z.literal('')),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(['accepted', 'rejected'], {
    errorMap: () => ({ message: 'Trạng thái phải là accepted hoặc rejected' }),
  }),
});

const toggleRecruitingSchema = z.object({
  isLookingForKol: z.boolean({
    required_error: 'Trạng thái isLookingForKol là bắt buộc',
  }),
});

module.exports = {
  applyCampaignSchema,
  updateApplicationStatusSchema,
  toggleRecruitingSchema,
};
