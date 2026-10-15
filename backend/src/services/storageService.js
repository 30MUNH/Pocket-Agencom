const crypto = require('node:crypto');
const sharp = require('sharp');
const supabase = require('../config/supabase');
const { AppError } = require('../middleware/errorHandler');

const PRIVATE_BUCKETS = Object.freeze({ campaign: 'campaign-assets-private', avatars: 'avatars-private' });
const MIME_EXTENSIONS = Object.freeze({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' });
const FORMAT_MIME = Object.freeze({ jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' });
const SAFE_ERROR = 'Private Storage operation failed.';

function assertStorageConfiguration(mode, env = process.env) {
  if (!['disabled', 'private'].includes(mode)) throw new AppError('PRIVATE_STORAGE_MODE must be disabled or private.', 503);
  if (mode === 'private' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new AppError('Private Storage is not configured.', 503);
  }
}

function createStorageService({ storageClient = supabase, env = process.env } = {}) {
  const mode = () => env.PRIVATE_STORAGE_MODE || 'disabled';
  assertStorageConfiguration(mode(), env);

  function requirePrivate() {
    const selectedMode = mode();
    assertStorageConfiguration(selectedMode, env);
    if (selectedMode !== 'private') throw new AppError('Private asset storage is disabled.', 503);
  }

  async function uploadPrivateObject({ ownerId, file, purpose, onPrepared }) {
    requirePrivate();
    if (!Number.isSafeInteger(Number(ownerId)) || Number(ownerId) < 1) throw new AppError('Authenticated owner is required.', 401);
    const bucket = purpose === 'avatar' ? PRIVATE_BUCKETS.avatars : purpose === 'campaign' ? PRIVATE_BUCKETS.campaign : null;
    if (!bucket || !MIME_EXTENSIONS[file?.mimetype] || !Buffer.isBuffer(file?.buffer)
      || file.buffer.length === 0 || file.buffer.length > 8 * 1024 * 1024) {
      throw new AppError('Unsupported private asset upload.', 400);
    }
    let verifiedMime;
    try {
      const decoder = sharp(file.buffer, { failOn: 'error', limitInputPixels: 16_000_000 });
      const metadata = await decoder.metadata();
      verifiedMime = FORMAT_MIME[metadata.format];
      if (!verifiedMime || metadata.pages > 1 || !metadata.width || !metadata.height) {
        throw new Error('Unsupported image format');
      }
      await decoder.clone().stats();
    } catch {
      throw new AppError('Invalid or corrupted image bytes.', 400);
    }
    if (file.mimetype !== verifiedMime) throw new AppError('Image content does not match its declared type.', 400);
    const extension = MIME_EXTENSIONS[verifiedMime];
    const objectPath = `${crypto.randomUUID()}${extension}`;
    const object = { bucket, path: objectPath, contentType: verifiedMime, byteLength: file.buffer.length };
    if (onPrepared) await onPrepared(object);
    const { error } = await storageClient.storage.from(bucket).upload(objectPath, file.buffer, {
      contentType: verifiedMime,
      upsert: false,
    });
    if (error) throw new AppError(SAFE_ERROR, 503);
    return object;
  }

  async function removePrivateObject({ bucket, path }) {
    requirePrivate();
    if (!Object.values(PRIVATE_BUCKETS).includes(bucket) || typeof path !== 'string' || !path || path.includes('..')) {
      throw new AppError('Invalid private asset reference.', 400);
    }
    const { error } = await storageClient.storage.from(bucket).remove([path]);
    if (error && !/not found|does not exist/i.test(error.message || '')) throw new AppError(SAFE_ERROR, 503);
    return { removed: true };
  }

  return { uploadPrivateObject, removePrivateObject };
}

const storageService = createStorageService();
module.exports = { ...storageService, createStorageService, assertStorageConfiguration, PRIVATE_BUCKETS };
