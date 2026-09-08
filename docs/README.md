# RepliGrant project specification

> Phase 4 locked build specification. Status is `COMPLETED - SUBMISSION READY`; the active
> deployment and evidence records below are bound to the locked safety,
> evidence, settlement, and lifecycle rules.

## Identity

- Idea ID: `IDEA-027`
- Project name: `RepliGrant`
- Project slug: `repligrant`
- Category: `Projects`
- Status: `COMPLETED - SUBMISSION READY / PORTAL ACTION PENDING`
- Repository: `https://github.com/duclucky/repligrant`
- Target network: `studionet`

## One-sentence product hook

`Fund independent replication evidence, then let validators decide whether a published study truly corroborates or challenges the locked claim.`

## Trust problem

- Decision that must not depend on one party: whether an indexed study is methodologically comparable to the locked claim and whether its reported finding corroborates or challenges that claim.
- Why database/ordinary EVM/backend LLM is insufficient: a sponsor or contributor operating the database/model could widen comparability, suppress contrary evidence, or control the payout; deterministic EVM code cannot interpret cross-study methods and scope.
- Value/rights/access at risk: a sponsor-funded 2 GEN grant purse, two possible 1 GEN contributor credits, and the canonical status/history of the research claim.

## Fingerprint

- Trust problem: neutral qualification of published replication evidence before grant credit and canonical claim status change.
- Actors/adversary: sponsor wants to retain unspent funds; contributor wants a selected paper to qualify for payment; public consumers need a neutral claim history.
- Evidence class + authenticity mechanism: contract-constructed, bounded Europe PMC core-search records from locked PMCID/DOI pairs; fixed authoritative host/query, deterministic identifier/source/binding/freshness/anti-replay checks.
- Consensus question: after objective checks pass, is comparability `SUFFICIENT` or `NOT_COMPARABLE`, and is the finding `CORROBORATES`, `CHALLENGES`, or `UNRESOLVED` for the exact locked scope IDs?
- State machine: round `OPEN -> REVIEWING -> OPEN | COMPLETE | EXPIRED`; submission `SUBMITTED -> QUALIFIED | NOT_COMPARABLE | RETRYABLE`; append-only attempts/history, pull credits, explicit close/refund.
- Direct consequence: a qualifying corroboration or challenge opens exactly 1 GEN contributor credit and deterministically derives `SUPPORTED`, `CHALLENGED`, or `MIXED`; invalid/unavailable evidence moves no GEN or claim state.
- Reuse surface: open/fund round, submit indexed study, request review/retry, close expired round, withdraw credit, and read round/submission/claim/credit views.

## Mandatory gate matrix

| Gate | PASS/FAIL | Evidence/reason |
| --- | --- | --- |
| Replacement | `PASS` | A single database/model operator could bias comparability, claim status, and payout; validator consensus is the lost trust property. |
| Judgment | `PASS` | Method, population, stimulus/endpoint, and conclusion-scope equivalence require semantic judgment. |
| Evidence availability | `PASS` | Europe PMC returned HTTP 200 for `PMC8500892` and `PMC13367721`; a bounded stage/status/length probe separates source from parser/model failures. |
| Evidence authenticity | `PASS` | The contract constructs the Europe PMC query and verifies source identifiers, canonical bindings, deadline, and replay identity before judgment; no actor-supplied URL or digest is trusted. |
| Equivalence | `PASS` | Validators compare coverage, comparability, finding, and exact scope-ID set; rationale wording may differ. |
| Consequence | `PASS` | A qualified result creates a 1 GEN contributor credit and updates canonical claim state. |
| Adversarial | `PASS` | Sponsor and contributor have opposed incentives over qualification and unspent funds. |
| State model | `PASS` | Per-round/per-submission isolation, append-only attempts, locked objective, direct time guards, explicit purse destinations, and no double settlement. |
| Reuse | `PASS` | DeSci treasuries, university grant offices, and biotech evidence programs can call one documented primitive. |
| Contract count | `PASS` | One contract owns the judgment, claim history, purse, and credits; no pass-through consumer is required. |
| Differentiation | `PASS` | Evidence-accumulation rewards and evolving claim state differ from prediction pools, challenge bonds, quarantine, filing triggers, and errata reserves. |
| Claim-to-code | `PASS` | Every product claim has a planned write/state/view/test/UI path; Phase 4 locks the full matrix before code. |
| Full lifecycle | `PASS` | Projects path requires real wallet funding/submission/review/withdraw, transaction lifecycle handling, and canonical reload on Studionet. |
| Scope honesty | `PASS` | V1 judges what authoritative published records report; it does not establish scientific truth, peer-review quality, legal validity, or adoption. |

One FAIL means redesign/reject.

## Actors, roles and incentives

| Actor | Permissions | Value at risk | Incentive to bias |
| --- | --- | --- | --- |
| Sponsor | Open one round with a locked claim and 2 GEN; close after expiry; withdraw unused credit | 2 GEN purse | Prefer narrow qualification or recovery of unspent funds |
| Contributor | Submit an indexed replication ID; request review/retry; withdraw a qualified 1 GEN credit | Time, reputation, and expected 1 GEN credit | Prefer broad comparability and favorable qualification |
| Research consumer | Browse canonical claim status and evidence history | Decision quality | Needs an independently checked state rather than either party's narrative |

## Scope and non-goals

### In scope

