const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

// Demo fallback memory store in case database migrations haven't run yet
let demoScheduledPostsStore = [
  {
    id: 101,
    userId: 1,
    title: "Trend 'Thông báo mất tích': Biến sự cố thành Content triệu view!",
    content: "Lô hàng 12 tấn KitKat biến mất và cách các thương hiệu lớn 'mượn cớ' thông báo thất lạc để giật spotlight. Cửa hàng bạn đã thử chưa?",
    platform: "Facebook",
    scheduledTime: new Date(Date.now() + 3600000 * 4).toISOString(), // 4 hours from now
    status: "pending_approval",
    isGoldenTime: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 102,
    userId: 1,
    title: "Trend 'Unboxing Hộp Mù (Blind Box)' - Kích thích tò mò!",
    content: "Sức hút từ cảm giác hồi hộp khi tự tay bóc hộp đồ chơi ngẫu nhiên. Áp dụng ngay hình thức Blind Box để x3 doanh số!",
    platform: "TikTok",
    scheduledTime: new Date(Date.now() + 3600000 * 26).toISOString(), // Tomorrow
    status: "approved",
    isGoldenTime: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 103,
    userId: 1,
    title: "Thử thách 7 ngày lột xác cùng sản phẩm mới",
    content: "Ghi lại hành trình lột xác 7 ngày thực tế để tạo dựng lòng tin tuyệt đối từ khách hàng cũ và mới.",
    platform: "Instagram",
    scheduledTime: new Date(Date.now() - 3600000 * 12).toISOString(), // Yesterday
    status: "published",
    isGoldenTime: false,
    createdAt: new Date().toISOString()
  }
];

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
      orderBy: { scheduledTime: 'asc' }
    });

    if (posts && posts.length > 0) {
      return posts;
    }
  } catch (err) {
    console.warn('[Prisma Fallback] Falling back to demo scheduled posts memory store');
  }

  return demoScheduledPostsStore;
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
