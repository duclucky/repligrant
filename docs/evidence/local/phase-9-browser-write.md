# Browser wallet write evidence

The production frontend was corrected to derive the wallet chain ID from
`genlayer-js/chains.studionet.id`. The official Studionet RPC returned
`eth_chainId=0xf22f` / `net_version=61999`; the previous hardcoded `0xF1EF`
(`61935`) was removed.

Production URL: `https://repligrant.vercel.app/rounds/R-1`

The browser selected an OKX EVM wallet and submitted a real
`submit_replication` transaction for `PMC13267231` /
`10.1186/s41073-026-00203-4`. Explorer showed:

```text
tx=0xb1de1f7d1507230e7bcd5b901bcc192d17392c0bed7f96eff91771fa16137fa0
method=submit_replication
from=0xBd733BC56Ec4a55FA25C068B9306b0171335D199
to=0x5dc18F7Ab1Ffd5CDA4D08663E86cBF0E0Efc1c48
status=FINALIZED
genvm_result=SUCCESS
consensus_result=Accepted
chain_id=61999
```

Explorer: `https://explorer-studio.genlayer.com/tx/0xb1de1f7d1507230e7bcd5b901bcc192d17392c0bed7f96eff91771fa16137fa0`

After finality, the frontend canonical read showed `PMC13267231 ... SUBMITTED`
and `Remaining slots 0`. This proves the browser submit write only; browser
review/withdraw signatures remain user-approval-dependent and are not claimed
as completed browser transactions.

## Per-write chain preflight (reviewer-feedback repair)

The wallet popup once displayed Ethereum when an already-connected account had
been switched away from Studionet. The adapter now calls `ensureStudionet`
immediately before every `writeContract`, not only during connect/restore. The
frontend test suite includes a provider regression that observes
`wallet_switchEthereumChain` with `0xf22f` (`61999`) before the write. The
production deployment was rebuilt with this guard; no write is attempted while
the provider remains on another chain.