- One Europe PMC evidence authority and one locked research-claim profile.
- One sponsor-funded 2 GEN round with at most two unique 1 GEN qualifying credits.
- Authoritative identifier and representation checks before semantic judgment.
- Full browser wallet lifecycle and canonical reads on Studionet.
- Expiry, retry, unspent-purse recovery, pull credits, and withdrawals.

### Out of scope

- No assertion that a publication proves scientific truth or causal validity.
- No legal, clinical, investment, or medical advice.
- No private/paywalled evidence, arbitrary URLs, uploads, screenshots, or claimant-hosted JSON.
- No peer-review-quality score, reputation token, cross-chain value, fiat, or external adoption claim in v1.
- No second contract without an independent state or enforcement boundary.

## Product/frontend blueprint

> Required for Projects. Provisional in Stage 1; finalized in Stage 2 before
> contract implementation.

### Human users and jobs

| User/role | Primary job | Decision or outcome needed |
| --- | --- | --- |
| Sponsor | Define a bounded claim and fund verification without becoming the judge | Know which indexed studies qualify and where every GEN unit went |
| Contributor | Find an open round, submit an indexed replication, and receive credit when it genuinely addresses the claim | Understand eligibility, review/finality, retry, and payout status |
| Research consumer | Inspect a claim's accepted evidence history | Decide whether the canonical record is supported, challenged, mixed, or still untested |

### Provisional contract-capability sketch

| Capability | Human role | User-visible action | Minimum view data | States/finality | Recovery |
| --- | --- | --- | --- | --- | --- |
| Open funded round | Sponsor | Lock claim, original PMCID/DOI, scope IDs, deadline, and 2 GEN | round ID, sponsor, claim, original record, deadline, remaining purse | wallet prompt -> submitted -> accepted/decided -> finalized -> canonical `OPEN` | failed write keeps no app-side canonical state; retry after correction |
| Submit replication | Contributor | Enter PMCID and DOI for a unique indexed paper | source identity, contributor, round status, existing IDs | submitted -> finalized `SUBMITTED` | duplicate/wrong binding rejects without value movement |
| Review/retry submission | Any connected user; contributor is primary | Ask validators to compare authenticated source records | attempt, source stage, public user reason, canonical verdict | submitted -> accepted/decided -> finalized `QUALIFIED`, `NOT_COMPARABLE`, or `RETRYABLE` | source/parser/model failure remains non-penalizing and retryable before deadline |
| Close expired/completed round | Sponsor | Return every unallocated GEN unit to sponsor credit | deadline, outstanding review, remaining purse | finalized `COMPLETE` or `EXPIRED` | premature/duplicate close rejects with accounting unchanged |
| Withdraw credit | Credit owner | Receive 1 GEN qualified credit or sponsor remainder | claimable GEN and last withdrawal status | submitted -> finalized -> zero claimable credit | failure leaves credit canonical and retryable; debit precedes transfer |
| Browse canonical history | Everyone | Search rounds and open claim/submission details | round summaries, claim state, submission timeline, credits for connected account | loading/empty/live/error | retry read; no fixture presented as chain state |

### Information architecture

| Screen/view | User purpose | Primary action | Required states | Mobile behavior |
| --- | --- | --- | --- | --- |
| `/` Home | Understand the value and evidence boundary | Explore open rounds | disconnected, unconfigured, loading, live | Hero stacks vertically; primary CTA remains above fold |
| `/rounds` Explore rounds | Search/filter canonical rounds and revisit prior work | Open a round detail | loading, empty, live, read error | Filter controls wrap; list becomes one-column cards |
| `/rounds/new` New round | Sponsor locks a claim and 2 GEN | Review and fund round | disconnected, invalid fields, signing, submitted, finalized, failed | Single-column labeled form; sticky action does not cover content |
| `/rounds/:roundId` Round detail | Understand claim, evidence history, status, and legal next action | Submit/review/close contextually | loading, missing, open, reviewing, retryable, complete, expired | Summary first; evidence cards and timeline stack |
| `/activity` Activity | Revisit connected account's rounds, submissions, and transaction states | Resume a retryable item | disconnected, loading, empty, live, error | Segmented filters horizontally scroll only within control |
| `/account` Account & credits | Inspect wallet/network and withdraw canonical credits | Withdraw eligible credit or disconnect | disconnected, wrong network, loading, zero credit, withdrawable, pending, failed | Address wraps; account actions remain 44px targets |
| `/help` Evidence guide | Learn eligibility, source authority, status meaning, and honest limits | Return to open rounds | always available; source-links error does not block copy | Readable 65-character measure; anchored sections |

### Visibility matrix

Use exactly one visibility class per row: `USER_PRIMARY`,
`USER_CONTEXTUAL`, or `SYSTEM_ONLY`.

| Function/data group | Visibility | Eligible role/state | User need or reason hidden |
| --- | --- | --- | --- |
| Product value, claim title/status, remaining funded slots | `USER_PRIMARY` | Everyone | Supports discovery and decisions |
| Open-round form and 2 GEN requirement | `USER_PRIMARY` | Connected sponsor | Core sponsor job |
| Submit PMCID/DOI | `USER_PRIMARY` | Connected contributor while round is open | Core contributor job |
| Review, retry, close, withdraw controls | `USER_CONTEXTUAL` | Only eligible role and canonical state | Prevents illegal or confusing actions |
| Evidence authority explanation and Europe PMC links | `USER_CONTEXTUAL` | Everyone on detail/help | Enables independent verification without crowding the journey |
| Transaction phase and human-readable failure/retry reason | `USER_CONTEXTUAL` | Initiating user | Explains submitted, accepted/decided, finalized, failed, retry |
| Raw enum, attempt ID, representation digest, validator output | `SYSTEM_ONLY` | Adapter/tests/evidence | Not needed for normal user decisions |
| Submission packet, reviewer checklist, internal accounting fields | `SYSTEM_ONLY` | Docs/tests only | Must not turn the app into a reviewer console |

