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

## Continuation — 2026-10-14

This continuation records a fresh real-DB attempt and the current working-tree fixes. It does not change the NOT RELEASE READY verdict above.

### Fresh real-service evidence

- A read-only pre-run snapshot verified the authorized project and captured 15 public tables / 1,486 rows. The real API suite then passed authentication, profile, password change, archived-account rejection, and persistent concurrent quota enforcement after backend restart.
- A bounded OpenRouter plan-generation request (one provider attempt, runner invoked with `AI_REQUEST_TIMEOUT_MS=30000`) failed. The provider attempt returned HTTP 502 after 53,418 ms; the API returned a generic 503 after 78,824 ms. No successful provider payload arrived, so no selected underlying model was observable for this request. A separate process parsed the 30-second setting, but the test child did not emit its effective timeout value; the 53.4-second provider attempt leaves timeout propagation/enforcement unresolved. No prompt, response content, key, or raw upstream error was logged.
- Because generation failed, refinement, save/review, and the later scheduled-post/media/support subtest did not complete in that run; the suite's 180-second parent timeout closed its local API before the later subtest could run. This is a harness timeout consequence, not evidence that those features failed in the application.
- A fresh read-only post-run snapshot matched the pre-run counts exactly: 1,486 rows, including 217 users, 1,011 plans, 2 media assets, 24 notifications, 1 scheduled post, 4 social platforms, and the 7 existing knowledge records. Run-owned users and quota rows were cleaned. No Storage object or legacy record was modified.
- A separate real-browser run used the production React build, Express, and the authorized PostgreSQL project with provider credentials withheld from the test backend. Registration/login, template selection, Quick Editor draft creation, calendar create/edit/delete with refresh, external media metadata, support submission, profile update, backend-restart session retention, and UI logout all passed. The only expected service error was the trend endpoint returning 503 while AI was deliberately disabled; no AI request was sent. Screenshot/API evidence is in `/tmp/pocket-agencom-db-backups/browser-1791956675894`.
- The read-only post-browser snapshot again matched its fresh pre-run snapshot exactly at 1,486 rows / 15 tables. The exact run prefix `pa-realdb-browser-1791956664058-2804b6` had no remaining users or dependent records. No private or legacy Storage objects were created or changed in this browser run.
- Earlier live OpenRouter probes recorded HTTP 200 with `$0` reported cost but unusable structured responses (reasoning-only output or invalid JSON), and a pinned free model returned HTTP 429. These are distinct provider results; the historical 120-second browser timeout still cannot be attributed to one layer from the earlier run. Current evidence confirms an upstream 502 plus an observed timeout/config mismatch, not a browser abort.
- Cloudflare account/billing endpoints returned 403, so its account-level free allowance and billing mode remain unverified. Gemini free-tier eligibility also remains unverified. No image inference, Vision call, or embedding inference was sent. No paid inference was made.

### Current focused fixes and verification

- Quick Editor caption generation, image-prompt generation, plan refinement, and image-input text generation now pass the owning user ID to the persistent daily quota guard. One operation reserves one unit before provider work, including a failed provider request; a failed request does not silently bypass quota accounting.
- OpenRouter results now expose the selected concrete model when the response contains it. Provider-failure logs record elapsed time, status, and code only; terminal API errors no longer include raw provider messages.
- Text-generation frontend calls now use a 180-second request timeout to allow three 45-second attempts plus bounded retry-after waits. The observed 53.4-second attempt exceeded the runner's requested 30-second setting, so provider/client timeout propagation remains a release blocker until its effective value is instrumented and verified.
- Gemini text eligibility now matches the verified model allowlist exactly; a prefix such as `gemini-2.5-flash-pro` is rejected. RAG model construction requires explicit Gemini free-tier confirmation and the exact configured embedding allowlist. The seven existing rows were neither embedded nor reindexed; their provenance/ownership question remains a separate follow-up.
- Image-input generation rejects before private asset creation when Gemini Vision is unavailable due to unconfirmed free-tier eligibility.
- Social analysis and trend refresh no longer substitute curated text when AI fails. Social analysis now reserves the user's persistent text quota and propagates provider/validation errors; this prevents static advice from being presented as generated analysis.
- Backend isolated suite with loopback enabled: **108 passed, 0 failed**. This is unit/mock coverage, not external-provider or real-DB acceptance. Frontend suite: **18 passed, 0 failed**. Frontend production build succeeded.
- The complete real-DB suite was **not a pass**: two nested checks passed; real plan generation failed on upstream 502; the scheduled-post/media/support subtest was prevented from running by the parent timeout. The exact post-run database reconciliation passed.

### Updated feature acceptance table

