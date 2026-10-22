# Frontend–Backend Integration

Set `VITE_API_URL=http://localhost:5000/api` in `frontend/.env`. Protected requests send the JWT as a bearer token; the backend verifies the signature and reloads the account from PostgreSQL before authorization.

## Retained API contracts

| Area | Method and endpoint | Roles |
|---|---|---|
| Register/login/profile | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Public / authenticated |
| Business profile | profile endpoints under `/api/auth` | user |
| Plans | `GET /api/marketing-plans`, `GET /api/marketing-plans/:id` | authenticated |
| Plan generation | `POST /api/marketing-plans/generate` | user, admin |
| Post generation | `POST /api/marketing-plans/generate-post` and `/generate-post-with-image` | user, admin |
| Plan lifecycle | `POST /api/marketing-plans/:id/save`, `DELETE /api/marketing-plans/:id` | user, admin |
| Review | `PATCH /api/marketing-plans/:id/review` | staff, admin |
| Scheduling/media | `/api/scheduled-posts`, `/api/media`, `/api/upload` | authenticated |
| Analytics/social | `/api/analytics`, `/api/social-platforms` | authenticated |
| Budgets | `/api/dashboard/monthly-spend`, `/api/campaigns/:id/budget`, `/api/expenses` | authenticated |
| Create payment checkout | `POST /api/payments/orders` | real user |
| Read own payment order | `GET /api/payments/orders/:id` | real user |
| Read own subscription and recent orders | `GET /api/payments/billing` | real user |
| Receive SePay bank transaction | `POST /api/payments/webhooks/sepay` | SePay API Key or HMAC |
| Read server-owned plan catalog | `GET /api/payments/catalog` | public |
| Read subscription access and remaining kits | `GET /api/payments/access` | user |
| Cancel an unpaid order | `POST /api/payments/orders/:id/cancel` | real user, own order |

Registration accepts an omitted role or the literal `user`. Other public role values are rejected. Plan responses expose `hasLegacyContent`; the UI preserves such plan text, labels it historical, and disables automatic reuse. Monthly spending returns `breakdown: { adsSpend, otherSpend }`; `totalMonthlySpend` remains the sum of every retained expense.

## Plan workflow

```text
draft → saved → reviewed → approved
              ↘ need_revision → saved
```

Users create and manage plans through `/marketing-kit` and `/plans`. Staff and administrators use `/plans` and `/staff/plan-review/:id` for review. Unknown and retired frontend URLs render the neutral 404 page; unknown backend routes return the standard JSON 404 contract.

## Verification boundaries

SePay checkout uses server-priced orders and the shared official VA. Subscription activation happens only after authenticated transaction matching, inside the same database transaction as webhook deduplication. Marketing generation requires active payment (402 otherwise); Starter kit usage increments in the same transaction as MarketingPlan creation and rolls back if persistence fails. Setup, SQL, API payloads, reconciliation rules, and daily AI limits are documented in [docs/SEPAY_SETUP.md](docs/SEPAY_SETUP.md). Payment tests use Prisma against disposable in-memory PostgreSQL, not the configured Supabase database.

The automated suites cover route removal, authentication/deactivation, role rejection, historical-plan formatting, expense aggregation, frontend routing, notices, and production compilation. Database migrations require disposable PostgreSQL integration testing. Gemini/RAG and Storage checks are opt-in and must not be reported as verified without test credentials.