### UI action matrix

The following rows are the finalized public interface for the contract and
frontend adapter.

| Visible control | Contract capability/method | Eligible role | Legal state | Input/value | Finality | Failure/recovery |
| --- | --- | --- | --- | --- | --- | --- |
| `Connect wallet` | Discover providers/select account/switch chain | Any visitor | Disconnected | Selected EVM provider | Immediate permission + chain confirmation | Wallet picker remains open on error; no auto-selection |
| `Fund a round` | `open_round(title, claim, original_pmcid, original_doi, scope_ids, deadline)` payable | Sponsor | Connected; valid future deadline | Claim fields + exactly 2 GEN | Accepted/decided then finalized; canonical reload | Failure shows field/transaction recovery; no local fake round |
| `Submit a replication` | `submit_replication(round_id, pmcid, doi)` | Contributor | `OPEN`, before deadline, unique record | PMCID + DOI; 0 GEN | Finalized then submission reload | Wrong/duplicate ID remains unchanged and editable |
| `Review evidence` | `review_submission(submission_id)` nondeterministic write | Connected user | `SUBMITTED` or retryable before deadline | Submission ID; 0 GEN | Accepted/decided/finalized then round reload | `RETRYABLE` explains source/model recovery and enables retry |
| `Close round` | `close_round(round_id)` | Sponsor | `OPEN`/`REVIEWING` with no active slot and `now >= deadline` | Round ID; 0 GEN | Finalized then credit reload | Premature/duplicate close remains unchanged |
| `Withdraw credit` | `withdraw_credit(credit_id)` | Credit owner | Claimable balance > 0 | Credit ID; 0 GEN call; transfer shown in GEN | Parent + child transfer finality and canonical reload | Failed transfer leaves canonical credit retryable |
| `Disconnect` | Clear selected provider/account UI state | Connected user | Any | None | Immediate local UI action | Writes disabled until reconnect; no canonical state deletion |

### User-facing state language

| Canonical status/violation | User-facing label | User consequence/next step |
| --- | --- | --- |
| `OPEN` | Open for evidence | Submit an indexed replication before the deadline |
| `SUBMITTED` | Evidence submitted | Wait for finality, then request review |
| `REVIEWING` | Validators are comparing studies | Keep this page open or return from Activity |
| `QUALIFIED/CORROBORATES` | Qualifying evidence supports the claim | Contributor can withdraw 1 GEN after finalization |
| `QUALIFIED/CHALLENGES` | Qualifying evidence challenges the claim | Contributor can withdraw 1 GEN after finalization |
| `NOT_COMPARABLE` | This study does not test the locked claim closely enough | No payout; find a better-matched study |
| `RETRYABLE` | Evidence could not be verified yet | No value or claim state changed; retry before deadline |
| `SUPPORTED` | Supported by qualifying replication evidence | Inspect the accepted evidence history |
| `CHALLENGED` | Challenged by qualifying replication evidence | Inspect the accepted evidence history |
| `MIXED` | Published replications disagree | Inspect both qualifying records |
| `COMPLETE/EXPIRED` | Round closed | Withdraw available credit; no new submissions |

### Visual preservation constraints

- Visual language/layout to preserve after frontend handoff: the verified `ui-ux-pro-max` design system, typography, color tokens, responsive shell, persistent navigation, evidence-card rhythm, page hierarchy, wallet modal, and route map produced in Phase 3A.
- Allowed functional edits: smallest changes needed to bind final method names, fields, state labels, conditional controls, accessibility, responsiveness, and honest errors under `FE-PRESERVE`.
- System/reviewer details excluded from the primary UI: validator payloads, raw storage/enums, digests, internal IDs, test counts, submission claims, deployment scripts, and private configuration.

## State model

### Stable IDs

- `R-<n>` round IDs, `S-<n>` submission IDs, and `C-<n>` credit IDs are
  contract-issued from append-only counters. IDs never contain caller input or
  wall-clock time and are never reused.
- A submission is bound to exactly one round, contributor address, PMCID, DOI,
  and attempt counter. A credit is bound to exactly one qualified submission or
  one sponsor purse remainder.

### Structured storage

- `RoundRecord` (`@allow_storage @dataclass`): sponsor, title, claim,
  original PMCID/DOI, canonical pipe-delimited scope IDs, deadline, status,
  claim status, purse total/remaining in base units, slot limit, qualified
  count, two bounded submission slots, and creation timestamp.
- `SubmissionRecord`: round ID, contributor, PMCID, DOI, submission status,
  finding, comparability, public reason, attempt number, and created/updated
  timestamps. The round's two submission slots keep v1 bounded and isolated.
- `CreditRecord`: owner, round ID, submission ID, kind (`CONTRIBUTOR` or
  `SPONSOR_REFUND`), amount in base units, status (`CLAIMABLE` or `WITHDRAWN`),
  and creation timestamp.
