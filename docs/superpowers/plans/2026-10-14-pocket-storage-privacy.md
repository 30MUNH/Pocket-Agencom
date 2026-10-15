# Pocket Agencom Private Storage Implementation Plan

> **For agentic workers:** Execute only after this plan is approved. Use the repository's executing-plans and test-driven-development skills, followed by verification-before-completion.

**Goal:** Store new unpublished assets and avatars in dedicated private Supabase Storage buckets, authorize access through persisted application ownership, preserve current workflows, and migrate verified legacy references without data loss.

**Architecture:** React clients handle MediaAsset IDs and temporary URLs. Express authenticates each request, checks owner/role and active status, then uses the backend-only Supabase service role to upload objects or mint 600-second signed URLs. Prisma stores private bucket/path, marks existing URL-only rows `legacy_unverified`, and uses same-owner composite references for avatars, scheduled posts, and Marketing Plans. Short advisory-lock transactions, lifecycle state, and expiring signing leases coordinate references and deletion without holding database transactions across Storage calls. Legacy URLs remain readable until individually verified and migrated.

**Tech Stack:** React, Vite, Express, Prisma, PostgreSQL, Supabase Storage, Node test runner, existing browser verification scripts.

**Spec:** [Storage Privacy Design](../specs/2026-10-14-storage-privacy-design.md)

## Global Constraints

- Remain on `feat/ui-ux-functional-overhaul`; preserve unrelated working-tree changes and stage only the files named in this plan.
- Do not push, merge, or create a pull request.
- Do not implement code, apply migrations, create buckets, change Storage policies, or perform a cutover until this plan receives final approval. Cloud changes and production data operations require separate explicit approval at the relevant gates below.
- Keep `SUPABASE_SERVICE_ROLE_KEY` backend-only. Never persist or log signed URLs, service credentials, raw private paths, or full user content in audit reports.
- Keep private bucket names `campaign-assets-private` and `avatars-private`; set signed URL expiry to 600 seconds. Never bulk-sign Media Library responses.
- Preserve legacy columns, source objects, and database records during inventory and migration. No physical cleanup is in scope.
- Keep the RAG embedding-provenance issue as a separate follow-up; do not change RAG behavior or reindex knowledge-base rows here.
- Complete local development and mocked verification without Cloud resources. Do not run database integration tests against the configured application database without separate explicit approval. Use only isolated test/staging databases and Supabase projects for approved migration/integration validation.
- If an isolated Supabase project is unavailable, finish Code Ready with mocks and report real Storage verification as **BLOCKED**. Do not claim privacy enforcement or Milestone A activation from mocks alone.

## Review Focus

1. External URL parsing and rejection of every internal Storage URL form (Task 3).
2. Owner, active-user, admin/staff avatar-only access, and cross-user denial (Tasks 4–6).
3. Reference coverage and attachment/deletion races, including legacy JSON/text (Tasks 2 and 7).
4. Backup bytes, checksum/restore validation, migration reconciliation, and no-source-delete guarantee (Task 9).
5. 600-second bearer-link expiry, disabled/deleted asset behavior, shared links, no bulk signing, and safe logging (Tasks 4 and 8).

## Implementation Tasks

### 1. Establish baseline and map all persisted references

**Depends on:** Final approval of this plan.

**Files:**

- Add `backend/scripts/audit-storage-references.js` (read-only report generator).
- Add `backend/test/storage-reference-audit.test.js`.
- Read-only review of `backend/prisma/schema.prisma`, `backend/src/services/mediaService.js`, `backend/src/services/marketingPlanService.js`, `backend/src/services/scheduledPostService.js`, `backend/src/services/authService.js`, and current upload/media controllers.

**Steps:**

1. Write a failing fixture test named `classifies_avatar_post_marketing_plan_and_json_references`; assert the report accounts for `User.avatarUrl`, `ScheduledPost.imageUrl`, `[IMAGE_URL: ...]`, MarketingPlan scalar/text/JSON data and existing relation rows, plus every additional persisted URL/asset-ID field found in the current schema.
2. Write `redacts_url_credentials_signed_tokens_and_user_content`; assert output contains IDs/classifications and never raw URL query tokens, credentials, or full plan text.
3. Implement a read-only audit that classifies verified internal objects, verified external URLs, unresolved/malformed internal URLs, and known missing objects. Every preexisting `MediaAsset.url` row remains `legacy_unverified` until evidence supports reclassification; verified old-bucket objects become `legacy_internal_verified` until copied. URL column presence does not imply an external URL. Require exact bucket/path and persisted owner evidence; a folder prefix alone is insufficient. Produce counts and stable record identifiers for review.
4. Test using fixtures only, then run the script only against an explicitly approved read-only test/staging database. Capture the report outside version control or in an approved protected location.

