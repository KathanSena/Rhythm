"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownToLine, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, FileUp, Gauge, HeartHandshake, Info, LoaderCircle, LockKeyhole, Menu, Search, ShieldCheck, ShoppingBag, Sparkles, Upload, Users, X } from "lucide-react";
import { Analysis, SaleRow, ShopperInsight, analyzeSales, money, parseSalesCsv, shortDate } from "@/lib/analysis";

const SAMPLE_PATH = "/uci-online-retail.csv";
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

type WatchlistItem = { productId: string; productName: string; shopperCount: number; typicalDays: number; medianLateDays: number };

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
  const [draftMode, setDraftMode] = useState<"template" | "ai" | "verified_template" | "">("");
  const [draftReview, setDraftReview] = useState<{ status: "passed" | "replaced" | "rules"; reasons: string[] } | null>(null);
  const [draftError, setDraftError] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");

  useEffect(() => { void loadSample(); }, []);

  async function loadSample() {
    setLoading(true); setError(""); setWarning(""); setAsOfInput(""); setSearch(""); setSelectedKey(""); setDraft(""); setDraftMode(""); setDraftReview(null);
    try {
      const response = await fetch(SAMPLE_PATH, { cache: "no-store" });
      if (!response.ok) throw new Error("Public transaction sample is unavailable.");
      const parsed = parseSalesCsv(await response.text());
      setRows(parsed.rows); setSource("UCI Online Retail · 2010–2011 historical transactions"); setFileName("UCI Online Retail.csv"); setIsSample(true); setWarning(parsed.warnings.join(" "));
    } catch (e) { setError(e instanceof Error ? e.message : "Sample data is unavailable. Restore the research dataset to try again."); setSource("Sales data unavailable"); }
    finally { setLoading(false); }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) { setError("This file is over 30 MB. Export a smaller date range from your sales system and try again."); return; }
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Upload a CSV export. Excel workbooks need to be saved as CSV first."); return; }
    setLoading(true); setError(""); setWarning(""); setDraft(""); setDraftMode(""); setDraftReview(null); setAsOfInput(""); setSelectedKey(""); setSearch("");
    try {
      const parsed = parseSalesCsv(await file.text());
      setRows(parsed.rows); setSource("Your CSV · processed in this browser"); setFileName(file.name); setIsSample(false); setWarning(parsed.warnings.join(" "));
    } catch (e) { setError(e instanceof Error ? e.message : "Check the CSV format and try again."); }
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

  const itemWatchlist: WatchlistItem[] = useMemo(() => {
    if (!analysis) return [];
    const groups = new Map<string, ShopperInsight[]>();
    for (const shopper of analysis.overdue) groups.set(shopper.productId, [...(groups.get(shopper.productId) || []), shopper]);
    return [...groups.entries()].map(([productId, shoppers]) => {
      const median = (values: number[]) => {
        const sorted = values.slice().sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
      };
      return {
        productId,
        productName: shoppers[0].productName,
        shopperCount: shoppers.length,
        typicalDays: Math.round(median(shoppers.map((shopper) => shopper.usualDays))),
        medianLateDays: Math.round(median(shoppers.map((shopper) => shopper.lateDays))),
      };
    }).sort((a, b) => b.shopperCount - a.shopperCount || b.medianLateDays - a.medianLateDays || a.productName.localeCompare(b.productName)).slice(0, 5);
  }, [analysis]);

  async function makeDraft(buyer: ShopperInsight) {
    setDrafting(true); setDraft(""); setDraftMode(""); setDraftReview(null); setDraftError("");
    try {
      const response = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productName: buyer.productName, usualDays: buyer.usualDays, daysSinceLast: buyer.daysSinceLast, daysLate: buyer.lateDays }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try drafting again.");
      setDraft(data.draft);
      setDraftMode(data.mode === "ai" || data.mode === "verified_template" ? data.mode : "template");
      setDraftReview(data.review || null);
    } catch (e) { setDraftError(e instanceof Error ? e.message : "Check that LM Studio is running and the model is loaded."); }
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
          {[{label:"Overview",icon:Gauge},{label:"Customers",icon:Users},{label:"Item watchlist",icon:ShoppingBag}].map(({label,icon:Icon})=><button key={label} className={"nav-item " + (activeNav===label?"active":"")} onClick={() => {setActiveNav(label); setMobileOpen(false); if(label==="Customers") document.getElementById("customer-list")?.scrollIntoView({behavior:"smooth"}); else if(label==="Item watchlist") document.getElementById("item-watchlist")?.scrollIntoView({behavior:"smooth"}); else window.scrollTo({top:0,behavior:"smooth"});}}><Icon size={17}/>{label}{label==="Customers"&&analysis?<span className="nav-count">{analysis.overdue.length}</span>:null}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-card"><div><LockKeyhole size={16}/><b>Private by design</b></div><p>Sales files are analyzed in this browser, and shopper identifiers stay local.</p></div>
          <div className="amd-chip"><span className="amd-glyph">R</span><span>Thoughtful outreach<small>AI assisted, evidence based</small></span></div>
          <button className="help-link" onClick={() => document.getElementById("method")?.scrollIntoView({behavior:"smooth"})}><CircleHelp size={16}/> How Rhythm works</button>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close menu backdrop" className="backdrop" onClick={() => setMobileOpen(false)}/>}
      <main className="main-area">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20}/></button><div className="breadcrumbs">Workspace <ChevronRight size={14}/> <b>{activeNav}</b></div><div className="topbar-right"><span className="live-dot"/> LOCAL WORKSPACE <span className="top-divider"/><button className="icon-button" title="Privacy details" onClick={() => document.getElementById("privacy")?.scrollIntoView({behavior:"smooth"})}><ShieldCheck size={17}/></button></div></header>
        <div className="content-wrap">
          <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> CUSTOMER ANALYTICS</div><h1>Customer overview</h1><p className="welcome-copy">Review repeat purchases, spot shoppers outside their usual cadence, and see the evidence behind each suggested follow-up.</p></div><div className="welcome-actions"><label className="button secondary upload-button"><Upload size={16}/> Upload sales CSV<input type="file" accept=".csv,text/csv" onChange={importFile}/></label><button className="button text-button" onClick={() => void loadSample()}><ArrowDownToLine size={15}/> Restore research dataset</button></div></section>
          <section className="data-ribbon"><div className="data-icon"><ShoppingBag size={17}/></div><div className="data-copy"><b>{source}</b><span>{isSample?"Public historical transactions from 2010–2011.":"Your CSV stays in browser memory for this session."}</span></div><div className="data-ribbon-right"><span className="data-pill">{isSample?"PUBLIC DATA":"PRIVATE SESSION"}</span><span className="file-label">{fileName}</span></div></section>
          {error && <div className="alert error-alert"><Info size={17}/><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={16}/></button></div>}
          {warning && <div className="alert warning-alert"><Info size={17}/><span>{warning}</span><button onClick={() => setWarning("")} aria-label="Dismiss"><X size={16}/></button></div>}
          {loading ? <div className="loading-panel"><LoaderCircle className="spin" size={24}/><span>Reading sales records locally…</span></div> : dataReady && analysis ? <>
            <section className="snapshot-row"><div><span className="section-kicker">REPORTING DATE</span><p>Historical snapshot used for these customer metrics.</p></div><label className="date-select"><CalendarDays size={16}/><input type="date" value={asOfInput || analysis.asOf} min={analysis.minDate} max={analysis.maxDate} onChange={(e) => setAsOfInput(e.target.value)}/><ChevronDown size={14}/></label></section>
            <section className="metric-grid">
              <Metric icon={<Users size={17}/>} label="Repeat shoppers" value={analysis.eligibleShoppers.toLocaleString()} note="4+ distinct purchase days before snapshot" tone="violet"/>
              <Metric icon={<Clock3 size={17}/>} label="Out of their rhythm" value={analysis.overdue.length.toLocaleString()} note="Beyond personal repeat threshold" tone="orange"/>
              <Metric icon={<Activity size={17}/>} label="Typical repeat cadence" value={analysis.medianCadence ? analysis.medianCadence + " days" : "—"} note="Median across eligible shoppers" tone="blue"/>
              <Metric icon={<ArrowUpRight size={17}/>} label="Natural return · 30 days" value={analysis.naturalReturnRate === null ? "—" : Math.round(analysis.naturalReturnRate * 100) + "%"} note={analysis.naturalReturnRate === null ? "Choose a date with 30 days of data after it" : "Historical 30-day return rate"} tone="green"/>
            </section>
            <section className="grid-main">
              <div className="card customer-card" id="customer-list">
                <div className="card-heading"><div><span className="section-kicker">WORTH A LOOK</span><h2>Shoppers past their usual rhythm</h2><p>Select a shopper to review the purchase history behind the signal.</p></div><span className="subtle-count">{analysis.overdue.length} found</span></div>
                <div className="search-box"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search aliases or repeat items"/></div>
                <div className="table-scroll"><table><thead><tr><th>SHOPPER</th><th>USUAL GAP</th><th>LAST ORDER</th><th>OVERDUE BY</th><th></th></tr></thead><tbody>
                  {filtered.map((buyer, i) => <tr key={buyer.customerKey} className={selected?.customerKey===buyer.customerKey?"chosen":""} onClick={() => {setSelectedKey(buyer.customerKey);setDraft("");setDraftMode("");setDraftReview(null);setDraftError("");}}><td><span className="shopper-cell"><span className={"shopper-avatar avatar-"+(i%5)}>{alias(buyer.customerKey).slice(-2)}</span><span><b>{alias(buyer.customerKey)}</b><small>{buyer.ordersBefore} purchase days</small></span></span></td><td><span className="cadence-value">{buyer.usualDays} days</span></td><td>{shortDate(buyer.lastOrder)}</td><td><span className="late-pill">+{buyer.lateDays} days</span></td><td><ChevronRight size={16} className="row-chevron"/></td></tr>)}
                  {!filtered.length && <tr><td colSpan={5} className="empty-row">{analysis.overdue.length?"Search matches: 0 shoppers.":"All repeat shoppers are within their personal threshold on this date."}</td></tr>}
                </tbody></table></div>
                <div className="table-foot"><span>Showing {filtered.length} of {analysis.overdue.length} flagged shoppers</span><span><LockKeyhole size={13}/> IDs are masked in this view</span></div>
              </div>
              <aside className="card insight-card">
                <div className="insight-top"><span className="section-kicker">SHOPPER DETAILS</span><span className="rank-label">#{Math.max(1,selectedPosition+1)} IN QUEUE</span></div>
                {selected ? <>
                  <div className="profile-heading"><div className="profile-avatar">{alias(selected.customerKey).slice(-2)}</div><div><h2>{alias(selected.customerKey)}</h2><span className="profile-status"><span/> Review suggested</span></div></div>
                  <div className="reason-box"><div className="reason-head"><span className="reason-mark"><Activity size={15}/></span><b>Why Rhythm flagged them</b></div><p>They usually order every <strong>{selected.usualDays} days</strong>. It has been <strong>{selected.daysSinceLast} days</strong> since the last order—<strong>{selected.lateDays} days beyond</strong> their personal threshold.</p><div className="rhythm-scale"><div className="scale-labels"><span>Usual: {selected.usualDays}d</span><span>Now: {selected.daysSinceLast}d</span></div><div className="scale-track"><div className="scale-fill" style={{width:Math.min(100,Math.max(14,(selected.daysSinceLast/Math.max(selected.thresholdDays*2,1))*100))+"%"}}/><span className="threshold-tick" style={{left:Math.min(92,(selected.thresholdDays/Math.max(selected.thresholdDays*2,1))*100)+"%"}}/></div><div className="scale-caption">Personal threshold: {selected.thresholdDays} days</div></div></div>
                  <PurchaseTimeline shopper={selected} asOf={analysis.asOf}/>
                  <div className="repeat-item"><div className="repeat-item-icon"><ShoppingBag size={17}/></div><div><span className="mini-label">MOST REPEATED ITEM</span><b>{selected.productName}</b><small>Appeared in {selected.repeatCount} separate order days</small></div></div>
                  <div className="draft-section"><div className="draft-title"><div><Sparkles size={16}/><b>Thoughtful next step</b></div><span>{draftMode === "ai" ? "AI · CHECKS PASSED" : draftMode === "verified_template" ? "AI REVIEW · TEMPLATE USED" : draftMode === "template" ? "RULE-BASED TEMPLATE" : "EVIDENCE-BASED"}</span></div><p>Draft a low-pressure reorder reminder using purchase evidence, with promotional details left to the merchant.</p>
                    {draft ? <div className="draft-result"><div className="draft-result-head"><Check size={14}/> Draft ready <button onClick={() => {setDraft("");setDraftMode("");setDraftReview(null);}} aria-label="Clear draft"><X size={14}/></button></div><p>{draft}</p>{draftReview?.status === "passed" ? <div className="draft-review-pass">Independent checks passed: concise and grounded in purchase evidence.</div> : draftReview?.status === "replaced" ? <div className="draft-review-fail">AI draft replaced: {draftReview.reasons.join("; ")}. This template uses only the supplied evidence.</div> : null}<small>Every draft stays under merchant review before sending.</small></div> : <button className="button ai-button" disabled={drafting} onClick={() => void makeDraft(selected)}>{drafting?<LoaderCircle size={16} className="spin"/>:<Sparkles size={16}/>} {drafting?"Preparing your draft…":"Draft a follow-up"}<ArrowUpRight size={15}/></button>}
                    {draftError && <div className="ai-error">{draftError}</div>}
                    <div className="local-note"><LockKeyhole size={13}/> Drafts use item names and timing evidence. Customer IDs and contact details stay in your browser. Rhythm labels rule-based drafts whenever AI is unavailable.</div>
                  </div>
                </> : <div className="no-risk"><Check size={24}/><b>All repeat shoppers are within their usual rhythm</b><p>Choose another snapshot date or load a dataset with more repeat purchases.</p></div>}
              </aside>
            </section>
            <section className="watchlist-card" id="item-watchlist">
              <div className="watchlist-heading"><div><span className="section-kicker">PRODUCT SIGNALS</span><h2>Items with the most overdue repeat shoppers</h2><p>Use the purchase history to decide which products deserve a closer look.</p></div><span className="subtle-count">{itemWatchlist.length} items</span></div>
              {itemWatchlist.length ? <div className="watchlist-list">{itemWatchlist.map((item) => <div className="watchlist-item" key={item.productId}>
                <div className="watchlist-product"><span className="watchlist-icon"><ShoppingBag size={16}/></span><span><b title={item.productName}>{item.productName}</b><small>Typical repeat interval · {item.typicalDays} days</small></span></div>
                <div className="watchlist-stat"><b>{item.shopperCount}</b><small>overdue shoppers</small></div>
                <div className="watchlist-stat"><b>{item.medianLateDays} days</b><small>median days past threshold</small></div>
                <button className="button secondary watchlist-action" onClick={() => {setSearch(item.productName);setActiveNav("Customers");document.getElementById("customer-list")?.scrollIntoView({behavior:"smooth"});}}>Review shoppers <ArrowUpRight size={14}/></button>
              </div>)}</div> : <div className="watchlist-empty">No repeat items need review for this reporting date.</div>}
            </section>
            <section className="method-row" id="method"><div className="method-main"><span className="section-kicker">TRANSPARENT RHYTHM RULE</span><h2>Every shopper has a personal purchase clock.</h2><p>We use each shopper’s own history to estimate when their usual routine has shifted. Four purchase days are required before a shopper can be assessed.</p><div className="formula"><span>Flag for review when</span><b>days since last order &gt; max(14, 1.6 × personal median gap)</b></div><small>This signal highlights a change in purchase timing. Merchants review the context before acting.</small></div><div className="method-side"><div className="method-stat"><b>{analysis.totalOrders.toLocaleString()}</b><span>orders included</span></div><div className="method-stat"><b>{analysis.totalRows.toLocaleString()}</b><span>line items analyzed</span></div><div className="method-stat"><b>{shortDate(analysis.minDate)} – {shortDate(analysis.maxDate)}</b><span>data coverage</span></div></div></section>
            <section className="privacy-footer" id="privacy"><div><ShieldCheck size={17}/><b>Privacy stays part of the product</b></div><p>CSV analysis stays in browser memory until the page closes. Customer identifiers are masked in the interface. AI draft requests include item names and purchase timing; configured model endpoints receive that evidence for drafting. Customer IDs and contact details remain in the browser. Rhythm labels rule-based drafts whenever AI is unavailable.</p><span>Public sample: UCI Machine Learning Repository · Online Retail · CC BY 4.0 · Chen (2015)</span></section>
          </> : <div className="empty-state"><div className="empty-graphic"><FileUp size={28}/></div><h2>Bring in transaction history.</h2><p>Upload a sales CSV with order, customer, product, quantity, date and unit-price columns. Or restore the real public research dataset.</p><button className="button primary" onClick={() => void loadSample()}><ArrowDownToLine size={16}/> Load UCI research dataset</button></div>}
          <footer className="app-footer"><span>RHYTHM · RETENTION, IN TIME</span><span>Historical transactions support analysis; merchants review every recommendation.</span></footer>
        </div>
      </main>
    </div>
  );
}

