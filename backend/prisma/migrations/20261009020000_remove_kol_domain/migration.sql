CREATE SCHEMA "legacy_kol_archive";
REVOKE ALL ON SCHEMA "legacy_kol_archive" FROM PUBLIC;

CREATE TABLE "legacy_kol_archive"."migration_audit" (
    "source_table" TEXT PRIMARY KEY,
    "source_count" BIGINT NOT NULL,
    "archive_count" BIGINT,
    "checked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "legacy_kol_archive"."migration_audit" ("source_table", "source_count")
VALUES
    ('kol_profiles', (SELECT COUNT(*) FROM "public"."kol_profiles")),
    ('kol_platform_accounts', (SELECT COUNT(*) FROM "public"."kol_platform_accounts")),
    ('kol_service_packages', (SELECT COUNT(*) FROM "public"."kol_service_packages")),
    ('kol_availability_slots', (SELECT COUNT(*) FROM "public"."kol_availability_slots")),
    ('kol_bookings', (SELECT COUNT(*) FROM "public"."kol_bookings")),
    ('booking_reviews', (SELECT COUNT(*) FROM "public"."booking_reviews")),
    ('campaign_applications', (SELECT COUNT(*) FROM "public"."campaign_applications")),
    ('kol_media', (SELECT COUNT(*) FROM "public"."kol_media")),
    ('kol_reviews', (SELECT COUNT(*) FROM "public"."kol_reviews")),
    ('kol_performance', (SELECT COUNT(*) FROM "public"."kol_performance"));

CREATE TABLE "legacy_kol_archive"."former_accounts" AS
SELECT
    "id",
    "name",
    "email",
    "phone",
    "avatar_url",
    "role"::TEXT AS "original_role",
    "status"::TEXT AS "original_status",
    "created_at",
    "updated_at",
    CURRENT_TIMESTAMP AS "archived_at"
FROM "public"."users"
WHERE "role" = 'kol';

ALTER TABLE "legacy_kol_archive"."former_accounts"
    ADD CONSTRAINT "former_accounts_pkey" PRIMARY KEY ("id");

CREATE TABLE "legacy_kol_archive"."notifications" AS
SELECT
    n."id", n."user_id", n."title", n."message",
    n."type"::TEXT AS "type", n."is_read", n."created_at",
    CURRENT_TIMESTAMP AS "archived_at"
FROM "public"."notifications" n
WHERE n."type" = 'booking'
   OR EXISTS (
       SELECT 1 FROM "legacy_kol_archive"."former_accounts" a
       WHERE a."id" = n."user_id"
   );

CREATE TABLE "legacy_kol_archive"."support_tickets" AS
SELECT
    t."id", t."user_id", t."assigned_staff_id", t."subject", t."message",
    t."category"::TEXT AS "category", t."status"::TEXT AS "status",
    t."created_at", t."updated_at", CURRENT_TIMESTAMP AS "archived_at"
FROM "public"."support_tickets" t
WHERE t."category" = 'booking'
   OR EXISTS (
       SELECT 1 FROM "legacy_kol_archive"."former_accounts" a
       WHERE a."id" = t."user_id"
   );

CREATE TABLE "legacy_kol_archive"."expenses" AS
SELECT
    e."id", e."marketing_plan_id", e."expense_type"::TEXT AS "expense_type",
    e."amount", e."note", e."date", e."created_at",
    CURRENT_TIMESTAMP AS "archived_at"
FROM "public"."expenses" e
WHERE e."expense_type" = 'KOL';

DO $$
DECLARE
    expected BIGINT;
    actual BIGINT;
BEGIN
    SELECT COUNT(*) INTO expected FROM "public"."users" WHERE "role" = 'kol';
    SELECT COUNT(*) INTO actual FROM "legacy_kol_archive"."former_accounts";
    IF expected <> actual THEN
        RAISE EXCEPTION 'Former-account archive mismatch: expected %, archived %', expected, actual;
    END IF;

    SELECT COUNT(*) INTO expected
    FROM "public"."notifications" n
    WHERE n."type" = 'booking'
       OR EXISTS (SELECT 1 FROM "legacy_kol_archive"."former_accounts" a WHERE a."id" = n."user_id");
    SELECT COUNT(*) INTO actual FROM "legacy_kol_archive"."notifications";
    IF expected <> actual THEN
        RAISE EXCEPTION 'Notification archive mismatch: expected %, archived %', expected, actual;
    END IF;

    SELECT COUNT(*) INTO expected
    FROM "public"."support_tickets" t
    WHERE t."category" = 'booking'
       OR EXISTS (SELECT 1 FROM "legacy_kol_archive"."former_accounts" a WHERE a."id" = t."user_id");
    SELECT COUNT(*) INTO actual FROM "legacy_kol_archive"."support_tickets";
    IF expected <> actual THEN
        RAISE EXCEPTION 'Ticket archive mismatch: expected %, archived %', expected, actual;
    END IF;

    SELECT COUNT(*) INTO expected FROM "public"."expenses" WHERE "expense_type" = 'KOL';
    SELECT COUNT(*) INTO actual FROM "legacy_kol_archive"."expenses";
    IF expected <> actual THEN
        RAISE EXCEPTION 'Expense archive mismatch: expected %, archived %', expected, actual;
    END IF;
END $$;

DELETE FROM "public"."notifications" n
WHERE n."type" = 'booking'
   OR EXISTS (SELECT 1 FROM "legacy_kol_archive"."former_accounts" a WHERE a."id" = n."user_id");

DELETE FROM "public"."support_tickets" t
WHERE t."category" = 'booking'
   OR EXISTS (SELECT 1 FROM "legacy_kol_archive"."former_accounts" a WHERE a."id" = t."user_id");

UPDATE "public"."expenses" e
SET
    "expense_type" = 'Custom',
    "note" = 'Legacy marketing expense retained for financial history'
WHERE e."expense_type" = 'KOL';

ALTER TABLE "public"."marketing_plans"
    ADD COLUMN "has_legacy_content" BOOLEAN NOT NULL DEFAULT false;

UPDATE "public"."marketing_plans"
SET "has_legacy_content" = true
WHERE "is_looking_for_kol" = true
   OR CONCAT_WS(' ',
        "goal", "campaign_type", "content_ideas", "video_scripts", "checklist",
        "playbook", "budget_breakdown", "deployment_channels", "campaign_reason"
      ) ~* '(kol|koc|influencer|creator marketplace|nhà sáng tạo)';

ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "status" DROP DEFAULT;
CREATE TYPE "public"."UserRole_new" AS ENUM ('user', 'staff', 'admin');
CREATE TYPE "public"."AccountStatus_new" AS ENUM ('active', 'inactive', 'banned', 'archived');
ALTER TABLE "public"."users"
    ALTER COLUMN "role" TYPE "public"."UserRole_new"
        USING (CASE WHEN "role"::TEXT = 'kol' THEN 'user' ELSE "role"::TEXT END)::"public"."UserRole_new",
    ALTER COLUMN "status" TYPE "public"."AccountStatus_new"
        USING (CASE WHEN "role"::TEXT = 'kol' THEN 'archived' ELSE "status"::TEXT END)::"public"."AccountStatus_new";

UPDATE "public"."users"
SET "status" = 'archived'
WHERE "id" IN (SELECT "id" FROM "legacy_kol_archive"."former_accounts");
DROP TYPE "public"."UserRole";
DROP TYPE "public"."AccountStatus";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
ALTER TYPE "public"."AccountStatus_new" RENAME TO "AccountStatus";
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'user';
ALTER TABLE "public"."users" ALTER COLUMN "status" SET DEFAULT 'active';

ALTER TABLE "public"."notifications" ALTER COLUMN "type" DROP DEFAULT;
CREATE TYPE "public"."NotificationType_new" AS ENUM ('system', 'plan', 'support');
ALTER TABLE "public"."notifications"
    ALTER COLUMN "type" TYPE "public"."NotificationType_new"
    USING ("type"::TEXT)::"public"."NotificationType_new";
DROP TYPE "public"."NotificationType";
ALTER TYPE "public"."NotificationType_new" RENAME TO "NotificationType";
ALTER TABLE "public"."notifications" ALTER COLUMN "type" SET DEFAULT 'system';

ALTER TABLE "public"."support_tickets" ALTER COLUMN "category" DROP DEFAULT;
CREATE TYPE "public"."TicketCategory_new" AS ENUM ('account', 'marketing_plan', 'payment', 'technical', 'other');
ALTER TABLE "public"."support_tickets"
    ALTER COLUMN "category" TYPE "public"."TicketCategory_new"
    USING ("category"::TEXT)::"public"."TicketCategory_new";
DROP TYPE "public"."TicketCategory";
ALTER TYPE "public"."TicketCategory_new" RENAME TO "TicketCategory";
ALTER TABLE "public"."support_tickets" ALTER COLUMN "category" SET DEFAULT 'other';

CREATE TYPE "public"."ExpenseType_new" AS ENUM ('Ads', 'Custom');
ALTER TABLE "public"."expenses"
    ALTER COLUMN "expense_type" TYPE "public"."ExpenseType_new"
    USING ("expense_type"::TEXT)::"public"."ExpenseType_new";
DROP TYPE "public"."ExpenseType";
ALTER TYPE "public"."ExpenseType_new" RENAME TO "ExpenseType";

ALTER TABLE "public"."kol_profiles" SET SCHEMA "legacy_kol_archive";
ALTER TABLE "public"."kol_platform_accounts" SET SCHEMA "legacy_kol_archive";
ALTER TABLE "public"."kol_service_packages" SET SCHEMA "legacy_kol_archive";
ALTER TABLE "public"."kol_availability_slots" SET SCHEMA "legacy_kol_archive";
ALTER TABLE "public"."kol_bookings" SET SCHEMA "legacy_kol_archive";
ALTER TABLE "public"."booking_reviews" SET SCHEMA "legacy_kol_archive";
ALTER TABLE "public"."campaign_applications" SET SCHEMA "legacy_kol_archive";
ALTER TABLE "public"."kol_media" SET SCHEMA "legacy_kol_archive";
ALTER TABLE "public"."kol_reviews" SET SCHEMA "legacy_kol_archive";
ALTER TABLE "public"."kol_performance" SET SCHEMA "legacy_kol_archive";

ALTER TYPE "public"."ApplicationStatus" SET SCHEMA "legacy_kol_archive";
ALTER TYPE "public"."MediaType" SET SCHEMA "legacy_kol_archive";
ALTER TYPE "public"."KolType" SET SCHEMA "legacy_kol_archive";
ALTER TYPE "public"."KolStatus" SET SCHEMA "legacy_kol_archive";
ALTER TYPE "public"."ServiceType" SET SCHEMA "legacy_kol_archive";
ALTER TYPE "public"."BookingStatus" SET SCHEMA "legacy_kol_archive";

UPDATE "legacy_kol_archive"."migration_audit" a
SET "archive_count" = CASE a."source_table"
    WHEN 'kol_profiles' THEN (SELECT COUNT(*) FROM "legacy_kol_archive"."kol_profiles")
    WHEN 'kol_platform_accounts' THEN (SELECT COUNT(*) FROM "legacy_kol_archive"."kol_platform_accounts")
    WHEN 'kol_service_packages' THEN (SELECT COUNT(*) FROM "legacy_kol_archive"."kol_service_packages")
    WHEN 'kol_availability_slots' THEN (SELECT COUNT(*) FROM "legacy_kol_archive"."kol_availability_slots")
    WHEN 'kol_bookings' THEN (SELECT COUNT(*) FROM "legacy_kol_archive"."kol_bookings")
    WHEN 'booking_reviews' THEN (SELECT COUNT(*) FROM "legacy_kol_archive"."booking_reviews")
    WHEN 'campaign_applications' THEN (SELECT COUNT(*) FROM "legacy_kol_archive"."campaign_applications")
    WHEN 'kol_media' THEN (SELECT COUNT(*) FROM "legacy_kol_archive"."kol_media")
    WHEN 'kol_reviews' THEN (SELECT COUNT(*) FROM "legacy_kol_archive"."kol_reviews")
    WHEN 'kol_performance' THEN (SELECT COUNT(*) FROM "legacy_kol_archive"."kol_performance")
END;

DO $$
DECLARE
    mismatch_count BIGINT;
    orphan_count BIGINT;
    archived_expense_total NUMERIC;
    active_expense_total NUMERIC;
BEGIN
    SELECT COUNT(*) INTO mismatch_count
    FROM "legacy_kol_archive"."migration_audit"
    WHERE "source_count" <> "archive_count";
    IF mismatch_count <> 0 THEN
        RAISE EXCEPTION 'Marketplace archive count validation failed for % table(s)', mismatch_count;
    END IF;

    SELECT COUNT(*) INTO mismatch_count
    FROM "legacy_kol_archive"."former_accounts" a
    JOIN "public"."users" u ON u."id" = a."id"
    WHERE u."role"::TEXT <> 'user' OR u."status"::TEXT <> 'archived';
    IF mismatch_count <> 0 THEN
        RAISE EXCEPTION 'Former account deactivation validation failed for % account(s)', mismatch_count;
    END IF;

    SELECT COUNT(*) INTO orphan_count FROM (
        SELECT p."id" FROM "legacy_kol_archive"."kol_profiles" p
        LEFT JOIN "public"."users" u ON u."id" = p."user_id"
        WHERE p."user_id" IS NOT NULL AND u."id" IS NULL
        UNION ALL
        SELECT b."id" FROM "legacy_kol_archive"."kol_bookings" b
        LEFT JOIN "public"."users" u ON u."id" = b."user_id"
        WHERE u."id" IS NULL
        UNION ALL
        SELECT a."id" FROM "legacy_kol_archive"."campaign_applications" a
        LEFT JOIN "public"."marketing_plans" p ON p."id" = a."campaign_id"
        WHERE p."id" IS NULL
        UNION ALL
        SELECT r."id" FROM "legacy_kol_archive"."kol_reviews" r
        LEFT JOIN "public"."users" u ON u."id" = r."sme_id"
        WHERE u."id" IS NULL
    ) orphaned;
    IF orphan_count <> 0 THEN
        RAISE EXCEPTION 'Archive referential-integrity validation found % orphan(s)', orphan_count;
    END IF;

    SELECT COALESCE(SUM("amount"), 0) INTO archived_expense_total
    FROM "legacy_kol_archive"."expenses";
    SELECT COALESCE(SUM(e."amount"), 0) INTO active_expense_total
    FROM "public"."expenses" e
    JOIN "legacy_kol_archive"."expenses" a ON a."id" = e."id";
    IF archived_expense_total <> active_expense_total THEN
        RAISE EXCEPTION 'Legacy expense total changed: archived %, active %', archived_expense_total, active_expense_total;
    END IF;

    IF EXISTS (SELECT 1 FROM "public"."notifications" WHERE "user_id" IN (SELECT "id" FROM "legacy_kol_archive"."former_accounts"))
       OR EXISTS (SELECT 1 FROM "public"."support_tickets" WHERE "user_id" IN (SELECT "id" FROM "legacy_kol_archive"."former_accounts")) THEN
        RAISE EXCEPTION 'Former-account active notifications or tickets remain';
    END IF;
END $$;

ALTER TABLE "public"."marketing_plans" DROP COLUMN "is_looking_for_kol";
