# Pocket Agencom Storage Privacy Design

**Status:** Design for owner review; no application, database, or Supabase Cloud changes are authorized by this document.

## Goal

Make unpublished marketing assets and user avatars private by default while preserving authorized previews, downloads, editing, scheduled-post attachments, and verified legacy content. Public delivery must require an explicit action and a demonstrated product need.

## Constraints

- Keep `SUPABASE_SERVICE_ROLE_KEY` on the backend only.
- Authorize through the authenticated application user and persisted ownership records, never a caller-supplied user ID, bucket, or object path.
- Use signed URLs with a target lifetime of 10 minutes (within the requested 5–15 minute range); never persist signed URLs as asset references.
- Treat signed URLs as bearer links: previously issued URLs remain usable until expiry even if the user is disabled or their application permission changes. Do not persist or log signed URLs; do not bulk-sign every Media Library row.
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
- Keep `MediaAsset.url` as the compatibility field for existing URL-only rows. Add a `sourceKind` classification with `legacy_unverified`, `legacy_internal_verified`, `external_url`, and `private_storage` values. Existing rows default to `legacy_unverified`; only new URLs that pass external validation are `external_url`. Do not classify an old Supabase URL as external because it is in `url`. Preserve the unverified classification until exact object identity and ownership are verified; verified old-bucket records become `legacy_internal_verified` until copied. New private Storage rows set `url` to null and `sourceKind` to `private_storage`.
- Add a database CHECK constraint that verifies the source shape: `private_storage` requires both bucket/path values; its URL may be null or retain the old URL as a non-authoritative compatibility value for a migrated record. All URL-only classifications require null bucket/path and non-null URL. New private rows use null URL. Application reads never treat a `private_storage` URL value as an authorization source. Test the actual PostgreSQL constraint by attempting valid and invalid inserts/updates in an isolated database.
- Add uniqueness for `(storageBucket, storagePath)` when both values are present. Add a composite unique key on `(MediaAsset.id, MediaAsset.userId)` for ownership relations.
- `User.avatarMediaAssetId Int?` references the user's private avatar. A restrictive composite foreign key from `(User.id, User.avatarMediaAssetId)` to `(MediaAsset.userId, MediaAsset.id)` enforces same-owner attachment at the database layer. Keep `avatarUrl` for legacy references until classified.
- `ScheduledPost.mediaAssetId Int?` references a private attachment. A restrictive composite foreign key from `(ScheduledPost.userId, ScheduledPost.mediaAssetId)` to `(MediaAsset.userId, MediaAsset.id)` enforces same-owner attachment. Keep `imageUrl` for existing URLs and legacy data.
- Add a `MarketingPlanAsset` join model with `userId` and composite restrictive foreign keys to `(MarketingPlan.id, MarketingPlan.userId)` and `(MediaAsset.id, MediaAsset.userId)`. Add the corresponding composite unique key on MarketingPlan and uniqueness for `(marketingPlanId, mediaAssetId)` in the join table. This enforces that a plan and its asset have the same owner, prevents duplicate associations, and prevents deletion of a referenced asset. Plan deletion may cascade removal of its join rows.
- Add a lifecycle state for private assets (`active`, `deleting`) and a short-lived `MediaAssetAccessLease` table used to coordinate URL signing with deletion without holding database transactions across Storage calls. Persist a deletion operation ID and start time so interrupted work can be retried idempotently.

Use the same short transaction-scoped advisory lock keyed by MediaAsset ID for attachment, detachment, signing-lease creation, and deletion-state changes. Attachment validates active state and owner, then writes the reference in that transaction. Deletion checks all normalized and legacy references, and atomically changes `active` to `deleting` only when no references remain. This state prevents later attachment and signing leases. Commit before calling Supabase. The database composite foreign keys are the backstop for owner mismatch and normalized reference races. Legacy string/JSON references have no foreign key: prohibit new internal Storage URLs in string fields and scan all such fields before marking an asset deleting. Never delete based on a stale in-memory reference scan.

Signed URL creation first inserts a short-lived access lease in a short database transaction only when the asset is active and the requester is authorized. It calls Supabase outside the transaction with a bounded timeout shorter than the lease lifetime, then releases the lease in a short transaction. A lease sweeper expires abandoned leases only after that bounded signing-call window. Deletion changes the state to `deleting`, which rejects new leases, then waits for any already-started signing leases to finish or expire before removing the object. This establishes a clear ordering without holding a database transaction across network I/O.

