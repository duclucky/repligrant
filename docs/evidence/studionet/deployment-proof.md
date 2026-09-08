# Studionet deployment proof

The active deployment record is the allowlisted `deployment.json` at the project root. It contains only the network, contract address, transaction hash, source digest, and finalized execution fields; raw receipts and validator configuration are intentionally not stored. Superseded revisions are retained under `docs/evidence/studionet/deployments/` with their status and source identity.

Verified command output:

```text
receipt_exit=0
status_name=FINALIZED
result_name=MAJORITY_AGREE
contract_address=0xF6Df75d131b97783f49F73C6B9199d70267776AF
leader_execution_result=SUCCESS
```

Network: Studionet (`chain_id=61999`, RPC `https://studio.genlayer.com/api`).

Active revision after the web-response compatibility fix:

```text
contract_address=0x5dc18F7Ab1Ffd5CDA4D08663E86cBF0E0Efc1c48
deployment_tx=0x92e7e8041e9f31f4a3bfa9ada21b9a84c90f6254f273f68e3700f1752bbb9886
source_sha256=5a69e45752a1ebecd48414d3c20ce2963eeda25ada2a05c32c100a64becd562a
```
