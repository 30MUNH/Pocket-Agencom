# Deployment and Database Recovery Guide

This guide separates a fresh database installation from an existing database upgrade. No migration, seed, archive SQL, or restore command may be run against a configured real database without explicit operator approval.

## Safety gate

Inspect the target without printing credentials and compare it read-only with the checked-in baseline:

```bash
cd backend
TMP_BASELINE_DIR=$(mktemp -d)
cp prisma/migrations/migration_lock.toml "$TMP_BASELINE_DIR/"
cp -r prisma/migrations/20261009010000_baseline "$TMP_BASELINE_DIR/"

npx prisma migrate diff \
  --from-url "$DIRECT_URL" \
  --to-migrations "$TMP_BASELINE_DIR" \
  --shadow-database-url "$PA_TEST_DATABASE_URL" \
  --exit-code

rm -rf "$TMP_BASELINE_DIR"
```

Stop if drift is reported (exit code 2). `PA_TEST_DATABASE_URL` must identify a disposable PostgreSQL database and must never reuse `DATABASE_URL` or the production database.

## Fresh database

After approval, point the migration command at a new empty database. Apply the baseline followed by the archive-and-removal migration using `prisma migrate deploy`. Do not run `migrate resolve`; both migrations must execute normally. Validate Prisma and representative auth, plan, scheduling, analytics, and budget reads afterward.

## Existing database upgrade

1. Complete and verify the backup/restore drill below.
2. Confirm the read-only drift result is empty (exit code 0).
3. Mark only `20261009010000_baseline` as already applied with `npx prisma migrate resolve --applied 20261009010000_baseline`.
4. Obtain separate explicit approval to run `npx prisma migrate deploy`.
5. Verify archive counts, orphan checks, account status, plan counts, and expense sums. The removal migration is transactional and aborts on a mismatch.

The migration creates the restricted `legacy_kol_archive` PostgreSQL schema, archives marketplace tables and selected shared records, deactivates former accounts, preserves original historical plan text, and keeps active financial amounts and relationships unchanged. Access to that schema should be granted only to recovery/audit operators.

## Tested backup and recovery procedure

Run this drill first against an approved source and a new disposable restore database. Store artifacts outside the repository.

```bash
export PA_BACKUP_DIR=/secure/backups/pocket-agencom
export PA_BACKUP_FILE="$PA_BACKUP_DIR/pocket-agencom-$(date +%Y%m%d-%H%M%S).dump"
pg_dump --format=custom --file="$PA_BACKUP_FILE" "$DIRECT_URL"
sha256sum "$PA_BACKUP_FILE"
pg_restore --list "$PA_BACKUP_FILE"

createdb pocket_agencom_restore_test
pg_restore --clean --if-exists --no-owner \
  --dbname=postgresql:///pocket_agencom_restore_test "$PA_BACKUP_FILE"
```

Record the checksum and restore listing. On source and restored databases compare schema objects, counts for users and marketing plans, user-role/status counts, and `SELECT COALESCE(SUM(amount), 0) FROM expenses`. Run `npx prisma validate`, `npx prisma generate`, and representative read-only queries using a temporary URL pointed at the restored database. Drop the disposable database only after recording results. Never restore into the source or production database.

## Application deployment

- Backend: install dependencies, run `npx prisma generate`, then start `node index.js`.
- Frontend: use Node.js 22.12+; set `VITE_API_URL` to the backend origin ending in `/api`, run `npm run build`, and serve `dist` with SPA fallback enabled. `frontend/vercel.json` configures the fallback for Vercel deep links such as `/calendar`. For a same-origin reverse proxy, route `/api` to the backend and `VITE_API_URL` may be omitted.
- Configure `FRONTEND_URL` (the frontend origin, without a path), a persistent `JWT_SECRET`, database URLs, and optional Gemini/Supabase secrets in the deployment platform. Keep the JWT secret unchanged across backend instances and deployments so existing sessions remain valid.
- Do not seed production. The seed requires `ALLOW_DESTRUCTIVE_SEED=true` by design.