Do not automatically backfill these fields from URL strings. A read-only dry-run report must inventory every persistent MediaAsset reference: avatar fields, ScheduledPost columns and `[IMAGE_URL: ...]` markers, MarketingPlan scalar/text/JSON fields and join rows, plus any other schema fields that store image URLs or IDs. Classify records as: verified Supabase object whose bucket and exact path match a persisted owner record; verified external URL; unresolved/malformed Supabase URL; or missing/deleted object where known. Existing `MediaAsset.url` rows start `legacy_unverified`; an internal URL remains in that class until exact bucket/path and owner evidence verify it, after which it is `legacy_internal_verified` until copied. A user-folder prefix is a consistency check, not proof of ownership. Only object identity verified against a persisted owning record is eligible for a later approved copy/backfill. The report must not print signed URLs, credentials, or full user content.

### External URL validation

New manually registered URLs are parsed with the platform `URL` parser and normalized before persistence. Accept only `http:` or `https:` URLs with a hostname, no username/password, no control characters, and no malformed or traversal-like path encoding. Do not fetch external URLs server-side. Compare the canonical hostname to the exact configured `SUPABASE_URL` hostname regardless of scheme or supplied port; classify all Storage object URL forms on that project host (public, signed, or authenticated; any bucket) as internal and reject them in the external-URL registration route. Compare bucket segments exactly after safe one-time decoding, reject invalid encodings, separators, and dot segments, and never infer ownership from a `user-<id>` path. Internal files can only be referenced by a persisted MediaAsset ID after an owner lookup. Existing legacy external strings are preserved; new external URL writes go through this validator.

## Authorization and API Behavior

### Media assets

- Authenticated uploads create the Storage object and its `MediaAsset` ownership row server-side; the API no longer relies on a second client call that registers an arbitrary Supabase URL as an owned object.
- `GET /api/media` remains scoped to `req.user.id` and returns metadata/record IDs without signing every object in a potentially large library. Preview/download requests obtain short-lived access URLs per visible/selected asset through an owner-checked endpoint. A signed URL may contain its object path; never return bucket/path as separate authorization inputs or accept a client-supplied path.
- A single-asset access/download endpoint accepts a MediaAsset ID only. It loads the persisted record, returns the same not-found response for missing and foreign-owned IDs, then signs the stored bucket/path. It never accepts a bucket or path from the request.
- MediaAsset creation for externally hosted media accepts only a URL validated by the external-URL rules above. Any URL on the configured Supabase project origin is not accepted as external; Storage-backed records can only be created by the authenticated upload/generation service with bucket/path set server-side.
- The Media Library can re-request an access URL after expiry and retry an image once. Download uses a signed URL with download disposition. Signed URLs are bearer links until expiry; copying one is an explicit temporary sharing action, not publication.
- Arbitrary external URLs remain external references. They are not signed, fetched by the backend, or used to infer Storage ownership.

### Avatars and staff access

- Avatar upload creates a private MediaAsset and stores its ID on the authenticated user's record. The owner can obtain a short-lived avatar URL through an authenticated endpoint.
- Admin/staff exceptions apply only to avatar viewing in existing workflows that require them. They do not grant general access to the target user's MediaAssets. The implementation must enumerate the current avatar consumers and authorize each endpoint using the existing role checks; staff access must be restricted to the workflow that requires it.
- Profile updates cannot accept a raw Storage path or another user's ID as proof of ownership.

### AI images, Marketing Plans, and scheduled posts