**Acceptance:** Every persisted reference class has a scanner rule and test. The report performs no writes and does not expose sensitive values.

### 2. Add forward-compatible Prisma reference model

**Depends on:** Task 1 field inventory.

**Files:**

- Modify `backend/prisma/schema.prisma`.
- Generate and review `backend/prisma/migrations/<timestamp>_private_asset_references/migration.sql`.
- Add local schema/migration checks and isolated database constraint tests in `backend/test/storage-schema.test.js`.

**Steps:**

1. Add schema assertions for `MediaAsset.sourceKind` (`legacy_unverified`, `legacy_internal_verified`, `external_url`, `private_storage`), nullable `storageBucket` / `storagePath` / `url`, lifecycle state and deletion operation fields, `User.avatarMediaAssetId`, `ScheduledPost.mediaAssetId`, `MarketingPlanAsset`, and `MediaAssetAccessLease`.
2. Add a database CHECK that verifies source-kind/column combinations. Existing URL-only rows receive `legacy_unverified`; verified old-bucket URLs may be `legacy_internal_verified`; only newly validated external URLs receive `external_url`. Private rows require both bucket/path values; their URL may be null or retain the prior URL as a non-authoritative compatibility value. New private rows use null URL. Preserve existing public Supabase URLs byte-for-byte.
3. Add uniqueness for non-null `(storageBucket, storagePath)` pairs and `(MarketingPlanAsset.marketingPlanId, mediaAssetId)`. Add composite unique keys and restrictive composite foreign keys to enforce same-owner avatar, scheduled-post, and Marketing Plan references.
4. Add lifecycle/deletion metadata and the short-lived signing-lease model. Migration is forward-only and does not infer ownership or URL classification from URL strings or delete data.
5. Write tests for duplicate object identity, duplicate plan/asset association, same-user and foreign-user avatar/post/plan references, valid/invalid source CHECK combinations, and legacy URL preservation. Prisma validation and generated SQL inspection are local; execute database constraint tests only in the approved isolated PostgreSQL stage.

**Acceptance:** Existing records remain readable and URL-only rows start unverified; old URL values survive migration; constraints reject invalid source shapes, duplicate private identities/plan associations, and foreign-owner references.

### 3. Validate manually registered external URLs

**Depends on:** Task 1 inventory; independent of Task 2 implementation.

**Files:**

- Add `backend/src/services/externalMediaUrl.js`.
- Modify `backend/src/services/mediaService.js` and `backend/src/controllers/mediaController.js`.
- Add `backend/test/external-media-url.test.js` and update relevant media API tests.

**Steps:**

1. Write failing tests `accepts_and_normalizes_http_and_https`, `rejects_unsupported_schemes_credentials_and_invalid_encoding`, `rejects_supabase_public_signed_and_authenticated_object_urls`, and `does_not_treat_user_prefix_as_ownership`.
2. Implement validation with the platform `URL` parser; require HTTP/S, a hostname, no credentials/control characters, and safe path encoding. Compare the canonical host with the configured Supabase project host and recognize Storage object URL routes and exact bucket segments after one safe decode. Reject internal URLs for every bucket and URL flavor. Do not fetch remote URLs.
3. Route all new external MediaAsset writes through this validator. Keep legacy rows untouched and preserve user-facing validation errors without reflecting unsafe input.

**Acceptance:** No request can register another user's internal Storage URL as an externally owned asset; validated external URLs remain external and are never signed by this service.

### 4. Build private upload, access, and signing services

**Depends on:** Task 2 schema; Task 3 URL separation.

**Files:**

- Modify `backend/src/services/storageService.js`.
- Add `backend/src/services/mediaAccessService.js`.
- Modify `backend/src/controllers/mediaController.js`, `backend/src/routes/mediaRoutes.js`, `backend/src/routes/uploadRoutes.js`, and `backend/src/middleware/authMiddleware.js` as needed.
- Add `backend/test/storage-service.test.js` and `backend/test/media-access.test.js` (or extend the existing equivalents).

