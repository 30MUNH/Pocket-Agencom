# Pocket Agencom Real E2E Verification

**Date:** 2026-10-14
**Branch:** `feat/ui-ux-functional-overhaul`
**Verdict:** **NOT RELEASE READY — LEGACY PRIVACY CUTOVER AND FULL AI/FEATURE COVERAGE REMAIN INCOMPLETE**

The reviewed private-storage migration and Milestone A private-upload path are exercised against the configured Pocket Agencom project. This report does not claim full application E2E verification or full privacy completion. Existing public legacy buckets remain public and unchanged.

## Target, backups, migration, and inventory

- Backend Supabase URL and database URLs resolve to project `jypgdzzwmzqkcsaqaerj`, database `postgres`, schema `public`, PostgreSQL `17.0.6`. No other project was accessed.
- Full PostgreSQL custom-format backup: `/home/tts/.local/share/pocket-agencom/backups/pocket-agencom-pre-e2e-2026-10-14T03-58-21-192Z.dump`, mode `0600`; `pg_restore --list` succeeded with 66 table-data entries. A fresh public-schema backup matching the migration scope is `/home/tts/.local/share/pocket-agencom/backups/pocket-agencom-public-pre-migration-2026-10-14T04-25-15-403Z.dump`, mode `0600`, SHA-256 `e0565b442a0b84a8480daaa82d9db54ed09c2dae17135ce459723bfb351f42e4`; its archive listing verified.
- The migration checksum was verified against committed source: `e65e27c90ec99e9d579cea77466df3e1e018f0ab91b3ace700ec99827480d903`. `20261014090000_private_asset_references` was the only pending migration and was applied with Prisma. Existing application-table row counts were unchanged; migration history increased by one. `marketing_plan_assets` and `media_asset_access_leases` are empty after cleanup.
- Post-migration baseline: 15 public tables, 1,486 total rows. The final reconciliation matched every table count exactly, including migration history; both reference/lease tables remain empty. Baseline details are in `/home/tts/.local/share/pocket-agencom/backups/pocket-agencom-post-migration-baseline-1791952091762.json` (mode `0600`).
- Migration rollback boundary: do not drop the additive schema or restore over the source database. If private writes must stop, set local `PRIVATE_STORAGE_MODE=disabled` and roll back application code; retain the additive migration and empty tables until a separately reviewed rollback exists. No rollback was needed or executed.

## Supabase Storage configuration and recovery

- Created exactly two private buckets: `campaign-assets-private` (4 MiB; JPEG, PNG, WebP) and `avatars-private` (2 MiB; JPEG, PNG, WebP). `PRIVATE_STORAGE_MODE=private` is set in ignored `backend/.env`, mode `0600`.
- Bucket metadata and effective Storage policies were inspected. RLS is enabled; neither new bucket has anon/authenticated object policies. Anonymous public-object and direct-object requests were denied in real tests. No broad bucket-independent read policy was found. Existing `avatars`, `campaign-assets`, and `media-assets` buckets/policies were not changed; the old buckets remain public.
- An actual synthetic 68-byte PNG was encrypted to a backup outside Git, decrypted and SHA-256/MIME checked, restored to a distinct exact path in the same private bucket, independently read back and verified, then both test paths were removed. SHA-256: `539d543da0a84c290716c8be3cda13e22cd4d5d963ba30031bab1fe19b4fc782`. Encrypted object, manifest, and ephemeral key files are mode `0600` in `/home/tts/.local/share/pocket-agencom/backups/storage-backup-e2e-1791953792975-62cab9` (directory mode `0700`). No source/legacy object was touched.
- Private-bucket rollback does not require making a bucket public. Disable private writes in local configuration, retain the private buckets and object bytes, and use the verified private backup/recovery flow. No object or legacy record is deleted by rollback.

## Real browser, API, database, and Storage results