- AI generation stores its output in the private campaign bucket, persists a MediaAsset with the generated object's bucket/path and authenticated owner, and returns its MediaAsset ID plus a temporary preview URL. Provider URLs and data URLs must not become durable fallbacks when private persistence is required; generation must fail clearly if secure persistence fails.
- Marketing Plan image uploads use the same owned asset creation path. The image buffer can still be passed directly to Gemini Vision; responses and previews use the MediaAsset ID and temporary URL, not a permanent public Storage URL.
- Quick Editor and Content Calendar submit `mediaAssetId` for private attachments. The backend checks that the asset belongs to the post owner on create and update. Scheduled-post responses resolve temporary URLs from this reference. `imageUrl` and `[IMAGE_URL: ...]` remain readable for verified legacy/external content, but new signed URLs are never embedded in either database field.
- Marketing Plan persistence must be audited for any serialized image URLs. New plan references are represented in `MarketingPlanAsset`, not in signed URLs or untracked IDs inside JSON. Existing JSON references are only updated by a reviewed migration after dry-run classification and a reference-preserving transaction.

## Object Lifecycle and Expiration

- Expired preview URLs are refreshed by fetching a new URL for the same authorized record ID. Frontend retry is limited to one reauthorization attempt per image request to avoid loops.
- Private asset lifecycle is `active → deleting → row removed`. A delete request uses a short transaction and the shared per-asset advisory lock to verify ownership, check restrictive references (avatar, scheduled post, MarketingPlanAsset) and scan legacy serialized/text references. It atomically changes `active` to `deleting` and records an operation ID/time only when no reference exists. New attachment and signing-lease requests require `active`, so they fail after this transition. No Storage network operation runs inside the transaction.
- Repeated delete requests for an asset already in `deleting` return/continue its existing operation ID; they do not create a competing operation. URL-only legacy assets are never physically deleted by this lifecycle until their source and references are verified and a separate reviewed cleanup is approved. Deleting an unreferenced external URL record has no Storage operation.
- A worker waits for signing leases started before the state transition to finish/expire, then removes the exact persisted object outside PostgreSQL. Success and Storage “not found” both proceed to a separate short transaction that deletes the row only if it is still `deleting` with the same operation ID. Restrictive foreign keys protect finalization. The operation ID makes retries idempotent.
- On timeout or ambiguous Storage failure, keep the asset `deleting`, retain the row, record a redacted error code/attempt count, and retry with backoff. A worker recovers abandoned `deleting` rows after process crashes; repeated remove calls are safe. Never reactivate after an ambiguous remove. If the object is proven intact, an audited recovery may restore it from the encrypted backup, verify checksum/metadata, and explicitly return the row to `active` after rechecking references. Do not delete a row or source object merely because a request timed out.
- Avatar replacement updates the user's reference before requesting cleanup of the old asset; cleanup must not remove a path still referenced by any record. Migration does not remove old public objects.
- Signed URLs are not immediate revocation. Supabase documents that previously issued signed URLs remain valid until expiration, including after the user's application account is disabled or authorization changes; CDN cache lifetime is also independent from URL lifetime. Deleting an object is the Storage-level revocation action, with CDN invalidation potentially taking time. If the product later requires immediate per-request revocation, use an authenticated streaming proxy instead of signed URLs.

## Supabase Cloud and SQL Approval Boundary

Prepare, but do not apply, a Cloud change set for a later explicit approval:

1. Create the dedicated private `campaign-assets-private` and `avatars-private` buckets with the current upload size/content-type restrictions.
2. Keep public/anonymous reads and client writes absent for those private buckets. Backend service-role operations remain server-side and bypass Storage RLS; RLS must not be disabled globally.
3. For Milestone B only, inspect current policies and bucket visibility. Make `campaign-assets` and `avatars` private after inventory, actual-byte backup/restore, copy verification, reference reconciliation, and application compatibility checks pass. Remove any broad `SELECT` policy that would defeat private reads.
4. If a later approved publication workflow exists, provision a separate public `published-assets` bucket with read-only public delivery and backend-only writes. Do not create it until a real consumer is identified.

Application-layer tests prove owner and role authorization before URL signing. Storage integration tests against an isolated non-production Supabase project prove private bucket behavior: anonymous/public URL reads fail, authorized server signing succeeds, and client-side unauthorized reads/writes fail. Do not use production objects or policies for these tests. Do not execute Cloud SQL or change bucket settings in this phase.

## Storage Object Backup and Recovery

Before copying any object bytes, create a recoverable backup of both PostgreSQL records and the actual Storage objects. Download each in-scope source object through the authenticated Storage API/service-role client into an encrypted, access-controlled backup location outside the application buckets. Record source bucket/path, byte length, content type, checksum, backup object key, and timestamp in an inventory manifest; exclude credentials and signed URLs. Verify each backup by recomputing its checksum and restoring it into an isolated test bucket, then verify downloaded bytes and metadata. Keep the source object and database row intact throughout.