- Append-only `round_ids`, `submission_ids`, and `credit_ids` arrays plus
  `rounds`, `submissions`, and `credits` `TreeMap[str, Record]` stores provide
  canonical enumeration and O(1) ID lookup without a raw JSON registry.

### State machine

```text
Round: OPEN --review--> REVIEWING --qualified/second-slot--> COMPLETE
Round: OPEN --deadline + close/sponsor--> EXPIRED
Round: REVIEWING --review result--> OPEN | COMPLETE
Submission: SUBMITTED --review--> QUALIFIED | NOT_COMPARABLE | RETRYABLE
Submission: RETRYABLE --retry review--> QUALIFIED | NOT_COMPARABLE | RETRYABLE
Credit: CLAIMABLE --owner withdraw--> WITHDRAWN
```

### Temporal entrypoint rules

> Phase and clock are independent. Every time-bounded public write must enforce
> its own exact interval. State the equality boundary and stale-phase behavior
> for each affected method.

- Canonical transaction-time source: `gl.current_time()` read at the start of
  every time-sensitive public write. No phase flag substitutes for the clock.
- Default/exception interval semantics: the submission/review window is
  `now < deadline`; equality is late. `close_round` may run only when
  `now >= deadline`, unless the round is already `COMPLETE` (then it rejects as
  already closed).
- Entrypoint-local deadline/expiry guards: `submit_replication` requires
  `OPEN` and `now < deadline`; `review_submission` requires `SUBMITTED` or
  `RETRYABLE` and `now < deadline`; `close_round` requires sponsor, no active
  submission, and `now >= deadline` for expiry. `open_round` requires a future
  deadline (`deadline > now`).
- Recovery/cancellation caller + state + time + actor-interest conditions:
  only the sponsor can close its round; it cannot close while either bounded
  slot is `SUBMITTED`/`RETRYABLE`; only a contributor/any connected reviewer
  can request review; only the credit owner can withdraw a `CLAIMABLE` credit.
  A retry never moves value and cannot reset a qualified or not-comparable
  submission.

### Illegal transitions

- A non-sponsor cannot open/close a round; a non-contributor cannot withdraw a
  contributor credit; a duplicate PMCID or DOI in the same round, invalid
  scope/identifier, second review of a terminal submission, review after the
  deadline, premature close, and close with an active submission all revert
  before storage or accounting changes.
- A `RETRYABLE` source/parser/model outcome never changes claim status or purse
  balance. A qualified result cannot be downgraded, and a credit cannot be
  double-settled or withdrawn twice.

### Authorization

- `open_round` is payable and uses `gl.message.sender` as sponsor. `close_round`
  checks the stored sponsor. `withdraw_credit` checks the stored credit owner.
  `submit_replication` records the caller as contributor. `review_submission`
  permits any non-zero connected account but has no caller-controlled evidence
  or consequence parameters; source URLs and policy are contract-derived.

### Idempotency and double-action prevention

- Stable IDs and bounded slots prevent duplicate round submissions. Terminal
  submission statuses reject repeat settlement. Credit status is debited to
  `WITHDRAWN` before the external transfer. Failed transfer leaves a
  `CLAIMABLE` credit only if the runtime reverts; a successful finalized child
  transfer plus zeroed credit is the only terminal withdrawal evidence.

## Write-method safety matrix

> Required before contract implementation. Every state-changing or
> value-affecting write method must have a row. Treat cancel, refund, retry,
> settle, withdraw, close, restore, and recover as high-risk transitions, not
> helper functions.

| Method | Caller | Allowed states | Forbidden states | Temporal/expiry gate | Idempotency | Value/accounting effect | Views affected | Negative tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `open_round(title, claim, pmcid, doi, scope_ids, deadline)` | Any caller; caller becomes sponsor | none; payable | malformed/empty fields, duplicate IDs, deadline not future, value != 2 GEN | `deadline > now`; equality rejected | New `R-n` only; no retry with same ID | Receives exactly 2 GEN; purse total/remaining = 2 GEN | round list, round view, sponsor activity | wrong value, duplicate source, stale deadline, malformed scopes, non-payable call | `tests/direct/test_round_guards.py` |
| `submit_replication(round_id, pmcid, doi)` | Any connected contributor | `OPEN`, `now < deadline`, empty slot | closed/reviewing, late/equal deadline, duplicate PMCID/DOI, invalid source ID | `now < deadline`; equality rejected in this method | One submission ID per empty bounded slot | No value; records contributor | round view, submission view | unauthorized impossible caller, late/equal, duplicate, third slot, wrong round | `tests/direct/test_submission_guards.py` |
| `review_submission(submission_id)` | Any connected non-zero account | `SUBMITTED` or `RETRYABLE`, `now < deadline` | terminal, wrong round state, late/equal, invalid source/auth fields | `now < deadline`; equality rejected | Attempt increments; terminal result cannot repeat | No value on all result/error paths | submission, round claim status, optional 1 GEN credit | source 404, missing PMCID/DOI binding, prompt injection, malformed verdict, disagreement | `tests/direct/test_review_guards.py` |
| `close_round(round_id)` | Stored sponsor only | `OPEN`/`REVIEWING` after deadline, or deterministic complete path | non-sponsor, before/equal? equality is allowed here (`now >= deadline`), active slot, already closed | `now >= deadline`; stale phase does not bypass active-slot check | Terminal close rejects; no duplicate refund credit | Remaining purse becomes one sponsor refund credit; round purse becomes zero | round, credit, activity | wrong caller, early/equal/late, active submission, duplicate close, accounting | `tests/direct/test_close_refund.py` |
| `withdraw_credit(credit_id)` | Stored credit owner | `CLAIMABLE` | wrong owner, zero amount, withdrawn, wrong credit | `N/A` — withdrawal is not deadline-bound; credit remains claimable until withdrawn | Status debited before child transfer; repeat rejected | 1 GEN contributor or remainder transfer; credit amount becomes zero | credit view, account credit view, transfer evidence | wrong owner, duplicate, zero, child transfer failure, balance mismatch | `tests/direct/test_withdrawal.py` |