function Metric({icon,label,value,note,tone}:{icon:React.ReactNode;label:string;value:string;note:string;tone:string}) {
  return <div className="metric-card"><div className={"metric-icon "+tone}>{icon}</div><div className="metric-meta"><span>{label}</span><b>{value}</b><small>{note}</small></div><span className={"metric-orbit "+tone}/></div>;
}

function PurchaseTimeline({shopper,asOf}:{shopper:ShopperInsight;asOf:string}) {
  const day = (date: string) => Math.floor(Date.parse(date + "T00:00:00Z") / 86_400_000);
  const date = (value: string) => new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(value + "T00:00:00Z"));
  const firstDay = day(shopper.purchaseDays[0]);
  const lastDay = day(shopper.lastOrder);
  const asOfDay = day(asOf);
  const thresholdDay = lastDay + shopper.thresholdDays;
  const span = Math.max(1, asOfDay - firstDay);
  const left = 8;
  const width = 304;
  const x = (value: number) => left + ((value - firstDay) / span) * width;
  const lastX = x(lastDay);
  const thresholdX = x(thresholdDay);
  const endX = x(asOfDay);

  return <section className="purchase-timeline" aria-label="Shopper purchase timeline">
    <div className="timeline-heading"><b>PURCHASE TIMELINE</b><span>{shopper.purchaseDays.length} purchase days</span></div>
    <svg className="timeline-chart" viewBox="0 0 320 76" role="img" aria-labelledby="purchase-timeline-title purchase-timeline-desc" preserveAspectRatio="none">
      <title id="purchase-timeline-title">Purchase history and personal repeat threshold</title>
      <desc id="purchase-timeline-desc">{shopper.purchaseDays.length} purchase days. Last purchase {date(shopper.lastOrder)}. Personal threshold {shopper.thresholdDays} days after that, on {date(new Date(thresholdDay * 86_400_000).toISOString().slice(0,10))}. Reporting date {date(asOf)}.</desc>
      <rect x={lastX} y="39" width={Math.max(0,thresholdX-lastX)} height="12" rx="4" fill="#f8ead8"/>
      <rect x={thresholdX} y="39" width={Math.max(0,endX-thresholdX)} height="12" rx="4" fill="#f2d8c3"/>
      <line x1={left} y1="45" x2={endX} y2="45" stroke="#dfe5e1" strokeWidth="2"/>
      {shopper.purchaseDays.map((purchaseDay,index) => {
        const purchaseX = x(day(purchaseDay));
        const purchaseY = 22 + (index % 3) * 5;
        const isLast = index === shopper.purchaseDays.length - 1;
        return <circle key={purchaseDay} cx={purchaseX} cy={purchaseY} r={isLast?3.5:2.4} fill={isLast?"#39765e":"#8ca99a"}>
          <title>{isLast?"Last purchase":"Purchase"}: {date(purchaseDay)}</title>
        </circle>;
      })}
      <line x1={thresholdX} y1="13" x2={thresholdX} y2="57" stroke="#b56b3d" strokeWidth="1.5" strokeDasharray="3 3"/>
      <circle cx={endX} cy="45" r="3.2" fill="#b56b3d"/>
    </svg>
    <div className="timeline-legend"><span><i className="timeline-dot"/>Purchase day</span><span><i className="timeline-threshold"/>Personal threshold</span><span><i className="timeline-late"/>Past threshold</span></div>
    <div className="timeline-dates"><span>First: {date(shopper.purchaseDays[0])}</span><span>Threshold: {date(new Date(thresholdDay * 86_400_000).toISOString().slice(0,10))}</span><span>Now: {date(asOf)}</span></div>
  </section>;
}
