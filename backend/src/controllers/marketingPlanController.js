const marketingPlanService = require('../services/marketingPlanService');
const mediaAccessService = require('../services/mediaAccessService').createMediaAccessService();
const { AppError } = require('../middleware/errorHandler');
const { generatePostWithImageSchema } = require('../validators/marketingPlan.validator');
const { success } = require('../utils/response');

async function generate(req, res, next) {
  try {
    const plan = await marketingPlanService.generatePlan(req.user.id, req.body);
    return success(res, plan, 201);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const plans = await marketingPlanService.getPlans(req.user);
    return success(res, plans);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const plan = await marketingPlanService.getPlanById(req.params.id, req.user);
    return success(res, plan);
  } catch (err) {
    next(err);
  }
}

async function save(req, res, next) {
  try {
    const plan = await marketingPlanService.savePlan(req.params.id, req.user.id);
    return success(res, plan);
  } catch (err) {
    next(err);
  }
}

async function review(req, res, next) {
  try {
    const plan = await marketingPlanService.reviewPlan(req.params.id, req.user, req.body);
    return success(res, plan);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await marketingPlanService.deletePlan(req.params.id, req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function generatePost(req, res, next) {
  try {
    const post = await marketingPlanService.generateDetailedPost(req.user, req.body);
    return success(res, post, 200);
  } catch (err) {
    next(err);
  }
}

async function generatePostWithImage(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('Vui lòng đính kèm ảnh sản phẩm hoặc ảnh feedback', 400);
    }

    // multipart bodies bypass the JSON validate() middleware, so validate here
    const parsed = generatePostWithImageSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      throw new AppError('Validation failed', 422, details);
    }

    // Persist the image privately and pass its ID with the in-memory bytes to Gemini Vision.
    const imageAsset = await mediaAccessService.createOwnedMediaAsset({
      ownerId: req.user.id,
      file: req.file,
      purpose: 'campaign',
      metadata: { name: req.file.originalname },
    });

    // The Vision call consumes bytes directly; no public or signed URL enters prompt content.
    const post = await marketingPlanService.generateDetailedPostWithImage(
      req.user,
      parsed.data,
      req.file,
      imageAsset.id
    );

    return success(res, { ...post, mediaAssetId: imageAsset.id }, 200);
  } catch (err) {
    next(err);
  }
}

async function refine(req, res, next) {
  try {
    const result = await marketingPlanService.refinePlan(req.params.id, req.user.id, req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function generateImagePrompt(req, res, next) {
  try {
    const result = await marketingPlanService.generateImagePrompt(req.user.id, req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function generateSocialImage(req, res, next) {
  try {
    const result = await marketingPlanService.generateSocialImage(req.user.id, req.body);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
}

async function getTrends(req, res, next) {
  try {
    const trends = await marketingPlanService.getTrendingBulletin(false);
    return success(res, trends);
  } catch (err) {
    next(err);
  }
}

async function refreshTrends(req, res, next) {
  try {
    const trends = await marketingPlanService.getTrendingBulletin(true);
    return success(res, trends);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generate,
  list,
  getById,
  save,
  review,
  remove,
  generatePost,
  generatePostWithImage,
  refine,
  generateImagePrompt,
  generateSocialImage,
  getTrends,
  refreshTrends,
};
