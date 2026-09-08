import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { createContractAdapter } from "./adapter";

const sender = "0x1111111111111111111111111111111111111111" as const;
const contract = "0x2222222222222222222222222222222222222222" as const;
const fixtureHash = `0x${"33".repeat(32)}` as const;

describe("RepliGrant adapter wallet-account boundary", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("uses the selected account at createClient and sends exact 2 GEN without a raw account override", async () => {
    const walletRequests: Array<{ method: string; params?: unknown[] | object }> = [];
    const rpcMethods: string[] = [];
    const originalFetch = globalThis.fetch;
    vi.stubGlobal("fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { method?: string; id?: number };
      rpcMethods.push(String(body.method));
      const fixtures: Record<string, string> = { eth_getTransactionCount: "0x0", eth_estimateGas: "0x30d40", eth_gasPrice: "0x0" };
      const result = fixtures[body.method ?? ""];
      if (!result) throw new Error(`Unexpected RPC ${body.method}`);
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id ?? 1, result }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const provider = {
      async request(request: { method: string; params?: unknown[] | object }) {
        walletRequests.push(request);
        if (request.method === "eth_chainId") return `0x${studionet.id.toString(16)}`;
        if (request.method === "eth_sendTransaction") return fixtureHash;
        throw new Error(`Unexpected wallet method ${request.method}`);
      },
    };
    const offlineChain = { ...studionet, rpcUrls: { default: { http: ["https://offline-repligrant.invalid"] } } };
    const clientFactory: typeof createClient = (config) => {
      const client = createClient({ ...config, chain: offlineChain });
      client.waitForTransactionReceipt = async (_args: Parameters<typeof client.waitForTransactionReceipt>[0]) => ({ resultName: "SUCCESS", txExecutionResultName: "FINISHED_WITH_RETURN" }) as Awaited<ReturnType<typeof client.waitForTransactionReceipt>>;
      client.readContract = (async () => JSON.stringify([{ id: "R-1", title: "Bounded claim" }])) as typeof client.readContract;
      return client;
    };
    const adapter = createContractAdapter({ contractAddress: contract, endpoint: "https://offline-repligrant.invalid", clientFactory, sessionGetter: () => ({ account: sender, provider }) });
    const phases: string[] = [];
    const roundId = await adapter.openRound({ title: "Bounded claim", claim: "A claim", originalPmcid: "PMC8500892", originalDoi: "10.3758/s13423-021-01928-7", scopeIds: ["outcome"], deadline: 1_900_000_000 }, (state) => phases.push(state.phase));
    expect(roundId).toBe("R-1");
    const send = walletRequests.find((request) => request.method === "eth_sendTransaction");
    const transaction = Array.isArray(send?.params) ? send.params[0] as Record<string, string> : {};
    expect(transaction.from.toLowerCase()).toBe(sender);
    expect(BigInt(transaction.value)).toBe(2n * 10n ** 18n);
    expect(phases).toEqual(["AWAITING_SIGNATURE", "SUBMITTED", "ACCEPTED", "FINALIZED"]);
    expect(rpcMethods).toContain("eth_estimateGas");
    globalThis.fetch = originalFetch;
  });
});
