import type { ReplicationSubmission, RoundDetail } from "./types";

const RECOVERABLE_SUBMISSION_STATUSES = new Set(["SUBMITTED", "RETRYABLE"]);
const ACTIVE_ROUND_STATUSES = new Set(["OPEN", "REVIEWING"]);

export function canReviewSubmission(
  round: RoundDetail,
  submission: ReplicationSubmission,
  nowSeconds: number,
): boolean {
  return ACTIVE_ROUND_STATUSES.has(round.status)
    && RECOVERABLE_SUBMISSION_STATUSES.has(submission.status)
    && nowSeconds < round.deadline;
}

export function canExpireSubmission(
  round: RoundDetail,
  submission: ReplicationSubmission,
  account: string | null,
  nowSeconds: number,
): boolean {
  if (!account || !ACTIVE_ROUND_STATUSES.has(round.status)) return false;
  if (!RECOVERABLE_SUBMISSION_STATUSES.has(submission.status) || nowSeconds < round.deadline) return false;
  const caller = account.toLowerCase();
  return caller === round.sponsor.toLowerCase() || caller === submission.contributor.toLowerCase();
}
