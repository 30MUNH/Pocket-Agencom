const scheduledPostService = require('../services/scheduledPostService');
const { success } = require('../utils/response');

/**
 * GET /api/scheduled-posts
 */
async function getPosts(req, res, next) {
  try {
    const userId = req.user.id;
    const posts = await scheduledPostService.getScheduledPosts(userId);
    return success(res, posts);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/scheduled-posts
 */
async function createPost(req, res, next) {
  try {
    const userId = req.user.id;
    const post = await scheduledPostService.createScheduledPost(userId, req.body);
    return success(res, post, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/scheduled-posts/:id/status
 */
async function updateStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    const updated = await scheduledPostService.updateScheduledPostStatus(userId, id, status);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/scheduled-posts/:id
 */
async function deletePost(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await scheduledPostService.deleteScheduledPost(userId, id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/scheduled-posts/:id
 */
async function updatePost(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updated = await scheduledPostService.updateScheduledPost(userId, id, req.body);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPosts,
  createPost,
  updatePost,
  updateStatus,
  deletePost
};
