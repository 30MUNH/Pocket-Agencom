const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { validateExternalMediaUrl } = require('./externalMediaUrl');
const { requireOwnedBusinessProfile } = require('./businessProfileAccess');

/**
 * Formats a scheduled post to extract embedded image URLs without schema drift.
 */
function stripImageMarkers(content) {
  return String(content || '').replace(/\n\n\[IMAGE_URL:\s*[^\s\]]+\]/g, '').trim();
}

function formatPostWithImage(post) {
  if (!post) return post;
  const rawContent = post.content || '';
  if (post.mediaAssetId) {
    return { ...post, content: stripImageMarkers(rawContent), imageUrl: null, rawContent };
  }
  const match = rawContent.match(/\n\n\[IMAGE_URL:\s*([^\s\]]+)\]/);
  if (match) {
    const imageUrl = match[1];
    const cleanContent = rawContent.replace(/\n\n\[IMAGE_URL:\s*[^\s\]]+\]/, '').trim();
    return { ...post, content: cleanContent, imageUrl, rawContent };
  }
  return { ...post, imageUrl: post.imageUrl || null };
}

function validatePostImageUrls(content, imageUrl) {
  const canonicalImageUrl = imageUrl ? validateExternalMediaUrl(imageUrl) : null;
  const matcher = /\[IMAGE_URL:\s*([^\s\]]+)\]/g;
  let match;
  while ((match = matcher.exec(String(content || '')))) validateExternalMediaUrl(match[1]);
  return canonicalImageUrl;
}

function parseMediaAssetId(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value);
  if (!/^[1-9]\d*$/.test(text)) throw new AppError('Invalid media asset ID.', 400);
  return Number(text);
}

async function withOwnedActiveAsset(userId, assetId, operation) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`media-asset:${assetId}`}, 0))::text`;
    const asset = await tx.mediaAsset.findUnique({ where: { id: assetId } });
    if (!asset || asset.userId !== userId || asset.lifecycleState !== 'active') {
      throw new AppError('Media asset not found.', 404);
    }
    return operation(tx);
  });
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
  const { title, content, platform = 'Facebook', scheduledTime, status = 'pending_approval', isGoldenTime = true, businessProfileId } = postData;
  if (!title || !content) throw new AppError('Tiêu đề và nội dung bài viết là bắt buộc.', 400);
  const profile = businessProfileId == null ? null : await requireOwnedBusinessProfile(userId, businessProfileId, prisma);
  const mediaAssetId = parseMediaAssetId(postData.mediaAssetId);
  const imageUrl = mediaAssetId ? null : validatePostImageUrls(content, postData.imageUrl);
  const enrichedContent = mediaAssetId ? stripImageMarkers(content) : imageUrl && !content.includes(imageUrl) ? `${content}\n\n[IMAGE_URL: ${imageUrl}]` : content;
  const finalScheduledTime = scheduledTime ? new Date(scheduledTime) : calculateGoldenTime();
  if (Number.isNaN(finalScheduledTime.getTime())) throw new AppError('Thời gian lên lịch không hợp lệ.', 400);
  const data = {
    userId,
    businessProfileId: profile?.id || null,
    title,
    content: enrichedContent,
    imageUrl,
    mediaAssetId,
    platform,
    scheduledTime: finalScheduledTime,
    status,
    isGoldenTime,
  };
  const newPost = mediaAssetId
    ? await withOwnedActiveAsset(userId, mediaAssetId, (tx) => tx.scheduledPost.create({ data }))
    : await prisma.scheduledPost.create({ data });
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
  const requestedAssetId = updateData.mediaAssetId === undefined ? undefined : parseMediaAssetId(updateData.mediaAssetId);
  const existing = await prisma.scheduledPost.findUnique({ where: { id: idNum } });
  if (!existing || existing.userId !== userId) throw new AppError('Không tìm thấy bài viết lên lịch hoặc bạn không có quyền cập nhật.', 404);

  const data = {};
  const { title, content, scheduledTime, status } = updateData;
  if (title !== undefined) data.title = title;
  if (status !== undefined) data.status = status;
  if (scheduledTime !== undefined) {
    const parsedTime = new Date(scheduledTime);
    if (Number.isNaN(parsedTime.getTime())) throw new AppError('Thời gian lên lịch không hợp lệ.', 400);
    data.scheduledTime = parsedTime;
  }
  const targetAssetId = requestedAssetId === undefined ? existing.mediaAssetId : requestedAssetId;
  const imageUrl = targetAssetId ? null : updateData.imageUrl !== undefined ? validatePostImageUrls(content ?? existing.content, updateData.imageUrl) : existing.imageUrl;
  if (requestedAssetId !== undefined) data.mediaAssetId = requestedAssetId;
  if (requestedAssetId !== undefined || updateData.imageUrl !== undefined) data.imageUrl = imageUrl;
  if (content !== undefined) {
    const canonicalTextUrl = targetAssetId ? null : validatePostImageUrls(content, updateData.imageUrl);
    data.content = targetAssetId ? stripImageMarkers(content) : canonicalTextUrl && !content.includes(canonicalTextUrl) ? `${content}\n\n[IMAGE_URL: ${canonicalTextUrl}]` : content;
  }
  const update = (tx) => tx.scheduledPost.update({ where: { id: idNum }, data });
  const updated = requestedAssetId
    ? await withOwnedActiveAsset(userId, requestedAssetId, update)
    : await update(prisma);
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
  stripImageMarkers,
};

