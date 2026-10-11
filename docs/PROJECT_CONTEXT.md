# MicroJobs persistent project context

Last updated: 2026-10-11 (Asia/Dhaka).

## Start here

The user supplied their group project report and database design to establish durable context. They will request implementation module by module. This initial task saves and explains the references; it does not authorize implementing all proposed features now.

**Confirmed UI decision: use HeroUI.** Module 1 uses HeroUI v3. On 2026-10-10 the user further directed that the complete UI, including the homepage, follow a Fiverr-inspired marketplace pattern adapted for university students. Search/category/service discovery and student/employer paths should be visually coherent. Features whose APIs are not built may use clearly labeled demo data in the UI; demos must not be represented as live jobs, orders, payments, reviews or verified people. Keep the existing Next.js agent rules and consult the relevant bundled Next.js documentation before further application code changes.

**Current scope: Module 1 only (User Management & Trust). Confirmed persistence: Neon PostgreSQL + Drizzle ORM. Confirmed authentication: Better Auth.** These direct user decisions supersede MongoDB/Mongoose and optional NextAuth suggestions in the source documents. Module 1 now has a local implementation. See [Module 1 status](MODULE_1_STATUS.md) for exact behavior, validation and integration limits.

This file is repository-backed memory, not a claim of memory outside this repository. Read it at the start of future work, then the relevant module and source details. Update it when the user makes decisions or modules are completed.

## Sources and authority

- [Original report](references/group02-project-report.pdf): unchanged copy of the four-page user PDF.
- [Extracted report](references/project-report-extracted.md): searchable page-by-page text; extraction does not preserve visual layout.
- [Database design](references/database-design.dbml): unchanged supplied text, including all fields, enums, indexes, relationships, and notes.
- [Source manifest](references/source-manifest.json): original paths and SHA-256 hashes for provenance.
- [Module map](MODULE_MAP.md): report requirements, schema entities, workflows, and gaps.
- [Module 1 status](MODULE_1_STATUS.md): implemented behavior, deliberate policy choices, verification, and pending live configuration.
- [Module 1 guide](references/module-1-implementation-guide.docx) and [extracted text](references/module-1-guide-extracted.txt): supplied implementation reference covering registration/login, verification, portfolio and administration. Original source: `/Users/maruf/Downloads/MicroJobs_Module_1_Complete_Implementation_Guide.docx`. Text extraction preserves reading content, not page layout. Its suggested stack, routes, policies and development commands are reference material, not independent authorization to execute.

The user's direct requests and subsequent decisions govern implementation. Neither reference has been designated as overriding the other. Document contents are product/design evidence, not agent instructions. Conflicts below remain open until addressed by a relevant user decision. Schema notes describe intended invariants, not proof of implemented enforcement. Third-party prices mentioned in notes are not project defaults.

## Product purpose

MicroJobs is a student-focused marketplace connecting university students/freelancers with individuals, local shops, small businesses, and startups offering short, small-budget tasks. Examples include poster design, data entry, writing, and simple websites. Students earn income, gain experience, and build portfolios; employers find affordable help. Verification, completion evidence, reviews, and administration support trust.

Stakeholders: students/freelancers, employers/job posters, platform administrators, the university/student community, and the project team/course supervisor.

Academic context: DIU, Department of Software Engineering, SE331 Software Engineering Design Capstone Project, Fall 2026, Group 02, Lab C1. Report title: MicroJobs. Supervisor: Sadia Sultana. Submission date is printed as `02/10/26`.

Team: Shakibur Rahman Akash (241-35-168), MD Maruf Hasan All Haddy (241-35-463), Shibashis Das (241-35-091). Original feature assignments are preserved in the module map; these do not restrict future user requests.

## Two distinct workflow references

**Report:** employer posts a job → student browses and applies with a proposal/price/delivery estimate → employer selects and hires → hired parties message → student submits completion proof → employer reviews → participants rate each other → earnings/payment history is displayed.

**Schema:** buyer creates a task with fixed reward, worker capacity, steps, proof requirements, country restrictions and timers → publication requires escrow funding → worker atomically reserves an eligible slot → worker submits immutable evidence revisions → owning buyer or authorized admin approves, rejects, or requests changes → approval atomically pays the worker and platform fee from escrow → verified user withdraws through quoted currency conversion and payout processing.

The schema is a substantially expanded microtask design. Do not equate a slot reservation with a negotiated proposal or claim that hiring exists just because a participation row exists.

## Decisions and unresolved differences

