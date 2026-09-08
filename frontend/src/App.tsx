import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FlaskConical,
  LayoutList,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import {
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ContractNotConfiguredError, contractAdapter } from "./adapter";
import type {
  ActivityItem,
  ClaimStatus,
  CreditBalance,
  RoundDetail,
  RoundSummary,
  TransactionPhase,
  TransactionState,
} from "./types";
import { shortenAddress, useWallet } from "./wallet";

const initialTransaction: TransactionState = { phase: "IDLE", message: "" };

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="rounds" element={<ExplorePage />} />
        <Route path="rounds/new" element={<NewRoundPage />} />
        <Route path="rounds/:roundId" element={<RoundPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="help" element={<HelpPage />} />
      </Route>
    </Routes>
  );
}

function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const wallet = useWallet();
  const navItems = [
    ["Explore", "/rounds"],
    ["Activity", "/activity"],
    ["How it works", "/help"],
  ] as const;

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="RepliGrant home">
            <span className="brand-mark"><FlaskConical aria-hidden="true" size={19} /></span>
            <span>RepliGrant</span>
          </Link>
          <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Primary navigation">
            {navItems.map(([label, path]) => (
              <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>{label}</NavLink>
            ))}
          </nav>
          <div className="header-actions">
            {wallet.account ? <AccountMenu /> : <button className="button button-primary button-small" onClick={wallet.openPicker}><WalletCards aria-hidden="true" size={16} /> Connect wallet</button>}
            <button className="icon-button menu-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div><span className="footer-brand">RepliGrant</span><span className="muted">Evidence before incentives.</span></div>
          <div className="footer-links"><Link to="/help">Method</Link><Link to="/activity">Activity</Link><a href="https://explorer-studio.genlayer.com" target="_blank" rel="noreferrer">Studionet explorer <ExternalLink size={13} /></a></div>
        </div>
      </footer>
    </div>
  );
}

function AccountMenu() {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  if (!wallet.account) return null;
  return <div className="account-menu-wrap">
    <button className="account-pill" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span className="status-dot" />{shortenAddress(wallet.account)}<ChevronRight size={15} className={open ? "rotate-90" : ""} /></button>
    {open && <div className="account-menu" role="menu"><div className="account-menu-label">Connected wallet</div><div className="account-menu-address">{wallet.account}</div><button role="menuitem" onClick={() => { wallet.disconnect(); setOpen(false); }}><LogOut size={15} /> Disconnect</button></div>}
  </div>;
}

function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`container ${className}`.trim()}>{children}</div>;
}

