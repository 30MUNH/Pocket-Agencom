const path = require('path');
const supabase = require('../config/supabase');
const { AppError } = require('../middleware/errorHandler');

const CAMPAIGN_BUCKET = 'campaign-assets';

/**
 * Uploads a multer memory-storage file to Supabase Storage and returns its public URL.
 * @param {Express.Multer.File} file - file from multer (buffer + mimetype + originalname)
 * @param {string} folder - folder prefix inside the bucket (e.g. `user-12`)
 * @returns {Promise<{ path: string, publicUrl: string }>}
 */
async function uploadCampaignAsset(file, folder = 'general', bucket = CAMPAIGN_BUCKET) {
  const fileExt = path.extname(file.originalname) || '.jpg';
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error(`[Supabase Upload Error] Failed uploading to bucket ${bucket}:`, error.message);
    if (bucket === CAMPAIGN_BUCKET) {
      console.log(`[Supabase Upload] Attempting fallback to 'avatars' bucket...`);
      try {
        return await uploadCampaignAsset(file, folder, 'avatars');
      } catch (fallbackErr) {
        console.error(`[Supabase Fallback Upload Error]`, fallbackErr.message);
      }
    }

    if (error.message && error.message.toLowerCase().includes('row-level security')) {
      throw new AppError(
        `Lỗi bảo mật (RLS) của Supabase: Vui lòng truy cập trang quản trị Supabase, chọn mục Storage -> tab Policies của bucket "${bucket}", và thêm chính sách (Policy) cho phép INSERT/SELECT.`,
        500
      );
    }
    if (error.message && error.message.toLowerCase().includes('bucket not found')) {
      throw new AppError(
        `Không tìm thấy Bucket "${bucket}": Vui lòng truy cập trang quản trị Supabase -> Storage -> click "New Bucket" và tạo một public bucket tên là "${bucket}".`,
        500
      );
    }
    throw new AppError(`Lỗi tải ảnh lên Supabase Storage: ${error.message}`, 500);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { path: filePath, publicUrl: urlData.publicUrl };
}

module.exports = { uploadCampaignAsset, CAMPAIGN_BUCKET };