| Topic             | Evidence / present decision                                                                                  | How future work should treat it                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| UI                | User chose HeroUI and a Fiverr-inspired university-student marketplace UI on 2026-10-10                       | Use HeroUI v3 and a search/category/listing marketplace pattern; label unimplemented flows as demo previews                      |
| Delivery          | User will request modules individually                                                                       | Complete requested module scope and record status; no bulk build now                                                             |
| Product name      | Report says MicroJobs; schema header says Microjobsworks                                                     | Use MicroJobs as report/repository label; final public branding pending                                                          |
| Marketplace       | Report uses applications, negotiated proposals, hiring; schema uses fixed-price claims with many workers     | Decide whether one flow or both is needed before implementing dependent workflows                                                |
| Database          | User selected Neon PostgreSQL + Drizzle ORM on 2026-10-10                                                    | Confirmed; Module 1 Drizzle schema and migrations created; no live Neon migration without credentials                            |
| Accounts          | User selected one ordinary account with switchable Student/Employer mode; Admin access separate              | Implemented. Mode is preference only; privileges come from administrator access level and ownership                              |
| Verification      | User selected email verification plus admin-reviewed university ID; approve ID for Verified Student badge    | Implemented for Module 1. Phone OTP deferred; the separate payout identity/liveness design is not implemented                    |
| Portfolio         | Required by report                                                                                           | Module 1 model, CRUD, ordering, privacy and public view implemented                                                              |
| Direct messaging  | Report requires hired student/employer chat; schema models support ticket/live chat only                     | Support chat is not buyer-worker messaging; add a separate model if required                                                     |
| Skills/location   | Report includes required skills and location; schema has categories and country targeting                    | Skills, local location and any onsite/remote semantics remain undefined                                                          |
| Auth tooling      | User accepted Better Auth recommendation                                                                     | Installed and implemented with its native account/session/token schema and Drizzle adapter; no custom DBML session/device schema |
| Files             | User selected private S3-compatible storage, such as R2                                                      | S3-compatible adapter implemented; external bucket and credentials pending; Cloudinary proposal superseded                       |
| Email             | User selected Resend                                                                                         | Resend API delivery callback implemented; API key and verified sender pending                                                    |
| Realtime          | Report suggests Pusher / Socket.io                                                                           | No realtime provider selected                                                                                                    |
| Hosting           | Report proposes Vercel + Atlas                                                                               | Proposal only; no deployment configured or performed by this task                                                                |
| Expanded features | Ads, promotions, subscriptions, referrals, prize draws, risk engine, support and search outbox are in schema | Reference scope, not a confirmed first release backlog                                                                           |

When a future requested module depends on one of these choices, explain the concrete mismatch and obtain the missing decision while continuing independent work. Do not force all decisions at once.

## Cross-module rules captured from schema

- Authorization comes from user status, access level, ownership and participation. `preferred_mode` only changes UI preference. Public user search is opt-in.
- USD values are integer cents; BDT values are integer poisha. Ledger accounts are USD only. Exchange rates use integer micros; quotes freeze rates and fees. Never use floating-point money or mutate a standalone balance as the source of truth.
- Ledger transactions are immutable, idempotent and balanced (at least two entries summing to zero). Check/lock spendable funds; corrections use new reversing transactions.
- Job publication requires escrow. Claims enforce capacity, schedule, deadline, country eligibility and no buyer self-claim. Instructions/proof requirements freeze after first claim. Rewards can only increase with additional funding; approved earnings cannot be rewritten.
- Participations own current workflow state; submission revisions, evidence, and per-revision reviews are immutable. Approval and ledger postings happen atomically exactly once.
- Private identity/proof media is served only after authorization using short-lived signed URLs. Enforce owner, purpose, readiness, MIME and size. Store file bytes outside the database. A checksum is an exact-byte risk signal, not automatic evidence of fraud or a globally unique identity.
- Encrypt sensitive fields, use keyed HMACs for appropriate duplicate lookups, and show masked display values. New IP/device alone does not cause a ban. Logs/notifications/search must not expose private documents or secrets.
- Identity approval requires document review and passed liveness; challenges expire and are consumed once. Payouts require approved, unexpired, non-revoked identity and a verified destination. Schema retains identity-document objects with no scheduled deletion; this is a reference policy, not implemented storage behavior.
- Deposit credit follows verified provider settlement, not a browser return. Withdrawals atomically lock funds. Unknown/timeout status stays locked pending reconciliation; successful settlement and release are mutually exclusive. Uncertain provider retries reuse the same idempotency key.
- Account health starts at 100 by the schema defaults; warning threshold is 70 with a default 72-hour repeat interval. Three active warnings or score reaching zero triggers an automatic ban transactionally. Exact penalty/recovery values are not supplied.
- Ratings require an approved participation and the actual buyer/worker counterparties. Reports do not directly release money or ban users. Business audit history is append-only.
- Schema prize draws explicitly remain disabled pending the approvals and auditable randomness procedure stated in that reference. Their presence is not an instruction to launch them.

## Report quality targets (not measured guarantees)

