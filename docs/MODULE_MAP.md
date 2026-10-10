# MicroJobs module and schema map

Read [project context](PROJECT_CONTEXT.md) first. Module 1 has a local implementation; see [Module 1 status](MODULE_1_STATUS.md). Modules 2 and 3 remain reference/planned as of 2026-10-10. The original [DBML](references/database-design.dbml) is the detailed field/constraint reference. Groupings below organize existing references; they do not establish an approved implementation order.

## Report requirements and original owners

| Report module                         | Feature              | Original owner        | Schema coverage / gap                                                                            |
| ------------------------------------- | -------------------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| 1. User Management & Trust            | Registration & Login | Shakibur Rahman Akash | Users, sessions, devices, OAuth; role model differs                                              |
| 1                                     | User Verification    | Maruf Hasan All Haddy | Identity/liveness and phone/email timestamps; university verification missing                    |
| 1                                     | Portfolio Showcase   | Shibashis Das         | No portfolio/project/certificate model                                                           |
| 1                                     | Admin Dashboard      | Shakibur Rahman Akash | Review, moderation, enforcement, policy and audit entities; dashboard still needs implementation |
| 2. Job Marketplace                    | Post a Job           | Maruf Hasan All Haddy | Jobs/categories/steps/proofs; skills and local location unspecified                              |
| 2                                     | Apply for Jobs       | Shibashis Das         | Claim participation exists; applications with price/time do not                                  |
| 2                                     | Job Proposal System  | Shakibur Rahman Akash | No proposal model                                                                                |
| 2                                     | Hire Students        | Maruf Hasan All Haddy | No explicit offer/selection/hiring model                                                         |
| 3. Communication, Delivery & Earnings | In-App Messaging     | Shibashis Das         | Support messages exist, buyer-worker chat does not                                               |
| 3                                     | Job Completion Proof | Shakibur Rahman Akash | Participation, immutable submissions, proofs and reviews                                         |
| 3                                     | Ratings & Reviews    | Maruf Hasan All Haddy | Counterparty user reviews                                                                        |
| 3                                     | Earning Dashboard    | Shibashis Das         | Ledger, deposits, quotes, withdrawals and payout attempts                                        |

## Schema domain inventory

| Domain                          | Tables                                                                                                      | Intended behavior                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Accounts and security           | `users`, `user_devices`, `sessions`, `oauth_accounts`, `user_security_events`                               | Registration/profile, device tracking, session revocation, OAuth identity and combined risk evaluation                    |
| Media                           | `media_files`, `media_duplicate_flags`                                                                      | Object metadata, private/public visibility, readiness, checksums, duplicate review signals                                |
| Identity                        | `identity_verifications`, `identity_documents`, `identity_liveness_checks`, `identity_reviews`              | Encrypted identity data, side-specific documents, expiring single-use liveness challenge, administrator decisions         |
| Job definition                  | `job_categories`, `jobs`, `job_countries`, `job_steps`, `job_attachments`, `job_proof_requirements`         | Hierarchical categories, instruction sequence, country targeting and typed evidence requirements                          |
| Job commercial changes          | `job_reward_increases`, `job_promotion_plans`, `job_promotions`                                             | Funded increases and paid time-bounded placement; commercial snapshots remain immutable                                   |
| Search integration              | `search_index_events`                                                                                       | Transactional outbox for job/user updates; leased retries, stale-version rejection; search engine unspecified             |
| Work and delivery               | `job_participations`, `submissions`, `submission_proofs`, `submission_proof_files`, `submission_reviews`    | Capacity reservation, timed work, evidence revisions, review and atomic reward settlement                                 |
| Accounting                      | `ledger_accounts`, `ledger_transactions`, `ledger_entries`                                                  | User available/locked, job escrow, platform revenue and settlement accounts; append-only balanced USD ledger              |
| Deposits                        | `payment_provider_configs`, `deposit_quotes`, `deposit_payments`                                            | Provider capabilities, frozen FX/fees and exactly-once verified credit                                                    |
| Withdrawals and provider events | `payout_methods`, `withdrawal_quotes`, `withdrawals`, `payout_attempts`, `payment_webhook_events`           | Encrypted destinations, quoted payout, fund locking, signature verification, deduplication and reconciliation             |
| Advertisements                  | `advertisement_plans`, `advertisements`, `advertisement_reviews`, `advertisement_daily_metrics`             | Owned banner, validated destination, admin review, wallet debit, scheduling, aggregate clicks/impressions                 |
| Subscriptions                   | `subscription_plans`, `user_subscriptions`                                                                  | Versioned commercial snapshot and server-controlled benefits; overlap/extension policy pending                            |
| Referrals                       | `referral_codes`, `referrals`, `referral_reward_rules`, `referral_rewards`                                  | Opaque codes, first attribution, anti-self-referral checks, qualifying event rewards and ledger posting                   |
| Prize draws                     | `prize_draws`, `prize_draw_tiers`, `prize_ticket_orders`, `prize_draw_winners`                              | Disabled reference feature; immutable ticket purchases, nonoverlapping ranges, auditable selection and once-only payouts  |
| Audit and inbox                 | `audit_events`, `notifications`                                                                             | Transactional business history and owner-only notification projection                                                     |
| Reputation and moderation       | `user_reviews`, `moderation_cases`, `moderation_case_media`, `user_enforcement_actions`                     | Counterparty reviews, contextual reports, evidence and accountable enforcement                                            |
| Account health                  | `account_health_policies`, `user_account_health`, `account_health_events`                                   | Versioned policy, locked/rebuildable projection, idempotent score/warning events and automatic bans                       |
| Support                         | `support_tickets`, `support_ticket_messages`, `support_ticket_participants`, `support_ticket_message_media` | Owner/staff tickets or live support chat, append-only messages, retry keys, participant read state; presence is ephemeral |