## Explicit Rollout States and Milestones

### State 1 — Code Ready

Application code, Prisma migration files, local/mock tests, and Cloud change documentation are prepared. Validate the Prisma schema and inspect generated migration SQL without applying it. No Supabase resource is needed for local development or mocked verification.

### State 2 — Staging Verified

After separate approval, apply the reviewed migration and provision the private buckets only in an isolated environment. Run PostgreSQL constraint/concurrency tests and real Supabase tests for anonymous read denial, cross-user denial, authorized signing, expiry, deletion, and recovery. If an isolated Supabase project is unavailable, report real Storage verification as **BLOCKED** and do not proceed to activation.

### Milestone A — Private Uploads Activated

After staging evidence is reviewed and activation is separately approved, set explicit `PRIVATE_STORAGE_MODE=private` in the approved environment. Verify that new uploads actually use the private buckets and that authenticated preview, download, refresh, and ownership enforcement work against those buckets. Do not claim Milestone A based on Code Ready or Staging Verified alone.

The application has explicit `disabled` and `private` storage write modes. `disabled` rejects new storage writes; `private` uses only the dedicated private buckets and fails closed if configuration or bucket access is unavailable. There is no fallback from private mode to a public bucket. Do not switch modes automatically. Locally, use a mocked Storage adapter to develop and verify private-mode behavior before Cloud resources exist. Milestone A is **not full privacy completion**: existing objects in the old public buckets remain anonymously accessible until Milestone B.

### Milestone B — Legacy Privacy Cutover Complete

1. Produce and review the full dry-run reference report and encrypted object-byte backup manifest. No source file or legacy row is removed.
2. Copy only objects whose exact identity and persisted owner are verified. Compare byte count, content type, checksum, and successful restore/read from the destination private bucket; preserve source bytes.
3. Update database references in transactions guarded by foreign keys and re-scan every serialized/text reference. Reconcile counts and report unresolved/missing objects before continuing.
4. Run all application and Storage access tests with both source and destination objects present. Keep old public buckets unchanged until this gate passes.
5. Obtain a separate explicit approval for Cloud cutover. Then set `campaign-assets` and `avatars` private and remove any broad public-read policy that defeats private access. Verify anonymous reads of old URLs fail after cache behavior is accounted for and authorized app access succeeds.
6. Preserve source objects and old database fields after cutover. Any eventual cleanup requires its own reviewed, backed-up, separately approved operation.

### Rollback

Before activation, leave storage writes disabled until the private buckets are available and verified. If private mode fails after activation, switch explicitly to `disabled` and repair the private configuration; never fall back to a public bucket. Do not make a private bucket public as an application rollback. After cutover, roll back only to a release that understands the new schema and signed-URL flow. Original objects and legacy fields provide recovery without deleting data.

## Security and Regression Test Plan

Add backend tests for:

- Owner can list, preview, download, and delete their own MediaAsset; another user gets an indistinguishable not-found response.
- Unauthenticated requests cannot list or resolve private assets.
- Forged IDs, bucket names, object paths, URL hosts, traversal segments, and mismatched user-folder paths cannot grant access or cause signing of another object. The signed URL may contain its object path; bucket/path are never returned as separate client-controlled authorization inputs.
- Admin/staff can view avatars only through authorized avatar workflows; they cannot use the exception to access arbitrary MediaAssets.
- Deleted, deleting, or missing MediaAsset IDs cannot receive new signing leases/URLs; deletion refuses referenced assets and cleans only the verified unreferenced object.
- Expired signed URL refreshes once through the authenticated endpoint; a signed URL is never persisted in Prisma records or markers.
- Existing signed URLs continue to work until expiry even after account disablement or permission changes; new signing requests after disablement, ownership loss, or deletion fail. Shared URLs are bearer links until expiry; cross-user app requests cannot mint new ones.
- Concurrent attachment and deletion cannot leave a dangling new reference or delete an attached object. Tests cover active→deleting state transition, denial of attachments/signing leases after transition, expired-lease recovery, crash after Storage removal, timeout/retry, idempotent not-found, and legacy string references blocking deletion.
- Database tests verify the source-kind CHECK constraint, uniqueness of non-null Storage bucket/path pairs and MarketingPlanAsset pairs, and same-owner composite foreign keys for avatar, scheduled-post, and Marketing Plan attachments.
- Manual URL registration normalizes valid HTTP/HTTPS URLs, rejects malformed/unsupported schemes and credentials, and rejects configured Supabase origin URLs in public, signed, authenticated, and encoded-path forms.
- Existing scheduled posts with external URLs and legacy markers remain readable/editable; new scheduled attachments use owner-checked MediaAsset IDs.
- AI-generated images and Marketing Plan uploads persist private MediaAssets and remain previewable after page refresh/backend restart.
- Private media download returns expected bytes and disposition only after authorization.
- No frontend build artifact or frontend environment variable contains `SUPABASE_SERVICE_ROLE_KEY`.

