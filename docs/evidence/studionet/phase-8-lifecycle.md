# Studionet lifecycle proof

All values below are human-readable GEN. The SDK sends the required base-unit integer only at the transaction boundary.

## Deploy/open/submit/review

`node scripts/demo_lifecycle.mjs` produced finalized transaction status `7` / result `6` and then canonical reads from the deployed contract. The consequential review result was retried after the first transaction's deadline-bound run; the successful canonical state was:

```text
contract=0x5dc18F7Ab1Ffd5CDA4D08663E86cBF0E0Efc1c48
roundId=R-1
submissionId=S-1
round status=OPEN
submission status=QUALIFIED
finding=CORROBORATES
claim_status=SUPPORTED
remaining_purse_gen=1.00
```

The review transaction was finalized at:

```text
0x108b2e1853ab12fdc7b346e660beb19e448bf868df47b4a4a92d888450fa938b
```

The contract created exactly one `1.00` GEN claimable contributor credit.

## Withdraw

`node scripts/withdraw_credit.mjs` read the claimable credit, withdrew it, finalized the transaction, and re-read canonical credit state:

```text
creditId=C-1
amountGen=1.00
hash=0xfb407ac78d6e306ebc2f2339c933a29ee792ec9dc44c62afb5d852c3bb6b4635
creditAfter.status=WITHDRAWN
creditAfter.amount_gen=0.00
claimableBefore=1
claimableAfter=0
```

This proves the value-bearing consequence and the no-double-withdraw canonical transition. The first short-deadline attempt remained `RETRYABLE` and unchanged in accounting; it was not treated as a successful review.
