# MicroJobs

Module 1: accounts, student verification, portfolios and administration, presented inside a student-focused marketplace UI. Built with Next.js App Router, HeroUI v3, Better Auth, Neon PostgreSQL and Drizzle ORM.

## Local setup

Use Node.js 22.12+ (Node 24 recommended).

```sh
npm ci
cp .env.example .env.local
```

Set the following in `.env.local` (never commit actual credentials):

| Variable                                   | Purpose                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`                             | Neon PostgreSQL connection string for your development branch                             |
| `BETTER_AUTH_URL`                          | Exact application origin, e.g. `http://localhost:3000`                                    |
| `BETTER_AUTH_SECRET`                       | High-entropy secret, at least 32 characters; generate with `openssl rand -base64 32`      |
| `EMAIL_VERIFICATION_ENABLED`               | `false` now; set `true` after Resend is ready, then restart the app                       |
| `RESEND_API_KEY`                           | Resend API key for transactional verification and password-reset emails                   |
| `EMAIL_FROM`                               | Sender on a verified Resend domain, e.g. `MicroJobs <accounts@example.com>`               |
| `STORAGE_DRIVER` | `local` (default): private files in `storage/uploads/`; `s3`: optional bucket storage |
| `S3_ENDPOINT`                              | Your S3-compatible endpoint (R2 example: `https://<account-id>.r2.cloudflarestorage.com`) |
| `S3_REGION`                                | `auto` for R2, your storage region otherwise                                              |
| `S3_BUCKET`                                | A private bucket for portfolio images/PDFs and university-ID images                       |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Credentials scoped to this bucket                                                         |

Then apply the checked-in migrations to the intended development database:

```sh
npm run db:migrate
npm run dev
```

Open http://localhost:3000. With `EMAIL_VERIFICATION_ENABLED=false`, register and sign in without an email link. Set it to `true` and restart the app to require email verification; configure Resend first. Existing accounts remain unverified until they use the resend link. Password recovery still needs Resend. Real account flows require Neon; uploads use private local storage by default (no S3 credentials needed). Missing integrations display unavailable states; there is no fake login or silent in-memory production database. The public marketplace listing previews use a separate, clearly labeled static demo dataset.

The Neon WebSocket Pool driver is used because account moderation, reviews and portfolio ordering need interactive PostgreSQL transactions. Deployment requires a Node.js runtime with outbound access to Neon and Resend, plus persistent writable disk for local uploads (or an S3 endpoint when selected). Set `BETTER_AUTH_URL` to the production HTTPS origin before deployment.

## First administrator

Register an ordinary account first. When email verification is enabled, verify that account before promotion. An authorized operator then runs:

```sh
npm run admin:promote -- your-verified-email@example.com
```

This promotes the existing active account, writes an audit event, and revokes existing sessions. Log in again. No public registration field or user-facing route grants administrator access. Administrators cannot suspend themselves or another administrator from the dashboard.
Open `/admin` directly to enter the panel. If signed out, the route sends you to the login form and returns you to `/admin` after sign-in; accounts without administrator access are sent to the restricted page.

## Features

- Email/password registration and login; env-controlled email verification (currently off), resend links when enabled, password recovery/reset with Resend, logout and owner-only session revocation.
- One ordinary account can switch between Student and Employer workspace modes. Mode is a preference, never an administrator permission. Portfolio ownership remains available in both modes.
- Profile editing with server validation and allowlisted fields.
- University-ID image submission with explicit versioned consent; independent administrator approval/rejection; rejected applicants can resubmit; one pending/approved request per account. Only approved university-ID review creates the Verified Student badge. Email verification alone does not.
- Portfolio create/edit/delete/reorder; private by default; explicitly public items appear at `/users/<user-id>/portfolio`. Projects support descriptions, tags, month, external work-sample links, and one JPEG/PNG image or PDF certificate/work sample per item.
- Admin overview with real database totals, user-mode and open-case counts, rolling seven-day activity compared with the preceding seven days, paginated user search/status filtering, suspend/restore with reasons, pending verification queue and recent audit events. Members can submit account reports/disputes from public portfolios and track their cases at `/cases`; admins filter, review and decide them at `/admin/reports` and `/admin/disputes`, with reasons and audit events. Job-linked moderation still needs the later shared job model.
- Student marketplace UI with search, category browsing, service cards/details, opportunity cards/details, student storefront, project brief composer, sample orders and message threads. Data comes from `lib/demo-marketplace.ts` and is labeled preview/demo. Search, filters and local brief preview work; publishing, booking, applications, hiring, reviews, messaging and payments are not enabled. Generated card images are local assets under `public/images/marketplace/`.

## Local uploads

For the university demo, use `STORAGE_DRIVER=local` in `.env.local` and restart the server. Uploads create `storage/uploads/` automatically, outside `public/` and ignored by Git. The existing media API checks permissions before returning file bytes; private ID reads remain audited. Back up this folder alongside the database. No database migration is needed for this change.