function HomePage() {
  const wallet = useWallet();
  return <>
    <section className="hero-section">
      <Container className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" />Decentralized replication funding</p>
          <h1>Fund the check.<br /><em>Trust the evidence.</em></h1>
          <p className="hero-lede">RepliGrant turns replication evidence into a transparent, validator-reviewed funding decision. No opaque scores. No off-chain verdicts.</p>
          <div className="hero-actions"><Link className="button button-primary" to="/rounds">Explore rounds <ArrowRight size={17} /></Link><Link className="button button-secondary" to="/help">Read the method <BookOpen size={17} /></Link></div>
          <div className="hero-proof"><ShieldCheck size={17} /><span>Validator-reviewed decisions on GenLayer</span></div>
        </div>
        <div className="hero-card" aria-label="How RepliGrant works">
          <div className="hero-card-header"><span className="live-label"><span className="live-dot" />Live protocol</span><span className="mono-label">STUDIONET</span></div>
          <div className="evidence-stack">
            <EvidenceStep index="01" icon={<ClipboardCheck size={18} />} title="A claim is proposed" text="A sponsor publishes the original paper and a bounded replication scope." />
            <div className="stack-line" />
            <EvidenceStep index="02" icon={<FlaskConical size={18} />} title="Evidence is reviewed" text="Independent contributors submit public, attributable replication evidence." />
            <div className="stack-line" />
            <EvidenceStep index="03" icon={<ShieldCheck size={18} />} title="A verdict is finalized" text="GenLayer validators compare meaning before any credit becomes claimable." active />
          </div>
          <div className="hero-card-footer"><span>Every decision has a public trail.</span><span className="footer-check"><CheckCircle2 size={16} /> Auditable</span></div>
        </div>
      </Container>
    </section>
    <section className="section section-muted">
      <Container>
        <div className="section-heading split-heading"><div><p className="eyebrow">A clearer funding loop</p><h2>Evidence moves the round forward.</h2></div><p className="section-intro">One place to propose a question, inspect the evidence, and see exactly what the protocol decided.</p></div>
        <div className="feature-grid"><FeatureCard icon={<ShieldCheck />} title="Evidence-first" text="Canonical paper identifiers and bounded scopes anchor every round." /><FeatureCard icon={<Sparkles />} title="Meaning, not string matching" text="Validator consensus evaluates whether evidence actually supports or challenges the claim." /><FeatureCard icon={<Clock3 />} title="A visible lifecycle" text="Submitted, reviewing, finalized, and retryable are explicit states—not hidden progress." /></div>
      </Container>
    </section>
    <section className="section"><Container className="cta-panel"><div><p className="eyebrow">Start with a question worth checking</p><h2>Put replication on the record.</h2><p className="muted">Create a round once the contract is connected to Studionet. This preview never invents balances or decisions.</p></div><Link className="button button-dark" to={wallet.account ? "/rounds/new" : "/help"}>{wallet.account ? "Create a round" : "See how to connect"}<ArrowRight size={17} /></Link></Container></section>
  </>;
}

function EvidenceStep({ index, icon, title, text, active = false }: { index: string; icon: ReactNode; title: string; text: string; active?: boolean }) {
  return <div className={active ? "evidence-step active" : "evidence-step"}><span className="step-index">{index}</span><span className="step-icon">{icon}</span><span className="step-copy"><strong>{title}</strong><span>{text}</span></span>{active && <CheckCircle2 className="step-status" size={18} />}</div>;
}

function FeatureCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <article className="feature-card"><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p><span className="feature-rule" /></article>;
}

function ExplorePage() {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setError(null); try { setRounds(await contractAdapter.listRounds()); } catch (cause) { setError(cause instanceof ContractNotConfiguredError ? "Round data will appear after the Studionet contract address is configured." : "Round data could not be loaded."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  return <section className="page-section"><Container><PageIntro eyebrow="Explore" title="Replication rounds" description="Browse open questions, inspect their evidence scope, and follow each finalized decision." action={<Link className="button button-primary" to="/rounds/new"><Plus size={17} /> New round</Link>} /><div className="toolbar"><div className="filter-tabs"><button className="filter-tab active">All rounds</button><button className="filter-tab" disabled>Open</button><button className="filter-tab" disabled>Finalized</button></div><button className="icon-button" aria-label="Refresh rounds" onClick={() => void load()}><RefreshCw size={17} className={loading ? "spin" : ""} /></button></div>{error ? <ConfigurationNotice message={error} /> : rounds.length === 0 ? <EmptyState icon={<LayoutList />} title={loading ? "Loading rounds" : "No rounds yet"} text={loading ? "Reading canonical state from the contract." : "Once the contract is connected, active replication questions will appear here."} /> : <div className="round-grid">{rounds.map((round) => <RoundCard key={round.id} round={round} />)}</div>}</Container></section>;
}

function RoundCard({ round }: { round: RoundSummary }) {
  return <Link to={`/rounds/${round.id}`} className="round-card"><div className="card-topline"><StatusBadge status={round.status} /><span className="card-id">{round.id}</span></div><h3>{round.title}</h3><p>{round.claim}</p><div className="card-meta"><span>{round.originalPmcid}</span><span>{round.remainingSlots} slots</span><span>{round.remainingPurseGen} GEN</span></div><div className="card-footer"><span className="claim-label">Claim status: <strong>{formatClaim(round.claimStatus)}</strong></span><ChevronRight size={17} /></div></Link>;
}

function RoundPage() {
  const { roundId } = useParams();
  const [round, setRound] = useState<RoundDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!roundId) return; void contractAdapter.getRound(roundId).then(setRound).catch((cause) => setError(cause instanceof ContractNotConfiguredError ? "This round will be readable after the Studionet contract is configured." : "The round could not be loaded.")); }, [roundId]);
  if (error) return <section className="page-section"><Container><ConfigurationNotice message={error} /></Container></section>;
  if (!round) return <section className="page-section"><Container><EmptyState icon={<Clock3 />} title="Loading round" text="Reading the canonical round state." /></Container></section>;
  return <RoundDetailView round={round} />;
}

