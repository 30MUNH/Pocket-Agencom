# Pocket Agencom Storage Privacy Design

**Status:** Design for owner review; no application, database, or Supabase Cloud changes are authorized by this document.

## Goal

Make unpublished marketing assets and user avatars private by default while preserving authorized previews, downloads, editing, scheduled-post attachments, and verified legacy content. Public delivery must require an explicit action and a demonstrated product need.

## Constraints

- Keep `SUPABASE_SERVICE_ROLE_KEY` on the backend only.
- Authorize through the authenticated application user and persisted ownership records, never a caller-supplied user ID, bucket, or object path.
- Use signed URLs with a target lifetime of 10 minutes (within the requested 5–15 minute range); never persist signed URLs as asset references.
- Do not change bucket visibility, Storage policies, or Cloud configuration in this work stage.
- Do not delete files or database records as part of migration. Produce a dry-run report before any data migration.
- Preserve external image URLs and do not treat them as internal Storage objects.
- Keep RAG provenance cleanup separate from storage implementation; do not reindex existing knowledge-base records in this task.

## Current State and Root Cause

`backend/src/services/storageService.js` uploads to `campaign-assets` (or `avatars`) with the service-role client and returns `getPublicUrl()`. User-scoped object prefixes constrain naming but do not constrain reads from a public bucket. The current public URL therefore works for anyone who obtains it.

`MediaAsset` stores `userId`, `url`, and descriptive metadata, but does not store the Storage bucket or object path. `mediaService.uploadMediaAsset` accepts a URL supplied by the caller. The avatar is stored as `User.avatarUrl`; no Storage identity is persisted for that avatar. Scheduled posts store an `imageUrl` and may also embed it in a legacy `[IMAGE_URL: ...]` marker. Marketing Plan image upload persists an object and passes its public URL to image-aware generation. AI image generation writes a Storage URL into its MediaAsset record and returns that URL to the frontend.

The frontend reaches Storage through application APIs; the Media Library renders and copies returned URLs. The current Media Library also supports manually registering arbitrary external URLs. Existing Storage files are not removed when a MediaAsset row is deleted.

The existing untracked `backend/scripts/restrict-storage-policies.sql` only removes upload policies and explicitly leaves public reads. It is not a privacy cutover and will not be edited or executed as part of this design stage.

## Bucket Migration Approaches

| Approach | Benefits | Risks and rollback |
| --- | --- | --- |
| **A. Convert current buckets to private after backfill** | Fewer buckets; current object paths remain stable. | A single visibility cutover affects every existing URL. Unverified legacy references can break. Rolling back visibility to public re-exposes all objects. |
| **B. Add dedicated private buckets, migrate incrementally** | New uploads become private independently; old URLs can remain compatible while records are inventoried; copying and verification can be staged; rollback before cutover does not require reopening public buckets. | Requires temporary dual-bucket support and additional storage. Existing buckets remain publicly readable until a separately approved final cutover. |

**Recommendation: B.** Provision dedicated private buckets for new campaign assets and avatars. Initially, retain read compatibility for legacy objects only when their identity and owning record can be verified. A later, separately approved migration may copy verified objects to private buckets, compare object metadata/checksums, update references, and then make the existing buckets private. Keep original objects and records throughout that migration. Do not create a public bucket for generated images.

Use the names `campaign-assets-private` and `avatars-private` for the dedicated buckets. For those buckets, Storage RLS remains enabled and there are no `anon` or `authenticated` policies granting object reads or writes. The application uses its server-only service-role client after its own authenticated ownership checks; do not add an `auth.uid()` folder policy because Pocket Agencom's application JWT is not a Supabase Auth JWT. At final cutover, set both existing buckets to private and remove any broad anonymous/authenticated `SELECT` policies that would otherwise preserve reads. Do not disable RLS globally.

