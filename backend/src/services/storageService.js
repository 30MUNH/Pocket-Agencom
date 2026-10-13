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
async function uploadCampaignAsset(file, folder, bucket = CAMPAIGN_BUCKET) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
    throw new AppError('Supabase Storage is not configured', 503);
  }
  if (!/^user-[1-9]\d*$/.test(folder)) {
    throw new AppError('Storage upload requires a user scope', 400);
  }
  if (bucket !== CAMPAIGN_BUCKET && bucket !== 'avatars') {
    throw new AppError('Unsupported storage bucket', 400);
  }
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
    throw new AppError(`Supabase Storage upload failed: ${error.message}`, 500);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { path: filePath, publicUrl: urlData.publicUrl };
}

module.exports = { uploadCampaignAsset, CAMPAIGN_BUCKET };
