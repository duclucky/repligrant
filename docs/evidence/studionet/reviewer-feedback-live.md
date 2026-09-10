# Reviewer feedback - live Studionet recovery proof

Date: 2026-09-10

Network: GenLayer Studionet (`chain_id=61999`)

Contract: `0xbc46481EB633363C45E4Cd3934d2e85cF0385E17`

Browser wallet: `0xBd733BC56Ec4a55FA25C068B9306b0171335D199`

This record contains only allowlisted transaction and canonical view fields. It
does not contain full receipts, validator configuration, or wallet secrets.

## Round R-2: pending-submission recovery

The production frontend opened R-2 with a 2 GEN purse:

```text
tx=0xa1c163547298a47f5e3690febc3301f4cb000176fa7c8b65a7bb80ab827211d7
status=FINALIZED
value=2 GEN
leader_execution=SUCCESS
round=R-2 OPEN
remaining_purse_gen=2.00
remaining_slots=2
claim_status=UNTESTED
```

The same browser wallet submitted a replication before the locked deadline:

```text
tx=0x92e013fedd32f542b6607f9ca44773ac9259430232a501e9088aac24854d5cb4
status=FINALIZED
value=0 GEN
leader_execution=SUCCESS
submission=S-1 SUBMITTED
remaining_purse_gen=2.00
remaining_slots=1
claim_status=UNTESTED
```

The browser was reloaded after the transaction. The selected account restored
as `0xbd73...d199`, and the page re-read the canonical S-1 state rather than
using local storage as contract state.

After the deadline, the sponsor expired the still-pending S-1 from the
production frontend:

```text
tx=0x22d9dcb7722df7fcdeff3032726bdefd0d9f18a2558c2e1726fd208e651b143d
status=FINALIZED
value=0 GEN
leader_execution=SUCCESS
submission=S-1 EXPIRED
finding=UNRESOLVED
public_reason=Review window expired without a payable finding.
remaining_purse_gen=2.00
remaining_slots=2
claim_status=UNTESTED
account_credits=C-1 only (R-1 sponsor refund already WITHDRAWN)
```

This proves the recovery transition preserved submission history, released the
consumed slot, did not pay the contributor, did not debit the purse, and did not
mutate the claim.

The sponsor then closed R-2 and converted the untouched purse into a refund
credit:

```text
tx=0xe1e5fde5c0f275a59b927bcc8e42f0f8101404b20cc4ebaaa0f07d348afccb99
status=FINALIZED
value=0 GEN
leader_execution=SUCCESS
round=R-2 EXPIRED
remaining_purse_gen=0.00
remaining_slots=2
claim_status=UNTESTED
credit=C-2 SPONSOR_REFUND 2.00 GEN CLAIMABLE
```

Finally, the sponsor withdrew C-2 through the production Activity page:

```text
tx=0x7ee940efc4c92dc2e097f9ff11b587043a563942231a82bf34e6661fa9f878a5
status=FINALIZED
value=0 GEN
leader_execution=SUCCESS
credit=C-2 SPONSOR_REFUND 0.00 GEN WITHDRAWN
claimable_credit=0.00 GEN
```

All three writes were wallet-signed in Chrome. Each transaction used the
frontend's per-write Studionet preflight and was followed by a canonical view
reload. No retryable or unresolved path created contributor credit.