**Required service interfaces:**

- `uploadPrivateObject({ ownerId, file, purpose }) -> { bucket, path, contentType, byteLength }`; choose the bucket and server-generated path from the purpose, never from request fields.
- `createOwnedMediaAsset({ ownerId, object, metadata }) -> MediaAsset`; compensate by removing the just-uploaded object if row persistence fails.
- `getAuthorizedMediaAccess({ requester, assetId, disposition }) -> { url, expiresAt }`; load ownership/role from persisted rows and sign for exactly 600 seconds.
- Media list returns IDs/metadata only; one asset endpoint signs on demand and accepts no caller-supplied bucket/path.
- Add explicit `PRIVATE_STORAGE_MODE=disabled|private`. Default to `disabled`; in that mode new storage writes fail clearly. In `private` mode, use only configured private buckets and fail closed on missing configuration, health failure, or Storage errors. Never fall back to a public bucket. Do not switch modes automatically.

**Steps:**

1. Add local/mock tests for explicit mode transitions, disabled default, private-mode failure without fallback, server-selected private bucket/path, exactly 600-second signing, same not-found response for absent/foreign IDs, disabled-account denial for new signing requests, no bucket/path request overrides, upload compensation, and log redaction for signed URLs/service-role credentials.
2. Implement service-role-only operations for `campaign-assets-private` and `avatars-private`; assert required backend credentials at service initialization without returning them in errors/logs.
3. Implement owner lookup and route authorization before signing. Add avatar-specific role checks only for enumerated existing workflows; do not make the exception general to MediaAsset access.
4. Ensure errors/logging redact signed URLs, object paths, and credentials. Do not store signed URLs in Prisma data. A signed URL may contain its object path; the API never returns bucket/path as separate values and never accepts a client-supplied path as authorization.

**Acceptance:** A user can mint access only for an authorized persisted asset; the service-role key and standalone bucket/path values never reach the browser; list requests cause no signing calls. Mocked tests prove behavior only and do not establish private-bucket enforcement.

### 5. Convert avatar, AI image, and Marketing Plan upload paths

**Depends on:** Tasks 2 and 4.

**Files:**

- Backend: `backend/src/controllers/uploadController.js`, `backend/src/routes/uploadRoutes.js`, `backend/src/services/ai/aiService.js`, `backend/src/services/marketingPlanService.js`, `backend/src/controllers/marketingPlanController.js`, `backend/src/services/authService.js`, `backend/src/controllers/adminController.js`, `backend/src/routes/adminRoutes.js`.
- Frontend: `frontend/src/api/uploadApi.js`, `frontend/src/api/authApi.js`, `frontend/src/api/adminApi.js`, `frontend/src/components/layout/Header.jsx`, `frontend/src/pages/user/UserSettings.jsx`, `frontend/src/pages/admin/ManageUsers.jsx`.
- Tests: add `backend/test/private-avatar.test.js` and `backend/test/private-generation.test.js` or extend relevant existing suites.

**Steps:**

1. Add failing tests that avatar upload persists an owned MediaAsset ID; profile update rejects foreign IDs/raw paths; existing avatar staff views remain limited to authorized screens; AI output and Marketing Plan upload persist IDs and remain resolvable after refresh; failed private persistence does not return a provider/data URL fallback.
2. Convert backend upload and AI/plan generation paths to use Task 4. Persist only asset IDs and metadata, not signed URLs. Keep provider image bytes available for the synchronous vision call where needed.
3. Update avatar consumers to request an authorized temporary URL by asset ID. Retain legacy avatar display behavior while the asset is unclassified.
4. Verify route-level checks use authenticated `req.user.id` and existing role middleware; no client-provided owner ID is trusted.

**Acceptance:** New avatar, generated image, and plan-upload objects use private buckets; existing legacy avatars continue to render pending verification.

### 6. Convert scheduled-post and plan references to MediaAsset IDs

**Depends on:** Tasks 2 and 4; Task 5 may proceed independently after Task 4, but coordinate MarketingPlan changes in this task.

**Files:**