| Feature | UI route / API and data | Evidence and verdict |
|---|---|---|
| Authentication and protected shell | `/login`, `/register`, `/dashboard`; `/api/auth/register`, `/login`, `/me`; `User`, `BusinessProfile` | **REAL E2E PASS** for synthetic registration, browser login, session persistence, protected page use and backend-restart session check in the browser suite. Logout and password change were not exercised. |
| Business profile and settings | `/business-profile`, `/settings`; profile update APIs; `BusinessProfile`, `User` | **REAL E2E PASS** for browser profile update and database persistence. Avatar upload/access is not yet verified in a live browser workflow. |
| Marketing Plan | `/marketing-kit`, `/marketing-kit/result`, `/plans`; generate/save/list/retrieve/review APIs; `MarketingPlan`, `BusinessProfile`, `Notification`, `AiQuotaUsage` | **REAL E2E PASS** for one actual OpenRouter `openrouter/free` generation, persisted plan, Markdown export, save, retrieval after backend restart, staff review and admin workflow in the browser run. A later additional revision/post-generation run timed out at the provider request deadline before its first result; its exact synthetic account was cleaned and row counts reconciled. Revision is not accepted as pass. |
| Templates and Quick Editor | `/templates`, `/user/quick-editor`; template and generated-post APIs | **REAL E2E PASS** for template selection, editor navigation and draft save. **BLOCKED — EXTERNAL DEPENDENCY** for a real AI-generated Quick Editor post: its additional OpenRouter free-route API attempt was part of the timed-out provider run. |
| Calendar and attachments | `/calendar`; `/api/scheduled-posts` GET/POST/PATCH/status/DELETE; `ScheduledPost`, `MediaAsset` | **REAL E2E PASS** for browser create/edit/delete and DB persistence. Separate private-storage scenario created an owned attachment through the real API, verified its DB reference, confirmed deletion returned 409 while referenced, deleted the post, then deleted the unreferenced object. A simultaneous attach/delete test left no dangling reference. Legacy external image markers were exercised in local regression tests, not a separate live legacy-record workflow. |
| Media Library/private assets | `/media-library`; `/api/upload/single`, `/api/media/:id/access`, `/api/media/:id`; `MediaAsset`, `MediaAssetAccessLease`, `storage.objects` | **REAL E2E PASS** for real browser file-input upload, exact byte comparison between upload and service-role read, `url=null` private metadata, 600-second preview and download signing, refresh signing, anonymous denial, forged/missing ID rejection, cross-user denial, disabled-user denial of new URLs, expiry rejection, referenced-delete block, asset/object deletion, and attach/delete concurrency. After deletion, new signing returned 404; a previously issued link remained usable during its lifetime, as expected for bearer signed URLs. No service-role key or signed URL was stored in app records or emitted by the test log. |
| PostgreSQL ownership/schema constraints | `ScheduledPost`, `MediaAsset`, `MarketingPlanAsset`, `MediaAssetAccessLease`, `User` | **REAL API/DB PASS**: real Postgres rejected invalid private-bucket source shape and cross-owner scheduled-post, avatar, signed-access-lease, and Marketing Plan asset references. Controlled constraint rows were not persisted. |
| Storage object backup and restore | Private bucket Storage API | **REAL API/Storage PASS** for synthetic actual bytes, encrypted backup, integrity verification, restore/readback and exact path cleanup. |
| Support, staff/admin, profile mutations | `/help`, `/staff/plan-review/:id`, `/admin/users`; support/admin APIs; `SupportTicket`, `User`, `Notification`, `MarketingPlan` | **REAL E2E PASS** for browser ticket submission, staff plan review, admin role/status update and forbidden user-to-admin mutation. |
| Social profiles and scraping/analytics | social and analytics route families; `SocialPlatform`, business analytics | **NOT VERIFIED** against live external services. No scrape provider call or live social-profile analysis was made. |
| Budget/expenses, notifications, password/logout | dashboard/budget/settings routes; `Expense`, `Notification`, `User` | **NOT VERIFIED** end to end. Frontend/API contract tests are not live persistence evidence. |
| Avatar asset workflow | `/settings`, admin avatar access; `User.avatarMediaAssetId`, private avatar bucket | **NOT VERIFIED** against actual avatar bytes. A schema mismatch in the admin avatar access guard was fixed and has regression coverage; the browser avatar upload/access workflow remains outstanding. |
| AI image, image-aware generation, Gemini Vision | image-generation routes; private Storage and provider APIs | **BLOCKED — BILLING/EXTERNAL DEPENDENCY**. Cloudflare free account eligibility could not be confirmed, so no Cloudflare image inference was invoked. No Gemini Vision request was made. |
| RAG and embeddings | knowledge-base/vector retrieval | **SEPARATE FOLLOW-UP**. No embedding or retrieval run was performed. Existing seven knowledge records were preserved; no reindex occurred. The embedding-provenance and RAG ownership questions remain separate work. |
| Legacy Storage privacy | existing public buckets and persisted legacy references | **NOT COMPLETE**. No inventory-based legacy byte migration, reference rewrite, or old-bucket privacy change was done. Existing legacy assets are preserved; old public assets may still be anonymously accessible. Milestone B needs its separate approval after inventory and reconciliation. |