There is no current social-network publishing pipeline that requires a durable public object URL. The initial private-asset implementation should therefore have no automatic publication path. An explicit publication workflow can be designed separately if a concrete consumer requires durable public URLs; it would use a dedicated published-assets bucket and an explicit user action, never reuse the private bucket or publish drafts by default. The existing “copy URL” interaction should copy a temporary signed URL and label it as temporary.

## Target Data Model

Create a forward-only Prisma migration with nullable compatibility fields:

- `MediaAsset.storageBucket String?` and `MediaAsset.storagePath String?` identify a server-created Storage object. Existing `userId` remains the owner. Application code accepts only configured private bucket names and validates paths produced by the server.
- Make `MediaAsset.url` nullable and reserve it for external URLs. New private Storage rows set `url` to null. Add a database check constraint requiring exactly one source: `(storageBucket, storagePath)` both present with `url` null, or both Storage fields null with an external `url` present; preserve current non-null URLs during migration.
- `User.avatarBucket String?` and `User.avatarPath String?` identify a private avatar. Keep `avatarUrl` for legacy external URLs and for backward-compatible reads until records are classified.
- `ScheduledPost.mediaAssetId Int?` references an owned `MediaAsset` for a private attachment. Keep `imageUrl` for existing external URLs and legacy data. The relation must prevent physical asset deletion while referenced (restrict semantics); service code returns a clear conflict until the attachment is detached.

Do not automatically backfill these fields from URL strings. A read-only dry-run report must classify records as: verified Supabase object with owner-matching `user-<id>` prefix; verified external URL; unresolved/malformed Supabase URL; or missing/deleted object where known. Only the first class is eligible for a later approved copy/backfill. The report must not print signed URLs, credentials, or full user content.

## Authorization and API Behavior

### Media assets

- Authenticated uploads create the Storage object and its `MediaAsset` ownership row server-side; the API no longer relies on a second client call that registers an arbitrary Supabase URL as an owned object.
- `GET /api/media` remains scoped to `req.user.id`. It returns record IDs and short-lived access URLs generated by the backend after the owner-scoped query; it omits service credentials and raw object paths.
- A single-asset access/download endpoint accepts a MediaAsset ID only. It loads the persisted record, returns the same not-found response for missing and foreign-owned IDs, then signs the stored bucket/path. It never accepts a bucket or path from the request.
- MediaAsset creation for externally hosted media accepts only an external URL record. A URL that points at a Pocket Agencom Storage bucket is rejected through this path; Storage-backed records can only be created by the authenticated upload/generation service with bucket/path set server-side.
- The Media Library can re-request an access URL after expiry and retry an image once. Download uses a signed URL with download disposition. Signed URLs are bearer links until expiry; copying one is an explicit temporary sharing action, not publication.
- Arbitrary external URLs remain external references. They are not signed, fetched by the backend, or used to infer Storage ownership.

### Avatars and staff access

- Avatar upload stores a private object identity on the authenticated user's record. The owner can obtain a short-lived avatar URL through an authenticated endpoint.
- Admin/staff exceptions apply only to avatar viewing in existing workflows that require them. They do not grant general access to the target user's MediaAssets. The implementation must enumerate the current avatar consumers and authorize each endpoint using the existing role checks; staff access must be restricted to the workflow that requires it.
- Profile updates cannot accept a raw Storage path or another user's ID as proof of ownership.

### AI images, Marketing Plans, and scheduled posts

- AI generation stores its output in the private campaign bucket, persists a MediaAsset with the generated object's bucket/path and authenticated owner, and returns its MediaAsset ID plus a temporary preview URL. Provider URLs and data URLs must not become durable fallbacks when private persistence is required; generation must fail clearly if secure persistence fails.
- Marketing Plan image uploads use the same owned asset creation path. The image buffer can still be passed directly to Gemini Vision; responses and previews use the MediaAsset ID and temporary URL, not a permanent public Storage URL.
- Quick Editor and Content Calendar submit `mediaAssetId` for private attachments. The backend checks that the asset belongs to the post owner on create and update. Scheduled-post responses resolve temporary URLs from this reference. `imageUrl` and `[IMAGE_URL: ...]` remain readable for verified legacy/external content, but new signed URLs are never embedded in either database field.
- Marketing Plan persistence must be audited for any serialized image URLs. If a plan stores an image reference, new records use MediaAsset IDs; existing JSON is only rewritten by a reviewed migration after dry-run classification.

