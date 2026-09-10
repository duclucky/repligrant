# RepliGrant

[![RepliGrant check](https://github.com/duclucky/repligrant/actions/workflows/check.yml/badge.svg)](https://github.com/duclucky/repligrant/actions/workflows/check.yml)

RepliGrant is a GenLayer Projects prototype for funding bounded research replication evidence. A sponsor locks an original PMCID/DOI claim and scope with a 2 GEN purse. Contributors submit a second authoritative Europe PMC record. GenLayer validators compare the meaning of the two records; only a finalized, normalized result can create a 1 GEN contributor credit and update the canonical claim status.

## What is verifiable

- One ASCII Intelligent Contract, `RepliGrant`, with structured per-round/per-submission/per-credit storage.
- Europe PMC is the contract-built evidence authority; arbitrary URLs and actor-supplied payout labels are not accepted.
- `SUBMITTED`, `QUALIFIED`, `NOT_COMPARABLE`, `RETRYABLE`, and post-deadline `EXPIRED` are explicit submission states. Invalid, unavailable, or unresolved evidence does not move value or claim state.
- The frontend reads canonical views, uses an EVM wallet-selection modal, sends real GenLayer SDK transactions, shows submitted/accepted/finalized/failed states, and reloads after finality.

## Checks

From the project root:

```powershell
npm install --prefix frontend
npm run check
```

`npm run check` runs `genvm-lint`, 17 direct-mode tests, 4 browser-RPC proxy tests, frontend TypeScript, 17 frontend tests, and the production build. The selected runner is pinned to `GENVM_VERSION=v0.2.16` for the verified contract/API family.

## Studionet deployment

The active deployment is recorded in [`deployment.json`](deployment.json):

- Network: GenLayer Studionet (`chain_id=61999`)
- Contract: `0xbc46481EB633363C45E4Cd3934d2e85cF0385E17`
- Explorer: [Studionet contract](https://explorer-studio.genlayer.com/address/0xbc46481EB633363C45E4Cd3934d2e85cF0385E17)
- Deployment transaction: [`0x6a695c...783e5`](https://explorer-studio.genlayer.com/tx/0x6a695ce99d080a9ce07eb4ebf5acbd5277f40b5b26617136c20f60fcfb5783e5)
- Reviewer-recovery lifecycle: [`docs/evidence/studionet/reviewer-feedback-live.md`](docs/evidence/studionet/reviewer-feedback-live.md)
- Production frontend: [repligrant.vercel.app](https://repligrant.vercel.app)
- CI workflow: [RepliGrant check](https://github.com/duclucky/repligrant/actions/workflows/check.yml)

Run the demo scripts only with an authorized ignored `.env`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/deploy_studionet.ps1
node scripts/demo_lifecycle.mjs
node scripts/retry_review.mjs
node scripts/withdraw_credit.mjs
```

No private key, raw receipt, validator configuration, or simulated balance belongs in this repository.

## Honest limits

V1 evaluates what authoritative published records report within the locked scope. It does not establish scientific truth, reproduce every protocol detail, assess peer-review quality, provide legal/clinical advice, or claim adoption. Source outage, malformed evidence, or validator disagreement remains non-penalizing and retryable.