| Feature / UI route | Real service and persistence evidence | Observed result | Status |
|---|---|---|---|
| Registration, login, password change, archived account `/register`, `/login`, `/settings` | Real Express API and PostgreSQL; backend restart in the isolated run | Registration/login/profile, browser logout and persisted session retention passed; password change and archived-account rejection passed through the real API, but the password-change browser interaction remains unverified | **PARTIAL** |
| Dashboard/profile analytics `/dashboard`, `/business-profile` | Earlier browser E2E; PostgreSQL-backed profile | Profile persistence passed previously. New API suite verified profile persistence. Analytics display/data accuracy remains unverified against the browser | **PARTIAL** |
| Marketing Plan `/marketing-kit`, `/marketing-kit/result`, `/plans` | Real OpenRouter route and PostgreSQL | Earlier run persisted one successful plan and retrieved it after backend restart. Fresh real attempt returned HTTP 502 and API 503; revision did not run in the failed suite | **FAIL — provider reliability / structured-output acceptance** |
| Quick Editor AI `/user/quick-editor` | Real provider route not successfully exercised for this action; deterministic code path now quota-metered | Draft save passed in earlier browser E2E; real AI caption/content success remains unverified | **BLOCKED — provider** |
| Image-input caption generation | Gemini Vision gated by explicit account eligibility; preflight before upload | Account eligibility not confirmed; request safely returns 503 without storing an asset | **BLOCKED — account eligibility** |
| AI image generation and persisted attachment `/media-library`, image studio, `/calendar` | Cloudflare Workers AI account could not be verified; private Storage remains available | No image generation request or image bytes were created; no MediaAsset ID/preview/attachment acceptance | **BLOCKED — billing verification** |
| Social account create/list/analyze/delete `/settings`, `/business-profile` | Social API uses scraper plus AI advice; provider errors now propagate and analysis uses the owner's AI quota | Prior run did not exercise live scraping or real analysis. CRUD/analyze remains outstanding; configured scraper eligibility was not verified | **NOT VERIFIED** |
| Calendar posts and media attachments `/calendar` | Real browser + Express + PostgreSQL; separate private Storage tests | Browser create/edit/delete, reload persistence and cleanup passed in the earlier and fresh non-AI browser runs. Private asset authorization/deletion/concurrency evidence remains as recorded above | **PASS for post CRUD; storage evidence separately recorded** |
| Budget and expenses / dashboard | PostgreSQL-backed expense API | No fresh real persistence workflow completed; safe contract coverage exists | **NOT VERIFIED** |
| Notifications and actions/settings | PostgreSQL notification rows; staff-review notification exercised previously | Automatic staff notification was previously observed. User notification list/action browser flow was not exercised | **PARTIAL** |
| Templates `/templates` | Earlier browser E2E | Template selection passed; database-backed template CRUD is not present in the observed workflow and the live templates table was empty | **PARTIAL** |
| Support tickets `/help` | Real browser + Express + PostgreSQL | Ticket submission and listing passed in prior and fresh non-AI browser runs; exact test-owned ticket and user cleanup reconciled | **PASS** |
| Avatar upload, preview, Admin/Staff access `/settings`, `/admin/users` | Private bucket path and authorization tests; earlier schema-guard regression coverage | Real browser avatar bytes/access workflow remains unverified | **NOT VERIFIED** |
| Signed URL refresh, expiry, deletion/cache | Earlier real private Storage tests | 600-second expiry, denied new signing after deletion, cross-user/disabled denial passed. Previously issued bearer URL remained usable until expiry; immediate revocation is not provided | **PASS with documented lifecycle limit** |
| RAG embeddings, similarity and context use | Existing PostgreSQL knowledge base inspected; Gemini inference remains gated | Seven records are global (no owner/business identifiers in metadata), 768 dimensions, missing embedding-model provenance. No new record or real retrieval/inference was made | **BLOCKED / separate follow-up** |
| Legacy Storage privacy | `avatars`, `campaign-assets`, `media-assets` inventory and encrypted byte backup | Legacy avatars remain public; ownership of the one referenced avatar remains ambiguous. No source changed or cutover performed | **NOT COMPLETE — legacy assets remain publicly accessible** |

### Release blockers

1. Make provider timeout propagation deterministic and reproduce the real API response within the configured bound. Verify at least one successful structured plan result, revision, and Quick Editor output through the real browser with persistence/refresh.
2. Obtain account-level confirmation of Cloudflare free capacity/billing configuration, or an owner-confirmed free image provider, before image inference.
3. Verify Gemini free eligibility before Vision or embeddings. Do not infer account eligibility from model names or prefixes.
4. Finish live browser coverage for logout, avatar, social, analytics, budget/expenses, notification actions, and signed-link refresh after expiry.
5. Keep the seven-row RAG provenance/ownership issue as the separate follow-up; no reindex was performed.
6. Legacy public buckets remain public. Ownership/reference ambiguity prevents a safe migration and privacy cutover; do not claim full privacy completion.

