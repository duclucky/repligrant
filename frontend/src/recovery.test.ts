import { describe, expect, it } from "vitest";
import { canExpireSubmission, canReviewSubmission } from "./recovery";
import type { ReplicationSubmission, RoundDetail } from "./types";

const sponsor = "0x1111111111111111111111111111111111111111";
const contributor = "0x2222222222222222222222222222222222222222";
const stranger = "0x3333333333333333333333333333333333333333";

const submission: ReplicationSubmission = {
  id: "S-1",
  roundId: "R-1",
  contributor,
  pmcid: "PMC2",
  doi: "10.1/replication",
  status: "RETRYABLE",
  finding: "UNRESOLVED",
  attempt: 1,
};

const round: RoundDetail = {
  id: "R-1",
  title: "Bounded claim",
  claim: "A claim",
  sponsor,
  originalPmcid: "PMC1",
  originalDoi: "10.1/original",
  scopeIds: ["outcome"],
  deadline: 2_000,
  status: "OPEN",
  claimStatus: "UNTESTED",
  remainingSlots: 1,
  remainingPurseGen: "2.00",
  submissions: [submission],
};

describe("submission recovery visibility", () => {
  it("shows review before the deadline and expiry recovery at/after it", () => {
    expect(canReviewSubmission(round, submission, 1_999)).toBe(true);
    expect(canReviewSubmission(round, submission, 2_000)).toBe(false);
    expect(canExpireSubmission(round, submission, contributor, 1_999)).toBe(false);
    expect(canExpireSubmission(round, submission, contributor, 2_000)).toBe(true);
    expect(canExpireSubmission(round, submission, sponsor, 2_001)).toBe(true);
  });

  it("hides recovery from unrelated callers and terminal submissions", () => {
    expect(canExpireSubmission(round, submission, stranger, 2_001)).toBe(false);
    expect(canExpireSubmission(round, { ...submission, status: "QUALIFIED" }, contributor, 2_001)).toBe(false);
    expect(canExpireSubmission({ ...round, status: "EXPIRED" }, submission, contributor, 2_001)).toBe(false);
  });
});
