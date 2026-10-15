const fs = require('node:fs/promises');
const path = require('node:path');
const { buildObjectManifest, encryptObjectBytes, decryptObjectBytes, sha256, backupKeyFor } = require('../src/services/storageBackup');

const REPO_ROOT = path.resolve(__dirname, '../..');

async function assertApprovedOutput(directory) {
  if (!process.argv.includes('--execute') || process.env.STORAGE_OBJECT_BACKUP_APPROVED !== '1') {
    throw new Error('Object backup requires --execute and STORAGE_OBJECT_BACKUP_APPROVED=1.');
  }
  const requested = path.resolve(directory || '');
  const relative = path.relative(REPO_ROOT, requested);
  if (!directory || !relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Backup directory must be outside the repository.');
  await fs.mkdir(requested, { recursive: true, mode: 0o700 });
  const resolved = await fs.realpath(requested);
  const canonicalRelative = path.relative(await fs.realpath(REPO_ROOT), resolved);
  if (!canonicalRelative.startsWith('..') || path.isAbsolute(canonicalRelative)) throw new Error('Backup directory must resolve outside the repository.');
  return resolved;
}

function safeSourceObject(item) {
  return item?.verified === true && /^[a-z0-9][a-z0-9_-]{0,62}$/i.test(item.sourceBucket || '') &&
    typeof item.sourcePath === 'string' && item.sourcePath.length > 0 && !item.sourcePath.startsWith('/') &&
    !item.sourcePath.split('/').some((part) => !part || part === '.' || part === '..' || part.includes('\\'));
}

async function main() {
  const backupDirectory = await assertApprovedOutput(process.env.STORAGE_BACKUP_DIRECTORY);
  if (!process.env.STORAGE_BACKUP_ENCRYPTION_KEY || !/^[a-f0-9]{64}$/i.test(process.env.STORAGE_BACKUP_ENCRYPTION_KEY)) {
    throw new Error('STORAGE_BACKUP_ENCRYPTION_KEY must be a 32-byte hex key supplied from a secret manager.');
  }
  const scopePath = path.resolve(process.env.STORAGE_BACKUP_SCOPE_FILE || '');
  if (!process.env.STORAGE_BACKUP_SCOPE_FILE) throw new Error('STORAGE_BACKUP_SCOPE_FILE is required.');
  const scope = JSON.parse(await fs.readFile(scopePath, 'utf8'));
  if (!Array.isArray(scope.objects) || scope.objects.some((item) => !safeSourceObject(item))) throw new Error('Backup scope contains an unverified or invalid source object.');
  const { createClient } = require('@supabase/supabase-js');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Backend Supabase credentials are required.');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  await fs.chmod(backupDirectory, 0o700);
  const timestamp = new Date().toISOString();
  const objects = [];
  for (const item of scope.objects) {
    const { data, error } = await supabase.storage.from(item.sourceBucket).download(item.sourcePath);
    if (error || !data) throw new Error('An approved source object could not be read; backup stopped without source mutation.');
    const bytes = Buffer.from(await data.arrayBuffer());
    const contentType = data.type || item.contentType || 'application/octet-stream';
    const objectManifest = buildObjectManifest([{ sourceBucket: item.sourceBucket, sourcePath: item.sourcePath, bytes, contentType }], { timestamp }).objects[0];
    const backupKey = backupKeyFor(item.sourceBucket, item.sourcePath);
    const encryptedPath = path.join(backupDirectory, `${backupKey}.enc`);
    let envelope;
    try {
      envelope = JSON.parse(await fs.readFile(encryptedPath, 'utf8'));
      const recovered = decryptObjectBytes({ ...envelope, ciphertext: Buffer.from(envelope.ciphertext, 'base64') }, process.env.STORAGE_BACKUP_ENCRYPTION_KEY);
      if (recovered.length !== bytes.length || sha256(recovered) !== objectManifest.sha256) throw new Error('Existing encrypted copy does not match current source bytes.');
      await fs.chmod(encryptedPath, 0o600);
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error('Existing encrypted backup file is invalid; preserve it for investigation.');
      const encrypted = encryptObjectBytes(bytes, process.env.STORAGE_BACKUP_ENCRYPTION_KEY);
      envelope = { algorithm: encrypted.algorithm, iv: encrypted.iv, tag: encrypted.tag, ciphertext: encrypted.ciphertext.toString('base64') };
      await fs.writeFile(encryptedPath, JSON.stringify(envelope), { flag: 'wx', mode: 0o600 });
    }
    objects.push({ ...objectManifest, encrypted: { algorithm: envelope.algorithm, iv: envelope.iv, tag: envelope.tag } });
  }
  const manifest = { version: 1, timestamp, encryption: 'aes-256-gcm', objects };
  const manifestPath = path.join(backupDirectory, 'manifest.json');
  try {
    const existing = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const identity = (list) => list.map(({ sourceBucket, sourcePath, byteLength, contentType, sha256, backupKey }) => ({ sourceBucket, sourcePath, byteLength, contentType, sha256, backupKey }));
    if (JSON.stringify(identity(existing.objects || [])) !== JSON.stringify(identity(objects))) throw new Error('Existing backup manifest does not match the requested scope.');
    await fs.chmod(manifestPath, 0o600);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
  }
  process.stdout.write(`Encrypted object backup written; objects=${objects.length}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Storage object backup failed: ${String(error?.message || error).replace(/https?:\/\/[^\s]+/g, '[redacted URL]')}\n`);
    process.exitCode = 1;
  });
}

module.exports = { assertApprovedOutput, safeSourceObject };
