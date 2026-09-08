# Phase 3A frontend evidence

Date: 2026-09-08
Project: RepliGrant (IDEA-027)

## Scope

The frontend is a React + TypeScript product shell for the Projects category. It
contains the named route map (`/`, `/rounds`, `/rounds/new`, `/rounds/:roundId`,
`/activity`, `/account`, `/help`), an EIP-6963-first wallet picker with injected
fallback discovery, an explicit Studionet switch/add request, canonical-state
adapter boundaries, lifecycle status language, and responsive styles from the
persisted ui-ux-pro-max design system.

The contract adapter intentionally remains unconfigured in this phase. It throws
`ContractNotConfiguredError` for every read/write method, so the UI cannot invent
rounds, balances, hashes, verdicts, or finality before deployment integration.

## Commands and real output

Run from `D:\Genlayer Project\repligrant\frontend`:

```text
npm install
added 103 packages, and audited 104 packages in 17s
found 0 vulnerabilities

npm test
Test Files  2 passed (2)
Tests  3 passed (3)

npm run typecheck
Process exited with code 0

npm run build
vite v8.2.2 building client environment for production...
✓ 1855 modules transformed.
✓ built in 351ms
```

## Acceptance notes

- No fake fixture data is used as canonical state.
- Wallet UI offers explicit selection rather than auto-picking a provider.
- Human-facing value labels use GEN; there are no raw base-unit balances in the UI.
- The frontend build is local evidence only; it is not Studionet deployment evidence.
