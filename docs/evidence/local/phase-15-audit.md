# Phase 15 audit evidence

This file records the final local and live checks for the Projects track. Secrets,
raw receipts, validator configuration, and private RPC payloads are not included.

## Acceptance precheck

Command: `npm run precheck`

```text
Project repligrant -Category projects
NO BLOCKER
OK contract source
OK direct tests
OK frontend product shell
OK frontend contract adapter
OK active Studionet deployment evidence
OK Studionet lifecycle evidence
OK browser/proxy evidence
OK public CI evidence
OK active contract 0x5dc18F7Ab1Ffd5CDA4D08663E86cBF0E0Efc1c48
OK frontend has a configured deployed contract address
OK public GitHub remote
OK README has verified live app and active contract
WARN: browser wallet writes remain user-signature dependent; wrappers, controls, finality handling, canonical reload, and SDK boundary tests are present.
```

## Required repository check

Command: `npm run check`

```text
Lint passed (3 checks)
Validation passed
  Contract: RepliGrant
  Methods: 12 (7 view, 5 write)
11 passed in 0.53s
Test Files 4 passed (4)
Tests 5 passed (5)
CHECK_PASS: lint, direct tests, frontend typecheck/tests/build
```

## Live app exit gate

Commands: `curl.exe -I https://repligrant.vercel.app` and
`curl.exe -s https://repligrant.vercel.app/rounds`.

Observed: HTTP `200 OK`; the response contains
`<title>RepliGrant | Fund evidence that holds up</title>` and `<div id="root"></div>`.
Chrome verification of `/rounds/R-1` read canonical `OPEN R-1`, submission
`PMC13367721 ... QUALIFIED`, `1.00 GEN` remaining purse, and no browser console
errors/warnings. The same-origin `/genlayer-rpc` path is used by the deployed app.

## Public and network evidence

- Public repository: `https://github.com/duclucky/repligrant`
- CI workflow: `https://github.com/duclucky/repligrant/actions/workflows/check.yml`
- Live app: `https://repligrant.vercel.app`
- Active Studionet contract: `0x5dc18F7Ab1Ffd5CDA4D08663E86cBF0E0Efc1c48`
- Lifecycle evidence: `docs/evidence/studionet/phase-8-lifecycle.md`
- Portal Builders: authenticated submission flow opened at
  `https://portal.genlayer.foundation/submit-contribution`; final send was not
  clicked, so no Portal submission or acceptance is claimed.
