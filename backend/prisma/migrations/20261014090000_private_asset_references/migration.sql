-- Forward-only, additive storage privacy schema. Existing URLs are preserved byte-for-byte.
CREATE TYPE "MediaAssetSourceKind" AS ENUM ('legacy_unverified', 'legacy_internal_verified', 'external_url', 'private_storage');
CREATE TYPE "MediaAssetLifecycleState" AS ENUM ('active', 'deleting');

ALTER TABLE "media_assets" ALTER COLUMN "url" DROP NOT NULL;
ALTER TABLE "media_assets"
  ADD COLUMN "source_kind" "MediaAssetSourceKind" NOT NULL DEFAULT 'legacy_unverified',
  ADD COLUMN "storage_bucket" TEXT,
  ADD COLUMN "storage_path" TEXT,
  ADD COLUMN "lifecycle_state" "MediaAssetLifecycleState" NOT NULL DEFAULT 'active',
  ADD COLUMN "deletion_operation_id" TEXT,
  ADD COLUMN "deletion_started_at" TIMESTAMP(3),
  ADD COLUMN "deletion_last_attempt_at" TIMESTAMP(3),
  ADD COLUMN "deletion_attempt_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "deletion_last_error" TEXT;

UPDATE "media_assets" SET "source_kind" = 'legacy_unverified';
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_source_shape_check" CHECK (
  ("source_kind" IN ('legacy_unverified', 'legacy_internal_verified') AND "storage_bucket" IS NULL AND "storage_path" IS NULL)
  OR ("source_kind" = 'external_url' AND "url" IS NOT NULL AND "storage_bucket" IS NULL AND "storage_path" IS NULL)
  OR ("source_kind" = 'private_storage' AND "storage_bucket" IS NOT NULL AND "storage_bucket" IN ('campaign-assets-private', 'avatars-private') AND "storage_path" IS NOT NULL AND "storage_path" <> '' AND "storage_path" !~ '(^|/)\.\.?(/|$)')
);
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_lifecycle_check" CHECK (
  ("lifecycle_state" = 'active' AND "deletion_operation_id" IS NULL AND "deletion_started_at" IS NULL)
  OR ("lifecycle_state" = 'deleting' AND "deletion_operation_id" IS NOT NULL AND "deletion_started_at" IS NOT NULL)
);
CREATE UNIQUE INDEX "media_assets_storage_bucket_storage_path_key" ON "media_assets"("storage_bucket", "storage_path");
CREATE UNIQUE INDEX "media_assets_user_id_id_key" ON "media_assets"("user_id", "id");
CREATE UNIQUE INDEX "media_assets_deletion_operation_id_key" ON "media_assets"("deletion_operation_id");
CREATE INDEX "media_assets_user_id_lifecycle_state_idx" ON "media_assets"("user_id", "lifecycle_state");

ALTER TABLE "users" ADD COLUMN "avatar_media_asset_id" INTEGER;
ALTER TABLE "scheduled_posts" ADD COLUMN "media_asset_id" INTEGER;
ALTER TABLE "marketing_plans" ADD CONSTRAINT "marketing_plans_user_id_id_key" UNIQUE ("user_id", "id");

CREATE TABLE "marketing_plan_assets" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "marketing_plan_id" INTEGER NOT NULL,
  "media_asset_id" INTEGER NOT NULL,
  "purpose" TEXT NOT NULL DEFAULT 'attachment',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketing_plan_assets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "marketing_plan_assets_marketing_plan_id_media_asset_id_key" UNIQUE ("marketing_plan_id", "media_asset_id"),
  CONSTRAINT "marketing_plan_assets_plan_owner_fkey" FOREIGN KEY ("user_id", "marketing_plan_id") REFERENCES "marketing_plans"("user_id", "id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "marketing_plan_assets_media_owner_fkey" FOREIGN KEY ("user_id", "media_asset_id") REFERENCES "media_assets"("user_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "marketing_plan_assets_user_id_media_asset_id_idx" ON "marketing_plan_assets"("user_id", "media_asset_id");

ALTER TABLE "users" ADD CONSTRAINT "users_avatar_media_asset_owner_fkey" FOREIGN KEY ("id", "avatar_media_asset_id") REFERENCES "media_assets"("user_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_media_asset_owner_fkey" FOREIGN KEY ("user_id", "media_asset_id") REFERENCES "media_assets"("user_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "media_asset_access_leases" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "media_asset_id" INTEGER NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_asset_access_leases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "media_asset_access_leases_media_asset_owner_fkey" FOREIGN KEY ("user_id", "media_asset_id") REFERENCES "media_assets"("user_id", "id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "media_asset_access_leases_media_asset_id_expires_at_idx" ON "media_asset_access_leases"("media_asset_id", "expires_at");
