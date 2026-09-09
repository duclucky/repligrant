import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { studionet } from "genlayer-js/chains";
import { Check, WalletCards, X } from "lucide-react";

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon?: string;
  rdns?: string;
}

interface Eip6963Detail {
  info: Eip6963ProviderInfo;
  provider: Eip1193Provider;
}

export interface DetectedWallet extends Eip6963Detail {
  source: "EIP-6963" | "INJECTED";
}

export const WALLET_STORAGE_KEY = "repligrant.selectedWallet";

export interface PersistedWalletIdentity {
  uuid: string;
  name: string;
  rdns?: string;
}

export function walletIdentity(wallet: DetectedWallet): PersistedWalletIdentity {
  return { uuid: wallet.info.uuid, name: wallet.info.name, rdns: wallet.info.rdns };
}

export function matchesWalletIdentity(wallet: DetectedWallet, saved: PersistedWalletIdentity): boolean {
  return wallet.info.uuid === saved.uuid
    || (Boolean(saved.rdns) && wallet.info.rdns === saved.rdns);
}

let activeWalletSession: { account: string; provider: Eip1193Provider } | null = null;

export function getActiveWalletSession() {
  return activeWalletSession;
}

interface WalletContextValue {
  account: string | null;
  selectedWallet: DetectedWallet | null;
  wallets: DetectedWallet[];
  isPickerOpen: boolean;
  error: string | null;
  openPicker(): void;
  closePicker(): void;
  connect(wallet: DetectedWallet): Promise<void>;
  disconnect(): void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      providers?: Eip1193Provider[];
      isMetaMask?: boolean;
      isRabby?: boolean;
      isCoinbaseWallet?: boolean;
      isBraveWallet?: boolean;
    };
    okxwallet?: Eip1193Provider;
    rabby?: Eip1193Provider;
    coinbaseWalletExtension?: Eip1193Provider;
  }
}

export const STUDIONET = {
  chainId: `0x${studionet.id.toString(16)}`,
  chainName: "GenLayer Studionet",
  rpcUrls: ["https://studio.genlayer.com/api"],
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
};

const WalletContext = createContext<WalletContextValue | null>(null);

function readPersistedWallet(): PersistedWalletIdentity | null {
  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedWalletIdentity>;
    if (typeof parsed.uuid !== "string" || typeof parsed.name !== "string") return null;
    return { uuid: parsed.uuid, name: parsed.name, rdns: typeof parsed.rdns === "string" ? parsed.rdns : undefined };
  } catch {
    return null;
  }
}

function writePersistedWallet(wallet: DetectedWallet): void {
  try { window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletIdentity(wallet))); } catch { /* storage is optional */ }
}

function clearPersistedWallet(): void {
  try { window.localStorage.removeItem(WALLET_STORAGE_KEY); } catch { /* storage is optional */ }
}

function isAddress(value: unknown): value is string {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function fallbackWallets(): DetectedWallet[] {
  const candidates: Array<[string, Eip1193Provider | undefined]> = [
    ["OKX Wallet", window.okxwallet],
    ["Rabby Wallet", window.rabby],
    ["Coinbase Wallet", window.coinbaseWalletExtension],
  ];

  if (window.ethereum) {
    const injected = window.ethereum.providers?.length ? window.ethereum.providers : [window.ethereum];
    for (const provider of injected) {
      const name = provider === window.ethereum && window.ethereum.isRabby
        ? "Rabby Wallet"
        : provider === window.ethereum && window.ethereum.isCoinbaseWallet
          ? "Coinbase Wallet"
          : provider === window.ethereum && window.ethereum.isBraveWallet
            ? "Brave Wallet"
            : provider === window.ethereum && window.ethereum.isMetaMask
              ? "MetaMask"
              : "Browser Wallet";
      candidates.push([name, provider]);
    }
  }

  const seen = new Set<Eip1193Provider>();
  return candidates.flatMap(([name, provider], index) => {
    if (!provider || seen.has(provider)) return [];
    seen.add(provider);
    return [{
      info: { uuid: `injected-${index}-${name.toLowerCase().replaceAll(" ", "-")}`, name },
      provider,
      source: "INJECTED" as const,
    }];
  });
}

export async function ensureStudionet(provider: Eip1193Provider): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET.chainId }],
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? Number(error.code) : null;
    if (code !== 4902 && code !== -32603) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [STUDIONET],
    });
  }
  const activeChainId = await provider.request({ method: "eth_chainId" });
  if (String(activeChainId).toLowerCase() !== STUDIONET.chainId.toLowerCase()) {
    throw new Error(`Wallet is still on chain ${String(activeChainId)}; switch to GenLayer Studionet (${studionet.id}) before signing.`);
  }
}

