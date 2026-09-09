import { describe, expect, it } from "vitest";
import { ContractNotConfiguredError, WalletNotConfiguredError, createContractAdapter, contractAdapter } from "./adapter";

describe("contract adapter safety boundary", () => {
  it("does not present fabricated canonical state before address configuration", async () => {
    const unconfigured = createContractAdapter({ contractAddress: "" });
    expect(unconfigured.configured).toBe(false);
    await expect(unconfigured.listRounds()).rejects.toBeInstanceOf(ContractNotConfiguredError);
    await expect(unconfigured.getRound("ROUND-1")).rejects.toBeInstanceOf(ContractNotConfiguredError);
    await expect(unconfigured.getActivity("0x0000000000000000000000000000000000000001")).rejects.toBeInstanceOf(ContractNotConfiguredError);
  });

  it("keeps every write path honest when no deployed address exists", async () => {
    const noOp = () => undefined;
    await expect(contractAdapter.openRound({
      title: "A bounded claim",
      claim: "A falsifiable claim",
      originalPmcid: "PMC1",
      originalDoi: "10.1/example",
      scopeIds: ["outcome"],
      deadline: 1_900_000_000,
    }, noOp)).rejects.toBeInstanceOf(WalletNotConfiguredError);
    await expect(contractAdapter.submitReplication({ roundId: "ROUND-1", pmcid: "PMC2", doi: "10.1/replication" }, noOp)).rejects.toBeInstanceOf(WalletNotConfiguredError);
    await expect(contractAdapter.expireSubmission("S-1", noOp)).rejects.toBeInstanceOf(WalletNotConfiguredError);
    await expect(contractAdapter.withdrawCredit("C-1", noOp)).rejects.toBeInstanceOf(WalletNotConfiguredError);
  });
});
