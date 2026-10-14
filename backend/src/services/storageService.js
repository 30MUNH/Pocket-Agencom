const crypto = require('node:crypto');
const supabase = require('../config/supabase');
const { AppError } = require('../middleware/errorHandler');

const PRIVATE_BUCKETS = Object.freeze({ campaign: 'campaign-assets-private', avatars: 'avatars-private' });
const MIME_EXTENSIONS = Object.freeze({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' });
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

  async function uploadPrivateObject({ ownerId, file, purpose }) {
    requirePrivate();
    if (!Number.isSafeInteger(Number(ownerId)) || Number(ownerId) < 1) throw new AppError('Authenticated owner is required.', 401);
    const bucket = purpose === 'avatar' ? PRIVATE_BUCKETS.avatars : purpose === 'campaign' ? PRIVATE_BUCKETS.campaign : null;
    const extension = MIME_EXTENSIONS[file?.mimetype];
    if (!bucket || !extension || !Buffer.isBuffer(file?.buffer) || file.buffer.length === 0) {
      throw new AppError('Unsupported private asset upload.', 400);
    }
    const objectPath = `${crypto.randomUUID()}${extension}`;
    const { error } = await storageClient.storage.from(bucket).upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) throw new AppError(SAFE_ERROR, 503);
    return { bucket, path: objectPath, contentType: file.mimetype, byteLength: file.buffer.length };
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
