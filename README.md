# Pocket Agencom

Pocket Agencom is an AI-powered marketing-management SaaS for small businesses. It combines campaign planning, content generation, staff review, scheduling, media management, social/e-commerce analytics, and budget tracking in one React–Express application.

## Stack

- React 19, Vite, Tailwind CSS, React Router, TanStack Query, and Zustand
- Node.js, Express, Prisma, PostgreSQL with pgvector, and Supabase Storage
- Google Gemini for structured plans, detailed posts, image-aware generation, and embeddings

Active application roles are `user`, `staff`, and `admin`. The `archived` account status is non-authenticating; middleware reloads the user and status from PostgreSQL for every protected request.

## Local setup

Use Node.js 20.19 or newer and PostgreSQL with the `vector` extension.

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
