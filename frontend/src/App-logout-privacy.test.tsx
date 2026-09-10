// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  account: "0x1111111111111111111111111111111111111111" as string | null,
  getActivity: vi.fn(async () => [{ id: "C-2", kind: "CREDIT", title: "SPONSOR_REFUND", status: "WITHDRAWN", roundId: "R-2" }]),
  getCredit: vi.fn(async () => ({ owner: "0x1111111111111111111111111111111111111111", claimableGen: "0.00", claimableIds: [] })),
}));

vi.mock("./adapter", () => ({
  ContractNotConfiguredError: class ContractNotConfiguredError extends Error {},
  contractAdapter: { configured: true, getActivity: mocks.getActivity, getCredit: mocks.getCredit },
}));

vi.mock("./wallet", () => ({
  shortenAddress: (value: string) => value,
  useWallet: () => ({ account: mocks.account, selectedWallet: null, openPicker: vi.fn(), disconnect: vi.fn() }),
}));

import { App } from "./App";

describe("activity logout privacy", () => {
  afterEach(cleanup);
  it("clears wallet-scoped activity and credit when the account disconnects", async () => {
    const view = render(<MemoryRouter initialEntries={["/activity"]}><App /></MemoryRouter>);
    await screen.findByText("SPONSOR_REFUND");

    mocks.account = null;
    view.rerender(<MemoryRouter initialEntries={["/activity"]}><App /></MemoryRouter>);

    await waitFor(() => expect(screen.queryByText("SPONSOR_REFUND")).toBeNull());
    expect(screen.getByText("Wallet not connected")).toBeTruthy();
  });
});
