-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'staff', 'admin', 'kol');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'inactive', 'banned');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('draft', 'saved', 'reviewed', 'approved', 'need_revision');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('social_post', 'banner', 'video_script', 'playbook', 'checklist');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "KolType" AS ENUM ('nano_koc', 'micro_kol', 'local_influencer', 'reviewer', 'livestream_seller', 'content_creator');

-- CreateEnum
CREATE TYPE "KolStatus" AS ENUM ('active', 'inactive', 'pending');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('tiktok_video', 'instagram_reels', 'facebook_post', 'story_post', 'livestream', 'product_review', 'unboxing', 'combo');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'staff_reviewing', 'need_more_info', 'approved', 'confirmed', 'in_progress', 'content_submitted', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'escalated', 'closed');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('account', 'marketing_plan', 'booking', 'payment', 'technical', 'other');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('system', 'plan', 'booking', 'support');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'published');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('KOL', 'Ads', 'Custom');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "business_name" TEXT,
    "business_type" TEXT NOT NULL,
    "product_description" TEXT NOT NULL,
    "target_customer" TEXT NOT NULL,
    "marketing_goal" TEXT,
    "budget_range" TEXT,
    "location" TEXT,
    "usp" TEXT,
    "brand_voice" TEXT,
    "price_range" TEXT,
    "best_selling_product" TEXT,
    "monthly_marketing_budget" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_plans" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "business_profile_id" INTEGER NOT NULL,
    "goal" TEXT NOT NULL,
    "campaign_type" TEXT,
    "budget" DECIMAL(65,30),
    "content_ideas" TEXT,
    "video_scripts" TEXT,
    "checklist" TEXT,
    "playbook" TEXT,
    "seo_keywords" TEXT,
    "budget_breakdown" TEXT,
    "deployment_channels" TEXT,
    "existing_resources" TEXT,
    "campaign_reason" TEXT,
    "is_looking_for_kol" BOOLEAN NOT NULL DEFAULT false,
    "status" "PlanStatus" NOT NULL DEFAULT 'saved',
    "reviewed_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "type" "TemplateType" NOT NULL,
    "description" TEXT,
    "file_url" TEXT,
    "preview_image" TEXT,
    "created_by" INTEGER NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "cover_url" TEXT,
    "bio" TEXT,
    "kol_type" "KolType" NOT NULL DEFAULT 'content_creator',
    "niche" TEXT NOT NULL DEFAULT 'General',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platforms" JSONB DEFAULT '{}',
    "location" TEXT,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "engagement_rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "completed_campaigns" INTEGER NOT NULL DEFAULT 0,
    "audience_gender" TEXT,
    "audience_age_range" TEXT,
    "audience_location" TEXT,
    "audience_interests" TEXT,
    "price_from" DECIMAL(65,30),
    "bookingPrice" DOUBLE PRECISION,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "status" "KolStatus" NOT NULL DEFAULT 'active',
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kol_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_platform_accounts" (
    "id" SERIAL NOT NULL,
    "kol_id" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "profile_url" TEXT,
    "username" TEXT,
    "follower_count" INTEGER,
    "engagement_rate" DECIMAL(65,30),
    "average_views" INTEGER,
    "average_likes" INTEGER,
    "average_comments" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kol_platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_service_packages" (
    "id" SERIAL NOT NULL,
    "kol_id" INTEGER NOT NULL,
    "package_name" TEXT NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "description" TEXT,
    "deliverables" TEXT,
    "delivery_time" TEXT,
    "revision_policy" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kol_service_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_availability_slots" (
    "id" SERIAL NOT NULL,
    "kol_id" INTEGER NOT NULL,
    "available_date" DATE NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kol_availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_bookings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "kol_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "assigned_staff_id" INTEGER,
    "campaign_name" TEXT NOT NULL,
    "campaign_goal" TEXT,
    "product_name" TEXT NOT NULL,
    "product_description" TEXT,
    "product_category" TEXT,
    "target_customer" TEXT,
    "campaign_platform" TEXT,
    "campaign_date" DATE,
    "budget" DECIMAL(65,30),
    "content_requirements" TEXT,
    "do_and_dont_notes" TEXT,
    "delivery_address" TEXT,
    "reference_link" TEXT,
    "product_images" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kol_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_reviews" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "kol_id" INTEGER NOT NULL,
    "rating" DECIMAL(65,30) NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "assigned_staff_id" INTEGER,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL DEFAULT 'other',
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" vector(768),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'system',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_platforms" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "platform_type" TEXT DEFAULT 'social',
    "url" TEXT NOT NULL,
    "followers_count" INTEGER NOT NULL,
    "engagement_rate" DOUBLE PRECISION NOT NULL,
    "metrics" JSONB DEFAULT '[]',
    "ai_insight" TEXT,
    "business_profile_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_applications" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "kol_profile_id" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "cover_letter" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_media" (
    "id" SERIAL NOT NULL,
    "kol_profile_id" INTEGER NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "is_full_body" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kol_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_reviews" (
    "id" SERIAL NOT NULL,
    "kol_profile_id" INTEGER NOT NULL,
    "sme_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kol_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_performance" (
    "id" SERIAL NOT NULL,
    "kol_profile_id" INTEGER NOT NULL,
    "post_url" TEXT NOT NULL,
    "engagement_rate" DOUBLE PRECISION NOT NULL,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "platform" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kol_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_posts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "business_profile_id" INTEGER,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "scheduled_time" TIMESTAMP(3),
    "status" "PostStatus" NOT NULL DEFAULT 'pending_approval',
    "is_golden_time" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "business_profile_id" INTEGER,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "marketing_plan_id" INTEGER NOT NULL,
    "expense_type" "ExpenseType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_user_id_key" ON "business_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "kol_profiles_user_id_key" ON "kol_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_applications_campaign_id_kol_profile_id_key" ON "campaign_applications"("campaign_id", "kol_profile_id");

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_plans" ADD CONSTRAINT "marketing_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_plans" ADD CONSTRAINT "marketing_plans_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_plans" ADD CONSTRAINT "marketing_plans_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_profiles" ADD CONSTRAINT "kol_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_profiles" ADD CONSTRAINT "kol_profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_platform_accounts" ADD CONSTRAINT "kol_platform_accounts_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kol_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_service_packages" ADD CONSTRAINT "kol_service_packages_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kol_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_availability_slots" ADD CONSTRAINT "kol_availability_slots_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kol_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_bookings" ADD CONSTRAINT "kol_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_bookings" ADD CONSTRAINT "kol_bookings_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kol_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_bookings" ADD CONSTRAINT "kol_bookings_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "kol_service_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_bookings" ADD CONSTRAINT "kol_bookings_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_reviews" ADD CONSTRAINT "booking_reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "kol_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_reviews" ADD CONSTRAINT "booking_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_reviews" ADD CONSTRAINT "booking_reviews_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kol_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_platforms" ADD CONSTRAINT "social_platforms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_platforms" ADD CONSTRAINT "social_platforms_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_kol_profile_id_fkey" FOREIGN KEY ("kol_profile_id") REFERENCES "kol_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_media" ADD CONSTRAINT "kol_media_kol_profile_id_fkey" FOREIGN KEY ("kol_profile_id") REFERENCES "kol_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_reviews" ADD CONSTRAINT "kol_reviews_kol_profile_id_fkey" FOREIGN KEY ("kol_profile_id") REFERENCES "kol_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_reviews" ADD CONSTRAINT "kol_reviews_sme_id_fkey" FOREIGN KEY ("sme_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_performance" ADD CONSTRAINT "kol_performance_kol_profile_id_fkey" FOREIGN KEY ("kol_profile_id") REFERENCES "kol_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_marketing_plan_id_fkey" FOREIGN KEY ("marketing_plan_id") REFERENCES "marketing_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
