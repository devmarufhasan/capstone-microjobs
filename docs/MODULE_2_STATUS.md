# Module 2 status — Job Marketplace

Last updated: 2026-11-15 (Asia/Dhaka). Implemented on `shibashis-module-2`; the final browse/application UI integration and regression tests are included on this branch.

## Scope decision

The user asked to complete Module 2 for every report feature owner and attached the group report. Module 2 follows the **report workflow** (employer posts → student applies with message/price/delivery time and an optional customized proposal → employer shortlists/declines → employer hires one student). The DBML's fixed-price multi-worker claim, escrow-funded publication, job steps and country targeting are **not** implemented; escrow/payment remains Module 3 (Earning Dashboard) scope.

"Apply for Jobs" and "Job Proposal System" share one `job_applications` record: the quick-apply fields (message, proposed price, delivery days) are required, and the proposal fields (approach, suitability) are optional on the same form.

## Features by report owner

| Feature | Owner | Implemented behavior |
| --- | --- | --- |
| Post a Job | Maruf Hasan All Haddy | `/jobs/new` form; title, description, category, required skills (1–10), budget (৳100–৳500,000, stored as poisha), deadline (today or later), remote/on-site/hybrid + location. Owner can edit while open and close (cancel) the job. Max 20 open jobs per employer. `/jobs` lists the employer's jobs with application counts. |
| Apply for Jobs | Shibashis Das | Public `/opportunities` browse/search (title, description, skills; category filter; sort by newest/budget/deadline); only open, non-expired jobs from active employers. `/opportunities/[id]` detail with apply form: short message, proposed price, delivery days. One application per student per job; no self-application; closed/expired jobs reject applications; max 20 applications per day. |
| Job Proposal System | Shakibur Rahman Akash | Optional approach and suitability fields; student can edit while submitted/shortlisted, withdraw, and resubmit a withdrawn proposal while the job is open. `/applications` shows all of a student's proposals and their status. |
| Hire Students | Maruf Hasan All Haddy | `/jobs/[id]` (owner only) lists applicants with name, bio, Verified Student badge, public-portfolio link, price, delivery time, message and proposal. Shortlist, decline, hire. Hiring locks the job row in a transaction: hired application → `hired`, all other active applications → `rejected`, job → `in_progress` with `hired_application_id`; audit event `JOB_HIRED`. A partial unique index guarantees at most one hired application per job. |

Status models: job `open → in_progress` (hire) or `open → cancelled` (close); `completed` is reserved for Module 3 completion proof. Application `submitted → shortlisted → hired/rejected`, or `withdrawn` by the student.

## Affected paths

- Schema: `lib/db/schema.ts` (`jobs`, `job_applications`, four enums). **Migration not generated** — the user runs `npm run db:generate` then `npm run db:migrate`.
- Rules: `lib/marketplace.ts`; validation in `lib/validation.ts`; display helpers in `lib/job-format.ts`.
- API: `app/api/jobs`, `app/api/jobs/[id]`, `app/api/jobs/[id]/applications`, `app/api/applications`, `app/api/applications/[id]`, `.../decision`, `.../hire`.
- UI: `app/opportunities` (real data; `[slug]` demo route replaced by `[id]`), `app/(workspace)/jobs`, `app/(workspace)/applications`, `components/job-form.tsx`, `components/application-form.tsx`, `components/applicant-actions.tsx`, `JobCard` in `components/marketplace-cards.tsx`. Homepage and dashboard show real open jobs; `/projects/new` redirects to `/jobs/new`; nav labels updated.

## Verification (2026-11-14)

- `tests/module-two.test.ts`: 14 tests against real PostgreSQL (PGlite) through the route handlers, run with `MIGRATIONS_DIR` pointing at a scratch-generated migration: all pass. Covers auth/origin/admin denial, validation, poisha storage, owner-only edit, search/category/skill + wildcard escaping, self-application block, duplicate application, proposal edit/withdraw/resubmit, owner-only applicant view with verified badge and no email exposure, shortlist/decline, concurrent hire (exactly one succeeds), post-hire lockout, job close declining applicants.
- Until the migration is generated into `./drizzle`, the full `npm test` fails only these Module 2 tests (tables missing); Module 1's 35 tests pass.
- `npm run typecheck` and ESLint pass. `next build` compiled and generated all routes, then stopped on a Next.js security-advisory notice (unrelated to this change).
- Not verified: live Neon tables (pending user migration) and in-browser visual checks.

## Not in Module 2 / follow-ups

- Hired-student chat, completion proof, ratings, payments/escrow and earnings are Module 3.
- No notifications (email/in-app) for new applications or hiring decisions.
- Admin job moderation (Module 1 admin dashboard "jobs") is not yet wired to the new `jobs` table.
- Deadline comparisons use UTC calendar dates.
