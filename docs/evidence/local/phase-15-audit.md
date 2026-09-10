# Phase 15 audit evidence

Updated: 2026-09-10

This file records allowlisted local and live checks for the Projects track. It
does not contain secrets, full receipts, validator configuration, or private RPC
payloads.

## Acceptance precheck

Command: `npm run precheck`

```text
Project repligrant -Category projects
NO BLOCKER
OK active contract 0xbc46481EB633363C45E4Cd3934d2e85cF0385E17
OK active deployment matches current contract source
OK active revision has browser-signed 2 GEN funding, pending-submission expiry,
slot release, sponsor refund, withdrawal, and canonical reload evidence
```

## Required repository check

Command: `npm run check`

```text
Lint passed (3 checks)
Validation passed
  Contract: RepliGrant
  Methods: 13 (7 view, 6 write)
17 passed
browser RPC proxy tests: 4 passed
Test Files 8 passed (8)
Tests 17 passed (17)
vite: 2304 modules transformed; built successfully
CHECK_PASS: lint, direct tests, browser RPC proxy tests, frontend typecheck/tests/build
```

## Reviewer invariants

1. Post-deadline recovery: `expire_submission` moves a still-pending or
   retryable submission to `EXPIRED` after the locked deadline.
2. Non-paying unresolved result: `UNRESOLVED` creates no contributor credit,
   debits no purse, and changes no claim state.
3. Exact Europe PMC parsing: review input contains only the locked identifiers
   plus `pmcid`, `doi`, `title`, `abstractText`, `pubYear`,
   `publicationStatus`, and `pubTypeList.pubType`; it does not truncate raw JSON.
4. Slot recovery: terminal unbonded `NOT_COMPARABLE` and `EXPIRED` submissions
   release their active slot while preserving append-only submission history.

Direct tests cover each invariant, including exact deadline boundaries, wrong
caller/state, duplicate expiry, accounting preservation, malformed evidence,
malicious validator output, and slot reuse.

## Live browser and Studionet proof

The production Chrome workflow used the selected OKX account on Studionet and
completed R-2: open with 2 GEN, submit S-1, expire S-1 after the deadline,
restore both slots with the claim still `UNTESTED`, close/refund 2 GEN, and
withdraw C-2 to `0.00 GEN WITHDRAWN`. Exact allowlisted transaction hashes and
canonical reads are in
`docs/evidence/studionet/reviewer-feedback-live.md`.

Production: `https://repligrant.vercel.app`

Active Studionet contract:
`0xbc46481EB633363C45E4Cd3934d2e85cF0385E17`

Repository: `https://github.com/duclucky/repligrant`

CI workflow: `https://github.com/duclucky/repligrant/actions/workflows/check.yml`

Portal approval is external and is not claimed.
