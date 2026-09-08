import { readFileSync } from "node:fs";
import { createAccount, createClient } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";
import { TransactionStatus } from "../frontend/node_modules/genlayer-js/dist/types/index.js";

const projectRoot = new URL("..", import.meta.url);
const envText = readFileSync(new URL(".env", projectRoot), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
}));
const privateKey = env.STUDIONET_PRIVATE_KEY;
if (!privateKey) throw new Error("STUDIONET_PRIVATE_KEY is missing");
const deployment = JSON.parse(readFileSync(new URL("deployment.json", projectRoot), "utf8"));
const account = createAccount(privateKey);
const client = createClient({ chain: studionet, account, endpoint: "https://studio.genlayer.com/api" });
const address = deployment.contract_address;
const GEN = 10n ** 18n;

const waitFinal = async (hash) => {
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 3000, retries: 50 });
  return {
    hash,
    status: receipt.statusName ?? String(receipt.status ?? ""),
    result: receipt.resultName ?? String(receipt.result ?? ""),
    execution: receipt.executionResultName ?? String(receipt.executionResult ?? ""),
  };
};

const write = async (functionName, args = [], value = 0n) => {
  const hash = await client.writeContract({ address, functionName, args, value });
  return waitFinal(hash);
};

const read = async (functionName, args = []) => client.readContract({ address, functionName, args });
const now = Math.floor(Date.now() / 1000);
const deadline = now + 3600;
const title = `Replication challenge: social hyperbinding ${now}`;
const roundsValue = String(await read("list_rounds"));
const rounds = JSON.parse(roundsValue);
const existing = rounds.find((item) => item.title === title && item.status === "OPEN");
const open = existing ? { reused: true } : await write("open_round", [
  title,
  "The replication preserves the original face-stimulus comparison and outcome direction.",
  "PMC8500892",
  "10.3758/s13423-021-01928-7",
  "outcome",
  deadline,
], 2n * GEN);
const refreshedRounds = JSON.parse(String(await read("list_rounds")));
const round = refreshedRounds.find((item) => item.title === title && item.status === "OPEN");
if (!round) throw new Error("open round was not readable after finalization");
const roundId = round.id;
const currentSubmissions = round.submissions ?? [];
const submitted = currentSubmissions.length ? { reused: true } : await write("submit_replication", [roundId, "PMC13367721", "10.1371/journal.pone.0352510"]);
const review = currentSubmissions.length ? { reused: true } : await write("review_submission", [`${roundId}-S1`]);
const roundAfterReview = JSON.parse(String(await read("get_round", [roundId])));
const activity = JSON.parse(String(await read("get_activity", [account.address])));
console.log(JSON.stringify({ account: account.address, contract: address, roundId, deadline, open, submitted, review, roundAfterReview, activity }, null, 2));
