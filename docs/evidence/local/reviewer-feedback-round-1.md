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
Tests 9 passed (9)
vite build: 2304 modules transformed; built successfully
CHECK_PASS: lint, direct tests, frontend typecheck/tests/build
```

## Deployment boundary

The active Studionet address still contains the pre-feedback revision. The
repair is locally verified only until a new contract revision is deployed,
smoke-tested, bound in `deployment.json`, and the frontend is redeployed.
