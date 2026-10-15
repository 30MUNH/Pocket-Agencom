const { z } = require('zod');

const generatePlanSchema = z.object({
  businessType: z.string().min(1, 'Business type is required'),
  campaignType: z.string().min(1, 'Campaign type is required'),
  productDescription: z.string().min(10, 'Product description must be at least 10 characters'),
  targetCustomer: z.string().min(5, 'Target customer profile is required'),
  goal: z.string().min(5, 'Marketing goal is required'),
  budget: z.number().positive('Ngân sách phải lớn hơn 0').optional(),
  deploymentChannels: z.string().optional(),
  existingResources: z.string().optional(),
  campaignReason: z.string().optional(),
});

const savePlanSchema = z.object({
  status: z.enum(['draft', 'saved']).optional(),
});

const reviewPlanSchema = z.object({
  action: z.enum(['approve', 'need_revision', 'reviewed']),
  note: z.string().optional(),
});

const generatePostSchema = z.object({
  ideaTitle: z.string().min(1, 'Idea title is required'),
  ideaDescription: z.string().min(1, 'Idea description is required'),
  platform: z.string().min(1, 'Platform is required'),
  businessProfileId: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().positive().optional()),
  existingResources: z.string().optional(),
  campaignReason: z.string().optional(),
});

// multipart/form-data variant: every field arrives as a string, so coerce the ID
const generatePostWithImageSchema = z.object({
  ideaTitle: z.string().min(1, 'Idea title is required'),
  ideaDescription: z.string().min(1, 'Idea description is required'),
  platform: z.string().min(1, 'Platform is required'),
  businessProfileId: z.coerce.number().int().positive('Business profile ID is required'),
  existingResources: z.string().optional(),
  campaignReason: z.string().optional(),
});

const refinePlanSchema = z.object({
  instruction: z.string().min(3, 'Chỉ dẫn điều chỉnh phải có ít nhất 3 ký tự'),
});

const generateImagePromptSchema = z.object({
  postContent: z.string().min(5, 'Nội dung bài viết phải có ít nhất 5 ký tự'),
  platform: z.string().optional(),
  businessProfileId: z.coerce.number().optional(),
});

const generateSocialImageSchema = z.object({
  prompt: z.string().trim().min(5, 'Mô tả hình ảnh (prompt) phải có ít nhất 5 ký tự').max(1000),
  aspectRatio: z.enum(['1:1', '4:5', '9:16', '16:9']).optional().default('1:1'),
  platform: z.string().trim().min(1).max(40).optional().default('Facebook'),
  businessProfileId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
});

const VALID_PLAN_TRANSITIONS = {
  draft: ['saved'],
  saved: ['reviewed', 'need_revision'],
  reviewed: ['approved', 'need_revision'],
  need_revision: ['saved', 'reviewed'],
  approved: [],
};

function isValidPlanTransition(from, to) {
  return VALID_PLAN_TRANSITIONS[from]?.includes(to) ?? false;
}

module.exports = {
  generatePlanSchema,
  savePlanSchema,
  reviewPlanSchema,
  isValidPlanTransition,
  generatePostSchema,
  generatePostWithImageSchema,
  refinePlanSchema,
  generateImagePromptSchema,
  generateSocialImageSchema,
};