- Backend: `backend/src/services/scheduledPostService.js`, `backend/src/controllers/scheduledPostController.js`, `backend/src/routes/scheduledPostRoutes.js`, new `backend/src/validators/scheduledPost.validator.js`, `backend/src/services/marketingPlanService.js`, `backend/src/controllers/marketingPlanController.js`, `backend/src/routes/marketingPlanRoutes.js`, `backend/src/validators/marketingPlan.validator.js`.
- Frontend: `frontend/src/api/scheduledPostApi.js`, `frontend/src/api/marketingPlanApi.js`, `frontend/src/pages/user/QuickEditor.jsx`, `frontend/src/pages/user/ContentCalendar.jsx`, `frontend/src/pages/user/MarketingResult.jsx`, `frontend/src/pages/user/MyPlans.jsx`, `frontend/src/components/media/SocialImageGeneratorModal.jsx`.
- Tests: add `backend/test/scheduled-media.test.js` and `backend/test/marketing-plan-media.test.js`; extend frontend UI workflow tests.

**Steps:**

1. Add mocked/service tests for owner-only attachment on create/update, rejection of foreign asset IDs, persistence of `mediaAssetId` / `MarketingPlanAsset`, and unchanged read/edit behavior for external legacy URLs and `[IMAGE_URL: ...]` markers. The isolated PostgreSQL suite verifies composite foreign keys reject foreign-owned post and plan attachments.
2. Add scheduled-post request validation for optional `mediaAssetId` and update route validation wiring. Update new post writes to store MediaAsset ID only. Resolve a temporary preview URL when returning an authorized post; never write a signed URL into `imageUrl` or the legacy marker.
3. Update Marketing Plan create/list/update flows to use normalized join rows. Inventory scanner remains responsible for old serialized references; do not bulk-rewrite legacy JSON here.
4. Update frontend submission payloads and ensure editor state stores IDs rather than signed URLs as durable references.

**Acceptance:** New private references are normalized and owner-checked; old external and legacy content remains available during the transition.

### 7. Implement recoverable asset deletion and reference concurrency

**Depends on:** Tasks 2, 5, and 6.

**Files:**

- Add `backend/src/services/mediaAssetReferenceService.js`.
- Modify all avatar, scheduled-post, MarketingPlan attach/detach, and MediaAsset delete services/controllers touched in Tasks 4–6.
- Add `backend/test/media-lifecycle.test.js`.

**Steps:**

1. Add local mocked lifecycle tests `attachment_after_deleting_is_rejected`, `sign_lease_after_deleting_is_rejected`, `storage_timeout_keeps_deleting_state`, and `storage_not_found_finalizes_idempotently`.
2. In a short transaction under the shared per-asset advisory lock, verify ownership and `active` state, check restrictive avatar/post/plan references and all legacy text/JSON references, then set `deleting` with a stable operation ID/time. If any reference exists, refuse and do not call Storage. Repeated requests for a deleting asset reuse the same operation ID.
3. Commit before all Supabase calls. A worker waits for preexisting signing leases to complete or expire; each signing timeout is shorter than its lease lifetime. It then removes the persisted bucket/path outside PostgreSQL and finalizes row deletion in a separate short transaction guarded by the operation ID and restrictive foreign keys.
4. On timeout/ambiguous failure, retain the `deleting` row and operation ID, record a redacted error/attempt count, and retry with backoff. `not found` is idempotent success. A recovery worker resumes abandoned operations after process crashes, including the case where Storage removal succeeded but DB finalization did not. Do not reactivate after ambiguous removal; recovery to `active` requires restoring and checksum-verifying the object from backup, then rechecking references.
5. Require every normalized reference writer and signing path to use the same state/lease protocol. Legacy fields that could add internal URLs must reject new internal URL writes. Never physically delete `legacy_unverified` or `legacy_internal_verified` assets in this flow; deleting an unreferenced external URL row requires no Storage call.
6. Add approved-isolated-PostgreSQL race and constraint tests: `attachment_wins_or_delete_wins_without_dangling_reference`, `referenced_asset_delete_is_rejected`, `legacy_marker_blocks_cleanup`, `expired_sign_lease_is_recovered`, and crash/timeout/not-found cases. Do not run them against the configured application database without separate approval.

**Acceptance:** Database transactions never span Storage network calls. Every deletion is a recoverable `active → deleting → row removed` operation; no referenced object is removed; retries are idempotent and crashes leave enough state to resume safely.

### 8. Add demand-driven frontend preview and refresh behavior

**Depends on:** Tasks 4–6.

**Files:**

