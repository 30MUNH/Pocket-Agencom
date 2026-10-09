# KOL/KOC Domain Excision Implementation Plan

> **For agentic workers:** Execute inline with the repository's executing-plans, test-driven-development, and verification-before-completion skills.

**Goal:** Remove the complete KOL/KOC marketplace domain while preserving Pocket Agencom as an AI-powered marketing management SaaS.

**Architecture:** Keep the React–Express–Prisma layers and excise the marketplace vertically. Archive legacy marketplace records into a dedicated PostgreSQL schema, deactivate former KOL accounts, preserve financial totals and historical plan text, and remove all active UI/API access.

**Tech Stack:** React, Vite, Express, Prisma, PostgreSQL/pgvector, Supabase Storage, Gemini.

## Global Constraints

- Preserve unrelated worktree changes and stage only explicit product paths.
- Never run migrations, seeds, restores, or destructive SQL against a configured non-test database without explicit approval.
- Keep user, staff, and admin authentication plus all non-marketplace marketing functionality.
- Preserve historical plan text and financial totals.
- Do not push or create a merge request.

## Tasks

1. Verify Git/database baseline and establish migration safety gates.
2. Add schema history, archive/removal migration, and safe marketing-only seed.
3. Remove backend marketplace modules and adapt shared auth, plans, and budgets with regression tests.
4. Remove frontend marketplace modules and adapt shared routes, navigation, plan views, and spending UI with regression tests.
5. Rewrite product and deployment documentation, scan references, and run complete validation.

## Acceptance

- Removed REST namespaces return 404; removed frontend URLs render a neutral not-found page.
- Active roles are user, staff, and admin; archived former KOL accounts and stale JWTs cannot authenticate.
- AI/RAG, profiles, plans/review, scheduling, media, uploads, analytics, social accounts, and budgets remain functional.
- Prisma checks, backend tests/syntax, frontend tests/lint/build, and reference checks pass, or unavailable external checks are reported precisely.