## Object Lifecycle and Expiration

- Expired preview URLs are refreshed by fetching a new URL for the same authorized record ID. Frontend retry is limited to one reauthorization attempt per image request to avoid loops.
- Asset deletion first verifies ownership and checks scheduled-post and avatar references. Referenced assets cannot be physically removed until detached. For an unreferenced private asset, delete the object before deleting its database row; if Storage deletion fails, retain the row and surface a retryable error. Treat Storage “not found” as idempotent success so a retry can remove a row after a prior partial failure. If the row deletion fails after object deletion, the retained row is a recoverable missing-object record, not an untracked orphan. If a new upload succeeds but row persistence fails, remove that just-created object as compensation.
- Avatar replacement updates the user's reference before cleaning up a prior verified private object; cleanup must not remove a path still referenced by any record. Migration does not remove old public objects.
- Signed URLs are not immediate revocation. Supabase documents that signed URLs remain valid until expiration and that CDN cache lifetime is independent from URL lifetime. Deleting an object is the Storage-level revocation action, with CDN invalidation potentially taking time. If the product later requires immediate per-request revocation, use an authenticated streaming proxy instead of signed URLs.

## Supabase Cloud and SQL Approval Boundary

Prepare, but do not apply, a Cloud change set for a later explicit approval:

1. Create the dedicated private campaign and avatar buckets with the current upload size/content-type restrictions.
2. Keep public/anonymous reads and client writes absent for private buckets. Backend service-role operations remain server-side and bypass Storage RLS; RLS must not be disabled globally.
3. Before final legacy cutover, inspect current policies and bucket visibility. Make `campaign-assets` and `avatars` private only after inventory, copy verification, and application compatibility checks pass. Remove any broad `SELECT` policy that would defeat private reads.
4. If a later approved publication workflow exists, provision a separate public `published-assets` bucket with read-only public delivery and backend-only writes. Do not create it until a real consumer is identified.

Application-layer tests prove owner and role authorization before URL signing. Storage integration tests against an isolated non-production Supabase project prove private bucket behavior: anonymous/public URL reads fail, authorized server signing succeeds, and client-side unauthorized reads/writes fail. Do not use production objects or policies for these tests. Do not execute Cloud SQL or change bucket settings in this phase.

## Dry-Run and Rollout

1. Back up the database and object inventory using the approved non-destructive procedure. Produce a report of MediaAsset URLs, avatar URLs, scheduled-post `imageUrl` values and markers, and serialized Marketing Plan references. Do not alter rows or objects.
2. Apply the reviewed nullable-column Prisma migration in the approved environment. Existing rows remain readable through their legacy fields.
3. Provision the dedicated private buckets after separate Cloud approval; test a throwaway object in the isolated project first.
4. Deploy application code that writes new assets privately, resolves them by persisted ID, and supports both verified legacy and new private records.
5. Copy only dry-run-verified legacy objects to private buckets. Compare object size, content type, and checksum where available; produce a second report before changing database references.
6. Backfill only rows whose owner and object identity were verified. Keep old objects and old fields until the owner separately approves cleanup.
7. Run browser workflows and Storage authorization tests. Make the old buckets private only after unresolved references are reviewed and the owner explicitly approves the cutover.

### Rollback

Before the old-bucket cutover, route new writes back to the previous version only if it can continue to read private objects; otherwise keep the privacy-aware application release deployed and disable writes temporarily. Do not make a private bucket public as an application rollback. After cutover, roll back only to a release that understands the new nullable metadata and signed-URL flow. Original objects and legacy fields provide recovery without deleting data.