No write method may be implemented while its row has a blank or vague safety
cell. A genuinely non-temporal method records `N/A` with a reason in
`Temporal/expiry gate`.

## Frontend lifecycle coverage matrix

> Required for Projects. Every claimed browser workflow step must have a
> frontend wrapper/control/test/finality/canonical-reload path. Script-only
> steps must be marked pending and not claimed as browser-complete.

| Canonical state | User action | Contract write | UI component | Frontend test | Evidence status |
| --- | --- | --- | --- | --- | --- |
| `OPEN` | Submit a unique PMCID/DOI | `submit_replication` | Explore card/detail form | `frontend/src/adapter.test.ts` + `frontend/src/adapter-lifecycle.test.ts` | implemented; canonical Studionet round exists |
| `SUBMITTED` | Request validator review | `review_submission` | Review action on detail/activity | `frontend/src/adapter-lifecycle.test.ts` | implemented; retry and finality phases covered |
| `QUALIFIED` | Inspect finding and credit | deterministic settlement in `review_submission` | status badge, timeline, credit banner | adapter reload path + phase-8 canonical reads | verified on Studionet `QUALIFIED` / 1.00 GEN |
| `NOT_COMPARABLE` / `RETRYABLE` | Read non-penalizing outcome or retry | `review_submission` retry path | explicit reason and retry control | adapter lifecycle test + direct unavailable-source test | retry path verified; no-value consequence |
| `COMPLETE` / `EXPIRED` | Sponsor closes/recovers remainder | `close_round` | contextual close button | `frontend/src/adapter-lifecycle.test.ts` | implemented; deadline gate and finality handled |
| `CLAIMABLE` | Withdraw a finalized credit | `withdraw_credit` | account/activity withdraw button | adapter write boundary + canonical reload path | verified on Studionet withdrawal; 0.00 GEN after |

## Evidence policy

- Authoritative sources: Europe PMC core-search endpoint for the contract-built
  PMCID query; DOI is a required cross-identifier but never a user-hosted URL.
- Provenance/authentication: the source controller is Europe PMC, not the
  sponsor or contributor. The contract derives the URL from the PMCID,
  requires the PMCID and DOI to appear in the fetched record, and checks the
  record's canonical identifier fields before semantic judgment.
- Authorized attestor/signer: Europe PMC publication metadata is the authority;
  no actor-provided signature is accepted. Missing or contradictory authority
  fields are non-penalizing `RETRYABLE`.
- Anti-replay event/digest identity: `(round_id, submission_id, attempt)` and
  the unique PMCID/DOI binding; terminal submission status prevents reuse.
- Signed timestamp bounds: N/A for the authoritative publication record; the
  contract enforces the round deadline and a live fetch per attempt.
- Immutable policy/source version URLs and hashes: policy is contract source
  and locked field schema; API host/path is a literal allowlisted constant.
- Allowed schemes/domains/paths: `https://www.ebi.ac.uk/europepmc/webservices/rest/`
  plus the contract-built `search?query=PMCID:<id>&format=json&pageSize=1&resultType=core`
  query; no arbitrary URL or redirects are accepted by calldata.
- Time/window rules: source review only while `now < deadline`; close only at
  `now >= deadline`. Equality is late for submissions/reviews.
- Size/count bounds: title/claim/scope/identifier strings have bounded lengths;
  max two submissions per round; fetched text is truncated to a bounded
  prompt size and source stage/status failures are explicit.
- Missing evidence: `RETRYABLE`, no credit and no claim-state change.
- Contradictory evidence: deterministic binding failure is `RETRYABLE`; a
  semantically challenging but authentic record is `QUALIFIED/CHALLENGES`.
- Unavailable source: `RETRYABLE`, no value movement.
- Invalid/unverifiable attestation: N/A signature path; invalid authority
  fields map to `RETRYABLE`, never a payout.
- Canonical objective/policy source and hash: locked PMCID/DOI/scope fields in
  `RoundRecord`, contract allowlisted endpoint, and source identifier checks.
- Workflow/entity, step/requirement, actor/subject binding: round ID, submission
  ID, contributor, locked scope IDs, and exact source identifiers are included
  in the review prompt and deterministic post-check.
- Prompt-injection boundary: fetched paper text is quoted as untrusted evidence;
  it cannot redefine status enums, purse rules, source URLs, scope IDs, or
  caller/authority. The model may only return bounded comparability/finding and
  a short rationale.
- Private/unverifiable evidence excluded: paywalled pages, arbitrary URLs,
  uploads, screenshots, claimant JSON, and self-reported logs are rejected.

A commit hash or SHA-256 digest proves byte stability only. It does not prove
the underlying real-world fact is authentic.

### Evidence Authority Matrix

