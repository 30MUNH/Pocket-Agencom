async function setupStorage() {
  console.log('Private Supabase Storage is disabled by default.');
  console.log('After separate Staging approval, provision campaign-assets-private and avatars-private as private buckets.');
  console.log('Keep SUPABASE_SERVICE_ROLE_KEY on the backend only. Use database-backed MediaAsset IDs for ownership.');
  console.log('Never create or fall back to public buckets through this application helper.');
  console.log('Enable PRIVATE_STORAGE_MODE=private only after migrations and real Storage checks are approved and complete.');
}

module.exports = setupStorage;
