const { z } = require('zod');

const generatePlanSchema = z.object({
  businessType: z.string().min(1, 'Business type is required'),
  campaignType: z.string().min(1, 'Campaign type is required'),
  productDescription: z.string().min(10, 'Product description must be at least 10 characters'),
  targetCustomer: z.string().min(5, 'Target customer profile is required'),
  goal: z.string().min(5, 'Marketing goal is required'),
  budget: z.number().positive().optional(),
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
  businessProfileId: z.number().int().positive('Business profile ID is required'),
  existingResources: z.string().optional(),
  campaignReason: z.string().optional(),
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
};