### Git and cleanup

The branch remains `feat/ui-ux-functional-overhaul`. No migration, bucket, Cloud policy, legacy object, cutover, deployment, push, merge, or PR operation occurred. Existing unrelated dirty files were preserved. The exact post-run database row counts match the pre-run snapshot; private Storage inventories and legacy sources were not modified in this continuation.

Focused local implementation commit: `d7f8864` — `fix(ai): enforce eligibility and account for text usage`.
Additional focused local commits: `21da85b` — `fix(frontend): align AI request deadline with retry budget`; `a38ed7d` — `fix(ai): surface provider failures for social insights`.
Real-browser harness commit: `268ec80` — `test: isolate non-AI real browser workflows`.

## Follow-up: AI reliability and remaining real browser workflows

This follow-up supersedes earlier “unverified” statuses below where it records a newer live browser result. It does not change the legacy Storage or RAG conclusions.

### A. AI timeout correction

- Root cause: `AIService.generateText()` enforced Axios/provider timeouts inconsistently and did not pass a shared `AbortSignal` or a total-operation deadline through provider calls. Retries and provider fallback could therefore outlive the requested timeout. The spawned real-browser API inherits the caller's environment; dotenv does not override inherited values.
- Commit `7cf6620` adds a per-attempt deadline and one total operation deadline, propagates cancellation to OpenRouter/Groq Axios requests and Gemini requests, bounds retry delays to the remaining operation time, and releases concurrency slots after abort.
- A controlled local delayed HTTP server proved the request was cancelled at the configured request deadline and a 100 ms total deadline stopped the operation after one attempt without retry. The test uses no provider and is timeout-mechanics evidence only.
- The actual child-process check printed `[AI timeout config] requestMs=30000 operationMs=30000 maxRetries=0` when launched with `AI_REQUEST_TIMEOUT_MS=30000 AI_MAX_RETRIES=0`. The final browser run logged its effective 45,000 ms request and operation deadlines and two retries. The browser's Axios limit is 90,000 ms, above the backend's 45,000 ms operation limit.
- Backend test suite: 111 passed, 0 failed. `npm run check --prefix backend` passed.

### B. AI workflow results

| Workflow | Status | Evidence |
|---|---|---|
| Marketing Plan generation | **FAIL — provider reliability** | An earlier real `openrouter/free` call generated and persisted a plan. The fresh minimum structured probe routed to `dots-studio/dots-3-note-preview:free` but returned no usable content (HTTP 200, zero-cost usage). A pinned Liquid free model returned HTTP 502 with an empty response; pinned Gemma returned HTTP 429. The earlier pass is not evidence of repeatable current reliability. |
| Marketing Plan refinement/revision | **BLOCKED — provider** | The provider did not return a usable structured response in the fresh probes; no fake fallback or paid request was used. |
| Quick Editor AI caption | **BLOCKED — provider** | Draft save passed in the browser; real caption generation was not accepted because the configured provider probes produced no usable content. |
| Image-prompt generation | **BLOCKED — provider** | No usable real structured response was available to validate or persist. |
| Social analysis and trend text | **BLOCKED — provider** | The non-AI browser run deliberately skipped AI; the trends endpoint returned expected 503 while AI was disabled. No fabricated analysis was accepted. |
| AI image generation, Gemini Vision, and embeddings | **BLOCKED — account eligibility** | No billable inference was attempted. See the dashboard fields in section D. |

### C. Latest non-AI real browser run

