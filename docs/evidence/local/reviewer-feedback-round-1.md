# Reviewer feedback round 1 - local repair evidence

Date: 2026-09-10

This record covers the four requested invariants without treating local checks
as Studionet deployment evidence.

## Feedback-to-code map

1. Post-deadline recovery: `expire_submission` permits only the stored sponsor
   or contributor to expire a `SUBMITTED`/`RETRYABLE` submission at
   `now >= deadline`, releases its active slot, and leaves claim/purse/credits
   unchanged. The sponsor can then close the round and recover the purse.
2. Unresolved settlement: `SUFFICIENT + UNRESOLVED` normalizes to `RETRYABLE`.
   Settlement accepts only `CORROBORATES` or `CHALLENGES`, so no credit, purse
   debit, qualified count, or claim-status change can occur.
3. Europe PMC parsing: the contract exactly binds canonical `pmcid` and `doi`
   fields, then passes only bounded `title`, `abstractText`, `pubYear`,
   `publicationStatus`, and `pubTypeList.pubType` fields to the semantic task.
   Raw-body substring binding and 700-character prefix truncation are removed.
4. Slot recovery: `NOT_COMPARABLE` and explicitly expired unbonded submissions
   release their active slot. Append-only submission history and per-round DOI/
   PMCID replay rejection remain intact.

## TDD RED

Command:

```powershell
.\.venv\Scripts\python.exe -m pytest tests\direct\test_repligrant_direct.py -q -k "unresolved_finding or post_deadline or expiry_recovery or not_comparable_terminal or parses_exact or source_binding_uses_exact"
```

Observed before the repair:

```text
FFFFFF [100%]
6 failed, 7 deselected
```

The failures showed the old payable `UNRESOLVED` path, missing expiry method,
occupied terminal slots, prefix-truncated source prompt, and raw-text identifier
binding.

## Live Europe PMC schema probe

The probe emitted only allowlisted identifiers and sizes:

```text
PMC8500892  DOI 10.3758/s13423-021-01928-7  HTTP 200  body 6691 bytes  title 48  abstract 1301  publication types 2
PMC13367721 DOI 10.1371/journal.pone.0352510 HTTP 200  body 6332 bytes  title 61  abstract 1569  publication types 2
```

Both records fit the explicit source and field bounds. No raw response was
stored.

## GREEN and full local gate

Command:

```powershell
npm run check
```

Observed:

```text
Lint passed (3 checks)
Validation passed
Contract: RepliGrant
Methods: 13 (7 view, 6 write)
17 passed
Test Files 5 passed (5)
Tests 17 passed (17)
vite build: 2304 modules transformed; built successfully
CHECK_PASS: lint, direct tests, frontend typecheck/tests/build
```

## Studionet deployment and browser chain repair

The repaired revision was deployed once and finalized on Studionet. The
deployment output was recovered from the Explorer after a CLI formatting parse
miss; no duplicate deployment was sent:

```text
contract_address=0xbc46481EB633363C45E4Cd3934d2e85cF0385E17
deployment_tx=0x6a695ce99d080a9ce07eb4ebf5acbd5277f40b5b26617136c20f60fcfb5783e5
status=FINALIZED
genvm_execution=SUCCESS
consensus=Accepted
schema=13 methods (7 view, 6 write), including expire_submission
list_rounds=[]
```

Production was redeployed after correcting the Vercel contract-address
environment variable. Browser `/rounds` now reads `No rounds yet` from the new
contract through `/genlayer-rpc`, with no console errors/warnings.

The wallet popup previously showed Ethereum because a connected account could
change networks after connect/restore and the adapter did not re-check before a
write. `ensureStudionet` now runs immediately before every write, using the
current `genlayer-js/chains.studionet.id` (`61999`, `0xf22f`). A focused test
proves the switch request is made; the user-denied 2 GEN attempt left
`list_rounds=[]` and spent no value.

The browser also exercised a late submit attempt. Explorer/SDK receipt evidence
showed `FINALIZED` with leader/validator `execution_result=ERROR` and rollback
payload `submission deadline passed`; the adapter now inspects the
snake_case consensus receipt and surfaces `Failed` instead of falsely claiming
success.

A successful browser submission then exposed a separate same-route refresh
bug: finality was reported, but navigating from `/rounds/R-2` to that same URL
did not remount the page. The new component regression test first failed with
`getRound` called once instead of twice. The submit handler now awaits the
canonical reload directly and collapses the form only after that read succeeds;
the focused regression and the full 17-test frontend suite pass.