Browser evidence from the broader real DB suite, including screenshots and exported Markdown, is at `/tmp/pocket-agencom-db-backups/browser-1791952506973`. The private Storage browser run and its PostgreSQL race/constraint checks were run under unique `pa-private-e2e-*` identifiers; all associated users, posts, assets, and exact private object paths were cleaned. Final public row counts equal baseline, and both new private bucket inventories contain zero test objects.

## AI provider and billing results

- One real in-app Marketing Plan structured-generation request succeeded using `openrouter/free`; generated output passed structure/relevance checks and was persisted and retrieved after backend restart.
- An additional three-workflow attempt (plan generation, revision, Quick Editor post) timed out at the configured 120-second external request deadline on its first AI generation. Cleanup and final row-count checks passed. Revision and Quick Editor AI generation are therefore **BLOCKED — EXTERNAL DEPENDENCY**, not pass.
- Groq, Gemini, and Cloudflare account free eligibility remains unverified; no inference was sent through those providers. Cloudflare image generation and Gemini Vision are not verified. No paid inference was authorized or attempted.
- A confirmed safety defect in `FREE_ONLY_MODE` was corrected: Groq/Gemini/Cloudflare now require explicit account-level free-tier confirmation and exact model allowlisting; Cloudflare no longer accepts any `@cf/` prefix. OpenRouter's explicit free route remains allowed.
- The E2E report logs only provider route names and outcomes, never API keys, signed URLs or generated user content.

## Defects fixed

- Media asset access controller called a method on the service module rather than an instantiated service. Fixed initialization and added a controller regression test.
- Several advisory-lock SQL calls selected PostgreSQL `void` into Prisma `$queryRaw`, which failed during real signing. All asset-lock result expressions now cast to `text`; signing, attachment, deletion and concurrency passed against real PostgreSQL afterward.
- Admin avatar access checked a nonexistent Prisma `MediaAsset.purpose` property. Removed the impossible condition; authorization still requires the target user's linked asset, owner, active state, private source and exact avatar bucket/path. Regression tests pass; live avatar workflow remains to verify.
- `FREE_ONLY_MODE` treated unverified provider accounts/model prefixes as free. Added explicit provider free-tier confirmations and regression tests.

## Tests and reproducibility

- Backend safe suite: `npm test` — **103 passed, 0 failed**. It removes database/provider secrets, blocks DB access and uses mock-backed cases. Loopback access was required for its local HTTP integration tests.
- Frontend suite: `npm test` — **18 passed, 0 failed**. These are local frontend contract tests, not real-service evidence.
- Real browser app suite: actual frontend and Express app, real login/session and Pocket Agencom PostgreSQL; no application API interception. Covered registration/login, profile, one real AI plan, save/export/restart persistence, template/Quick Editor draft, calendar, external Media Library registration, support, staff review and admin permission changes.
- Real private Storage run: real browser upload, Storage bytes, Postgres ownership/constraint checks, signed URL access/expiry, disabled/cross-user denial, deletion and concurrent attachment/deletion; actual object backup/restore was separately checked.
- Final cleanup reconciliation: all 15 public table counts exactly match the saved post-migration baseline (1,486 rows total); new relation/lease tables have zero rows; both private buckets have zero root objects.
- Vite build succeeded. It reported Node `20.18.0` below the configured minimum `20.19` and a large chunk warning; these did not block the build or tested browser run.

## Approval boundaries and remaining release gates

1. **Milestone A — Private Uploads Ready:** the core tested upload, signed access, ownership, private visibility, deletion and race behavior passed. Explicit post-expiration UI refresh, actual avatar browser workflow, and full feature coverage remain open before claiming complete Milestone A acceptance.
2. **Milestone B — Legacy Privacy Cutover:** not started. Inventory and byte backups for legacy source objects, verified reference rewrite, reconciliation and old-bucket policy changes require their separate approval. Do not claim full privacy while old public buckets remain public.
3. Do not enable account-dependent Groq/Gemini/Cloudflare inference until their free billing eligibility is verified. Keep them disabled; OpenRouter's free route may be used within its published limits.
4. Complete remaining live social/scraping, analytics, budget, notifications, password/logout, avatar, Quick Editor AI, plan revision, AI image and RAG workflows before a full release-readiness verdict.
5. Preserve the RAG embedding-provenance issue as a separate follow-up; do not reindex the existing seven rows in this task.

## Git state

Stayed on `feat/ui-ux-functional-overhaul`. No Cloud policy changes, legacy object changes, deployment, push, merge or PR occurred. The local runtime `.env` is ignored and mode `0600`. Unrelated dirty files were preserved.

Local commits:

- `34bf6c8` — `fix(storage): repair private media access and locking`
- `60e1588` — `fix(ai): gate free-only providers by account eligibility`