- Modify `frontend/src/api/mediaApi.js`, `frontend/src/api/uploadApi.js`, `frontend/src/api/authApi.js`, `frontend/src/api/scheduledPostApi.js`, `frontend/src/api/marketingPlanApi.js`.
- Add `frontend/src/hooks/useAuthorizedMediaUrl.js` and `frontend/src/components/media/AuthorizedMediaImage.jsx`.
- Modify `frontend/src/pages/user/MediaLibrary.jsx`, `frontend/src/components/media/SocialImageGeneratorModal.jsx`, `frontend/src/pages/user/QuickEditor.jsx`, `frontend/src/pages/user/ContentCalendar.jsx`, `frontend/src/pages/user/MarketingResult.jsx`, `frontend/src/components/layout/Header.jsx`, and `frontend/src/pages/admin/ManageUsers.jsx`.
- Modify `frontend/src/pages/user/UserSettings.jsx` and `frontend/src/api/adminApi.js`; add `GET /api/admin/users/:id/avatar-access` in `backend/src/routes/adminRoutes.js` and `backend/src/controllers/adminController.js`.
- Add frontend coverage in `frontend/test/private-media-access.test.js` and backend avatar-role/ownership tests.

**Steps:**

1. Add coverage that Media Library does not request URLs for off-screen assets, that visible asset access is fetched on demand, expired images refresh with a bounded retry, downloads use the authorized endpoint, and copied URLs are labeled temporary.
2. Implement per-item access requests through IntersectionObserver and one bounded image retry. Keep signed URLs in transient component memory only; generation and attachment responses/payloads retain MediaAsset IDs, not URLs.
3. Cover missing/deleted assets, disabled requesters, and signing failures with an unavailable preview state; avoid infinite retry loops. Admin/Staff access must resolve through the target user's avatar FK and must not expose an arbitrary cross-user asset endpoint.
4. Run a browser workflow against mocked Storage if the repository has an isolated browser harness; do not use the real-DB browser E2E harness in Code Ready.

**Acceptance:** Large library responses do not trigger bulk signing; all supported screens use authorized IDs and temporary URLs.

### 9. Prepare byte backup, copy tooling, and Cloud change package

**Depends on:** Tasks 1–8; implement and test with fixtures/fake Storage before Cloud resources exist.

**Files:**

- Add `backend/src/services/storageBackup.js` for checksum manifests, AES-GCM encryption, verification, and resumable asset copy.
- Add `backend/scripts/backup-storage-metadata.js`, `backend/scripts/backup-storage-objects.js`, and `backend/scripts/verify-storage-backup.js`.
- Add `backend/scripts/migrate-legacy-storage.js` in dry-run-by-default mode.
- Add `docs/superpowers/plans/storage-privacy-cloud-change-set.md` with exact Dashboard bucket settings, policy inventory/removal checklist, and verification commands. Do not edit or execute the pre-existing untracked `backend/scripts/restrict-storage-policies.sql`.
- Add `backend/test/storage-migration.test.js` using local fixtures/fake Storage.

**Steps:**

1. Test manifest generation, AES-256-GCM byte round-trip, checksum mismatch detection, matching-destination resume, dry-run default, and refusal to delete source objects or legacy rows.
2. Implement protected metadata backup plus encrypted external object-byte backup. The object manifest includes source bucket/path, byte length, content type, SHA-256, opaque backup key, and timestamp, but excludes credentials and signed URLs. Verify by decrypting/recomputing checksums and support a separately gated isolated-bucket restore/readback.
3. Implement verified copy of exact bucket/path only after an approved owner inventory. Under the shared advisory lock, update only the matching active MediaAsset row and retain its old URL field and source object. Do not rewrite arbitrary direct URL references automatically; unresolved User, ScheduledPost, MarketingPlan, Template, or newly discovered references remain explicit reconciliation blockers for Milestone B.
4. Document exact Cloud work: `campaign-assets-private` at 4 MB and `avatars-private` at 2 MB, both restricted to JPEG/PNG/WebP, no anonymous/authenticated object policies, and backend service-role access. Inspect/remove broad legacy public SELECT only with Milestone B approval. Cloud package is descriptive and unapplied.

**Acceptance:** Byte backup can be restored and independently verified; migration has dry-run, resume, reconciliation, and no-delete guarantees; Cloud changes remain unapplied.

### 10. Complete Code Ready, then verify staging and activate explicitly

**Depends on:** Tasks 1–9.

