// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STUDIONET, useWallet, WalletProvider, type Eip1193Provider } from "./wallet";

const account = "0x1111111111111111111111111111111111111111";

function Probe() {
  const wallet = useWallet();
  return <><span>{wallet.account ?? "disconnected"}</span><button onClick={wallet.openPicker}>Choose wallet</button></>;
}

describe("wallet reconnect", () => {
  afterEach(() => {
    cleanup();
    delete window.okxwallet;
    window.localStorage.clear();
  });

  it("reuses an already-authorized account without requesting permission again", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") return [account];
      if (method === "eth_requestAccounts") throw { code: 4001 };
      if (method === "eth_chainId") return STUDIONET.chainId;
      return null;
    });
    window.okxwallet = { request } as Eip1193Provider;

    render(<WalletProvider><Probe /></WalletProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Choose wallet" }));
    fireEvent.click(await screen.findByRole("button", { name: /OKX Wallet.*Injected provider/i }));

    await screen.findByText(account);
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ method: "eth_requestAccounts" }));
  });

  it("deduplicates an injected provider when that provider also announces via EIP-6963", async () => {
    const provider = { request: vi.fn(async () => []) } as Eip1193Provider;
    window.okxwallet = provider;
    render(<WalletProvider><Probe /></WalletProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Choose wallet" }));
    await screen.findByRole("button", { name: /OKX Wallet.*Injected provider/i });

    window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: { info: { uuid: "okx-eip6963", name: "OKX Wallet", rdns: "com.okex.wallet" }, provider } }));

    await screen.findByRole("button", { name: /OKX Wallet.*Detected securely/i });
    expect(screen.getAllByRole("button", { name: /OKX Wallet/i })).toHaveLength(1);
  });
});
