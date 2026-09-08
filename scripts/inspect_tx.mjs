import { readFileSync } from "node:fs";
import { createAccount, createClient } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";
const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => { const i = line.indexOf("="); return [line.slice(0, i).trim(), line.slice(i + 1).trim()]; }));
const client = createClient({ chain: studionet, account: createAccount(env.STUDIONET_PRIVATE_KEY), endpoint: "https://studio.genlayer.com/api" });
const txHash = process.argv[2];
if (!txHash) throw new Error("Pass a transaction hash explicitly; no attempt is hardcoded.");
const tx = await client.getTransaction({ hash: txHash });
const safe = {
  keys: Object.keys(tx),
  status: tx.status,
  statusName: tx.statusName,
  result: tx.result,
  resultName: tx.resultName,
  executionResult: tx.executionResult,
  executionResultName: tx.executionResultName,
  consensusKeys: tx.consensus_data ? Object.keys(tx.consensus_data) : [],
  leaderExecution: tx.consensus_data?.leader_receipt?.[0]?.execution_result,
  leaderErrorCode: tx.consensus_data?.leader_receipt?.[0]?.genvm_result?.error_code,
  leaderStderr: tx.consensus_data?.leader_receipt?.[0]?.genvm_result?.stderr,
  leaderErrorDescription: tx.consensus_data?.leader_receipt?.[0]?.genvm_result?.error_description,
  leaderRawError: tx.consensus_data?.leader_receipt?.[0]?.genvm_result?.raw_error,
  validatorExecutionResults: (tx.consensus_data?.validators ?? []).map((item) => item.execution_result),
  validatorErrorCodes: (tx.consensus_data?.validators ?? []).map((item) => item.genvm_result?.error_code).filter(Boolean),
  createdAt: tx.created_at,
  currentTimestamp: tx.current_timestamp,
};
console.log(JSON.stringify(safe, null, 2));