Add isolated Storage integration tests for:

- Anonymous access to a private object's conventional public URL is denied.
- Owner-authorized backend signing works; unauthorized owner and unauthenticated endpoint calls do not yield signed URLs.
- Forged object path and cross-user read/write attempts fail at the application and Storage layers.
- A deliberately short test URL expires, and deleted objects cannot be newly signed.
- After a test user is disabled or loses access, previously issued links remain usable until expiry while new access requests are denied. Exercise shared-link behavior without logging the URL.

Use the existing safe backend suite and frontend unit suite. Run real PostgreSQL and browser workflows only within the previously approved non-destructive test boundary. Do not run migration or Storage policy changes against production as part of validation.

## Compatibility and Known Limits

- **Milestone A does not complete privacy for legacy assets:** old public buckets and their objects remain anonymously readable until Milestone B's separately approved cutover. Do not report full privacy completion before anonymous reads from those buckets have been verified denied.
- Existing external URLs continue to pass through as external references. They are not guaranteed to remain available if the remote host changes them.
- Existing `MediaAsset.url` rows remain `legacy_unverified` until an inventory proves they are external or verifies their exact internal object and owner. URL column presence alone does not classify the source.
- Existing public Supabase URLs keep working while their existing buckets are public. After a separately approved private cutover, only records with verified ownership/object identity can be signed by the application. Unresolved URLs require manual review and must not be silently converted.
- Previously disclosed public URLs may persist in browser/CDN caches, messages, or third-party systems. The system cannot retroactively retract those copies. Once objects are copied and old buckets are private, new anonymous reads from old bucket paths should be denied, subject to cache invalidation behavior.
- Signed URLs can be shared by anyone who obtains them until expiry and may be served from a CDN cache according to Storage cache settings. They remain usable until expiry even if the issuing user's account is disabled or permissions change. They are short-lived bearer links, not revocable per-user sessions. Do not persist or log signed URLs. Avoid creating them for every asset in a large Media Library response.
- No current live database provenance results are available: the previous read-only `knowledge_base` audit could not reach the configured PostgreSQL pooler. The seven records therefore remain unverified until a read-only query can run in the approved environment.

## RAG Consistency Finding (Separate Follow-Up)

`backend/src/services/ragService.js` generates `gemini-embedding-2` embeddings with 768 dimensions and stores those tags for new records. Retrieval currently accepts records whose `embeddingModel` is null, so unknown-provenance vectors can be compared with current-model query vectors. Reindexing updates unknown-tagged records in place without a backup. Treat this as a separate RAG task: first run a read-only inventory of record IDs, metadata tags, vector dimensions, and null vectors; preserve a database/object backup; then propose a reviewed re-embedding migration. Do not reindex in the storage task. Retrieval should include only records explicitly tagged with the query embedding model and matching dimensions.

## Current Supabase Documentation Reviewed

- Supabase describes private buckets as access-controlled for downloads and supports time-limited signed URLs; public buckets bypass read access controls: [Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).
- Signed URL lifetime is set in seconds with `createSignedUrl`: [JavaScript `createSignedUrl`](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl).
- Supabase documents signed URL/CDN cache behavior and cautions that expiry and cache TTL are independent: [Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn).
- The current changelog review found no Storage breaking change relevant to the proposed bucket migration.
