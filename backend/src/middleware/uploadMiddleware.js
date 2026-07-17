const multer = require('multer');
const { AppError } = require('./errorHandler');

// Configure memory storage (we will stream/upload the buffer directly to Supabase)
const storage = multer.memoryStorage();

// Restrict to common web image formats and max 2MB
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ hỗ trợ tải lên các định dạng ảnh: JPEG, PNG, WebP', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

module.exports = {
  uploadAvatar: upload.single('avatar'),
};