New local records use a `local:` storage-key prefix. Existing S3 records still use S3 credentials; changing drivers does not migrate old files. Optional `STORAGE_DRIVER=s3` retains the bucket adapter. Local storage requires persistent disk on the machine running Next.js.

## Security and storage behavior

Better Auth owns the `users`, `accounts`, `sessions` and `verifications` auth models. Its default scrypt password hashing and HttpOnly session cookies are retained. Sessions use Better Auth's native token schema (not the original DBML's custom hashed-token/device schema); cookie caching is disabled, and protected application requests re-read current account status. Password reset revokes sessions. Reset verification identifiers are hashed. Auth rate limits use database storage, including in development. If deploying behind a proxy, verify its trusted client-IP forwarding configuration before relying on per-IP limits.

App mutations verify request origin, session, current account status, input and ownership/admin access. Database enum/unique/foreign-key constraints complement these checks. Reviews and account moderation commit their business state and audit history in one transaction. Sensitive values are never included in public portfolio queries.

Local files remain outside the public directory and are returned only after owner/admin or published-portfolio authorization. Optional S3 bucket objects also stay private; the application issues a 60-second signed GET URL after the same authorization. University-ID access creates an audit event. Removing a public item prevents further public access; an already-issued S3 URL can remain usable until its 60-second expiry. Original filenames are not retained. Images are decoded and re-encoded with Sharp to remove metadata and reject malformed input; SVG and HTML uploads are not accepted. Portfolio PDFs are rewritten, limited to 20 pages, and delivered as download attachments; university-ID evidence accepts images only. Limits: 5 MB source file, 25 million input pixels, 2400px output dimensions, and 30 successful uploads per user per rolling day. That quota is a best-effort abuse limit, not a billing guarantee under simultaneous uploads.

University-ID evidence is retained with no automatic deletion in this version, following the supplied retention reference; deletion requests need an operator process. Unattached/replaced portfolio files are also retained and require future cleanup tooling. The application never deletes an object still referenced by verification. The consent notice describes retention. Portfolio content becomes public only through an explicit visibility choice; an account's name/bio can be viewed at its known public portfolio URL. There is no public directory/search index.

Resend calls run with Next.js `after()` so email delivery does not expose account existence through provider response timing. Delivery failures log only a bounded status, never recipients or URLs. Users can resend verification and reset links. Monitor delivery failures in deployment; no durable mail queue/retry worker is implemented.

## Database and checks

```sh
npm run db:generate       # generate migrations after deliberate schema changes
npm run db:migrate        # apply migrations to DATABASE_URL
npm run db:studio         # local database inspection
npm run typecheck
npm run lint
npm test
npm run build
```

If a restricted environment blocks Turbopack's CSS-worker port, use `npm run build -- --webpack`. Do not downgrade Next.js to work around the restriction. Tests use isolated in-memory PGlite (real PostgreSQL semantics) and apply the checked-in SQL migrations; they do not connect to Neon, send emails or upload documents. Auth tests run Better Auth itself; API tests stub only the session boundary and use the real database and route handlers.

## Routes and code map

- `/register`, `/login`, `/forgot-password`, `/reset-password?token=...`: auth UI.
- `/explore`, `/explore/[slug]`, `/opportunities`, `/opportunities/[slug]`: public marketplace previews backed by static demo data, not production marketplace records.
- `/seller/services`, `/projects/new`, `/orders`, `/messages`: marketplace workspace previews. The brief is local-only; listings, orders and conversations are samples without persistence or transaction APIs.
- `/dashboard`, `/profile`, `/verification`, `/portfolio`: protected workspace.
- `/cases`: submit an account report/dispute and view your own case history.
- `/users/[id]/portfolio`: public portfolio (only public items from active accounts).
- `/admin`, `/admin/users`, `/admin/verification`: protected administration.
- `/api/auth/[...all]`: Better Auth's own endpoints; no competing custom login/session system.
- `/api/users/me`, `/api/sessions`, `/api/sessions/[id]`: own profile and session management.
- `/api/portfolio`, `/api/portfolio/[id]`, `/api/portfolio/reorder`: portfolio mutations.
- `/api/verification/student-id`: own student-ID submission/history.
- `/api/admin/users/[id]`, `/api/admin/verification/[id]`: admin decisions.
- `/api/cases`, `/api/admin/cases`, `/api/admin/cases/[id]`: owner case access and admin review.
- `/api/media`, `/api/media/[id]`: authenticated upload and authorized temporary file access.
- `lib/auth-core.ts`: testable Better Auth configuration; `lib/auth.ts`: server integration/email delivery.
- `lib/db/schema.ts`, `drizzle/`: actual PostgreSQL schema and migrations.
- `lib/services.ts`, `lib/http.ts`, `lib/validation.ts`: business transitions, request authorization and input validation.
- `docs/PROJECT_CONTEXT.md`, `docs/MODULE_1_STATUS.md`: decisions, current scope and verification record.

The original report and full DBML are retained under `docs/references/`. They are design references, not migrations. Only Module 1 tables are implemented. No jobs, payments, KYC/liveness, phone OTP, messaging, subscription/referral/prize functionality is enabled. Student verification is not payout identity verification.
