const supabase = require('../config/supabase');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');
const path = require('path');

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('Vui lòng chọn ảnh đại diện cần tải lên', 400);
    }

    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage bucket 'avatars'
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      if (error.message && error.message.toLowerCase().includes('row-level security')) {
        throw new AppError(
          'Lỗi bảo mật (RLS) của Supabase: Vui lòng truy cập trang quản trị Supabase, chọn mục Storage -> tab Policies của bucket "avatars", và thêm chính sách (Policy) cho phép INSERT/SELECT.',
          500
        );
      }
      if (error.message && error.message.toLowerCase().includes('bucket not found')) {
        throw new AppError(
          'Không tìm thấy Bucket "avatars": Vui lòng truy cập trang quản trị Supabase -> Storage -> click "New Bucket" và tạo một public bucket tên là "avatars".',
          500
        );
      }
      throw new AppError(`Lỗi tải ảnh lên Supabase Storage: ${error.message}`, 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return success(res, {
      url: urlData.publicUrl,
    });
  } catch (err) {
    next(err);
  }
}

async function uploadSingle(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('Vui lòng chọn tập tin cần tải lên', 400);
    }

    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
    const filePath = `media/${fileName}`;
    const bucket = 'campaign-assets';

    let { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error && error.message.toLowerCase().includes('bucket not found')) {
      const fallbackResult = await supabase.storage
        .from('avatars')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (!fallbackResult.error) {
        const { data: fallbackUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        return success(res, { url: fallbackUrlData.publicUrl });
      }
    }

    if (error) {
      if (error.message && error.message.toLowerCase().includes('row-level security')) {
        throw new AppError(
          `Lỗi bảo mật (RLS) của Supabase: Vui lòng truy cập trang quản trị Supabase -> Storage -> tab Policies của bucket "${bucket}", và thêm chính sách (Policy) cho phép INSERT/SELECT.`,
          500
        );
      }
      throw new AppError(`Lỗi tải tập tin lên Supabase Storage: ${error.message}`, 500);
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return success(res, {
      url: urlData.publicUrl,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadAvatar,
  uploadSingle
};