| Consequential claim/fact | Evidence/artifact | Data controller | Authoritative source/issuer | Deterministic verification | Canonical objective/entity/actor binding | Freshness/anti-replay | Semantic role after verification | Non-penalizing failure state | Consequence blocked | Required negative test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A replication qualifies for 1 GEN | PMCID/DOI core-search record | Europe PMC; contributor controls only identifiers | Fixed Europe PMC query plus PMCID/DOI fields in fetched JSON | PMCID/DOI binding and allowlisted host/path checked before prompt | Round's locked original claim/scope, submission ID, contributor, and attempt | Unique PMCID/DOI per round; terminal status and attempt counter | LLM judges comparability and finding only after objective gate | `RETRYABLE` | Credit creation, claim status update, and purse decrement | Body from wrong host, missing DOI, wrong PMCID, replayed submission, prompt injection, unavailable source |

Every actor-controlled evidence path that can affect transfer, payout, credit,
settlement, slashing, quarantine, routing, access, or rights needs one complete
row. No cell may be blank or vague. If an interested actor controls all fetched
bytes and no independent authority verifies the consequential claim, Evidence
authenticity is `FAIL` and implementation must not start.

No consequential fact may rely only on actor-controlled public bytes,
claimant-hosted JSON, screenshots, self-reported logs, commit hashes, SHA-256
digests, or LLM judgment that a signature "looks valid". If deterministic
authentication is absent or invalid, the consequence must be
`UNVERIFIABLE`/`RETRYABLE`/non-penalizing.

At least one negative test per consequential evidence class must keep the
bytes and digest valid while making provenance actor-controlled, incorrectly
bound, replayed, stale, future-dated, or wrong-version. The test must prove that
GEN accounting, settlement, access, routing, quarantine, and other hard state
remain unchanged except for an explicit non-penalizing retry/unverifiable
record allowed by the state machine.

## Consensus design

### Leader task

- Inputs: locked round claim/scope/original PMCID+DOI and submitted PMCID+DOI;
  no caller-supplied URLs or payout labels.
- Fetch: inside the nondeterministic leader function, fetch both records from
  the literal Europe PMC core-search endpoint with bounded response size.
- Extraction: verify HTTP success, source PMCID and DOI fields, then extract a
  bounded title/abstract/method/results representation; never pass unbounded
  HTML or arbitrary instructions to the model.
- Normalization: uppercase enum fields, trim whitespace, require exact locked
  scope-ID set coverage, and cap the rationale to a public short reason.
- Structured output: `{"comparability":"SUFFICIENT|NOT_COMPARABLE",
  "finding":"CORROBORATES|CHALLENGES|UNRESOLVED", "reason":"..."}`.

### Consensus-critical fields

| Field | Type/bounds | Comparison rule | Why critical |
| --- | --- | --- | --- |
| `comparability` | enum; exact two values | leader and independent validator must agree exactly | gates any credit |
| `finding` | enum; three values | leader and validator agree only after objective source checks | derives claim status |
| `covered_scope_ids` | sorted, exact locked set | derived by contract/parser, not trusted from prose | prevents missing/extra requirements |
| `source_bound` | boolean from deterministic checks | must be true in both runs | blocks unauthenticated payout |
| `reason` | bounded string | wording may differ and is never used for settlement | user explanation only |

### Validator

- Independent evidence/replay: validator reruns the same fixed-source fetch,
  objective identifier checks, normalization, and semantic task; it does not
  trust leader text alone.
- Semantic rule: `comparability` and `finding` must agree exactly; rationales
  can differ. Validator checks meaning against the locked claim and scope.
- Rejection conditions: missing/extra scope, wrong PMCID/DOI, wrong host/path,
  malformed JSON, invalid enum, source unavailable, or leader/validator
  disagreement rejects consensus and maps to non-penalizing `RETRYABLE`.
- `UNDETERMINED` handling: model uncertainty returns `UNRESOLVED` only when
  source binding and scope coverage are valid; source/model/parser failure is
  `RETRYABLE` and never creates a credit.

### Rationale policy

- Rationale is truncated, user-visible, and explicitly non-authoritative. The
  contract stores only a short reason after deterministic field validation.
  Raw source text, prompts, validator payloads, and digests remain system-only.

## Consequence and accounting

| Verdict | Canonical state change | Consumer action | Value movement |
| --- | --- | --- | --- |
| `SUFFICIENT + CORROBORATES` | submission `QUALIFIED`; claim `SUPPORTED`; round remains `OPEN` unless second slot fills; create one 1 GEN contributor credit | Contributor can withdraw after finality; consumers see accepted source | Decrement purse by 1 GEN; create claimable credit |
| `SUFFICIENT + CHALLENGES` | submission `QUALIFIED`; claim `CHALLENGED` or `MIXED`; same slot/credit rule | Contributor can withdraw; consumers inspect finding | Decrement purse by 1 GEN; create claimable credit |
| `SUFFICIENT + UNRESOLVED` | submission `QUALIFIED`; claim becomes `MIXED` only if another accepted finding conflicts; credit still follows qualification | Contributor sees unresolved accepted evidence | Decrement purse by 1 GEN |
| `NOT_COMPARABLE` | submission `NOT_COMPARABLE`; claim/purse unchanged | No credit; contributor can submit elsewhere | No movement |
| source/parser/model failure | submission `RETRYABLE`; round returns `OPEN` | Retry before deadline | No movement |

