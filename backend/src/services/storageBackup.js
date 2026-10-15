const crypto = require('node:crypto');

const PRIVATE_BUCKETS = new Set(['campaign-assets-private', 'avatars-private']);
const BACKUP_CHECKSUM_MISMATCH = 'STORAGE_BACKUP_CHECKSUM_MISMATCH';

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function backupKeyFor(bucket, path) {
  return crypto.createHash('sha256').update(`${bucket}\0${path}`).digest('hex');
}

function buildObjectManifest(objects, { timestamp = new Date().toISOString() } = {}) {
  return {
    version: 1,
    timestamp,
    objects: objects.map(({ sourceBucket, sourcePath, bytes, contentType }) => ({
      sourceBucket,
      sourcePath,
      byteLength: Buffer.byteLength(bytes),
      contentType: String(contentType || 'application/octet-stream').split(';')[0].trim().toLowerCase(),
      sha256: sha256(bytes),
      backupKey: backupKeyFor(sourceBucket, sourcePath),
      timestamp,
    })),
  };
}

function encryptionKey(value) {
  const key = Buffer.isBuffer(value) ? value : Buffer.from(String(value || ''), 'hex');
  if (key.length !== 32) throw new Error('Backup encryption key must be 32 bytes (64 hex characters).');
  return key;
}

function encryptObjectBytes(bytes, keyValue, iv = crypto.randomBytes(12)) {
  const key = encryptionKey(keyValue);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return { algorithm: 'aes-256-gcm', iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext };
}

function decryptObjectBytes(encrypted, keyValue) {
  if (!encrypted || encrypted.algorithm !== 'aes-256-gcm') throw new Error('Unsupported encrypted backup object.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(keyValue), Buffer.from(encrypted.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));
  return Buffer.concat([decipher.update(encrypted.ciphertext), decipher.final()]);
}

async function verifyBackupObjects(manifest, readBytes) {
  const results = [];
  for (const item of manifest.objects || []) {
    const bytes = await readBytes(item);
    if (!Buffer.isBuffer(bytes) || bytes.length !== item.byteLength || sha256(bytes) !== item.sha256) {
      const error = new Error(`Backup object verification failed for key ${item.backupKey}.`);
      error.code = BACKUP_CHECKSUM_MISMATCH;
      throw error;
    }
    results.push({ backupKey: item.backupKey, verified: true });
  }
  return results;
}

function validObjectPath(path) {
  return typeof path === 'string' && path.length > 0 && path.length <= 1024 && !path.startsWith('/') &&
    !path.includes('\\') && path.split('/').every((part) => part && part !== '.' && part !== '..');
}

function validateMigrationItem(item) {
  return item?.approved === true && Number.isSafeInteger(Number(item.mediaAssetId)) && Number(item.mediaAssetId) > 0 &&
    Number.isSafeInteger(Number(item.ownerId)) && Number(item.ownerId) > 0 &&
    typeof item.expectedUrl === 'string' && item.expectedUrl.length > 0 &&
    /^[a-z0-9][a-z0-9_-]{0,62}$/i.test(item.sourceBucket || '') && validObjectPath(item.sourcePath) &&
    PRIVATE_BUCKETS.has(item.destinationBucket) && validObjectPath(item.destinationPath) &&
    /^[a-f0-9]{64}$/i.test(item.expectedSha256 || '');
}

async function migrateVerifiedMediaAssets(items, adapters, { dryRun = true, approved = false } = {}) {
  const manifest = (items || []).map((item) => ({
    mediaAssetId: item.mediaAssetId,
    sourceBucket: item.sourceBucket,
    sourcePath: item.sourcePath,
    destinationBucket: item.destinationBucket,
    destinationPath: item.destinationPath,
    status: 'ready',
  }));
  if (!dryRun && !approved) throw Object.assign(new Error('Explicit legacy migration approval is required.'), { code: 'STORAGE_MIGRATION_NOT_APPROVED' });
  if ((items || []).some((item) => !validateMigrationItem(item))) {
    throw Object.assign(new Error('Migration item is not an approved, exact object mapping.'), { code: 'STORAGE_MIGRATION_INVALID_SOURCE' });
  }
  if (dryRun) return { dryRun: true, copied: 0, manifest };
  if (!approved) throw Object.assign(new Error('Explicit legacy migration approval is required.'), { code: 'STORAGE_MIGRATION_NOT_APPROVED' });
  if (!adapters?.readSource || !adapters?.readPrivate || !adapters?.writePrivate || !adapters?.database?.$transaction) {
    throw new Error('Storage and database migration adapters are required.');
  }

  let copied = 0;
  for (const item of items || []) {
    const source = await adapters.readSource(item.sourceBucket, item.sourcePath);
    if (!Buffer.isBuffer(source?.bytes) || sha256(source.bytes) !== item.expectedSha256) {
      throw Object.assign(new Error('Source object checksum does not match the approved manifest.'), { code: BACKUP_CHECKSUM_MISMATCH });
    }

    let destination;
    try { destination = await adapters.readPrivate(item.destinationBucket, item.destinationPath); }
    catch (error) {
      if (error?.statusCode !== 404 && error?.code !== 'NOT_FOUND') throw error;
    }
    if (destination?.bytes) {
      if (sha256(destination.bytes) !== item.expectedSha256) {
        throw Object.assign(new Error('Existing destination object does not match the approved checksum.'), { code: BACKUP_CHECKSUM_MISMATCH });
      }
    } else {
      await adapters.writePrivate(item.destinationBucket, item.destinationPath, source.bytes, {
        contentType: source.contentType || 'application/octet-stream',
        upsert: false,
      });
      destination = await adapters.readPrivate(item.destinationBucket, item.destinationPath);
      if (!Buffer.isBuffer(destination?.bytes) || destination.bytes.length !== source.bytes.length || sha256(destination.bytes) !== item.expectedSha256) {
        throw Object.assign(new Error('Copied destination object failed byte verification.'), { code: BACKUP_CHECKSUM_MISMATCH });
      }
    }

    const updateResult = await adapters.database.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`media-asset:${Number(item.mediaAssetId)}`}, 0))::text`;
      return tx.mediaAsset.updateMany({
        where: {
          id: Number(item.mediaAssetId),
          userId: Number(item.ownerId),
          url: item.expectedUrl,
          sourceKind: { in: ['legacy_unverified', 'legacy_internal_verified'] },
          lifecycleState: 'active',
        },
        data: {
          sourceKind: 'private_storage',
          storageBucket: item.destinationBucket,
          storagePath: item.destinationPath,
        },
      });
    });
    if (updateResult?.count !== 1) throw Object.assign(new Error('Legacy MediaAsset record changed or did not match the approved owner and URL.'), { code: 'STORAGE_MIGRATION_REFERENCE_CONFLICT' });
    copied += 1;
  }
  return { dryRun: false, copied, manifest };
}

module.exports = {
  buildObjectManifest,
  encryptObjectBytes,
  decryptObjectBytes,
  verifyBackupObjects,
  migrateVerifiedMediaAssets,
  sha256,
  backupKeyFor,
  BACKUP_CHECKSUM_MISMATCH,
};
