"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownToLine, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, FileUp, Gauge, HeartHandshake, Info, LoaderCircle, LockKeyhole, Menu, MessageSquareText, Search, ShieldCheck, ShoppingBag, Sparkles, Upload, Users, X } from "lucide-react";
import { Analysis, SaleRow, ShopperInsight, analyzeSales, money, parseSalesCsv, shortDate } from "@/lib/analysis";

const SAMPLE_PATH = "/uci-online-retail.csv";
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

function alias(key: string) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) { hash ^= key.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return "Shopper " + Math.abs(hash >>> 0).toString(36).slice(0, 4).toUpperCase();
}

export default function Home() {
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [source, setSource] = useState("Loading public dataset…");
  const [isSample, setIsSample] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [asOfInput, setAsOfInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");

  useEffect(() => { void loadSample(); }, []);

  async function loadSample() {
    setLoading(true); setError(""); setWarning(""); setAsOfInput(""); setSearch(""); setSelectedKey(""); setDraft("");
    try {
      const response = await fetch(SAMPLE_PATH, { cache: "no-store" });
      if (!response.ok) throw new Error("Public transaction sample could not be loaded.");
      const parsed = parseSalesCsv(await response.text());
      setRows(parsed.rows); setSource("UCI Online Retail · 2010–2011 historical transactions"); setFileName("UCI Online Retail.csv"); setIsSample(true); setWarning(parsed.warnings.join(" "));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load the sample data."); setSource("No sales data loaded"); }
    finally { setLoading(false); }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) { setError("This file is over 30 MB. Export a smaller date range from your sales system and try again."); return; }
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Upload a CSV export. Excel workbooks need to be saved as CSV first."); return; }
    setLoading(true); setError(""); setWarning(""); setDraft(""); setAsOfInput(""); setSelectedKey("");
    try {
      const parsed = parseSalesCsv(await file.text());
      setRows(parsed.rows); setSource("Your CSV · processed in this browser"); setFileName(file.name); setIsSample(false); setWarning(parsed.warnings.join(" "));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not read the file."); }
    finally { setLoading(false); }
  }

  const analysis: Analysis | null = useMemo(() => rows.length ? analyzeSales(rows, asOfInput || undefined) : null, [rows, asOfInput]);
  const filtered = useMemo(() => {
    if (!analysis) return [];
    const q = search.trim().toLowerCase();
    return analysis.overdue.filter((buyer) => !q || alias(buyer.customerKey).toLowerCase().includes(q) || buyer.productName.toLowerCase().includes(q)).slice(0, 80);
  }, [analysis, search]);
  const selected: ShopperInsight | null = useMemo(() => {
    if (!analysis) return null;
    return analysis.overdue.find((buyer) => buyer.customerKey === selectedKey) || analysis.overdue[0] || null;
  }, [analysis, selectedKey]);

  async function makeDraft(buyer: ShopperInsight) {
    setDrafting(true); setDraft(""); setDraftError("");
    try {
      const response = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productName: buyer.productName, usualDays: buyer.usualDays, daysSinceLast: buyer.daysSinceLast, daysLate: buyer.lateDays }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not draft a message.");
      setDraft(data.draft);
    } catch (e) { setDraftError(e instanceof Error ? e.message : "Could not reach LM Studio."); }
    finally { setDrafting(false); }
  }

  const dataReady = Boolean(analysis && rows.length);
  const selectedPosition = selected ? analysis?.overdue.findIndex((buyer) => buyer.customerKey === selected.customerKey) ?? -1 : -1;

  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobileOpen ? "open" : "")}>
        <div className="brand"><span className="brand-mark"><Activity size={20} strokeWidth={2.4}/></span><span>rhythm<span className="brand-period">.</span><small>RETENTION STUDIO</small></span><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
        <div className="shop-switch"><div className="shop-avatar">M</div><div><b>Merchant workspace</b><small>Local analysis</small></div><ChevronDown size={15}/></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav">
          {[{label:"Overview",icon:Gauge},{label:"Customers",icon:Users},{label:"Pilot planner",icon:CalendarDays}].map(({label,icon:Icon})=><button key={label} className={"nav-item " + (activeNav===label?"active":"")} onClick={() => {setActiveNav(label); setMobileOpen(false); if(label==="Customers") document.getElementById("customer-list")?.scrollIntoView({behavior:"smooth"}); else if(label==="Pilot planner") document.getElementById("pilot-plan")?.scrollIntoView({behavior:"smooth"}); else window.scrollTo({top:0,behavior:"smooth"});}}><Icon size={17}/>{label}{label==="Customers"&&analysis?<span className="nav-count">{analysis.overdue.length}</span>:null}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-card"><div><LockKeyhole size={16}/><b>Private by design</b></div><p>Sales files are analyzed in this browser. No customer list is uploaded to a cloud service.</p></div>
          <div className="amd-chip"><span className="amd-glyph">A</span><span>Local AI, on your terms<small>LM Studio · OpenAI-compatible</small></span></div>
          <button className="help-link" onClick={() => document.getElementById("method")?.scrollIntoView({behavior:"smooth"})}><CircleHelp size={16}/> How Rhythm works</button>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close menu backdrop" className="backdrop" onClick={() => setMobileOpen(false)}/>}
      <main className="main-area">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20}/></button><div className="breadcrumbs">Workspace <ChevronRight size={14}/> <b>{activeNav}</b></div><div className="topbar-right"><span className="live-dot"/> LOCAL WORKSPACE <span className="top-divider"/><button className="icon-button" title="Privacy details" onClick={() => document.getElementById("privacy")?.scrollIntoView({behavior:"smooth"})}><ShieldCheck size={17}/></button></div></header>
        <div className="content-wrap">
          <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> CUSTOMER ANALYTICS</div><h1>Customer overview</h1><p className="welcome-copy">Review repeat purchases, spot shoppers outside their usual cadence, and see the evidence behind each suggested follow-up.</p></div><div className="welcome-actions"><label className="button secondary upload-button"><Upload size={16}/> Upload sales CSV<input type="file" accept=".csv,text/csv" onChange={importFile}/></label><button className="button text-button" onClick={() => void loadSample()}><ArrowDownToLine size={15}/> Restore research dataset</button></div></section>
          <section className="data-ribbon"><div className="data-icon"><ShoppingBag size={17}/></div><div className="data-copy"><b>{source}</b><span>{isSample?"A real, public research dataset. Historical—not live merchant sales.":"Your file stays in this browser session and is not saved."}</span></div><div className="data-ribbon-right"><span className="data-pill">{isSample?"PUBLIC DATA":"PRIVATE SESSION"}</span><span className="file-label">{fileName}</span></div></section>
          {error && <div className="alert error-alert"><Info size={17}/><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={16}/></button></div>}
          {warning && <div className="alert warning-alert"><Info size={17}/><span>{warning}</span><button onClick={() => setWarning("")} aria-label="Dismiss"><X size={16}/></button></div>}
          {loading ? <div className="loading-panel"><LoaderCircle className="spin" size={24}/><span>Reading sales records locally…</span></div> : dataReady && analysis ? <>
            <section className="snapshot-row"><div><span className="section-kicker">REPORTING DATE</span><p>Historical snapshot used for these customer metrics.</p></div><label className="date-select"><CalendarDays size={16}/><input type="date" value={asOfInput || analysis.asOf} min={analysis.minDate} max={analysis.maxDate} onChange={(e) => setAsOfInput(e.target.value)}/><ChevronDown size={14}/></label></section>
            <section className="metric-grid">
              <Metric icon={<Users size={17}/>} label="Repeat shoppers" value={analysis.eligibleShoppers.toLocaleString()} note="4+ distinct purchase days before snapshot" tone="violet"/>
              <Metric icon={<Clock3 size={17}/>} label="Out of their rhythm" value={analysis.overdue.length.toLocaleString()} note="Beyond personal repeat threshold" tone="orange"/>
              <Metric icon={<Activity size={17}/>} label="Typical repeat cadence" value={analysis.medianCadence ? analysis.medianCadence + " days" : "—"} note="Median across eligible shoppers" tone="blue"/>
              <Metric icon={<ArrowUpRight size={17}/>} label="Natural return · 30 days" value={analysis.naturalReturnRate === null ? "—" : Math.round(analysis.naturalReturnRate * 100) + "%"} note={analysis.naturalReturnRate === null ? "Choose a date with 30 days of data after it" : "Historical behavior, not campaign impact"} tone="green"/>
            </section>
            <section className="grid-main">
              <div className="card customer-card" id="customer-list">
                <div className="card-heading"><div><span className="section-kicker">WORTH A LOOK</span><h2>Shoppers past their usual rhythm</h2><p>Select a shopper to review the purchase history behind the signal.</p></div><span className="subtle-count">{analysis.overdue.length} found</span></div>
                <div className="search-box"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search aliases or repeat items"/></div>
                <div className="table-scroll"><table><thead><tr><th>SHOPPER</th><th>USUAL GAP</th><th>LAST ORDER</th><th>OVERDUE BY</th><th></th></tr></thead><tbody>
                  {filtered.map((buyer, i) => <tr key={buyer.customerKey} className={selected?.customerKey===buyer.customerKey?"chosen":""} onClick={() => {setSelectedKey(buyer.customerKey);setDraft("");setDraftError("");}}><td><span className="shopper-cell"><span className={"shopper-avatar avatar-"+(i%5)}>{alias(buyer.customerKey).slice(-2)}</span><span><b>{alias(buyer.customerKey)}</b><small>{buyer.ordersBefore} purchase days</small></span></span></td><td><span className="cadence-value">{buyer.usualDays} days</span></td><td>{shortDate(buyer.lastOrder)}</td><td><span className="late-pill">+{buyer.lateDays} days</span></td><td><ChevronRight size={16} className="row-chevron"/></td></tr>)}
                  {!filtered.length && <tr><td colSpan={5} className="empty-row">{analysis.overdue.length?"No shoppers match that search.":"No shoppers are beyond their personal threshold on this date."}</td></tr>}
                </tbody></table></div>
                <div className="table-foot"><span>Showing {filtered.length} of {analysis.overdue.length} flagged shoppers</span><span><LockKeyhole size={13}/> IDs are masked in this view</span></div>
              </div>
              <aside className="card insight-card">
                <div className="insight-top"><span className="section-kicker">SHOPPER DETAILS</span><span className="rank-label">#{Math.max(1,selectedPosition+1)} IN QUEUE</span></div>
                {selected ? <>
                  <div className="profile-heading"><div className="profile-avatar">{alias(selected.customerKey).slice(-2)}</div><div><h2>{alias(selected.customerKey)}</h2><span className="profile-status"><span/> Review suggested</span></div></div>
                  <div className="reason-box"><div className="reason-head"><span className="reason-mark"><Activity size={15}/></span><b>Why Rhythm flagged them</b></div><p>They usually order every <strong>{selected.usualDays} days</strong>. It has been <strong>{selected.daysSinceLast} days</strong> since the last order—<strong>{selected.lateDays} days beyond</strong> their personal threshold.</p><div className="rhythm-scale"><div className="scale-labels"><span>Usual: {selected.usualDays}d</span><span>Now: {selected.daysSinceLast}d</span></div><div className="scale-track"><div className="scale-fill" style={{width:Math.min(100,Math.max(14,(selected.daysSinceLast/Math.max(selected.thresholdDays*2,1))*100))+"%"}}/><span className="threshold-tick" style={{left:Math.min(92,(selected.thresholdDays/Math.max(selected.thresholdDays*2,1))*100)+"%"}}/></div><div className="scale-caption">Personal threshold: {selected.thresholdDays} days</div></div></div>
                  <div className="repeat-item"><div className="repeat-item-icon"><ShoppingBag size={17}/></div><div><span className="mini-label">MOST REPEATED ITEM</span><b>{selected.productName}</b><small>Appeared in {selected.repeatCount} separate order days</small></div></div>
                  <div className="draft-section"><div className="draft-title"><div><Sparkles size={16}/><b>Thoughtful next step</b></div><span>GEMMA · LOCAL</span></div><p>Draft a low-pressure reorder reminder from the purchase evidence. No discount is assumed.</p>
                    {draft ? <div className="draft-result"><div className="draft-result-head"><Check size={14}/> Draft ready <button onClick={() => setDraft("")} aria-label="Clear draft"><X size={14}/></button></div><p>{draft}</p><small>Review and personalize before sending. Rhythm never sends messages.</small></div> : <button className="button ai-button" disabled={drafting} onClick={() => void makeDraft(selected)}>{drafting?<LoaderCircle size={16} className="spin"/>:<Sparkles size={16}/>} {drafting?"Asking local model…":"Draft a follow-up"}<ArrowUpRight size={15}/></button>}
                    {draftError && <div className="ai-error">{draftError}</div>}
                    <div className="local-note"><LockKeyhole size={13}/> Only the item name and timing evidence go to your local LM Studio endpoint.</div>
                  </div>
                </> : <div className="no-risk"><Check size={24}/><b>No overdue repeat shoppers</b><p>Try another snapshot date or load a dataset with more repeat purchases.</p></div>}
              </aside>
            </section>
            <section className="pilot-row" id="pilot-plan"><div className="pilot-icon"><MessageSquareText size={18}/></div><div className="pilot-copy"><span className="section-kicker">MAKE THE NEXT STEP MEASURABLE</span><h2>Test a thoughtful nudge, not a blanket discount.</h2><p>For a real campaign, hold back a random control group. Compare 30-day repeat purchases and gross margin between contacted and holdout customers before claiming impact.</p></div><div className="pilot-metric"><b>30 days</b><span>suggested review window</span></div><div className="pilot-link"><span>Not a revenue-lift claim</span><Info size={15}/></div></section>
            <section className="method-row" id="method"><div className="method-main"><span className="section-kicker">TRANSPARENT RHYTHM RULE</span><h2>A personal clock, not a generic churn score.</h2><p>We use each shopper’s own history to estimate when their usual routine has shifted. Four purchase days are required before a shopper can be assessed.</p><div className="formula"><span>Flag for review when</span><b>days since last order &gt; max(14, 1.6 × personal median gap)</b></div><small>This is a review signal, not a churn prediction. It does not infer why the customer is late.</small></div><div className="method-side"><div className="method-stat"><b>{analysis.totalOrders.toLocaleString()}</b><span>orders included</span></div><div className="method-stat"><b>{analysis.totalRows.toLocaleString()}</b><span>line items analyzed</span></div><div className="method-stat"><b>{shortDate(analysis.minDate)} – {shortDate(analysis.maxDate)}</b><span>data coverage</span></div></div></section>
            <section className="privacy-footer" id="privacy"><div><ShieldCheck size={17}/><b>Privacy stays part of the product</b></div><p>CSV analysis stays in browser memory and is cleared when the page closes. Customer identifiers are masked in the interface. The message draft request contains no customer ID or contact details and is sent only to the configured local model endpoint.</p><span>Public sample: UCI Machine Learning Repository · Online Retail · CC BY 4.0 · Chen (2015)</span></section>
          </> : <div className="empty-state"><div className="empty-graphic"><FileUp size={28}/></div><h2>Bring in transaction history.</h2><p>Upload a sales CSV with order, customer, product, quantity, date and unit-price columns. Or restore the real public research dataset.</p><button className="button primary" onClick={() => void loadSample()}><ArrowDownToLine size={16}/> Load UCI research dataset</button></div>}
          <footer className="app-footer"><span>RHYTHM · RETENTION, IN TIME</span><span>Historical data is not live performance. Recommendations need a human review.</span></footer>
        </div>
      </main>
    </div>
  );
}

function Metric({icon,label,value,note,tone}:{icon:React.ReactNode;label:string;value:string;note:string;tone:string}) {
  return <div className="metric-card"><div className={"metric-icon "+tone}>{icon}</div><div className="metric-meta"><span>{label}</span><b>{value}</b><small>{note}</small></div><span className={"metric-orbit "+tone}/></div>;
}