export function WalletProvider({ children }: PropsWithChildren) {
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<DetectedWallet | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const restoreAttempted = useRef(false);

  useEffect(() => {
    const discovered = new Map<string, DetectedWallet>();
    const addWallet = (wallet: DetectedWallet) => {
      const key = wallet.info.uuid || wallet.info.rdns || wallet.info.name;
      discovered.set(key, wallet);
      setWallets([...discovered.values()]);
    };

    for (const wallet of fallbackWallets()) addWallet(wallet);

    const announce = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963Detail>).detail;
      if (detail?.provider && detail.info?.uuid && detail.info.name) {
        addWallet({ ...detail, source: "EIP-6963" });
      }
    };
    window.addEventListener("eip6963:announceProvider", announce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", announce);
  }, []);

  useEffect(() => {
    if (restoreAttempted.current || wallets.length === 0) return;
    const saved = readPersistedWallet();
    if (!saved) {
      restoreAttempted.current = true;
      return;
    }
    const wallet = wallets.find((item) => matchesWalletIdentity(item, saved));
    if (!wallet) return;
    restoreAttempted.current = true;
    void (async () => {
      try {
        const accounts = await wallet.provider.request({ method: "eth_accounts" });
        if (!Array.isArray(accounts) || !isAddress(accounts[0])) return;
        await ensureStudionet(wallet.provider);
        setSelectedWallet(wallet);
        setAccount(accounts[0]);
        activeWalletSession = { account: accounts[0], provider: wallet.provider };
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Saved wallet could not be restored.");
      }
    })();
  }, [wallets]);

  useEffect(() => {
    if (!selectedWallet?.provider.on) return;
    const handleAccounts = (...args: unknown[]) => {
      const accounts = args[0];
      if (!Array.isArray(accounts) || !isAddress(accounts[0])) {
        setAccount(null);
        activeWalletSession = null;
        return;
      }
      setAccount(accounts[0]);
      activeWalletSession = { account: accounts[0], provider: selectedWallet.provider };
    };
    selectedWallet.provider.on("accountsChanged", handleAccounts);
    return () => selectedWallet.provider.removeListener?.("accountsChanged", handleAccounts);
  }, [selectedWallet]);

  const connect = useCallback(async (wallet: DetectedWallet) => {
    setError(null);
    try {
      const accounts = await wallet.provider.request({ method: "eth_requestAccounts" });
      if (!Array.isArray(accounts) || !isAddress(accounts[0])) {
        throw new Error("The selected wallet did not return a valid account address.");
      }
      await ensureStudionet(wallet.provider);
      setSelectedWallet(wallet);
      setAccount(accounts[0]);
      activeWalletSession = { account: accounts[0], provider: wallet.provider };
      writePersistedWallet(wallet);
      setPickerOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Wallet connection was not completed.");
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setSelectedWallet(null);
    activeWalletSession = null;
    clearPersistedWallet();
    setError(null);
  }, []);

  const value = useMemo<WalletContextValue>(() => ({
    account,
    selectedWallet,
    wallets,
    isPickerOpen,
    error,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
    connect,
    disconnect,
  }), [account, selectedWallet, wallets, isPickerOpen, error, connect, disconnect]);

  return (
    <WalletContext.Provider value={value}>
      {children}
      <WalletPicker />
    </WalletContext.Provider>
  );
}

function WalletPicker() {
  const wallet = useWallet();
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!wallet.isPickerOpen) return;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") wallet.closePicker();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [wallet]);

  if (!wallet.isPickerOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) wallet.closePicker();
    }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="wallet-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Choose your signer</p>
            <h2 id="wallet-title">Connect an EVM wallet</h2>
          </div>
          <button ref={closeButton} className="icon-button" aria-label="Close wallet picker" onClick={wallet.closePicker}>
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <p className="muted">You choose which detected wallet can request accounts. RepliGrant never stores a private key.</p>
        <div className="wallet-list">
          {wallet.wallets.map((item) => (
            <button className="wallet-option" key={item.info.uuid} onClick={() => void wallet.connect(item)}>
              {item.info.icon?.startsWith("data:image/") ? (
                <img src={item.info.icon} alt="" width="32" height="32" />
              ) : (
                <WalletCards aria-hidden="true" size={28} />
              )}
              <span>
                <strong>{item.info.name}</strong>
                <small>{item.source === "EIP-6963" ? "Detected securely" : "Injected provider"}</small>
              </span>
              <Check aria-hidden="true" className="wallet-check" size={18} />
            </button>
          ))}
          {wallet.wallets.length === 0 && (
            <div className="empty-compact">
              <WalletCards aria-hidden="true" size={28} />
              <p>No compatible browser wallet was detected. Install or enable an EVM wallet, then reopen this dialog.</p>
            </div>
          )}
        </div>
        {wallet.error && <p className="field-error" role="alert">{wallet.error}</p>}
      </section>
    </div>
  );
}

export function useWallet(): WalletContextValue {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider");
  return value;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
