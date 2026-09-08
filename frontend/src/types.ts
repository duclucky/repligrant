export type RoundStatus = "OPEN" | "REVIEWING" | "COMPLETE" | "EXPIRED";
export type ClaimStatus = "UNTESTED" | "SUPPORTED" | "CHALLENGED" | "MIXED";
export type SubmissionStatus =
  | "SUBMITTED"
  | "REVIEWING"
  | "QUALIFIED"
  | "NOT_COMPARABLE"
  | "RETRYABLE";
export type Finding = "CORROBORATES" | "CHALLENGES" | "UNRESOLVED";

export interface RoundSummary {
  id: string;
  title: string;
  claim: string;
  sponsor: string;
  originalPmcid: string;
  originalDoi: string;
  scopeIds: string[];
  deadline: number;
  status: RoundStatus;
  claimStatus: ClaimStatus;
  remainingSlots: number;
  remainingPurseGen: string;
}

export interface ReplicationSubmission {
  id: string;
  roundId: string;
  contributor: string;
  pmcid: string;
  doi: string;
  status: SubmissionStatus;
  finding?: Finding;
  publicReason?: string;
  attempt: number;
}

export interface RoundDetail extends RoundSummary {
  submissions: ReplicationSubmission[];
}

export interface ActivityItem {
  id: string;
  kind: "ROUND" | "SUBMISSION" | "CREDIT";
  title: string;
  status: string;
  roundId: string;
  updatedAt?: number;
}

export interface CreditBalance {
  owner: string;
  claimableGen: string;
  claimableIds: string[];
}

export type TransactionPhase =
  | "IDLE"
  | "AWAITING_SIGNATURE"
  | "SUBMITTED"
  | "ACCEPTED"
  | "FINALIZED"
  | "FAILED"
  | "RETRYABLE";

export interface TransactionState {
  phase: TransactionPhase;
  message: string;
  hash?: string;
}

export interface OpenRoundInput {
  title: string;
  claim: string;
  originalPmcid: string;
  originalDoi: string;
  scopeIds: string[];
  deadline: number;
}

export interface SubmitReplicationInput {
  roundId: string;
  pmcid: string;
  doi: string;
}

export interface ContractAdapter {
  readonly configured: boolean;
  listRounds(): Promise<RoundSummary[]>;
  getRound(roundId: string): Promise<RoundDetail | null>;
  getActivity(account: string): Promise<ActivityItem[]>;
  getCredit(account: string): Promise<CreditBalance>;
  openRound(input: OpenRoundInput, onPhase: (state: TransactionState) => void): Promise<string>;
  submitReplication(input: SubmitReplicationInput, onPhase: (state: TransactionState) => void): Promise<string>;
  reviewSubmission(submissionId: string, onPhase: (state: TransactionState) => void): Promise<void>;
  closeRound(roundId: string, onPhase: (state: TransactionState) => void): Promise<void>;
  withdrawCredit(creditId: string, onPhase: (state: TransactionState) => void): Promise<void>;
}
