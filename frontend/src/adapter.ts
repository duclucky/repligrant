import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { isAddress, type Address } from "viem";
import { ensureStudionet, getActiveWalletSession, type Eip1193Provider } from "./wallet";
import type {
  ActivityItem, ClaimStatus, ContractAdapter, CreditBalance, Finding,
  OpenRoundInput, ReplicationSubmission, RoundDetail, RoundStatus, RoundSummary,
  SubmissionStatus, SubmitReplicationInput, TransactionState,
} from "./types";

const CONTRACT_ADDRESS = String(import.meta.env.VITE_REPLIGRANT_CONTRACT_ADDRESS ?? "").trim();
const IC_ENDPOINT = String(import.meta.env.VITE_GENLAYER_RPC_URL ?? "/genlayer-rpc").trim();
type AdapterOptions = {
  contractAddress?: string;
  endpoint?: string;
  sessionGetter?: typeof getActiveWalletSession;
  clientFactory?: typeof createClient;
};

export class ContractNotConfiguredError extends Error {
  constructor() { super("The Studionet contract address is not configured yet."); this.name = "ContractNotConfiguredError"; }
}

export class WalletNotConfiguredError extends Error {
  constructor() { super("Connect a selected EVM wallet before signing this transaction."); this.name = "WalletNotConfiguredError"; }
}

function requireContractAddress(value: string): Address {
  if (!isAddress(value)) throw new ContractNotConfiguredError();
  return value;
}

function requireSigner(sessionGetter: typeof getActiveWalletSession): { account: Address; provider: Eip1193Provider } {
  const session = sessionGetter();
  if (!session || !isAddress(session.account)) throw new WalletNotConfiguredError();
  return { account: session.account, provider: session.provider };
}

function createReadClient(options: AdapterOptions) {
  return (options.clientFactory ?? createClient)({ chain: studionet, endpoint: options.endpoint ?? IC_ENDPOINT });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The contract returned invalid JSON.");
  return value as Record<string, unknown>;
}
function parseJson(value: unknown): unknown { if (typeof value !== "string") throw new Error("The contract returned a non-JSON view."); return JSON.parse(value) as unknown; }
function text(value: unknown, fallback = ""): string { return typeof value === "string" ? value : fallback; }
function numberValue(value: unknown, fallback = 0): number { return typeof value === "number" ? value : typeof value === "string" ? Number(value) : fallback; }
function list(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }

function toSubmission(value: unknown): ReplicationSubmission {
  const item = asRecord(value);
  return { id: text(item.id), roundId: text(item.round_id), contributor: text(item.contributor), pmcid: text(item.pmcid), doi: text(item.doi), status: text(item.status, "RETRYABLE") as SubmissionStatus, finding: text(item.finding, "UNRESOLVED") as Finding, publicReason: text(item.public_reason), attempt: numberValue(item.attempt) };
}

function toRound(value: unknown): RoundDetail {
  const item = asRecord(value);
  return { id: text(item.id), title: text(item.title), claim: text(item.claim), sponsor: text(item.sponsor), originalPmcid: text(item.original_pmcid), originalDoi: text(item.original_doi), scopeIds: list(item.scope_ids).map((scope) => text(scope)).filter(Boolean), deadline: numberValue(item.deadline), status: text(item.status, "OPEN") as RoundStatus, claimStatus: text(item.claim_status, "UNTESTED") as ClaimStatus, remainingSlots: numberValue(item.remaining_slots), remainingPurseGen: text(item.remaining_purse_gen, "0.00"), submissions: list(item.submissions).map(toSubmission) };
}

function hasFailureMarker(value: unknown): boolean {
  const marker = typeof value === "string" ? value.toUpperCase() : "";
  return marker.includes("ERROR") || marker.includes("FAILURE") || marker.includes("REVERT");
}

function isBenignQuorumStop(entry: Record<string, unknown>): boolean {
  const genvm = entry.genvm_result;
  if (!genvm || typeof genvm !== "object" || Array.isArray(genvm)) return false;
  return String((genvm as Record<string, unknown>).error_code ?? "").toUpperCase() === "CONSENSUS_VALIDATOR_QUORUM_REACHED";
}

function isFailedReceipt(receipt: unknown): boolean {
  const item = asRecord(receipt);
  if ([item.txExecutionResultName, item.executionResultName, item.tx_execution_result_name, item.execution_result, item.tx_execution_result].some(hasFailureMarker)) return true;
  const consensus = item.consensus_data;
  if (!consensus || typeof consensus !== "object" || Array.isArray(consensus)) return hasFailureMarker(item.resultName) || hasFailureMarker(item.result_name);
  const data = consensus as Record<string, unknown>;
  const receipts = [...list(data.leader_receipt), ...list(data.validators)];
  return receipts.some((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    const nested = entry as Record<string, unknown>;
    if (isBenignQuorumStop(nested)) return false;
    return hasFailureMarker(nested.execution_result) || hasFailureMarker(nested.txExecutionResultName) || hasFailureMarker(nested.executionResultName);
  });
}

