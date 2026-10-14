# Pocket Agencom Private Storage — Code Ready Evidence

**Verdict: CODE READY**  
**Branch:** `feat/ui-ux-functional-overhaul`  
**Baseline design:** `a7fedef`  
**Implementation plan:** `docs/superpowers/plans/2026-10-14-pocket-storage-privacy.md`

## Prepared

- Redacted read-only reference inventory tooling for users, scheduled posts and markers, Marketing Plan fields/JSON/relations, MediaAssets, and Template URL fields.
- Forward-only Prisma schema/migration with source classification, lifecycle metadata, ownership relations, deletion fields, signing leases, uniqueness, same-owner foreign keys, and non-null private bucket/path checks. Migration SQL is prepared and was not applied.
- Canonical HTTP/HTTPS URL validation; new internal assets use owner-checked MediaAsset IDs.
- Private upload/signing services, private avatar and generated-image persistence, scheduled-post and Marketing Plan ID references, and recoverable deletion with shared advisory locks.
- Demand-driven frontend signing from visible assets, refresh before expiry, one image retry, explicit unavailable state, temporary 10-minute link copy/download, and an avatar-only Admin/Staff route.
- Encrypted object-byte backup, metadata snapshot, checksum verification, isolated restore tooling, and dry-run-by-default legacy MediaAsset copy tooling. Source objects and legacy rows are retained.
- Supabase Cloud change package at `docs/superpowers/plans/storage-privacy-cloud-change-set.md`.
- RAG embedding provenance remains a separate follow-up.

The legacy copier changes only an exact, owner-matched `MediaAsset` row under the asset advisory lock. It does not rewrite arbitrary direct URL references. Any unresolved `User.avatarUrl`, `ScheduledPost.imageUrl` or marker, Marketing Plan serialized URL, Template URL, or newly discovered reference remains a Milestone B blocker until a reviewed mapping updates it.

## Local Verification

- Backend safe unit and mocked API suite: **101/101 passed** after closing the review finding for pretty-printed Marketing Plan JSON references. The launcher strips Cloud credentials and targets a blocked local database URL.
- Frontend test suite: **18/18 passed**.
- Mocked browser workflow: **26/26 passed**, including on-demand access for 8 of 32 mock Media Library assets, owner avatar ID access, responsive page checks, and intercepted API calls. No backend/database was started. Screenshots/results were written under `/tmp`.
- Backend syntax check: passed, including the new backup/migration scripts.
- Prisma schema validation and client generation: passed. Migration SQL was inspected, not applied.
- Retired-domain scanner: passed across 124 files.
- Frontend lint: passed with existing project warnings and no errors.
- Frontend production build: passed. The environment runs Node 20.18.0 while Vite declares support from Node 20.19+/22.12+ and emitted that version warning.
- Secret scan found no service-role key or signed-URL API references in frontend source/build output. Backend signed URLs are returned transiently from authorized access methods; no signed URL logging or persistence was found.
- Independent code review found and closed a medium deletion-integrity issue: candidate Marketing Plan rows are now selected by serialized asset-reference keys regardless of JSON whitespace, then parsed and checked for the exact asset ID. The regression test covers pretty-printed JSON with arbitrary key spacing.

## Not Verified Against Real Services

- No database inventory, migration, PostgreSQL constraint/concurrency test, Storage byte backup, object copy, or reference rewrite was executed.
- No Supabase Cloud bucket, visibility, policy, or environment change was made.
- Real PostgreSQL and real Supabase Storage behavior is **BLOCKED** until a separately approved isolated staging project and database are provided. Mock results do not establish anonymous-read denial, cross-user enforcement, expiry, CDN behavior, or restore correctness in Supabase.
- Existing legacy public objects remain anonymously accessible until the separately approved Milestone B policy cutover. Full legacy privacy is not complete.

## Required Approval Boundaries

1. Approve and apply the reviewed Prisma migration to an isolated staging database; run the database constraint and concurrency tests there.
2. Approve creation/configuration of the two private buckets in isolated staging; run real Storage anonymous, owner, cross-user, disabled-user, expiry, deletion, and restore checks.
3. Review staging evidence and separately approve `PRIVATE_STORAGE_MODE=private` activation for Milestone A.
4. For Milestone B, separately approve protected production inventory access and backup destination, exact object-byte copy and reference updates, and the legacy-bucket visibility/policy cutover. Preserve source bytes and legacy records throughout; do not use public-bucket exposure as rollback.

No Staging Verified, Milestone A Activated, or Milestone B completion is claimed here.

## Local Commits

- `e4f761f` — redacted storage reference inventory
- `b037371` — private asset reference schema and migration
- `44ab0d5` — external media URL validation
- `1e9d564` — private upload and access services
- `c198645` — private avatars and generated images
- `68861ce` — owner-ID attachments
- `3193b3a` — recoverable asset deletion
- `785582c` — require private asset bucket identity
- `bdfdb63` — demand-driven authorized media access
- `e1a7f06` — encrypted backup and legacy copy tooling
- `a0de7b9` — unavailable private preview state
- `0edecbd` — approved backup destinations and project URL gates

All commits are local; none were pushed, merged, or opened as a pull request.