## Security and Regression Test Plan

Add backend tests for:

- Owner can list, preview, download, and delete their own MediaAsset; another user gets an indistinguishable not-found response.
- Unauthenticated requests cannot list or resolve private assets.
- Forged IDs, bucket names, object paths, URL hosts, traversal segments, and mismatched user-folder paths cannot grant access or cause signing of another object.
- Admin/staff can view avatars only through authorized avatar workflows; they cannot use the exception to access arbitrary MediaAssets.
- Deleted or missing MediaAsset IDs cannot receive new signed URLs; deletion refuses referenced assets and cleans only the verified unreferenced object.
- Expired signed URL refreshes once through the authenticated endpoint; a signed URL is never persisted in Prisma records or markers.
- Existing scheduled posts with external URLs and legacy markers remain readable/editable; new scheduled attachments use owner-checked MediaAsset IDs.
- AI-generated images and Marketing Plan uploads persist private MediaAssets and remain previewable after page refresh/backend restart.
- Private media download returns expected bytes and disposition only after authorization.
- No frontend build artifact or frontend environment variable contains `SUPABASE_SERVICE_ROLE_KEY`.

Add isolated Storage integration tests for:

- Anonymous access to a private object's conventional public URL is denied.
- Owner-authorized backend signing works; unauthorized owner and unauthenticated endpoint calls do not yield signed URLs.
- Forged object path and cross-user read/write attempts fail at the application and Storage layers.
- A deliberately short test URL expires, and deleted objects cannot be newly signed.

Use the existing safe backend suite and frontend unit suite. Run real PostgreSQL and browser workflows only within the previously approved non-destructive test boundary. Do not run migration or Storage policy changes against production as part of validation.

## Compatibility and Known Limits

- Existing external URLs continue to pass through as external references. They are not guaranteed to remain available if the remote host changes them.
- Existing public Supabase URLs keep working while their existing buckets are public. After a separately approved private cutover, only records with verified ownership/object identity can be signed by the application. Unresolved URLs require manual review and must not be silently converted.
- Previously disclosed public URLs may persist in browser/CDN caches, messages, or third-party systems. The system cannot retroactively retract those copies. Once objects are copied and old buckets are private, new anonymous reads from old bucket paths should be denied, subject to cache invalidation behavior.
- Signed URLs can be shared by anyone who obtains them until expiry and may be served from a CDN cache according to Storage cache settings. They are short-lived access tokens, not revocable per-user sessions.
- No current live database provenance results are available: the previous read-only `knowledge_base` audit could not reach the configured PostgreSQL pooler. The seven records therefore remain unverified until a read-only query can run in the approved environment.

## RAG Consistency Finding (Separate Follow-Up)

`backend/src/services/ragService.js` generates `gemini-embedding-2` embeddings with 768 dimensions and stores those tags for new records. Retrieval currently accepts records whose `embeddingModel` is null, so unknown-provenance vectors can be compared with current-model query vectors. Reindexing updates unknown-tagged records in place without a backup. Treat this as a separate RAG task: first run a read-only inventory of record IDs, metadata tags, vector dimensions, and null vectors; preserve a database/object backup; then propose a reviewed re-embedding migration. Do not reindex in the storage task. Retrieval should include only records explicitly tagged with the query embedding model and matching dimensions.

## Current Supabase Documentation Reviewed

- Supabase describes private buckets as access-controlled for downloads and supports time-limited signed URLs; public buckets bypass read access controls: [Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).
- Signed URL lifetime is set in seconds with `createSignedUrl`: [JavaScript `createSignedUrl`](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl).
- Supabase documents signed URL/CDN cache behavior and cautions that expiry and cache TTL are independent: [Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn).
- The current changelog review found no Storage breaking change relevant to the proposed bucket migration.
