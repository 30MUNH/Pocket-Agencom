# RAG Isolation and Runtime Stabilization Implementation Plan

> **For agentic workers:** Execute these tasks in order in the current Pocket Agencom checkout. Do not commit, push, deploy, or use paid inference.

**Goal:** Make RAG retrieval fail closed by authenticated user and business, preserve legacy rows, and resolve the observed frontend runtime warnings.

**Architecture:** The business profile is the current tenant boundary because each profile belongs to one user. Persist scope, ownership, approval, and embedding provenance as typed columns. Retrieval rechecks the caller against `users` and `business_profiles` inside SQL before returning approved global or matching private rows. The seven legacy records retain a default `unclassified` scope and receive no inferred provenance.

**Tech Stack:** Prisma 5, PostgreSQL/pgvector on the verified Supabase project, Node test runner, React/Vite.

**Spec:** User request attached on 2026-10-14 (`eb679828-00f5-4d3f-ba9d-bce5b3bb73ff`).

## Global constraints

- `FREE_ONLY_MODE=true`; `AI_ALLOW_PAID_MODELS=false`; no new image inference without current quota confirmation.
- Preserve unrelated worktree changes and all existing knowledge-base rows and vectors.
- Apply the non-destructive migration only after target identity, impact, and a verified fresh backup are checked.
- Keep missing or ineligible Gemini embeddings as a non-fatal RAG miss during Marketing Plan generation.

## Tasks

### 1. Schema and migration

- [x] Add nullable owner, business, approver, and embedding provenance fields plus default `unclassified` scope to `KnowledgeBase` in `backend/prisma/schema.prisma`.
- [x] Add an additive SQL migration with foreign keys, scope-shape checks, indexes, and RLS/grant defense in depth. Include separate rollback SQL that drops only new columns, constraints, and indexes; never changes or deletes the seven rows.
- [x] Validate the schema and migration impact against the verified project, take a verified backup, apply the migration, and compare all seven preserved rows afterward. The planned disposable database rehearsal was unavailable; this remains a process limitation.

### 2. Scoped RAG service and caller

- [x] First write isolated failing tests for missing and forged context, scoped SQL, model compatibility, ingestion authorization, and no-result fallback.
- [x] Replace metadata-only model matching with typed provenance and SQL tenant predicates in `backend/src/services/ragService.js`.
- [x] Require server-derived user and business context in `backend/src/services/ai/aiService.js` via `backend/src/services/marketingPlanService.js`.
- [x] Prevent the legacy seed script from deleting rows or silently classifying existing knowledge.

### 3. Real PostgreSQL isolation checks

- [x] Add a synthetic, cleanup-safe real database test with deterministic embedding responses; exercise same-business, cross-user, forged-business, approved-global, unclassified, model-mismatch, and write authorization cases.
- [x] Verify exact-prefix cleanup and unchanged seven legacy rows after execution.

### 4. Frontend and runtime

- [x] Trace the warning to the notification preference state updater, write a regression check, and move its side effects into the click handler. The recorded production warning had minified names; source inspection identified the updater directly.
- [x] Use a project-local Node 22 runtime consistent with `.nvmrc`, without changing the system Node installation.
- [x] Rerun build, backend/frontend suites, real database and browser E2E where safe, syntax checks, and `git diff --check`.

## Verification record (2026-10-14)

- RAG isolation: 6 isolated tests passed; real PostgreSQL isolation test passed with deterministic local vectors and verified exact-marker cleanup.
- Full backend suite: 127/127 passed under Node 22.23.3 with localhost socket access. Frontend suite: 5/5 test files passed. Production frontend build passed under Node 22.23.3.
- Clean real PostgreSQL application E2E rerun: 5/5 passed, including real Marketing Plan generation, save, staff review, and scheduled media workflows. A preceding run was interrupted after its workflow subtests; its five exact-marker users and linked fixtures were cleaned before the clean rerun.
- Corrected production browser E2E with all AI providers disabled: zero workflow failures, unexpected API errors, browser errors, and React warnings. The browser runner now builds with `NODE_ENV=production`. The private test avatar and run-owned users were removed after signed URL expiry.
- The first AI-disabled browser attempt failed because its Quick Editor step still called Cloudflare text generation and received HTTP 503. Its own fixtures were cleaned. The runner now skips that request when AI is disabled. Real Cloudflare image generation was not rerun.
- The seven pre-existing knowledge rows remain unclassified. Their ID, content, metadata, vector text, and creation time match the pre-migration backup. RLS is enabled; `anon` and `authenticated` have no SELECT grant.
- Four older synthetic browser users from 2026-10-13 remain. Automatic approval review rejected their deletion because they belong to older runs; no workaround was attempted.

## Review focus

- Missing auth context returns no private data.
- A forged business profile ID cannot reveal another user's vectors.
- Legacy rows with missing provenance cannot be returned even if their vector dimensions match.
- Admin approval cannot be supplied through ordinary user write parameters.
- A failed embedding or migration leaves existing rows and Marketing Plan generation usable.

## Verification rerun (2026-10-15)

- Backend suite under Node 22.23.3: 127/127 passed; `npm run check` passed. The first sandboxed Node 22 run reported 3 file-level failures because child Node processes could not start in the sandbox; rerunning outside the sandbox passed all tests.
- Frontend suite under Node 22.23.3: 22/22 tests passed across 5 files. Production Vite build passed with no Node-version warning.
- Real PostgreSQL RAG isolation: 1/1 passed against the target-locked project. The runner verified a fresh 15-table, 162-column backup (1,491 rows, including 7 knowledge-base rows), exercised tenant/global/model/legacy/write checks, and verified cleanup. The seven legacy rows remained unclassified.
- Real PostgreSQL application E2E: 5/5 passed. Marketing Plan generation/refinement completed with free-only flags; RAG embedding eligibility was unconfirmed, retrieval returned no context, and plan generation proceeded. Synthetic test fixtures were cleaned.
- Real browser E2E: exited successfully with zero workflow failures, unexpected API errors, browser errors, or React warnings. `PA_REAL_DB_BROWSER_SKIP_AI=true` skipped Marketing Plan/image/Quick Editor AI workflows to avoid another Cloudflare image request; the browser still exercised the other UI and database workflows. Synthetic fixtures were cleaned after signed-avatar URL expiry.
- Connectivity investigation was triggered by a sandbox P1001-style failure. A read-only check of the verified direct target succeeded outside the sandbox; the real test runners then passed outside the sandbox. No Supabase connection settings were changed.
- Node environment: `.nvmrc` specifies 22.23.3 and the frontend engine range requires Node >=22.12 <27. The shell default remains Node 20.18.0; Node 22.23.3 was used from the local npm cache, with no system-wide change.
- No migration was executed during this rerun. No paid inference or Cloudflare image generation was used. No commits, pushes, merges, PRs, or deployments were made.