- Accepted/finalized boundary: only after the nondeterministic write finalizes
  and deterministic settlement invariants pass; the UI reloads canonical views.
- Ledger invariant: `purse_total = sum(contributor credits created) +
  round.purse_remaining + sponsor refund credits`; no credit exceeds 1 GEN and
  `qualified_count <= 2`.
- Child-message/transfer evidence: withdrawal debits the credit first, emits a
  child transfer to the owner, then deployment evidence reads parent/child
  finality and owner balance delta. A parent receipt alone is insufficient.
- Withdrawal/settlement: pull-based credits; no automatic transfer in review.
  Failed transfer reverts and preserves claimable state.
- Cure/appeal/restore: no v1 appeal or slash; `RETRYABLE` is the only cure path
  before deadline, and a broken revision is abandoned under the documented
  replacement exception rather than funded again.

## Reusable interface

### Write methods

- `open_round(title, claim, original_pmcid, original_doi, scope_ids, deadline)`
  payable, exactly 2 GEN.
- `submit_replication(round_id, pmcid, doi)`.
- `review_submission(submission_id)`; same method is the retry path for
  `RETRYABLE` before deadline.
- `close_round(round_id)`; sponsor expiry/refund path.
- `withdraw_credit(credit_id)`; pull transfer to stored owner.

### View methods

- `get_round(round_id) -> str` canonical JSON view.
- `list_rounds() -> str` bounded summaries from append-only IDs.
- `get_submission(submission_id) -> str` and `get_round_submissions(round_id) -> str`.
- `get_credit(credit_id) -> str` and `get_account_credits(account) -> str`.
- `get_activity(account) -> str` derived from canonical IDs, never local storage.

### Consumer/callback

- Authentication: no consumer callback in v1; EOA transfer uses the stored
  credit owner and the EVM recipient boundary.
- Idempotency key: credit ID plus `CLAIMABLE` status; submission ID plus attempt.
- Failure/retry: child transfer failure reverts the debit; a finalized credit
  remains claimable and can be retried.
- Authorized cancellation: sponsor close is the only cancellation/refund path;
  no callback can bypass contract state.

## Threat model

| Threat | Attack | Mitigation | Test |
| --- | --- | --- | --- |
| Sponsor edits claim after funding | Attempts to alter objective or scope | Immutable `RoundRecord` fields after open | direct locked-field test |
| Contributor submits duplicate evidence | Reuses a qualifying paper for a second credit | Per-round unique PMCID/DOI and two bounded slots | duplicate submission test |
| Malicious leader JSON | Valid shape but wrong scope/finding | independent validator rerun + enum/coverage invariants | malicious leader tests |
| Prompt injection in paper | Text says to ignore claim/payout rules | paper is untrusted quoted evidence; model output is bounded | injection fixture test |
| Forged or wrong-source record | Contributor controls a URL/DOI mismatch | contract constructs allowlisted URL and checks PMCID/DOI fields | valid-body wrong-provenance tripwire |
| Replay terminal review | Replays same submission to mint twice | terminal status, attempt, and credit uniqueness | duplicate review/settlement test |
| Sponsor closes with active review | Recovers funds while submission is unresolved | close checks both bounded slots and exact deadline | active-close test |
| Unauthorized withdrawal | Steals a credit | owner address check and debit-before-transfer | wrong caller test |
| Child transfer ambiguity | Parent finalized but recipient not paid | child receipt and balance delta evidence; credit remains on failure | transfer parser/balance test |

## Test plan

- Happy path: 2 GEN open -> unique submission -> objective source gate ->
  corroborates/challenges/unresolved -> 1 GEN claimable credit -> withdrawal.
- Unauthorized: sponsor-only close, owner-only withdrawal, invalid caller state.
- Isolation: two rounds and two submissions cannot share fields, slots, purse,
  claim status, or credit IDs.
- Evidence failure: 404, missing PMCID/DOI, wrong host/path, oversize,
  contradictory source, and unavailable endpoint map to `RETRYABLE` with zero
  accounting delta.
- Malicious leader: valid-shape wrong finding, missing/extra scope, duplicate
  IDs, invalid enum; validator rejects before settlement.
- Prompt injection: source text attempts to redefine policy, payout, or enums;
  deterministic policy wins.
- Semantic mismatch: independent validator disagrees on comparability/finding;
  no hard state or value change.
- Verdict classes: corroborates, challenges, unresolved, not comparable,
  retryable, and mixed claim aggregation.
- Duplicate: duplicate PMCID/DOI, repeated review, repeated close, repeated
  withdrawal, and repeated transfer receipt.
- Recovery/value write safety: boundary-1, exact-boundary, boundary+1 for every
  time-bounded write, stale phase, active review close, and retry.
- Accounting/value: exact 2 GEN receive, two 1 GEN maximum credits, refund of
  remainder, debit-before-transfer, and zero orphaned purse.
- Cure/restore: retryable review before deadline; broken revision replacement
  retains explicit abandoned status and no further funding.
- Consumer enforcement: N/A in v1; no pass-through consumer contract.
- Undetermined/retry: source/model/parser errors are non-penalizing and retryable.

## Claim-to-code matrix

