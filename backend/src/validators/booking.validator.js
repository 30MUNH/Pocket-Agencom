const { z } = require('zod');

const createBookingSchema = z.object({
  kolId: z.number().int().positive('KOL ID is required'),
  packageId: z.number().int().positive('Package ID is required'),
  campaignName: z.string().min(3, 'Campaign name is required'),
  campaignGoal: z.string().optional(),
  productName: z.string().min(1, 'Product name is required'),
  productDescription: z.string().optional(),
  productCategory: z.string().optional(),
  targetCustomer: z.string().optional(),
  campaignPlatform: z.string().optional(),
  campaignDate: z.string().optional(),
  budget: z.number().positive().optional(),
  contentRequirements: z.string().optional(),
  doAndDontNotes: z.string().optional(),
  deliveryAddress: z.string().optional(),
  referenceLink: z.string().url().optional().or(z.literal('')),
  productImages: z.string().optional(),
});

const updateBookingStatusSchema = z.object({
  status: z.enum([
    'pending',
    'staff_reviewing',
    'need_more_info',
    'approved',
    'confirmed',
    'in_progress',
    'content_submitted',
    'completed',
    'cancelled',
  ]),
  assignedStaffId: z.number().int().positive().optional(),
  note: z.string().optional(),
});

const VALID_TRANSITIONS = {
  pending: ['staff_reviewing', 'cancelled'],
  staff_reviewing: ['need_more_info', 'approved', 'cancelled'],
  need_more_info: ['staff_reviewing', 'cancelled'],
  approved: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['content_submitted', 'cancelled'],
  content_submitted: ['completed', 'in_progress'],
  completed: [],
  cancelled: [],
};

function isValidTransition(from, to) {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

module.exports = { createBookingSchema, updateBookingStatusSchema, isValidTransition };
