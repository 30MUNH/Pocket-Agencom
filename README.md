# Pocket Agencom

Pocket Agencom is an AI-powered marketing-management SaaS for small businesses. It combines campaign planning, content generation, staff review, scheduling, media management, social/e-commerce analytics, and budget tracking in one React–Express application.

## Stack

- React 19, Vite, Tailwind CSS, React Router, TanStack Query, and Zustand
- Node.js, Express, Prisma, PostgreSQL with pgvector, and Supabase Storage
- Google Gemini for structured plans, detailed posts, image-aware generation, and embeddings

Active application roles are `user`, `staff`, and `admin`. The `archived` account status is non-authenticating; middleware reloads the user and status from PostgreSQL for every protected request.

## Local setup

Use Node.js 22.23.3 (as specified in `.nvmrc`) and PostgreSQL with the `vector` extension. Run `nvm use` before installing dependencies or starting the app.

```bash
npm run install:all
cd backend
npx prisma generate
cd ..
npm run dev
```

Configure `backend/.env` with `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and optional test-only Gemini/Supabase credentials. Configure `frontend/.env` with `VITE_API_URL=http://localhost:5000/api`.

Do not use `prisma db push` for this project. Follow [deployment-guide.md](deployment-guide.md) for fresh and existing database migration paths. The destructive demo seed refuses to run unless `ALLOW_DESTRUCTIVE_SEED=true`; use it only with an approved disposable database.

## Validation

```bash
cd backend && npm test && npm run check && npx prisma validate && npx prisma generate
cd ../frontend && npm test && npm run lint && npm run build
cd .. && npm run check:domain-removal
```

External Gemini/RAG and Supabase Storage smoke tests require explicitly identified test credentials and are not part of the default test commands.

## Retained product areas

- Registration, login, profiles, and role-based access
- AI plan generation, plan history, save/delete, and staff/admin review
- Text and image-aware post generation, RAG retrieval, and knowledge-base embeddings
- Content scheduling, media assets, uploads, analytics, social/e-commerce links, and budgets

See [INTEGRATION.md](INTEGRATION.md) for application contracts and [ai-architecture.md](ai-architecture.md) for the AI data flow.

## SePay VA payments

The `/upgrade` page supports bank-transfer checkout through a shared SePay MBBank VA, authenticated webhooks, transaction deduplication, cancellation of unpaid orders, and persisted subscriptions. Users need an active paid subscription to generate Marketing Kits. Starter allows three completed kits per 30-day cycle; Pro/Advanced have no kit cap. Daily AI safety limits still apply. Follow [docs/SEPAY_SETUP.md](docs/SEPAY_SETUP.md) for the complete Supabase SQL file, local HTTPS tunnel, webhook settings, and frontend/backend configuration.
