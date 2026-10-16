const marketingPlanService = require('../services/marketingPlanService');
const mediaAccessService = require('../services/mediaAccessService').createMediaAccessService();
const aiService = require('../services/ai/aiService');
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
  let imageAsset;
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

    const hasVision =
      (typeof aiService.isVisionAvailable === 'function' ? aiService.isVisionAvailable() : false) ||
      Boolean(aiService.gemini?.isAvailable?.() || aiService.openrouter?.isAvailable?.());
    if (!hasVision) {
      throw new AppError('Gemini Vision is unavailable because free-tier eligibility is not confirmed.', 503);
    }

    const profile = await marketingPlanService.requireOwnedBusinessProfile(req.user.id, parsed.data.businessProfileId);

    // Persist the image privately and pass its ID with the in-memory bytes to Gemini Vision.
    imageAsset = await mediaAccessService.createOwnedMediaAsset({
      ownerId: req.user.id,
      file: req.file,
      purpose: 'campaign',
      metadata: { name: req.file.originalname, businessProfileId: profile.id },
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
    if (imageAsset) {
      try {
        const cleanup = await mediaAccessService.deleteOwnedMediaAsset(req.user.id, imageAsset.id);
        if (!cleanup.deleted) throw new Error('Asset deletion is pending');
      } catch {
        return next(new AppError('Image generation failed and asset cleanup is pending recovery.', 503));
      }
    }
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

async function updateMediaAssets(req, res, next) {
  try {
    const result = await marketingPlanService.attachMediaAssets(req.params.id, req.user.id, req.body.mediaAssetIds);
    return success(res, result);
  } catch (err) { next(err); }
}

async function removeMediaAsset(req, res, next) {
  try {
    const result = await marketingPlanService.detachMediaAsset(req.params.id, req.user.id, req.params.assetId);
    return success(res, result);
  } catch (err) { next(err); }
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
  updateMediaAssets,
  removeMediaAsset,
  getTrends,
  refreshTrends,
};
