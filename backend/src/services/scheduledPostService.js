const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

// In-memory fallback store in case database tables are not migrated yet
let demoScheduledPostsStore = [];

/**
 * Calculates an AI Golden Time recommendation (e.g. 19:30 or 20:00 tonight/tomorrow).
 */
function calculateGoldenTime() {
  const now = new Date();
  const goldenDate = new Date(now);
  goldenDate.setHours(19, 30, 0, 0);

  // If 19:30 has already passed today, schedule for 19:30 tomorrow
  if (now.getHours() >= 19) {
    goldenDate.setDate(goldenDate.getDate() + 1);
  }

  return goldenDate;
}

/**
 * Creates a new scheduled post.
 */
async function createScheduledPost(userId, postData) {
  const {
    title,
    content,
    platform = 'Facebook',
    scheduledTime,
    status = 'pending_approval',
    isGoldenTime = true,
    businessProfileId
  } = postData;

  if (!title || !content) {
    throw new AppError('Tiêu đề và nội dung bài viết là bắt buộc.', 400);
  }

  const finalScheduledTime = scheduledTime ? new Date(scheduledTime) : calculateGoldenTime();

  try {
    const newPost = await prisma.scheduledPost.create({
      data: {
        userId,
        businessProfileId: businessProfileId ? Number(businessProfileId) : null,
        title,
        content,
        platform,
        scheduledTime: finalScheduledTime,
        status,
        isGoldenTime,
      }
    });
    return newPost;
  } catch (err) {
    console.warn('[Prisma Fallback] ScheduledPost model fallback to memory store:', err.message);
    const newPost = {
      id: Date.now(),
      userId,
      businessProfileId: businessProfileId ? Number(businessProfileId) : null,
      title,
      content,
      platform,
      scheduledTime: finalScheduledTime.toISOString(),
      status,
      isGoldenTime,
      createdAt: new Date().toISOString()
    };
    demoScheduledPostsStore.unshift(newPost);
    return newPost;
  }
}

/**
 * Retrieves all scheduled posts for a user.
 */
async function getScheduledPosts(userId) {
  try {
    const posts = await prisma.scheduledPost.findMany({
      where: { userId },
      orderBy: { scheduledTime: 'asc' },
    });
    return posts || [];
  } catch (err) {
    console.warn('[Prisma Warning] Could not retrieve scheduled posts:', err.message);
    return [];
  }
}

/**
 * Updates status of a scheduled post (e.g. approve, publish, set to draft).
 */
async function updateScheduledPostStatus(userId, postId, status) {
  const idNum = parseInt(postId, 10);

  try {
    const updated = await prisma.scheduledPost.update({
      where: { id: idNum },
      data: { status }
    });
    return updated;
  } catch (err) {
    console.warn('[Prisma Fallback] Updating post status in memory store:', err.message);
    const target = demoScheduledPostsStore.find(p => p.id === idNum);
    if (target) {
      target.status = status;
      return target;
    }
    throw new AppError('Không tìm thấy bài viết lên lịch.', 404);
  }
}

/**
 * Deletes a scheduled post.
 */
async function deleteScheduledPost(userId, postId) {
  const idNum = parseInt(postId, 10);

  try {
    await prisma.scheduledPost.delete({
      where: { id: idNum }
    });
    return { deleted: true };
  } catch (err) {
    console.warn('[Prisma Fallback] Deleting post in memory store:', err.message);
    demoScheduledPostsStore = demoScheduledPostsStore.filter(p => p.id !== idNum);
    return { deleted: true };
  }
}

module.exports = {
  calculateGoldenTime,
  createScheduledPost,
  getScheduledPosts,
  updateScheduledPostStatus,
  deleteScheduledPost
};
