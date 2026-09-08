# Browser payment lifecycle evidence

The production frontend was exercised with the selected OKX EVM wallet on
Studionet chain `61999`. The browser opened `R-2` with exactly `2 GEN`, left
the purse untouched through the deadline, closed the expired round, then read
the canonical sponsor refund and withdrew it.

```text
open_round tx=0x14ea50faab4c1646fa42d3f3ec5c77e376c208e961bcf085d7f31bffd210812c
round=R-2
open_value=2 GEN
close_refund tx=0x9f5374377b1b31d29aac39c01b6dafeb804544ed52b07325db883a912b4ef4c4
close_state=EXPIRED
remaining_purse=0.00 GEN
withdraw tx=0xa6ff8a5aa41d7a2d0736af88b7fe543effba3527bc6cbab8c64d7d7a41dffcb6
credit=C-2
credit_status=WITHDRAWN
credit_amount=0.00 GEN
```

All three transactions were shown as finalized in the browser lifecycle
notice. A direct canonical read for the browser account returned:

```json
[{"amount_gen":"0.00","id":"C-2","kind":"SPONSOR_REFUND","round_id":"R-2","status":"WITHDRAWN","submission_id":""}]
```

The browser review calls for `R-1-S-2` were also signed three times. Each
finalized transaction returned `GenVM result=ERROR`, while the canonical
submission remained `SUBMITTED`; no credit was created and no purse changed.
This is recorded as an honest runtime blocker rather than a successful review.
