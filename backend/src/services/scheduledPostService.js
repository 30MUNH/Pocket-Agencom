const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Formats a scheduled post to extract embedded image URLs without schema drift.
 */
function formatPostWithImage(post) {
  if (!post) return post;
  const rawContent = post.content || '';
  const match = rawContent.match(/\n\n\[IMAGE_URL:\s*([^\s\]]+)\]/);
  if (match) {
    const imageUrl = match[1];
    const cleanContent = rawContent.replace(/\n\n\[IMAGE_URL:\s*[^\s\]]+\]/, '').trim();
    return {
      ...post,
      content: cleanContent,
      imageUrl,
      rawContent,
    };
  }
  return {
    ...post,
    imageUrl: post.imageUrl || null,
  };
}

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
 * Embeds imageUrl into content text and persists imageUrl as structured column.
 */
async function createScheduledPost(userId, postData) {
  const {
    title,
    content,
    platform = 'Facebook',
    scheduledTime,
    status = 'pending_approval',
    isGoldenTime = true,
    businessProfileId,
    imageUrl,
  } = postData;

  if (!title || !content) {
    throw new AppError('Tiêu đề và nội dung bài viết là bắt buộc.', 400);
  }

  let enrichedContent = content;
  if (imageUrl && !content.includes(imageUrl)) {
    enrichedContent = `${content}\n\n[IMAGE_URL: ${imageUrl}]`;
  }

  const finalScheduledTime = scheduledTime ? new Date(scheduledTime) : calculateGoldenTime();
  if (Number.isNaN(finalScheduledTime.getTime())) {
    throw new AppError('Thời gian lên lịch không hợp lệ.', 400);
  }

  const newPost = await prisma.scheduledPost.create({
    data: {
      userId,
      businessProfileId: businessProfileId ? Number(businessProfileId) : null,
      title,
      content: enrichedContent,
      imageUrl: imageUrl || null,
      platform,
      scheduledTime: finalScheduledTime,
      status,
      isGoldenTime,
    },
  });
  return formatPostWithImage(newPost);
}

/**
 * Retrieves all scheduled posts for a user.
 */
async function getScheduledPosts(userId) {
  const posts = await prisma.scheduledPost.findMany({
    where: { userId },
    orderBy: { scheduledTime: 'asc' },
  });
  return (posts || []).map(formatPostWithImage);
}

/**
 * Updates a scheduled post (caption, title, scheduled time, imageUrl) with ownership verification.
 */
async function updateScheduledPost(userId, postId, updateData) {
  const idNum = parseInt(postId, 10);
  const { title, content, scheduledTime, status, imageUrl } = updateData;

  const existing = await prisma.scheduledPost.findUnique({ where: { id: idNum } });
  if (!existing || existing.userId !== userId) {
    throw new AppError('Không tìm thấy bài viết lên lịch hoặc bạn không có quyền cập nhật.', 404);
  }

  const data = {};
  if (title !== undefined) data.title = title;
  if (status !== undefined) data.status = status;
  if (scheduledTime !== undefined) {
    const parsedTime = new Date(scheduledTime);
    if (Number.isNaN(parsedTime.getTime())) throw new AppError('Thời gian lên lịch không hợp lệ.', 400);
    data.scheduledTime = parsedTime;
  }

  const targetImageUrl = imageUrl !== undefined ? imageUrl : existing.imageUrl;
  if (targetImageUrl !== undefined) {
    data.imageUrl = targetImageUrl;
  }

  if (content !== undefined) {
    let enriched = content;
    if (targetImageUrl && !content.includes(targetImageUrl)) {
      enriched = `${content}\n\n[IMAGE_URL: ${targetImageUrl}]`;
    }
    data.content = enriched;
  }

  const updated = await prisma.scheduledPost.update({ where: { id: idNum }, data });
  return formatPostWithImage(updated);
}

/**
 * Updates status of a scheduled post with ownership verification.
 */
async function updateScheduledPostStatus(userId, postId, status) {
  const idNum = parseInt(postId, 10);

  const existing = await prisma.scheduledPost.findUnique({ where: { id: idNum } });
  if (!existing || existing.userId !== userId) {
    throw new AppError('Không tìm thấy bài viết lên lịch hoặc bạn không có quyền cập nhật.', 404);
  }

  const updated = await prisma.scheduledPost.update({ where: { id: idNum }, data: { status } });
  return formatPostWithImage(updated);
}

/**
 * Deletes a scheduled post with ownership verification.
 */
async function deleteScheduledPost(userId, postId) {
  const idNum = parseInt(postId, 10);

  const existing = await prisma.scheduledPost.findUnique({ where: { id: idNum } });
  if (!existing || existing.userId !== userId) {
    throw new AppError('Không tìm thấy bài viết lên lịch hoặc bạn không có quyền xóa.', 404);
  }

  await prisma.scheduledPost.delete({ where: { id: idNum } });
  return { deleted: true };
}

module.exports = {
  calculateGoldenTime,
  createScheduledPost,
  getScheduledPosts,
  updateScheduledPost,
  updateScheduledPostStatus,
  deleteScheduledPost,
  formatPostWithImage,
};

