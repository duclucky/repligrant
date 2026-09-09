import { describe, expect, it } from "vitest";
import { studionet } from "genlayer-js/chains";
import { ensureStudionet, matchesWalletIdentity, shortenAddress, STUDIONET, walletIdentity, type DetectedWallet } from "./wallet";

describe("wallet display", () => {
  it("shortens an address without changing the underlying value", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678";
    expect(shortenAddress(address)).toBe("0x1234...5678");
  });

  it("uses the genlayer-js Studionet chain id for wallet switching", () => {
    expect(Number.parseInt(STUDIONET.chainId, 16)).toBe(studionet.id);
    expect(studionet.id).toBe(61999);
  });

  it("requests a Studionet switch when a connected wallet is on another chain", async () => {
    const requests: Array<{ method: string; params?: unknown[] | object }> = [];
    const provider = { request: async (request: { method: string; params?: unknown[] | object }) => { requests.push(request); return request.method === "eth_chainId" ? STUDIONET.chainId : null; } };
    await ensureStudionet(provider);
    expect(requests).toEqual([
      { method: "wallet_switchEthereumChain", params: [{ chainId: STUDIONET.chainId }] },
      { method: "eth_chainId" },
    ]);
  });

  it("stops before signing when the provider remains on another chain", async () => {
    const provider = { request: async (request: { method: string; params?: unknown[] | object }) => request.method === "eth_chainId" ? "0x1" : null };
    await expect(ensureStudionet(provider)).rejects.toThrow(/still on chain/);
  });

  it("persists a selected provider identity without persisting a private key", () => {
    const wallet: DetectedWallet = { info: { uuid: "okx-1", name: "OKX Wallet", rdns: "com.okex.wallet" }, provider: { request: async () => [] }, source: "EIP-6963" };
    const identity = walletIdentity(wallet);
    expect(identity).toEqual({ uuid: "okx-1", name: "OKX Wallet", rdns: "com.okex.wallet" });
    expect(JSON.stringify(identity)).not.toContain("private");
    expect(matchesWalletIdentity(wallet, identity)).toBe(true);
    expect(matchesWalletIdentity({ ...wallet, info: { uuid: "other", name: "Other" } }, identity)).toBe(false);
  });
});