async function writeTransaction(method: string, args: Array<string | number>, value: bigint, onPhase: (state: TransactionState) => void, options: AdapterOptions): Promise<string> {
  const signer = requireSigner(options.sessionGetter ?? getActiveWalletSession);
  const address = requireContractAddress(options.contractAddress ?? CONTRACT_ADDRESS);
  try {
    // The account may have switched networks since connect/restore. Enforce the
    // wallet-compatible Studionet chain immediately before every write.
    await ensureStudionet(signer.provider);
    const client = (options.clientFactory ?? createClient)({ chain: studionet, endpoint: options.endpoint ?? IC_ENDPOINT, account: signer.account, provider: signer.provider });
    onPhase({ phase: "AWAITING_SIGNATURE", message: "Confirm this transaction in your selected wallet." });
    const rawHash = await client.writeContract({ address, functionName: method, args, value });
    const hash = String(rawHash);
    onPhase({ phase: "SUBMITTED", message: "Transaction submitted; waiting for the network.", hash });
    const accepted = await client.waitForTransactionReceipt({ hash: rawHash, status: TransactionStatus.ACCEPTED, interval: 1500, retries: 40 });
    if (isFailedReceipt(accepted)) throw new Error("The accepted transaction has a contract execution error.");
    onPhase({ phase: "ACCEPTED", message: "Transaction accepted; validators are processing it.", hash });
    const finalized = await client.waitForTransactionReceipt({ hash: rawHash, status: TransactionStatus.FINALIZED, interval: 2500, retries: 120 });
    if (isFailedReceipt(finalized)) throw new Error("The finalized transaction did not execute successfully.");
    onPhase({ phase: "FINALIZED", message: "Transaction finalized. Reloading canonical contract state.", hash });
    return hash;
  } catch (cause) {
    onPhase({ phase: "FAILED", message: cause instanceof Error ? cause.message : "Transaction failed before finality." });
    throw cause;
  }
}

function amountToCents(value: string): bigint { const [whole, fraction = ""] = value.split("."); return BigInt(whole || "0") * 100n + BigInt((fraction + "00").slice(0, 2)); }
function centsToGen(value: bigint): string { return `${value / 100n}.${(value % 100n).toString().padStart(2, "0")}`; }

export function createContractAdapter(options: AdapterOptions = {}): ContractAdapter {
  const contractAddress = options.contractAddress ?? CONTRACT_ADDRESS;
  return {
    configured: isAddress(contractAddress),
    async listRounds(): Promise<RoundSummary[]> { const raw = await createReadClient(options).readContract({ address: requireContractAddress(contractAddress), functionName: "list_rounds" }); return list(parseJson(raw)).map(toRound); },
    async getRound(roundId: string): Promise<RoundDetail | null> { const raw = await createReadClient(options).readContract({ address: requireContractAddress(contractAddress), functionName: "get_round", args: [roundId] }); return toRound(parseJson(raw)); },
    async getActivity(account: string): Promise<ActivityItem[]> { if (!isAddress(account)) throw new Error("The connected account address is invalid."); const raw = await createReadClient(options).readContract({ address: requireContractAddress(contractAddress), functionName: "get_activity", args: [account] }); return list(parseJson(raw)).map((entry) => { const item = asRecord(entry); return { id: text(item.id), kind: text(item.kind, "ROUND") as ActivityItem["kind"], title: text(item.title), status: text(item.status), roundId: text(item.round_id) }; }); },
    async getCredit(account: string): Promise<CreditBalance> { if (!isAddress(account)) throw new Error("The connected account address is invalid."); const raw = await createReadClient(options).readContract({ address: requireContractAddress(contractAddress), functionName: "get_account_credits", args: [account] }); const entries = list(parseJson(raw)).map(asRecord); const claimable = entries.filter((item) => text(item.status) === "CLAIMABLE"); const cents = claimable.reduce((total, item) => total + amountToCents(text(item.amount_gen, "0.00")), 0n); return { owner: account, claimableGen: centsToGen(cents), claimableIds: claimable.map((item) => text(item.id)).filter(Boolean) }; },
    async openRound(input: OpenRoundInput, onPhase): Promise<string> {
      await writeTransaction("open_round", [input.title, input.claim, input.originalPmcid, input.originalDoi, input.scopeIds.join(","), input.deadline], 2n * 10n ** 18n, onPhase, options);
      const created = list(parseJson(await createReadClient(options).readContract({ address: requireContractAddress(contractAddress), functionName: "list_rounds" })));
      const match = created.reverse().find((value) => text(asRecord(value).title) === input.title);
      const id = match ? text(asRecord(match).id) : "";
      if (!id) throw new Error("Round finalized but its canonical id was not readable.");
      return id;
    },
    async submitReplication(input: SubmitReplicationInput, onPhase): Promise<string> { return writeTransaction("submit_replication", [input.roundId, input.pmcid, input.doi], 0n, onPhase, options); },
    async reviewSubmission(submissionId: string, onPhase): Promise<void> { await writeTransaction("review_submission", [submissionId], 0n, onPhase, options); },
    async expireSubmission(submissionId: string, onPhase): Promise<void> { await writeTransaction("expire_submission", [submissionId], 0n, onPhase, options); },
    async closeRound(roundId: string, onPhase): Promise<void> { await writeTransaction("close_round", [roundId], 0n, onPhase, options); },
    async withdrawCredit(creditId: string, onPhase): Promise<void> { await writeTransaction("withdraw_credit", [creditId], 0n, onPhase, options); },
  };
}

export const contractAdapter = createContractAdapter();
