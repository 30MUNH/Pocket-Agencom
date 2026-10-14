# Supabase Cloud Change Set — Private Storage

**Status: documentation only. No project setting, bucket, policy, object, or row has been changed.** All actions below require separate approval and an isolated Staging project.

## Milestone A — Private Uploads Ready

Create these buckets as **private** in Supabase Dashboard → Storage → New bucket:

| Bucket | Maximum object size | MIME allowlist | Use |
| --- | ---: | --- | --- |
| `campaign-assets-private` | 4 MB | `image/jpeg`, `image/png`, `image/webp` | Campaign uploads and generated images. The upload middleware allows up to 4 MB for Gemini Vision input and the general image endpoint caps direct upload at 2 MB. |
| `avatars-private` | 2 MB | `image/jpeg`, `image/png`, `image/webp` | Profile avatars; current middleware limit is 2 MB. |

The backend uses opaque UUID object names, `upsert: false`, and the service role. Do not add anonymous or authenticated `SELECT`, `INSERT`, `UPDATE`, or `DELETE` policies for either private bucket. Supabase Storage requests from application users must go through the authenticated Pocket Agencom API; the API does not accept browser-supplied bucket/path values.

Before setting `PRIVATE_STORAGE_MODE=private` in the isolated Staging environment, verify the schema migration is applied there and all of these checks pass:

1. Bucket details show **Public bucket: off** and the configured size/MIME restrictions above.
2. Inspect Storage policies, including policies on `storage.objects` that apply to every bucket. Confirm no policy grants anonymous or authenticated reads to either private bucket. Keep service-role access server-only.
3. Anonymous Storage API requests for a known test object fail. An owner can upload and request an authorized preview/download/refresh through the API. Another user cannot request a signed URL by changing the asset ID.
4. Disabled requesters cannot mint new URLs. A signed URL that was already issued remains a bearer link until its 600-second expiry; permission changes do not revoke it immediately.
5. Expired links fail, refresh returns a new link for an authorized owner, and deleting an asset blocks new links. Real behavior must be checked in the isolated project; mocks are not evidence of Cloud enforcement.

Keep `PRIVATE_STORAGE_MODE=disabled` until the separate activation approval is granted. Do not point Code Ready builds at the existing project schema before its approved migration and buckets are ready.

## Milestone B — Legacy Privacy Cutover

Do not make existing buckets private as part of Milestone A. Before requesting Milestone B approval:

1. Run the read-only reference inventory against the approved project and reconcile every asset candidate to an owner and persisted reference. URL patterns or folder prefixes alone do not establish ownership.
2. Create a protected PostgreSQL metadata backup and an encrypted byte-for-byte object backup outside Supabase Storage. Verify SHA-256, byte length, content type, and restore a copy into an isolated test bucket. Keep original rows and objects.
3. Copy only approved exact source bucket/path entries into private buckets. Re-read and checksum each destination. Update only the matching active MediaAsset row under the shared asset advisory lock, after checking the expected owner and legacy URL still match.
4. Reconcile all other URL-bearing records independently: `User.avatarUrl`, `ScheduledPost.imageUrl`, scheduled-post content markers, MarketingPlan serialized fields, Template URLs, and any newly discovered references. The Code Ready MediaAsset copier does not rewrite arbitrary direct URL fields. Any unresolved direct URL is a cutover blocker.
5. Review the complete Storage policy inventory for broad public `SELECT` grants. With separate cutover approval, remove only grants proven to expose the legacy buckets; do not remove policies needed by unrelated buckets.
6. Verify anonymous reads fail after accounting for CDN cache lifetime, while authorized application previews, downloads, ID ownership checks, and recovery still work. Keep original bytes and records throughout.

The Cloud policy inventory and exact SQL must be prepared from the target project's current policy state during the separately approved change window. Do not execute the untracked `backend/scripts/restrict-storage-policies.sql`; it is outside this change set and has not been reviewed here.

## Rollback

Pause new private uploads or roll back to a compatible application build that understands the new schema. Keep private buckets private. Restore verified bytes into a private bucket and repair references from the protected manifest if a copy or reference update is incomplete. Do not roll back by making either private bucket public, deleting source objects, or deleting legacy records. If legacy visibility has already changed, restore the prior policy only under a separate reviewed recovery approval and only after confirming it does not expose the new private buckets.