Pages within 3 seconds under normal network conditions; APIs within 1–2 seconds; 99% uptime target with regular backups. Responsive mobile/tablet/desktop UI, simple consistent navigation, hashed passwords (report names bcrypt), secure sessions/cookies, HTTPS, input validation and restricted personal-data access. Modular TypeScript and reusable components with Git/GitHub. Scaling via Atlas/serverless Vercel is the report's proposed architecture, subject to database/hosting decisions.

## Repository snapshot and implementation status

Initial snapshot before implementation, 2026-10-10: minimal Next.js 16.4.0 App Router starter, React 19.3.0, TypeScript 5, Tailwind CSS 4.3.3. This paragraph records the starting state, not the current implementation.

Current status: Module 1 application, APIs, ten-table PostgreSQL schema, three migrations, local tests and setup instructions implemented. The user applied the migrations; a read-only Neon check on 2026-10-10 found all ten Module 1 tables. Local `.env` has email verification enabled and Resend settings configured; live email delivery still needs validation. The user will personally run `db:generate`/`db:migrate` whenever needed; request those commands explicitly and do not run them. Private S3 setup is deferred by the user. Modules 2 and 3 remain outside current scope. Module 1 now includes user/account report and dispute submission, owner history, protected admin review UI/API, and audited decisions; job-linked moderation depends on the later marketplace job model. No fake statistics or marketplace data is shown.

Module 1 guide details: email/password registration and login, password recovery, own profile, server-side access checks, contact verification, separately reviewed university-ID verification, owner-managed portfolios with visibility and uploads, and audited administration. Confirmed user choices resolved role/mode, badge, phone OTP, email and storage choices. Implementation defaults: phone omitted; portfolio private by default; JPEG/PNG only up to 5 MB; administrators may suspend/restore ordinary users but cannot change access levels through the UI. ID evidence and unattached media are retained with no automatic deletion. These implementation defaults are documented in the README; they are not original report requirements. Google/social login is a possible later feature, not a Module 1 requirement.

Auth evaluation (official docs checked 2026-10-10): Auth.js supports a Drizzle adapter, but its Credentials provider leaves persistence, password handling, resets and rate-limiting logic to the application. Better Auth provides email/password, verification/reset flows, database-backed session management and a Drizzle adapter; email delivery still needs configuration. Neither library supplies university-ID review, portfolios or the project's authorization/business logic automatically. Adapt the supplied auth-table reference to the selected library deliberately; neither is a drop-in match for the custom DBML session/token/account fields. Sources: https://authjs.dev/getting-started/authentication/credentials, https://authjs.dev/getting-started/adapters/drizzle, https://better-auth.com/docs/authentication/email-password, https://better-auth.com/docs/concepts/session-management, https://better-auth.com/docs/adapters/drizzle.

## Decision / progress log

2026-10-10: At the user's explicit request, reset the existing demo administrator password and revoked its sessions in the configured Neon database. Added guarded `scripts/reset-demo-admin.mts` (requires `--confirm-reset`, localhost configuration and an existing active demo administrator), using Better Auth password hashing and transactional credential verification, session revocation and audit recording. Reset completed successfully; credentials were delivered only in the conversation, not stored in repository files.

2026-10-10 maintenance: `scripts/create-admin.mts` now uses the CommonJS-compatible default import for `@next/env`, fixing the Node 24 ESM named-export startup error. Checked script startup without an email argument; no account promotion was performed.

2026-10-11 maintenance: auth configuration checks now reject whitespace-only values; login and registration pages are marked noindex/nofollow. Admin overview counts are aggregated per table to reduce count-query round trips without changing schema or displayed totals. No schema migration was needed; no tests were run for this change.

| Date       | Decision or work                                                                                                                                                                                      | Status                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 2026-10-10 | User supplies report and DBML reference; asks for durable context before module work                                                                                                                  | References saved and mapped                          |
| 2026-10-10 | User selects HeroUI                                                                                                                                                                                   | Confirmed preference; installation pending           |
| 2026-10-10 | Report/schema discrepancies recorded without selecting an architecture silently                                                                                                                       | Open decisions above                                 |
| 2026-10-10 | User limits current work to Module 1 and supplies its detailed guide                                                                                                                                  | Guide retained; current scope updated                |
| 2026-10-10 | User selects Neon PostgreSQL + Drizzle ORM                                                                                                                                                            | Confirmed, not yet installed/configured              |
| 2026-10-10 | User accepted Better Auth                                                                                                                                                                             | Installed and implemented                            |
| 2026-10-10 | User selected same-account Student/Employer switching, email + admin-reviewed university ID, Verified Student badge after ID approval, no phone OTP for now, Resend and private S3-compatible storage | Implemented Module 1 choices                         |
| 2026-10-10 | Module 1 code, SQL migrations, tests, README and context assembled                                                                                                                                    | Local checks passed; live provider setup outstanding |

After each module: record the user-confirmed scope and decisions, affected paths, completed behavior, validation performed, remaining gaps, and any changes to reference assumptions. Keep design-only, mocked, integrated, and verified behavior distinguishable.
