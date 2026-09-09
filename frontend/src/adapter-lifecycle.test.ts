import { describe, expect, it, vi } from "vitest";
import { createClient } from "genlayer-js";
import { createContractAdapter } from "./adapter";
import { STUDIONET } from "./wallet";

const account = "0x1111111111111111111111111111111111111111" as const;
const address = "0x2222222222222222222222222222222222222222" as const;

describe("frontend lifecycle wrappers", () => {
  it("exposes review, expiry recovery, and close writes with finality phases", async () => {
    const methods: string[] = [];
    const fakeClientFactory = (() => ({
      writeContract: vi.fn(async ({ functionName }: { functionName: string }) => { methods.push(functionName); return "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; }),
      waitForTransactionReceipt: vi.fn(async () => ({ resultName: "SUCCESS", txExecutionResultName: "FINISHED" })),
    })) as unknown as typeof createClient;
    const adapter = createContractAdapter({
      contractAddress: address,
      clientFactory: fakeClientFactory,
      sessionGetter: () => ({ account, provider: { request: vi.fn(async ({ method }: { method: string }) => method === "eth_chainId" ? STUDIONET.chainId : null) } }),
    });
    const phases: string[] = [];
    await adapter.reviewSubmission("S-1", (state) => phases.push(state.phase));
    await adapter.expireSubmission("S-1", (state) => phases.push(state.phase));
    await adapter.closeRound("R-1", (state) => phases.push(state.phase));
    expect(methods).toEqual(["review_submission", "expire_submission", "close_round"]);
    expect(phases).toEqual([
      "AWAITING_SIGNATURE", "SUBMITTED", "ACCEPTED", "FINALIZED",
      "AWAITING_SIGNATURE", "SUBMITTED", "ACCEPTED", "FINALIZED",
      "AWAITING_SIGNATURE", "SUBMITTED", "ACCEPTED", "FINALIZED",
    ]);
  });
});
