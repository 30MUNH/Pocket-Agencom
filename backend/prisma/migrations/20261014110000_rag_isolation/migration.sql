-- Additive RAG isolation. Existing records remain unclassified and unchanged.
ALTER TABLE "knowledge_base"
  ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'unclassified',
  ADD COLUMN "owner_user_id" INTEGER,
  ADD COLUMN "business_profile_id" INTEGER,
  ADD COLUMN "approved_by_user_id" INTEGER,
  ADD COLUMN "approved_at" TIMESTAMP(3),
  ADD COLUMN "embedding_provider" TEXT,
  ADD COLUMN "embedding_model" TEXT,
  ADD COLUMN "embedding_version" TEXT,
  ADD COLUMN "embedding_dimensions" INTEGER;

CREATE UNIQUE INDEX "business_profiles_user_id_id_key" ON "business_profiles"("user_id", "id");

ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_owner_business_fkey"
  FOREIGN KEY ("owner_user_id", "business_profile_id")
  REFERENCES "business_profiles"("user_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_approver_fkey"
  FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_scope_shape_check" CHECK (
  ("scope" = 'unclassified' AND "owner_user_id" IS NULL AND "business_profile_id" IS NULL
    AND "approved_by_user_id" IS NULL AND "approved_at" IS NULL)
  OR ("scope" = 'tenant_private' AND "owner_user_id" IS NOT NULL AND "business_profile_id" IS NOT NULL
    AND "approved_by_user_id" IS NULL AND "approved_at" IS NULL AND "embedding" IS NOT NULL
    AND "embedding_provider" IS NOT NULL AND "embedding_model" IS NOT NULL
    AND "embedding_version" IS NOT NULL AND "embedding_dimensions" = 768)
  OR ("scope" = 'approved_global' AND "owner_user_id" IS NULL AND "business_profile_id" IS NULL
    AND "approved_by_user_id" IS NOT NULL AND "approved_at" IS NOT NULL AND "embedding" IS NOT NULL
    AND "embedding_provider" IS NOT NULL AND "embedding_model" IS NOT NULL
    AND "embedding_version" IS NOT NULL AND "embedding_dimensions" = 768)
);

CREATE INDEX "knowledge_base_scope_owner_user_id_business_profile_id_idx"
  ON "knowledge_base"("scope", "owner_user_id", "business_profile_id");
CREATE INDEX "knowledge_base_scope_embedding_model_embedding_version_idx"
  ON "knowledge_base"("scope", "embedding_model", "embedding_version");

-- The app's PostgreSQL role is privileged. Its RAG queries must still use
-- explicit actor predicates; RLS and grants protect direct Data API access.
ALTER TABLE "knowledge_base" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "knowledge_base" FROM anon, authenticated;