function RoundDetailView({ round }: { round: RoundDetail }) {
  const [transaction, setTransaction] = useState(initialTransaction);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await contractAdapter.submitReplication({ roundId: round.id, pmcid: String(form.get("pmcid")), doi: String(form.get("doi")) }, setTransaction); navigate(`/rounds/${round.id}`); } catch (cause) { setTransaction({ phase: "FAILED", message: cause instanceof Error ? cause.message : "Submission failed." }); } };
  return <section className="page-section"><Container><Link className="back-link" to="/rounds">← Back to rounds</Link><div className="detail-grid"><div><div className="detail-kicker"><StatusBadge status={round.status} /><span>{round.id}</span></div><h1>{round.title}</h1><p className="detail-claim">{round.claim}</p><div className="claim-callout"><ShieldCheck size={21} /><div><strong>Evidence scope is locked by the round</strong><span>{round.originalPmcid} · {round.originalDoi}</span></div></div><div className="detail-section"><h2>Replication evidence</h2>{round.submissions.length === 0 ? <EmptyState icon={<FlaskConical />} title="No submissions yet" text="Contributors can submit a public paper identifier for validator review." compact /> : <div className="submission-list">{round.submissions.map((submission) => <div className="submission-row" key={submission.id}><div><strong>{submission.pmcid}</strong><span>{submission.doi}</span></div><StatusBadge status={submission.status} /></div>)}</div>}</div></div><aside className="detail-aside"><div className="aside-card"><div className="aside-label">Round purse</div><strong className="aside-value">{round.remainingPurseGen} <small>GEN</small></strong><div className="aside-divider" /><div className="aside-stat"><span>Remaining slots</span><strong>{round.remainingSlots}</strong></div><div className="aside-stat"><span>Deadline</span><strong>{formatDate(round.deadline)}</strong></div><button className="button button-primary full-width" onClick={() => setShowForm((value) => !value)}><FlaskConical size={17} /> Submit evidence</button>{showForm && <form className="inline-form" onSubmit={(event) => void submit(event)}><label>Replication PMCID<input name="pmcid" required placeholder="PMC…" /></label><label>DOI<input name="doi" required placeholder="10.…" /></label><button className="button button-dark full-width" type="submit">Submit for review <ArrowRight size={16} /></button></form>}{transaction.phase !== "IDLE" && <TransactionNotice state={transaction} />}</div><div className="aside-note"><CheckCircle2 size={17} /><span>Only finalized validator outcomes can change claim status or credit.</span></div></aside></div></Container></section>;
}

