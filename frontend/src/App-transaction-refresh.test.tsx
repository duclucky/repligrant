// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRound: vi.fn(),
  submitReplication: vi.fn(),
}));

vi.mock("./adapter", () => ({
  ContractNotConfiguredError: class ContractNotConfiguredError extends Error {},
  contractAdapter: {
    configured: true,
    getRound: mocks.getRound,
    submitReplication: mocks.submitReplication,
  },
}));

vi.mock("./wallet", () => ({
  shortenAddress: (value: string) => value,
  useWallet: () => ({
    account: "0x1111111111111111111111111111111111111111",
    selectedWallet: { info: { name: "Test wallet" } },
    openPicker: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

import { App } from "./App";

const pendingRound = {
  id: "R-2",
  title: "Pending recovery",
  claim: "A bounded claim",
  sponsor: "0x1111111111111111111111111111111111111111",
  originalPmcid: "PMC8500892",
  originalDoi: "10.3758/s13423-021-01928-7",
  scopeIds: ["sample"],
  deadline: 4_102_444_800,
  status: "OPEN",
  claimStatus: "UNTESTED",
  remainingSlots: 2,
  remainingPurseGen: "2.00",
  submissions: [],
} as const;

describe("round transaction refresh", () => {
  beforeEach(() => {
    mocks.getRound.mockReset().mockResolvedValue(pendingRound);
    mocks.submitReplication.mockReset().mockImplementation(async (_input, onPhase) => {
      onPhase({ phase: "FINALIZED", message: "Finalized" });
      return "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    });
  });

  it("reloads canonical round state after a submission finalizes on the current route", async () => {
    render(<MemoryRouter initialEntries={["/rounds/R-2"]}><App /></MemoryRouter>);
    await screen.findByText("No submissions yet");

    fireEvent.click(screen.getByRole("button", { name: /submit evidence/i }));
    fireEvent.change(screen.getByLabelText("Replication PMCID"), { target: { value: "PMC13367721" } });
    fireEvent.change(screen.getByLabelText("DOI"), { target: { value: "10.1371/journal.pone.0352510" } });
    fireEvent.click(screen.getByRole("button", { name: /submit for review/i }));

    await waitFor(() => expect(mocks.getRound).toHaveBeenCalledTimes(2));
  });
});
