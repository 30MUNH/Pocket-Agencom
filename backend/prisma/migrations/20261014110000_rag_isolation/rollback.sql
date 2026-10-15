-- Manual rollback only. This removes new RAG classification/provenance data.
-- Back up and inspect rows first; refuse rollback if any row has been classified.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "knowledge_base" WHERE "scope" <> 'unclassified') THEN
    RAISE EXCEPTION 'RAG rollback refused: classified rows exist';
  END IF;
END $$;

DROP INDEX IF EXISTS "knowledge_base_scope_embedding_model_embedding_version_idx";
DROP INDEX IF EXISTS "knowledge_base_scope_owner_user_id_business_profile_id_idx";
ALTER TABLE "knowledge_base" DROP CONSTRAINT IF EXISTS "knowledge_base_scope_shape_check";
ALTER TABLE "knowledge_base" DROP CONSTRAINT IF EXISTS "knowledge_base_approver_fkey";
ALTER TABLE "knowledge_base" DROP CONSTRAINT IF EXISTS "knowledge_base_owner_business_fkey";
ALTER TABLE "knowledge_base"
  DROP COLUMN IF EXISTS "embedding_dimensions",
  DROP COLUMN IF EXISTS "embedding_version",
  DROP COLUMN IF EXISTS "embedding_model",
  DROP COLUMN IF EXISTS "embedding_provider",
  DROP COLUMN IF EXISTS "approved_at",
  DROP COLUMN IF EXISTS "approved_by_user_id",
  DROP COLUMN IF EXISTS "business_profile_id",
  DROP COLUMN IF EXISTS "owner_user_id",
  DROP COLUMN IF EXISTS "scope";
DROP INDEX IF EXISTS "business_profiles_user_id_id_key";
-- Restore the previous access-control state only after checking it from backup.
-- The verified pre-migration state was RLS disabled and no anon/auth SELECT grants.
ALTER TABLE "knowledge_base" DISABLE ROW LEVEL SECURITY;