**Code Ready validation (local only):**

- `npx prisma validate --schema backend/prisma/schema.prisma` and inspect migration SQL without applying it.
- `npm test --prefix backend` and `npm test --prefix frontend` for local/unit/mock suites only; exclude or retain the existing guard on real-DB suites. Do not point test configuration at the configured application database.
- `npm run check --prefix backend`, `npm run lint --prefix frontend`, `npm run build --prefix frontend`, and `npm run check:domain-removal`.
- Run browser verification against the mocked Storage adapter where supported; report it blocked when no isolated mock browser harness exists.
- Scan frontend outputs/configuration and application logging to confirm the service-role key is not exposed and signed URLs are not persisted or logged.

**State 1 — Code Ready:** Application code, Prisma migration files, local/mock tests, and Cloud change documentation are prepared. No schema is applied and no Cloud resource is required. Local/mocked results do not claim real Storage privacy enforcement.

**State 2 — Staging Verified:** Only after separate approval, apply the reviewed schema migration and create/configure private buckets in an isolated environment. Run PostgreSQL constraint and concurrency tests plus real Supabase tests for anonymous read denial, cross-user denial, authenticated signing, expiry, deletion, and recovery. If no isolated Supabase project is available, report real Storage verification as **BLOCKED** and stop before activation.

**State 3 — Milestone A Activated:** After staging evidence is reviewed and activation is separately approved, set `PRIVATE_STORAGE_MODE=private` in the approved environment. Verify new uploads actually land in private buckets and authenticated preview/download/refresh and ownership controls work against those buckets. The mode must fail closed if a bucket is missing or unavailable. Do not claim Milestone A from Code Ready or Staging Verified alone.

**Milestone A acceptance:** Real isolated Storage tests and approved activation prove new assets use private buckets; authenticated access works; anonymous and cross-user access is rejected; disabled users cannot mint new links; 600-second bearer URL lifecycle and recoverable deletion tests pass. Existing public buckets may still be anonymously readable, so legacy privacy cutover remains incomplete.

**Milestone B acceptance:** Separately review the full reference inventory and encrypted byte-backup/restore evidence; migrate only verified objects and reconcile all references; preserve originals and rows; pass application and isolated Storage tests; obtain explicit Cloud cutover approval; then make old buckets private/remove broad public reads and verify anonymous reads fail after cache behavior is accounted for while authorized application access succeeds. Do not claim full privacy before that verification is recorded.

## Approval Boundaries and Rollback

| Action | Approval boundary |
| --- | --- |
| Editing implementation and running local/unit tests | This plan's final approval |
| Applying Prisma migration to any database, including isolated test/staging | Separate explicit approval before applying; production schema changes also require a separate production migration approval |
| Creating private buckets or changing any Supabase Cloud settings | Separate explicit approval before Cloud action |
| Switching `PRIVATE_STORAGE_MODE` to `private` in an approved environment | Separate explicit activation approval after Staging Verified evidence is reviewed |
| Reading production inventory or copying production object bytes | Separate explicit approval specifying read/copy scope and protected backup destination |
| Updating production references or changing old bucket visibility/policies | Separate explicit Milestone B cutover approval after evidence review |
| Deleting source objects, legacy fields, or rows | Out of scope; requires a new reviewed plan and separate approval |
| RAG embedding inventory/reindexing | Separate follow-up plan and approval |

Before Milestone B, rollback by pausing new uploads or deploying a compatible release while leaving private buckets private. Do not roll back by exposing private buckets publicly. After the legacy cutover, roll back only to a version that reads the new schema and uses authorized signing; keep original bytes and legacy fields as recovery sources. If a reference update is incomplete, restore from the manifest/backup into a private bucket, repair the reference, and reconcile before resuming. Never delete source data during rollback.

## Plan Self-Review

- Covers every reference group and ownership requirement in the design, including avatars, ScheduledPost columns/markers, MarketingPlan text/JSON, and additional schema fields.
- Covers URL canonicalization, Supabase origin/bucket detection, active-user checks, roles, ID-only signing, and no bulk signing.
- Separates private upload readiness from the later legacy privacy cutover, with explicit evidence and approval gates.
- Covers object bytes, checksum validation, isolated restore, idempotent copy, source preservation, and rollback without public buckets.
- Leaves DB/Cloud mutation, cutover, and RAG work outside Code Ready.
