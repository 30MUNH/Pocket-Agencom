const fs = require('node:fs/promises');
const path = require('node:path');
const { decryptObjectBytes, verifyBackupObjects, sha256 } = require('../src/services/storageBackup');

async function main() {
  const directory = path.resolve(process.env.STORAGE_BACKUP_DIRECTORY || '');
  if (!process.env.STORAGE_BACKUP_DIRECTORY || !process.env.STORAGE_BACKUP_ENCRYPTION_KEY || !/^[a-f0-9]{64}$/i.test(process.env.STORAGE_BACKUP_ENCRYPTION_KEY)) {
    throw new Error('Backup directory and secret-manager encryption key are required.');
  }
  const manifest = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'));
  const readDecrypted = async (item) => {
    const envelope = JSON.parse(await fs.readFile(path.join(directory, `${item.backupKey}.enc`), 'utf8'));
    return decryptObjectBytes({ ...envelope, ciphertext: Buffer.from(envelope.ciphertext, 'base64') }, process.env.STORAGE_BACKUP_ENCRYPTION_KEY);
  };
  const verified = await verifyBackupObjects(manifest, readDecrypted);
  if (process.argv.includes('--restore')) {
    const bucket = process.env.STORAGE_ISOLATED_RESTORE_BUCKET;
    if (!process.argv.includes('--execute') || process.env.STORAGE_BACKUP_RESTORE_APPROVED !== '1' || !/^(test-|.+-test$)/.test(bucket || '')) {
      throw new Error('Restore requires --restore --execute, STORAGE_BACKUP_RESTORE_APPROVED=1, and an isolated test bucket name.');
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Isolated test Storage credentials are required.');
    if (!process.env.STORAGE_RESTORE_PROJECT_URL || process.env.SUPABASE_URL !== process.env.STORAGE_RESTORE_PROJECT_URL) {
      throw new Error('Configured Supabase URL does not match the separately approved isolated test project URL.');
    }
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    for (const item of manifest.objects) {
      const bytes = await readDecrypted(item);
      const restorePath = `restore/${item.backupKey}`;
      const upload = await supabase.storage.from(bucket).upload(restorePath, bytes, { contentType: item.contentType, upsert: false });
      if (upload.error && !/already exists|duplicate/i.test(upload.error.message || '')) throw new Error('Isolated Storage restore failed.');
      const download = await supabase.storage.from(bucket).download(restorePath);
      if (download.error || !download.data) throw new Error('Restored object could not be read back.');
      const restoredBytes = Buffer.from(await download.data.arrayBuffer());
      if (restoredBytes.length !== item.byteLength || sha256(restoredBytes) !== item.sha256 || (download.data.type && download.data.type !== item.contentType)) {
        throw new Error('Restored object failed independent byte or metadata validation.');
      }
    }
  }
  process.stdout.write(`Backup verification passed; objects=${verified.length}${process.argv.includes('--restore') ? '; isolated restore verified' : ''}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Storage backup verification failed: ${String(error?.message || error).replace(/https?:\/\/[^\s]+/g, '[redacted URL]')}\n`);
    process.exitCode = 1;
  });
}