function NewRoundPage() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(initialTransaction);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(null); const form = new FormData(event.currentTarget); try { const id = await contractAdapter.openRound({ title: String(form.get("title")), claim: String(form.get("claim")), originalPmcid: String(form.get("pmcid")), originalDoi: String(form.get("doi")), scopeIds: String(form.get("scope" )).split(",").map((value) => value.trim()).filter(Boolean), deadline: Math.floor(new Date(String(form.get("deadline"))).getTime() / 1000) }, setTransaction); navigate(`/rounds/${id}`); } catch (cause) { setError(cause instanceof Error ? cause.message : "Round creation failed."); } };
  return <section className="page-section"><Container className="narrow-container"><Link className="back-link" to="/rounds">← Back to rounds</Link><PageIntro eyebrow="New round" title="Put a claim on the record" description="Describe one research claim, its source, and the bounded evidence scope contributors should test." />{!wallet.account && <div className="inline-warning"><WalletCards size={18} /><span>Connect a wallet before creating a round.</span><button className="text-button" onClick={wallet.openPicker}>Connect wallet</button></div>}<form className="form-card" onSubmit={(event) => void submit(event)}><label>Round title<input name="title" required placeholder="e.g. Does intervention X improve outcome Y?" /></label><label>Original claim<textarea name="claim" required rows={4} placeholder="State the claim in a falsifiable, bounded way." /></label><div className="form-two-col"><label>Original PMCID<input name="pmcid" required placeholder="PMC8500892" /></label><label>Original DOI<input name="doi" required placeholder="10.3758/s13423-021-01928-7" /></label></div><label>Evidence scope IDs<span className="label-help">Comma-separated identifiers contributors must address.</span><input name="scope" required placeholder="sample, outcome, replication" /></label><label>Submission deadline<input name="deadline" required type="datetime-local" /></label><div className="form-footer"><span className="muted"><ShieldCheck size={16} /> Validator-reviewed after submission.</span><button className="button button-primary" type="submit" disabled={!wallet.account || transaction.phase === "AWAITING_SIGNATURE"}>Create round <ArrowRight size={17} /></button></div>{error && <p className="field-error" role="alert">{error}</p>}{transaction.phase !== "IDLE" && <TransactionNotice state={transaction} />}</form></Container></section>;
}

function ActivityPage() {
  const wallet = useWallet();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [credit, setCredit] = useState<CreditBalance | null>(null);
  const [transaction, setTransaction] = useState(initialTransaction);
  const [message, setMessage] = useState("Connect a wallet to read your canonical activity.");
  const load = async () => { if (!wallet.account) return; try { const [activity, balance] = await Promise.all([contractAdapter.getActivity(wallet.account), contractAdapter.getCredit(wallet.account)]); setItems(activity); setCredit(balance); } catch (cause) { setMessage(cause instanceof ContractNotConfiguredError ? "Activity will appear after the Studionet contract address is configured." : "Activity could not be loaded."); } };
  useEffect(() => { void load(); }, [wallet.account]);
  const withdraw = async () => { const creditId = credit?.claimableIds[0]; if (!creditId) return; try { await contractAdapter.withdrawCredit(creditId, setTransaction); await load(); } catch (cause) { setTransaction({ phase: "FAILED", message: cause instanceof Error ? cause.message : "Withdrawal failed." }); } };
  return <section className="page-section"><Container><PageIntro eyebrow="Activity" title="Your evidence trail" description="A canonical view of rounds, submissions, and finalized credits associated with the connected account." />{credit && <div className="credit-banner"><div><span className="eyebrow">Claimable credit</span><strong>{credit.claimableGen} GEN</strong></div><button className="button button-dark" onClick={() => void withdraw()} disabled={!credit.claimableIds.length || transaction.phase === "AWAITING_SIGNATURE"}>Withdraw credit <ArrowRight size={16} /></button>{transaction.phase !== "IDLE" && <TransactionNotice state={transaction} />}</div>}{items.length === 0 ? <EmptyState icon={<LayoutList />} title={wallet.account ? "No activity yet" : "Wallet not connected"} text={message} /> : <div className="activity-list">{items.map((item) => <Link className="activity-row" to={`/rounds/${item.roundId}`} key={item.id}><span className="activity-icon"><ActivityIcon kind={item.kind} /></span><span className="activity-copy"><strong>{item.title}</strong><span>{item.status}</span></span><ChevronRight size={17} /></Link>)}</div>}</Container></section>;
}

