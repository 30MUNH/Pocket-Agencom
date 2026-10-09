-- AlterTable
ALTER TABLE "public"."scheduled_posts" ADD COLUMN IF NOT EXISTS "image_url" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."ai_quota_usage" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date_key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_quota_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ai_quota_usage_user_id_date_key_type_key" ON "public"."ai_quota_usage"("user_id", "date_key", "type");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_quota_usage_user_id_fkey'
    ) THEN
        ALTER TABLE "public"."ai_quota_usage" 
        ADD CONSTRAINT "ai_quota_usage_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
