# Studionet deployment proof

The active deployment record is the allowlisted `deployment.json` at the project root. It contains only the network, contract address, transaction hash, source digest, and finalized execution fields; raw receipts and validator configuration are intentionally not stored. Superseded revisions are retained under `docs/evidence/studionet/deployments/` with their status and source identity.

Verified command output for the initial superseded revision (archived; not the active address):

```text
receipt_exit=0
status_name=FINALIZED
result_name=MAJORITY_AGREE
contract_address=0xF6Df75d131b97783f49F73C6B9199d70267776AF
leader_execution_result=SUCCESS
```

Network: Studionet (`chain_id=61999`, RPC `https://studio.genlayer.com/api`).

Superseded revision after the web-response compatibility fix:

```text
contract_address=0x5dc18F7Ab1Ffd5CDA4D08663E86cBF0E0Efc1c48
deployment_tx=0x92e7e8041e9f31f4a3bfa9ada21b9a84c90f6254f273f68e3700f1752bbb9886
source_sha256=5a69e45752a1ebecd48414d3c20ce2963eeda25ada2a05c32c100a64becd562a
status_name=FINALIZED
result_name=MAJORITY_AGREE
leader_execution_result=SUCCESS
```

Active reviewer-feedback revision:

```text
contract_address=0xbc46481EB633363C45E4Cd3934d2e85cF0385E17
deployment_tx=0x6a695ce99d080a9ce07eb4ebf5acbd5277f40b5b26617136c20f60fcfb5783e5
source_sha256=481bec3a4e3cc93ce272d8187c1e3644da4d453ca978db6e67bc5f318c3381a0
source_commit=5ac7ff4bc0820a1e237ec298989fcc17da779bcd
status_name=FINALIZED
consensus_result=Accepted
leader_execution_result=SUCCESS
```

Explorer proof: https://explorer-studio.genlayer.com/tx/0x6a695ce99d080a9ce07eb4ebf5acbd5277f40b5b26617136c20f60fcfb5783e5
