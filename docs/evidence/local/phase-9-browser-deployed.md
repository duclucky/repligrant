# Browser deployed integration proof

Browser: Chrome, local Vite server at `http://192.168.1.148:5173/`.

Observed DOM from the configured local app:

```text
GET /rounds
OPEN R-1 Replication challenge: social hyperbinding 1788870820
PMC8500892
1 slots
1.00 GEN
Claim status: supported

GET /rounds/R-1
PMC13367721 10.1371/journal.pone.0352510 QUALIFIED
ROUND PURSE 1.00 GEN
Remaining slots 1
Only finalized validator outcomes can change claim status or credit.
```

The account is not auto-connected. Clicking `Connect wallet` opened the centered wallet-selection modal with explicit `OKX Wallet` and `MetaMask` entries (including injected/detected provider labels), plus a close action. The browser console error/warning read returned an empty list (`[]`).

This is browser-local proof of canonical reads and wallet-selection behavior; no simulated wallet signature or browser transaction is claimed.

Historical production proof for the superseded revision (`https://repligrant.vercel.app`):

```text
GET /rounds -> OPEN R-1 ... 1 slots 1.00 GEN Claim status: supported
GET /rounds/R-1 -> PMC13367721 10.1371/journal.pone.0352510 QUALIFIED
GET /rounds/R-1 -> ROUND PURSE 1.00 GEN; Remaining slots 1
```

The superseded production browser loaded both canonical views through the same-origin `/genlayer-rpc` rewrite. After waiting for reads to settle, the console error/warning list was empty (`[]`).

Current production proof after the reviewer-feedback deployment:

```text
GET /rounds -> No rounds yet
contract=0xbc46481EB633363C45E4Cd3934d2e85cF0385E17
RPC path=/genlayer-rpc
console warnings/errors=[]
```