function AccountPage() {
  const wallet = useWallet();
  return <section className="page-section"><Container className="narrow-container"><PageIntro eyebrow="Account" title="Wallet and network" description="RepliGrant uses your selected EVM wallet for signatures and reads canonical state from the GenLayer contract path." />{wallet.account ? <div className="account-card"><div className="account-card-icon"><WalletCards size={23} /></div><div><span className="eyebrow">Connected account</span><strong className="account-full-address">{wallet.account}</strong><span className="muted">{wallet.selectedWallet?.info.name ?? "EVM wallet"} · GenLayer Studionet</span></div><button className="button button-secondary" onClick={wallet.disconnect}><LogOut size={16} /> Disconnect</button></div> : <EmptyState icon={<WalletCards />} title="No wallet connected" text="Choose a detected EVM wallet to enable signing. The app will switch or add Studionet before writes." action={<button className="button button-primary" onClick={wallet.openPicker}>Choose wallet</button>} />}</Container></section>;
}

function HelpPage() {
  return <section className="page-section"><Container className="narrow-container"><PageIntro eyebrow="Method" title="How RepliGrant works" description="A simple lifecycle for funding replication without hiding the hard parts." /><div className="method-list"><MethodRow number="01" title="Sponsor a bounded claim" text="A round names the original paper, DOI, PMCID, scope identifiers, deadline, and purse." /><MethodRow number="02" title="Contributors submit evidence" text="Submissions point to public research artifacts. The contract treats artifact prose as untrusted until authoritative fields and scope are checked." /><MethodRow number="03" title="Validators compare meaning" text="GenLayer validators review the evidence with an equivalence principle: semantic agreement matters, not identical wording." /><MethodRow number="04" title="Only finalized state settles credit" text="A qualified, challenged, mixed, retryable, or unverifiable outcome is explicit. No UI preview can mint, settle, or pretend a balance." /></div><div className="honesty-panel"><ShieldCheck size={20} /><div><strong>Honest by default</strong><p>When the contract address is not configured, RepliGrant shows empty/unconfigured states instead of fabricated rounds, balances, hashes, or verdicts.</p></div></div></Container></section>;
}

function MethodRow({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="method-row"><span className="step-index">{number}</span><div><h3>{title}</h3><p>{text}</p></div><CheckCircle2 size={18} /></div>;
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>;
}

function EmptyState({ icon, title, text, action, compact = false }: { icon: ReactNode; title: string; text: string; action?: ReactNode; compact?: boolean }) {
  return <div className={compact ? "empty-state compact" : "empty-state"}><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

function ConfigurationNotice({ message }: { message: string }) {
  return <div className="configuration-notice"><CircleHelp size={20} /><div><strong>Contract configuration required</strong><p>{message}</p></div><Link className="button button-secondary" to="/help">Read method</Link></div>;
}

function TransactionNotice({ state }: { state: TransactionState }) {
  const labels: Record<TransactionPhase, string> = { IDLE: "", AWAITING_SIGNATURE: "Awaiting wallet signature", SUBMITTED: "Submitted", ACCEPTED: "Accepted by the network", FINALIZED: "Finalized", FAILED: "Failed", RETRYABLE: "Retryable" };
  return <div className={`transaction-notice ${state.phase.toLowerCase()}`}><span className="transaction-dot" /><div><strong>{labels[state.phase]}</strong><p>{state.message}</p>{state.hash && <code>{state.hash}</code>}</div></div>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}><span />{formatStatus(status)}</span>;
}

function formatStatus(status: string) { return status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " "); }
function formatClaim(status: ClaimStatus) { return status.toLowerCase().replaceAll("_", " "); }
function formatDate(timestamp: number) { return timestamp ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp * 1000)) : "Not set"; }
function ActivityIcon({ kind }: { kind: ActivityItem["kind"] }) { return kind === "ROUND" ? <ClipboardCheck size={17} /> : kind === "SUBMISSION" ? <FlaskConical size={17} /> : <Sparkles size={17} />; }

export default App;