| Product claim | Contract method/state | View/read | Direct test | Network evidence |
| --- | --- | --- | --- | --- |
| “Fund the check” | `open_round` payable -> `OPEN` | `get_round` purse/sponsor/deadline | payable exact-value and state test | Studionet open receipt + canonical view |
| “Validators decide meaning” | `review_submission` nondet -> finalized result | `get_submission` verdict/reason/status | independent meaning/malicious leader tests | finalized review + explorer |
| “Evidence is authoritative” | source gate before settlement | submission source IDs and status | wrong-host/wrong-ID provenance tripwire | sanitized evidence record |
| “Only qualifying evidence earns credit” | qualified result creates one credit | `get_credit` / account credits | not-comparable/retry accounting tests | credit + balance proof |
| “No orphaned GEN” | close/refund and pull withdrawal | round purse + credit views | ledger invariant and duplicate withdrawal tests | receipt and balance delta |
| “Full Projects lifecycle” | wallet wrappers for every write | canonical reload after finality | frontend lifecycle tests | browser + Studionet evidence |

No important claim may have a blank cell.

## Analogue and differentiation matrix

| Analogue/prior idea | Similar dimensions | Structural difference | Collision decision |
| --- | --- | --- | --- |
| Prediction markets | external outcome and payout | RepliGrant accumulates indexed research evidence and claim history; no odds or pooled betting | adjacent; no collision |
| Challenge/bond registry | adversarial dispute and escrow | no challenger bond or slash; objective published-paper authority + semantic comparability | adjacent; no collision |
| Quarantine/access gate | evidence controls access | v1 only derives claim status and pull credit, never access/quarantine | adjacent; no collision |
| Filing/errata reserve | publication workflow and reserve | replication qualification is an evidence primitive reusable by treasuries/offices/biotech programs | adjacent; differentiated |

## Deployment and evidence plan

- Network: Studionet only (D1); Portal Builders submission channel (D2);
  `gl.vm.run_nondet`/`gl.eq_principle.*` (D3).
- Actors/wallet separation: authorized deployer; funded sponsor; separate
  contributor; browser-selected EVM wallet. Discover existing authorized EOAs
  from ignored env without printing keys; no faucet.
- Deploy steps: pinned source -> `genvm-lint check` -> direct tests -> bounded
  integration test -> CLI deploy -> schema/read-method verification -> record
  active `deployment.json` bound to commit/API/network.
- Consequential lifecycle: fund 2 GEN, submit a Europe PMC replication,
  finalize review, read verdict/claim/credit, close/refund or withdraw 1 GEN;
  capture retry and duplicate negative evidence.
- Canonical reads: script and frontend use deployed view methods after each
  finalized write; never use local fixtures or storage as truth.
- Balance/receipt proof: allowlisted receipt fields, parent and child finality,
  sponsor/contributor balances before/after, and exact GEN conversion only at
  display edge.
- Evidence path: `docs/evidence/studionet/` with sanitized logs, tx hashes,
  addresses, view outputs, explorer links, and source commit; no private RPC
  payloads or secrets.
- Resume/idempotency: scripts discover active deployment and current IDs;
  reruns read status before sending value; one active deployment plus archived
  superseded revisions.

## Definition of Done

### Intelligent Contracts

- [x] Reusable primitive — contract views and adapter interface.
- [x] Semantic validator judgment — `gl.eq_principle.prompt_comparative` with meaning validation.
- [x] Direct consequence — finalized qualifying review opens a 1 GEN credit.
- [x] Reuse proof — round/submission/credit views are documented for DeSci grant consumers.
- [x] Adversarial tests — duplicate, unauthorized, temporal, unavailable-source, and accounting paths.
- [x] Real network lifecycle — finalized Studionet review and credit withdrawal.
- [x] Canonical evidence — deployment, lifecycle, and withdrawal records under `docs/evidence/studionet/`.

### Projects, if selected

- [x] Real frontend wallet-write path — selected EVM wallet, `createClient` account binding, and a finalized browser `submit_replication` on Studionet; later browser signatures remain an honest action-time dependency.
- [x] Full lifecycle/failure/retry — submit/review/retry/close/withdraw controls, phases, and live retry-to-qualified evidence.
- [x] Canonical reads — all product views read contract methods; production route shows live `R-1` state.
- [x] Meaningful user outcome — finalized `QUALIFIED` opened 1.00 GEN, then withdrawal reached 0.00 GEN.
- [x] Browser evidence — wallet picker, corrected chain `61999`, same-origin IC proxy, production app, finalized browser submit, 2 GEN open/close/refund/withdraw, and empty console verified in Chrome.
- [x] Every claimed browser lifecycle action has frontend wrapper/control/test/finality/canonical reload.
- [x] Primary UI contains only user-relevant data/actions; system/reviewer
      details are contextual or hidden.

## Honest limitations

- V1 does not establish scientific truth, causal validity, peer-review quality,
  clinical/legal suitability, or broad adoption. Europe PMC is an authority for
  indexed record identity/content, not a truth oracle. A `SUPPORTED` or
  `CHALLENGED` status means qualifying records report a semantic relationship to
  the locked claim under the bounded prompt and scope, not that the underlying
  science is universally proven. Live wallet/Studionet availability and source
  availability can delay finalization; `RETRYABLE` is expected and safe.

## Kill criteria

- Reject the design if Europe PMC cannot provide stable authoritative identity
  fields for the chosen records, if the contract cannot deterministically bind
  PMCID/DOI/source before semantic judgment, if `genvm-lint` rejects the single
  contract class, or if any value/recovery invariant cannot be proven in direct
  and bounded Studionet tests. Do not expand the model, trust claimant-hosted
  artifacts, or add a second consumer contract to compensate.