- Run prefix: `pa-realdb-browser-1791962146925-05831e`; verified pre-run snapshot: `/tmp/pocket-agencom-db-backups/pocket-agencom-2026-10-14T07-16-01-506Z.json.gz`; screenshots: `/tmp/pocket-agencom-db-backups/browser-1791962161603`.
- The run ended with `verified: true`, `workflowFailures: []`, no unexpected API failures, and no page errors. The two browser console warnings were recorded separately: a React state update during another component's render and a duplicate child key.
- **REAL E2E PASS:** registration/login/logout; profile settings persistence; private avatar upload to `avatars-private`; owner preview and staff avatar preview rendered actual bytes; dashboard analytics API/render; social account persistence, UI list and browser deletion; password change followed by login with the new password; notification preference toggle and reload persistence; budget/expense create and rendered persistence; template selection and Quick Editor draft save; calendar create/edit/delete; external media URL registration; support ticket submission.
- Social list rendering had a confirmed frontend defect: Axios unwraps a successful response to an array, while the settings component only read `response.data`. The component now accepts both array and wrapped response shapes. A focused frontend regression test covers both.
- Budget/expense browser coverage proves create/read. Expense update/delete actions are **NOT IMPLEMENTED** in the current UI/API, so CRUD is not claimed.
- Notification preference persistence is browser-local. Notification inbox/read/delete actions are **NOT IMPLEMENTED** in the inspected user API/UI. Automatic notification records from other workflows are separate.
- Social add through the profile API plus persisted list/delete were verified. AI-powered profile analysis and scraper-based external metrics remain **BLOCKED** by provider/account eligibility; external analytics are not represented as real data.
- Frontend tests: 20 passed, 0 failed. Frontend production build passed. Vite emitted the pre-existing Node 20.18 vs required 20.19 warning and a 516 kB main-chunk warning.

### D. Free-tier eligibility

- Configuration has provider keys, but `freeTierConfirmed` is false for Groq, Gemini, and Cloudflare. Keys alone do not establish free billing. OpenRouter's one HTTP 200 probe reported usage cost `$0`; this does not establish reliable structured output or eligibility for other providers.
- Cloudflare owner check: in the Cloudflare dashboard, verify the account plan and Workers AI usage/allocation under **AI → Workers AI**. Confirm current Neurons used against the 10,000/day no-charge allocation and whether paid/unified billing is enabled. See [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).
- Gemini owner check: in Google AI Studio **Projects**, verify the configured key's project has **Billing Tier = Free Tier** and its **Status** is active; review **Usage** and the Billing page's prepay/postpay, credit balance, and auto-reload fields. Do not use the key if its project is paid or billing status is uncertain. See [Gemini API billing](https://ai.google.dev/gemini-api/docs/billing/).
- Cloudflare account endpoints previously returned 403; they were not retried. Gemini account eligibility was not established programmatically. No paid inference, Cloud policy change, or AI image/vision/embedding call occurred.

### E. RAG and legacy privacy

- Read-only inspection found 7 knowledge-base rows, all 768-dimensional, with no embedding-model provenance and no owner/business metadata. Current retrieval code has no tenant filter and includes rows without model provenance. Whether the corpus is intentionally global is unresolved; no reindex, write, or retrieval inference was performed. Keep this as a separate follow-up.
- Legacy public Storage buckets and objects remain unchanged and anonymously accessible. Milestone B / legacy privacy cutover is **NOT COMPLETE**. No old bucket was made private and no legacy object or record was deleted.
- After browser cleanup, both private bucket root inventories were empty: `avatars-private` 0 objects; `campaign-assets-private` 0 objects.

### F. Database reconciliation, cleanup, and Git

- Final browser run pre-snapshot and verified post-run snapshot both contain exactly 1,487 rows across 15 tables. Counts matched exactly: `_prisma_migrations=5`, `ai_quota_usage=4`, `business_profiles=210`, `expenses=0`, `knowledge_base=7`, `marketing_plan_assets=0`, `marketing_plans=1011`, `media_asset_access_leases=0`, `media_assets=2`, `notifications=24`, `scheduled_posts=1`, `social_platforms=4`, `support_tickets=2`, `templates=0`, `users=217`.
- Post-run snapshot: `/tmp/pocket-agencom-db-backups/pocket-agencom-2026-10-14T07-19-42-272Z.json.gz`, SHA-256 `4c2541d6d3e788fc7ee5b4b8df1f3cce190fe7bb3d4610418251a6e16cfd0b7b`, verified. The test plan (ID `8112`), avatar asset (ID `45`), synthetic users, expense, social record, and other run-owned rows were cleaned. Both private Storage inventories are empty.
- One earlier rerun left its private avatar metadata after the cleanup transaction hit Prisma's default five-second timeout while scanning serialized Marketing Plan references (6.071 seconds elapsed). The exact synthetic asset was subsequently deleted through the ownership/reference-checked service after raising its transaction deadline; its two synthetic users and all prefixed records were removed. The regression test now verifies a 20-second reference transaction deadline. No source/legacy object was touched.
- Confirmed fix commits: `7cf6620` — `fix(ai): enforce request and operation deadlines`; `107804e` — `fix(storage): bound reference-check transactions`; `e1a170f` — `fix(frontend): render saved social platforms`. The real-browser harness updates and this report are in a separate local commit. No push, merge, deploy, or PR was performed. The branch remains `feat/ui-ux-functional-overhaul`; unrelated working-tree changes remain unstaged.