## Workflow details to retain

### Accounts, identity and media

Ordinary users can act as buyer and worker in the schema. `access_level` distinguishes administrators, while `preferred_mode` is a UI preference. Public discovery is opt-in. Device/session ownership must be checked in implementation; foreign keys alone do not establish same-user ownership.

Identity states: draft, pending_review, approved, rejected, expired, revoked. Permit rejected-document retries, prevent a document being approved for different users, and allow only one current pending/approved verification per user. Liveness states: issued, submitted, passed, failed, expired. Capture consent, consume challenge once before expiry, and validate face/challenge rather than treating browser recording itself as proof.

Media states: pending, ready, quarantined, deleted. Server-computed checksum is required before ready. Submitted identity links/evidence are immutable; retention must consider every reference. Privacy and ownership checks apply even when files have matching checksums.

### Marketplace and delivery

Job states: draft, pending_review, published, paused, completed, cancelled, rejected, expired. These enum values do not specify every permitted transition; define transition rules when implementing.

Country policy: all_supported, include_only, exclude. Only all_supported permits an empty country list. Jobs store reward, per-approval fee, worker limit, work/review timers, schedule and deadline. Buyer private notes are owner/admin only. Categories can have parents.

Participation states: reserved, submitted, changes_requested, approved, rejected, expired, cancelled. Enforce one participation per job/worker and atomically release capacity on expiration. Claim snapshots reward/fee. Clarify reuse of an expired participation and the policy for rewards on open reservations before implementing those edge cases.

Proof types: text, URL, image, video, file. Every requirement must belong to the same job; all required evidence must be present. Multiple files are allowed within the specified limits. Requesting changes creates a new immutable revision; review only the latest submitted revision, with one immutable decision per revision. Approval commits review, participation transition, escrow debit, worker credit and platform fee together.

Reward increases must fund the difference and use a documented policy for affected reserved/unsubmitted participations. Promotions derive from active paid time ranges and do not override job approval.

### Money

Deposit flow: configured provider → owned immutable quote → accept once before expiry → provider payment → verify settled amount/currency/reference → balanced wallet credit exactly once. Formula from reference: `base_bdt_poisha = floor(credit_usd_cents * exchange_rate_micros / 1_000_000)`; `fee_bdt_poisha = ceil(base_bdt_poisha * fee_bps / 10_000)`; payable = base + fee.

Withdrawal flow: verified owned payout method + current approved identity → immutable quote → atomic quote acceptance and available-to-locked transfer → provider attempt → settlement OR one release on definitive failure. Formula: `gross_bdt_poisha = floor(amount_usd_cents * exchange_rate_micros / 1_000_000)`; net = gross - fee > 0. Use sufficiently wide integer arithmetic. Snapshot destination so subsequent account edits cannot redirect an accepted withdrawal.

Transfer states: pending, processing, succeeded, failed, cancelled, unknown. A timeout/unknown outcome is not a failed payment; keep funds locked and reconcile. Only authoritative terminal failure permits a new payout attempt; network retries reuse the attempt key. Webhooks require verified signatures, unique provider event IDs, one target and out-of-order reconciliation. Payment provider support/contracts and exact fee/rate policy remain unspecified.

### Moderation, growth and support

Health projection is shared across buyer and worker activity. Serialize per-user transitions, clamp scores to policy range and keep active-warning count consistent with enforcement. Score zero or three active warnings creates one automatic ban and synchronizes user status and audit history transactionally. Manual and automated actions have different issuer requirements. Review penalty/recovery rules before using the defaults in a working module.

Advertisements require administrator review and successful payment before activation; revised rejected content needs another review. Subscription entitlements come from stored benefits and active dates, never UI mode. Referral rewards require a qualifying settled event and idempotent ledger posting; price/percentage examples from third-party sites are observations only.

Support messages permit the owner and authorized active staff participants; a last-read message must belong to its ticket. This support schema does not authorize arbitrary users to message one another.

## Dependencies for later module work

These are dependency notes, not an assigned sequence:

- UI work needs HeroUI integration and design/navigation choices.
- Auth/profile work needs account-role, identity-provider and persistence decisions.
- Identity, portfolios, proof and chat attachments depend on authorized media storage.
- Marketplace work needs the proposal-versus-claim decision; paid publication/approval depends on the ledger.
- Real payments require provider setup, secure webhooks and reconciliation; do not label mocks as payment integration.
- Buyer-worker chat, proposals/hiring, skills and portfolio need additions beyond this schema if retained from the report.
- Review timeout behavior, cancellation/refund rules, exact commissions, geographic scope, minimum withdrawal, age/student eligibility, account health penalties and subscription overlap remain product decisions, not inferred defaults.

When a module is requested, read its complete source tables and notes, clarify only the blocking differences, implement the agreed scope, validate appropriate behavior, then update the project context and status.
