import React, { useState, useEffect, useCallback, useRef } from "react";
import { getAuthToken, signOut as supaSignOut } from "./supabaseClient";
import SearchPanel from "./SearchPanel";

const API_URL = process.env.REACT_APP_API_URL || "https://kadera-backend-production-6a21.up.railway.app";


// ── Design tokens ────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Aldrich&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #fff; font-family: 'Inter', system-ui, sans-serif; color: #1a2035; overflow-x: hidden; }
  input, select, button, textarea { font-family: inherit; }
  @keyframes fade-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .fade-in { animation: fade-in 0.25s ease both; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #f1f5f9; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

  /* Kadera AI chasing light border */
  .kadera-ai-chase-border {
    position: absolute;
    inset: 0;
    border-radius: 10px;
    background: #fff;
  }
  .kadera-ai-chase-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 10px;
    padding: 1.5px;
    background: conic-gradient(
      from var(--angle, 0deg),
      transparent 0deg,
      transparent 300deg,
      #a78bfa 330deg,
      #ffffff 345deg,
      #a78bfa 360deg
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: kadera-chase 3s linear infinite;
  }
  @property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes kadera-chase {
    to { --angle: 360deg; }
  }

  /* Modal backdrop */
  .modal-backdrop { position:fixed; inset:0; background:rgba(15,30,61,0.5); display:flex; align-items:center; justify-content:center; z-index:200; backdrop-filter:blur(2px); }
  .modal-box { background:#fff; border-radius:0; border:1.5px solid #cbd5e1; box-shadow:0 20px 60px rgba(15,30,61,0.18); width:min(1060px,96vw); max-height:90vh; display:flex; flex-direction:column; overflow:hidden; }
  .modal-box-sm { width:min(600px,96vw); }
  .modal-hdr { padding:16px 20px; border-bottom:1.5px solid #e2e8f0; background:#f8fafc; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
  .modal-title { font-size:14px; font-weight:600; color:#1e293b; }
  .modal-sub { font-size:11px; color:#94a3b8; margin-top:2px; }
  .modal-body { flex:1; overflow-y:auto; }
  .modal-close { padding:6px 14px; border-radius:8px; border:1.5px solid #e2e8f0; background:transparent; font-size:11px; font-weight:500; color:#64748b; cursor:pointer; transition:all 0.15s; }
  .modal-close:hover { border-color:#cbd5e1; background:#f1f5f9; }

  /* Tab strip */
  .tab-strip { display:flex; gap:4px; padding:10px 16px; border-bottom:1.5px solid #e2e8f0; background:#f8fafc; flex-shrink:0; flex-wrap:wrap; }
  .tab-btn { padding:5px 14px; border-radius:6px; border:1.5px solid transparent; background:transparent; font-size:11px; font-weight:500; color:#64748b; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; gap:0; }
  .tab-btn.active { background:#fff; border-color:#cbd5e1; color:#1e293b; box-shadow:0 1px 3px rgba(15,30,61,0.07); }
  .tab-close { padding:3px 6px; border-radius:0 4px 4px 0; border:none; background:transparent; color:#94a3b8; cursor:pointer; font-size:11px; margin-left:4px; }
  .tab-close:hover { color:#dc2626; }

  /* Cards */
  .card { background:#fff; border-radius:12px; border:1.5px solid #cbd5e1; box-shadow:0 1px 4px rgba(15,30,61,0.07); overflow:hidden; }
  .card-hdr { padding:12px 16px; border-bottom:1.5px solid #e2e8f0; background:#f8fafc; display:flex; align-items:center; justify-content:space-between; }
  .card-title { font-size:12px; font-weight:600; color:#1e293b; }
  .card-badge { font-size:10px; font-weight:500; padding:2px 8px; border-radius:99px; background:#e2e8f0; color:#64748b; }

  /* Buttons */
  .btn { padding:7px 16px; border-radius:8px; border:1.5px solid #cbd5e1; background:#fff; font-size:11px; font-weight:500; color:#334155; cursor:pointer; transition:all 0.15s; }
  .btn:hover { border-color:#93b4fd; background:#eff6ff; color:#2563eb; }
  .btn-primary { background:#2563eb; border-color:#2563eb; color:#fff; }
  .btn-primary:hover { background:#1d4ed8; border-color:#1d4ed8; color:#fff; }
  .btn-sm { padding:4px 10px; font-size:10px; }
  .btn-active { background:#0f1e3d; border-color:#0f1e3d; color:#fff; }

  /* Inputs */
  .inp { padding:8px 12px; border-radius:8px; border:1.5px solid #cbd5e1; background:#fff; font-size:12px; color:#1e293b; outline:none; width:100%; transition:border-color 0.15s; }
  .inp:focus { border-color:#2563eb; }
  .inp-sm { padding:5px 10px; font-size:11px; border-radius:6px; }

  /* Table */
  .tbl-hdr { display:grid; padding:8px 14px; border-bottom:1.5px solid #e2e8f0; background:#f8fafc; }
  .tbl-hdr-cell { font-size:10px; font-weight:600; color:#64748b; letter-spacing:0.3px; cursor:pointer; display:flex; align-items:center; gap:3px; user-select:none; }
  .tbl-hdr-cell:hover { color:#2563eb; }
  .tbl-row { display:grid; padding:9px 14px; border-bottom:1px solid #f1f5f9; align-items:center; transition:background 0.1s; cursor:pointer; }
  .tbl-row:hover { background:#f8fafc; }
  .tbl-cell { font-size:11px; color:#334155; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:8px; }

  /* Badges */
  .badge { display:inline-flex; align-items:center; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; }
  .badge-green { background:#dcfce7; color:#15803d; border:1px solid #86efac; }
  .badge-amber { background:#fef3c7; color:#92400e; border:1px solid #fcd34d; }
  .badge-red   { background:#fff1f2; color:#be123c; border:1px solid #fca5a5; }
  .badge-blue  { background:#dbeafe; color:#1d4ed8; border:1px solid #93c5fd; }
  .badge-purple{ background:#ede9fe; color:#6d28d9; border:1px solid #c4b5fd; }
  .badge-gray  { background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1; }

  /* Countdown badges — keep the glow */
  .cd { display:flex; flex-direction:column; align-items:center; padding:6px 10px; border-radius:8px; min-width:58px; flex-shrink:0; }
  .cd-num { font-family:'Aldrich',sans-serif; font-size:20px; line-height:1; }
  .cd-lbl { font-size:8px; letter-spacing:1px; margin-top:2px; font-weight:600; }
  .cd-dt  { font-size:9px; color:#94a3b8; margin-top:2px; }
  .cd-g { background:#f0fdf4; border:1.5px solid #86efac; box-shadow:0 0 10px rgba(34,197,94,0.2); }
  .cd-a { background:#fffbeb; border:1.5px solid #fcd34d; box-shadow:0 0 10px rgba(245,158,11,0.2); }
  .cd-r { background:#fff1f2; border:1.5px solid #fca5a5; box-shadow:0 0 10px rgba(239,68,68,0.2); }

  /* Form fields */
  .field { margin-bottom:12px; }
  .field label { display:block; font-size:11px; font-weight:600; color:#475569; margin-bottom:4px; }

  /* Empty state */
  .empty { padding:48px 24px; text-align:center; }
  .empty-title { font-size:13px; font-weight:600; color:#94a3b8; margin-bottom:6px; }
  .empty-sub { font-size:11px; color:#cbd5e1; }

  /* Stat cards */
  .stat-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }

  /* Tool buttons */
  .tool-btn { padding:10px 12px; border-radius:8px; border:1.5px solid #cbd5e1; background:#f8fafc; cursor:pointer; transition:all 0.15s; text-align:left; width:100%; }
  .tool-btn:hover { border-color:#93b4fd; background:#eff6ff; }
  .tool-btn.green { border-color:#86efac; background:#f0fdf4; }
  .tool-btn.green:hover { border-color:#4ade80; background:#dcfce7; }

  /* Feed */
  .feed-item { display:flex; align-items:center; gap:12px; padding:10px 16px; border-bottom:1.5px solid #c8d6e8; transition:background 0.1s; cursor:pointer; }
  .feed-item:hover { background:#f8fafc; }

  /* Summary strip in modals */
  .summary-strip { display:flex; gap:20px; padding:12px 16px; background:#f8fafc; border-bottom:1.5px solid #e2e8f0; flex-wrap:wrap; }
  .summary-item { }
  .summary-val { font-family:'Aldrich',sans-serif; font-size:18px; line-height:1; }
  .summary-lbl { font-size:10px; color:#94a3b8; margin-top:2px; font-weight:500; }

  /* Provider bar */
  .prov-bar { height:3px; background:#e2e8f0; border-radius:99px; overflow:hidden; margin-top:4px; }
  .prov-bar-fill { height:100%; background:linear-gradient(90deg,#93b4fd,#2563eb); border-radius:99px; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = v => v == null ? "—" : `$${Math.round(v).toLocaleString()}`;
const fmtDate = v => v ? new Date(v).toLocaleDateString() : "—";

function SortHdr({ label, field, sortField, sortAsc, onSort, style }) {
  const active = sortField === field;
  return (
    <div className="tbl-hdr-cell" style={{ color: active ? "#2563eb" : undefined, ...style }} onClick={() => onSort(field)}>
      {label} {active ? (sortAsc ? "↑" : "↓") : <span style={{ opacity:0.3 }}>↕</span>}
    </div>
  );
}

function useSort(initial = "id", asc = false) {
  const [sortField, setSortField] = useState(initial);
  const [sortAsc, setSortAsc] = useState(asc);
  function toggle(field) {
    if (sortField === field) setSortAsc(p => !p);
    else { setSortField(field); setSortAsc(false); }
  }
  function apply(arr, key) {
    return [...arr].sort((a, b) => {
      const av = a[key ?? sortField]; const bv = b[key ?? sortField];
      if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? av - bv : bv - av;
    });
  }
  return { sortField, sortAsc, toggle, apply };
}

function Spinner({ color = "#2563eb" }) {
  return <div style={{ textAlign:"center", padding:"48px", fontSize:12, color, fontWeight:500 }}>Loading...</div>;
}

function Empty({ title = "No results found", sub = "" }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  );
}

function StatusDot({ ok = true }) {
  return <span style={{ width:8, height:8, borderRadius:"50%", background: ok ? "#22c55e" : "#ef4444", display:"inline-block", boxShadow: ok ? "0 0 6px rgba(34,197,94,0.5)" : "0 0 6px rgba(239,68,68,0.5)", flexShrink:0 }}/>;
}


// ── Feed470 ───────────────────────────────────────────────────────────────────
function Feed470({ token, onTagsUpdated, onView470 }) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [state]             = useState("TX");
  const [filter, setFilter] = useState("all");
  const [page, setPage]     = useState(0);
  const [tags, setTags]     = useState(new Set());
  const PAGE = 8;

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/tags`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (d.status === "success") setTags(new Set(d.data.map(t => String(t.application_number))));
      }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ state, limit:500, offset:0 });
    fetch(`${API_URL}/api/470s?${params}`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (d.status === "success") {
          // Filter to open (bid_due_date in future or null)
          const open = (d.data||[]).filter(x => !x.bid_due_date || new Date(x.bid_due_date) >= new Date());
          setData(open);
        }
      })
      .catch(() => {}).finally(() => setLoading(false));
  }, [token, state, filter]);

  async function toggleTag(item) {
    const appNum = String(item.application_number);
    const isTagged = tags.has(appNum);
    const next = new Set(tags);
    if (isTagged) {
      await fetch(`${API_URL}/api/tags/${appNum}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
      next.delete(appNum);
    } else {
      await fetch(`${API_URL}/api/tags`, { method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({ application_number: appNum, billed_entity_name: item.billed_entity_name, state: item.billed_entity_state, service_category: item.service_category, bid_due_date: item.bid_due_date, funding_year: item.funding_year }) });
      next.add(appNum);
    }
    setTags(next);
    onTagsUpdated?.();
  }

  // Compute days remaining from bid_due_date
  const withDays = data.map(item => ({
    ...item,
    days_until_due: item.bid_due_date
      ? Math.ceil((new Date(item.bid_due_date) - new Date()) / (1000*60*60*24))
      : null
  }));

  const displayed = filter === "urgent"
    ? withDays.filter(x => x.days_until_due != null && x.days_until_due <= 7)
    : withDays;

  const paged = displayed.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(displayed.length / PAGE);

  function cdClass(days) {
    if (days == null || days < 0) return "cd cd-r";
    if (days <= 7) return "cd cd-r";
    if (days <= 14) return "cd cd-a";
    return "cd cd-g";
  }
  function cdColor(days) {
    if (days == null || days < 0) return "#dc2626";
    if (days <= 7) return "#dc2626";
    if (days <= 14) return "#d97706";
    return "#16a34a";
  }

  return (
    <div className="card" style={{ display:"flex", flexDirection:"column" }}>
      <div className="card-hdr">
        <div>
          <div className="card-title">Form 470 Live Feed</div>
          <div style={{ fontSize:10, color:"#94a3b8", marginTop:2, display:"flex", alignItems:"center", gap:4 }}>
            <StatusDot /> Live · USAC Open Data API · TX
          </div>
        </div>
        <div className="card-badge">{data.length} open</div>
      </div>
      <div style={{ padding:"8px 16px", borderBottom:"1.5px solid #e2e8f0", background:"#f8fafc", display:"flex", gap:6, alignItems:"center" }}>
        {[["all","All Open"],["urgent","⚠ Urgent ≤7d"]].map(([key,label]) => (
          <button key={key} onClick={() => { setFilter(key); setPage(0); }}
            className={`btn btn-sm ${filter===key ? "btn-active" : ""}`}>{label}</button>
        ))}
        <span style={{ marginLeft:"auto", fontSize:10, color:"#94a3b8" }}>Page {page+1} of {Math.max(1,totalPages)}</span>
      </div>

      {loading ? <Spinner /> : paged.length === 0 ? <Empty title="No open 470s found" /> : (
        <>
          {paged.map((item, i) => {
            const days = item.days_until_due;
            const tagged = tags.has(String(item.application_number));
            const dayLabel = days == null ? "—" : days < 0 ? "CLOSED" : days === 0 ? "TODAY" : `${days}`;
            return (
              <div key={i} className="feed-item" onClick={() => onView470?.(String(item.application_number))} style={{ cursor:"pointer" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:"#2563eb" }}>
                      {item.application_number}
                    </span>
                    <span className="badge badge-green">OPEN</span>
                    {item.days_until_due <= 3 && item.days_until_due >= 0 && <span className="badge badge-red">URGENT</span>}
                    <button onClick={e => { e.stopPropagation(); toggleTag(item); }} style={{ marginLeft:"auto", padding:"2px 8px", borderRadius:4, border:`1.5px solid ${tagged ? "#86efac" : "#cbd5e1"}`, background: tagged ? "#f0fdf4" : "transparent", fontSize:10, fontWeight:600, color: tagged ? "#15803d" : "#94a3b8", cursor:"pointer" }}>
                      {tagged ? "★ Tagged" : "☆ Tag"}
                    </button>
                  </div>
                  <div style={{ fontSize:11, fontWeight:500, color:"#334155" }}>{item.billed_entity_name}</div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>
                    FY{item.funding_year} · {item.service_category} · Posted {item.date_posted ? new Date(item.date_posted).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div className={cdClass(days)}>
                  <div className="cd-num" style={{ color: cdColor(days) }}>{dayLabel}</div>
                  <div className="cd-lbl" style={{ color: cdColor(days) }}>DAYS</div>
                  <div className="cd-dt">{item.bid_due_date ? new Date(item.bid_due_date).toLocaleDateString() : "—"}</div>
                </div>
              </div>
            );
          })}
          <div style={{ padding:"10px 16px", borderTop:"1.5px solid #e2e8f0", background:"#f8fafc", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:10, color:"#94a3b8" }}>{displayed.length} results · showing {page*PAGE+1}–{Math.min((page+1)*PAGE, displayed.length)}</span>
            <div style={{ display:"flex", gap:6 }}>
              <button className="btn btn-sm" disabled={page===0} onClick={() => setPage(p=>p-1)}>← Prev</button>
              <button className="btn btn-sm" disabled={page>=totalPages-1} onClick={() => setPage(p=>p+1)}>Next →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


// ── Form 470 Detail Modal ─────────────────────────────────────────────────────
function Form470Modal({ token, appNum, onClose }) {
  const [form, setForm]             = useState(null);
  const [services, setServices]     = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);

  const USAC = "https://opendata.usac.org/resource";

  useEffect(() => {
    if (!appNum) return;
    const where = encodeURIComponent(`application_number='${appNum}'`);
    Promise.all([
      fetch(`${USAC}/jp7a-89nd.json?$where=${where}&$limit=1`).then(r => r.json()),
      fetch(`${USAC}/39tn-hjzv.json?$where=${where}&$limit=200`).then(r => r.json()),
      fetch(`${USAC}/g55z-erud.json?$where=${where}&$limit=10`).then(r => r.json()),
    ]).then(([fData, sData, cData]) => {
      if (!fData?.length) { setError(true); return; }
      setForm(fData[0]);
      setServices(Array.isArray(sData) ? sData : []);
      setConsultants(Array.isArray(cData) ? cData : []);
    }).catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [appNum]);

  const fmtDt = v => {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };
  const fmtDtFull = v => {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const f = form || {};

  const status = f.application_status || f.fcc_form_470_status || "";




  const days = f.allowable_contract_date
    ? Math.ceil((new Date(f.allowable_contract_date) - new Date()) / (1000*60*60*24))
    : null;

  // Field row — label + value in two columns
  const Row = ({ label, value, children, link }) => {
    const content = children || (link && value
      ? <a href={link} target="_blank" rel="noreferrer" style={{ color:"#2563eb", textDecoration:"none" }}>{value}</a>
      : value);
    if (!content && content !== 0) return null;
    return (
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", padding:"7px 0", borderBottom:"1px solid #f1f5f9", gap:8 }}>
        <div style={{ fontSize:12, color:"#111827", fontWeight:700, paddingTop:1 }}>{label}</div>
        <div style={{ fontSize:12, color:"#1e293b", lineHeight:1.5 }}>{content}</div>
      </div>
    );
  };

  // Collapsible section
  const Sec = ({ title, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div style={{ marginBottom:20 }}>
        <div onClick={() => setOpen(p => !p)}
          style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:8, borderBottom:"2px solid #0f1e3d", marginBottom:4, cursor:"pointer", userSelect:"none" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#2563eb", letterSpacing:0.2 }}>{title}</div>
          <div style={{ fontSize:11, color:"#94a3b8" }}>{open ? "▲ Hide section" : "▼ Show section"}</div>
        </div>
        {open && <div style={{ paddingTop:4 }}>{children}</div>}
      </div>
    );
  };

  const CatBadge = ({ cat }) => {
    const is2 = String(cat || "").includes("2");
    return (
      <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 7px", borderRadius:4, fontSize:10, fontWeight:700,
        background: is2 ? "#ede9fe" : "#dbeafe", color: is2 ? "#6d28d9" : "#1d4ed8" }}>
        {is2 ? "Cat 2" : "Cat 1"}
      </span>
    );
  };

  return (
    <div className="modal-backdrop" style={{ zIndex:400 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width:"min(860px,96vw)", maxHeight:"92vh" }}>

        {/* Header */}
        <div style={{ background:"#fff", padding:"24px 28px 20px", borderBottom:"1px solid #e2e8f0", flexShrink:0 }}>
          <div style={{ fontSize:11, color:"#94a3b8", marginBottom:10, fontWeight:400, letterSpacing:0.2 }}>
            Form 470 › FY{f.funding_year || "2026"} › {f.physical_state || f.billed_entity_state || "TX"}
          </div>
          <h2 style={{ fontSize:26, fontWeight:300, color:"#2563eb", lineHeight:1.15, marginBottom:6, letterSpacing:-0.3 }}>
            {f.billed_entity_name || `Form 470 · ${appNum}`}
          </h2>
          <div style={{ fontSize:13, color:"#64748b", fontWeight:400, marginBottom:4 }}>
            Form 470 · Application <span style={{ color:"#2563eb", fontWeight:500 }}>#{appNum}</span> · FY {f.funding_year || "2026"}
          </div>
          {f.form_nickname && (
            <div style={{ fontSize:12, color:"#94a3b8", fontStyle:"italic", marginBottom:14 }}>"{f.form_nickname}"</div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap", marginTop:14 }}>
            {status && (
              <span style={{ fontSize:12, color: status.toLowerCase().includes("certif") ? "#15803d" : "#64748b", fontWeight:500 }}>
                {status}
              </span>
            )}
            {days != null && days >= 0 && (
              <span style={{ fontSize:12, color:"#dc2626", fontWeight:500 }}>
                {days === 0 ? "Due today" : `Due ${fmtDt(f.allowable_contract_date)}`}
              </span>
            )}
            <button onClick={onClose}
              style={{ marginLeft:"auto", padding:"5px 14px", borderRadius:6, border:"1px solid #e2e8f0", background:"#fff", color:"#64748b", fontSize:11, fontWeight:500, cursor:"pointer" }}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Notice bar */}
        <div style={{ padding:"9px 20px", background:"#fffbeb", borderBottom:"1px solid #fde68a", fontSize:11, color:"#92400e", flexShrink:0 }}>
          <strong>Note:</strong> Contact Name and Phone Number reflect current USAC profile data. To review data as certified, see the original document on USAC EPC.
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding:"20px 24px" }}>

          {loading && (
            <div style={{ textAlign:"center", padding:"60px", fontSize:13, color:"#94a3b8" }}>
              <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTopColor:"#2563eb", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }}/>
              Loading Form 470 data...
            </div>
          )}

          {!loading && error && (
            <div style={{ textAlign:"center", padding:"60px" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
              <div style={{ fontSize:15, fontWeight:600, color:"#1e293b", marginBottom:6 }}>Form 470 Not Found</div>
              <div style={{ fontSize:13, color:"#94a3b8" }}>Application #{appNum} could not be located in the USAC Open Data system.</div>
            </div>
          )}

          {!loading && !error && form && (
            <>
              {/* Application Information */}
              <Sec title="Application Information">
                <Row label="Nickname"              value={f.form_nickname} />
                <Row label="Application Number"   value={f.application_number} />
                <Row label="Funding Year"          value={f.funding_year} />
                <Row label="Status"                value={status} />
                <Row label="Allowable Contract Date">
                  <span style={{ color: days != null && days >= 0 && days <= 7 ? "#c2410c" : "#1e293b", fontWeight: days != null && days >= 0 && days <= 7 ? 600 : 400 }}>
                    {fmtDt(f.allowable_contract_date) || "—"}
                  </span>
                </Row>
                <Row label="Created Date"          value={fmtDtFull(f.created_date)} />
                <Row label="Created By"            value={f.created_by} />
                <Row label="Certified Date"        value={fmtDtFull(f.certified_date)} />
                <Row label="Certified By"          value={f.certified_by} />
                <Row label="Last Modified Date"    value={fmtDtFull(f.last_modified_date)} />
                <Row label="Last Modified By"      value={f.last_modified_by} />
              </Sec>

              {/* Billed Entity Information */}
              <Sec title="Billed Entity Information">
                <Row label="Name"                    value={f.billed_entity_name} />
                <Row label="Billed Entity Number (BEN)" value={f.billed_entity_number} />
                <Row label="Address"                 value={f.physical_address} />
                <Row label="City / State / ZIP"      value={[f.physical_city, f.physical_state, f.physical_zipcode].filter(Boolean).join(", ")} />
                <Row label="Phone"                   value={f.phone_number} />
                <Row label="Email"                   value={f.email_address} link={f.email_address ? `mailto:${f.email_address}` : null} />
                <Row label="FCC Registration #"      value={f.fcc_registration_number} />
              </Sec>

              {/* Application Type & Recipients */}
              <Sec title="Application Type and Recipients of Service">
                <Row label="Applicant Type"            value={f.entity_type || f.applicant_type} />
                <Row label="Recipient(s) of Service"   value={f.recipient_of_service} />
                <Row label="Number of Eligible Entities" value={f.number_of_eligible_entities} />
              </Sec>

              {/* Contact Information */}
              <Sec title="Contact Information">
                <Row label="Name"         value={f.contact_name} />
                <Row label="Email"        value={f.contact_email} link={f.contact_email ? `mailto:${f.contact_email}` : null} />
                <Row label="Phone Number" value={f.contact_phone} />
              </Sec>

              {/* Services Requested */}
              <Sec title="Services Requested">
                {!services.length ? (
                  <div style={{ fontSize:12, color:"#94a3b8", padding:"8px 0" }}>No service line items found.</div>
                ) : (
                  <>
                    {/* Cat 1 / Cat 2 descriptions */}
                    {f.category_one_description && (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#1d4ed8", textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>
                          Category 1 — Internet &amp; Transport
                        </div>
                        <pre style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 14px", fontSize:12, color:"#334155", whiteSpace:"pre-wrap", fontFamily:"inherit", lineHeight:1.75, margin:0 }}>
                          {f.category_one_description}
                        </pre>
                      </div>
                    )}
                    {f.category_two_description && (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#6d28d9", textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>
                          Category 2 — Internal Connections
                        </div>
                        <pre style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 14px", fontSize:12, color:"#334155", whiteSpace:"pre-wrap", fontFamily:"inherit", lineHeight:1.75, margin:0 }}>
                          {f.category_two_description}
                        </pre>
                      </div>
                    )}
                    {/* Line items table */}
                    <div style={{ fontSize:12, fontWeight:600, color:"#0f1e3d", marginBottom:8 }}>
                      {services.length} Line Item{services.length !== 1 ? "s" : ""}
                    </div>
                    <div style={{ overflowX:"auto", margin:"0 -4px" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                        <thead>
                          <tr style={{ background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0" }}>
                            {["#","Category","Service Type","Function","Manufacturer","Qty","Unit","Install","Entities","RFP"].map(h => (
                              <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontWeight:600, color:"#64748b", whiteSpace:"nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {services.map((s, i) => (
                            <tr key={i} style={{ borderBottom:"1px solid #f1f5f9" }}
                              onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                              <td style={{ padding:"8px 10px", color:"#94a3b8", fontSize:11 }}>{i + 1}</td>
                              <td style={{ padding:"8px 10px" }}><CatBadge cat={s.category_of_service || s.service_category} /></td>
                              <td style={{ padding:"8px 10px", color:"#1e293b", fontWeight:500 }}>{s.service_type_name || s.type_of_service || "—"}</td>
                              <td style={{ padding:"8px 10px", color:"#475569" }}>{s.function_type || s.function || "—"}</td>
                              <td style={{ padding:"8px 10px", color:"#475569" }}>{s.manufacturer_name || s.manufacturer || "—"}</td>
                              <td style={{ padding:"8px 10px", color:"#475569" }}>{s.quantity || "—"}</td>
                              <td style={{ padding:"8px 10px", color:"#475569" }}>{s.unit || "—"}</td>
                              <td style={{ padding:"8px 10px", color:"#475569" }}>{s.installation_and_initial_configuration || s.installation || "—"}</td>
                              <td style={{ padding:"8px 10px", color:"#475569" }}>{s.number_of_entities || "—"}</td>
                              <td style={{ padding:"8px 10px" }}>
                                {(s.rfp_documents?.url || s.rfp_document_url || s.rfp_url)
                                  ? <a href={s.rfp_documents?.url || s.rfp_document_url || s.rfp_url} target="_blank" rel="noreferrer"
                                      style={{ color:"#2563eb", fontSize:11, fontWeight:600, textDecoration:"none" }}
                                      onMouseEnter={e => e.currentTarget.style.textDecoration="underline"}
                                      onMouseLeave={e => e.currentTarget.style.textDecoration="none"}>
                                      View RFP Documents ↗
                                    </a>
                                  : <span style={{ color:"#cbd5e1" }}>—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Sec>

              {/* Technical Contact */}
              <Sec title="Technical Contact Information">
                <Row label="Name"         value={f.technical_contact_name || f.tech_contact_name} />
                <Row label="Title"        value={f.technical_contact_title || f.tech_contact_title} />
                <Row label="Phone Number" value={f.technical_contact_phone || f.tech_contact_phone} />
                <Row label="Email"        value={f.technical_contact_email || f.tech_contact_email}
                  link={(f.technical_contact_email || f.tech_contact_email) ? `mailto:${f.technical_contact_email || f.tech_contact_email}` : null} />
              </Sec>

              {/* State/Local Procurement */}
              {f.state_or_local_restrictions && (
                <Sec title="State or Local Procurement Requirements">
                  {f.state_or_local_restrictions === "Yes" && (
                    <div style={{ display:"flex", gap:10, padding:"10px 14px", background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:8, marginBottom:10 }}>
                      <span style={{ color:"#d97706", fontSize:16, flexShrink:0 }}>⚠</span>
                      <div style={{ fontSize:12, color:"#92400e", lineHeight:1.6 }}>
                        <strong>State or local procurement restrictions apply.</strong> Review all applicable bidding laws before submitting a bid.
                        {f.state_or_local_restrictions_narrative && <><br/>{f.state_or_local_restrictions_narrative}</>}
                      </div>
                    </div>
                  )}
                </Sec>
              )}

              {/* Consultants */}
              {consultants.length > 0 && (
                <Sec title={`Consultants (${consultants.length})`}>
                  <div style={{ borderTop:"1px solid #f1f5f9" }}>
                    {consultants.map((c, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f1f5f9", gap:12 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:500, color:"#1e293b" }}>{c.consultant_name || c.name || "Unknown"}</div>
                          {c.consulting_firm_name && c.consulting_firm_name !== c.consultant_name && (
                            <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{c.consulting_firm_name}</div>
                          )}
                        </div>
                        {(c.spin || c.consultant_registration_id || c.fcc_registration_number) && (
                          <span style={{ flexShrink:0, fontSize:11, fontFamily:"monospace", background:"#f1f5f9", color:"#475569", padding:"3px 8px", borderRadius:5 }}>
                            {c.spin || c.consultant_registration_id || c.fcc_registration_number}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Sec>
              )}

              {/* Service Request RFP Documents */}
              {(() => {
                // Deduplicate by URL — one row per unique document
                const rfpServices = [...new Map(
                  services
                    .filter(s => s.rfp_documents?.url || s.rfp_document_url || s.rfp_url)
                    .map(s => [s.rfp_documents?.url || s.rfp_document_url || s.rfp_url, s])
                ).values()];
                if (!rfpServices.length) return null;

                const getFilename = url => {
                  try {
                    const parts = decodeURIComponent(url).split("/");
                    return parts[parts.length - 1] || url;
                  } catch { return url; }
                };

                const fmtUploadDate = v => {
                  if (!v) return null;
                  const d = new Date(v);
                  return isNaN(d) ? null : d.toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
                };

                return (
                  <Sec title="Service Request RFP Documents">
                    <div style={{ borderTop:"1px solid #f1f5f9" }}>
                      {rfpServices.map((s, i) => {
                        const url = s.rfp_documents?.url || s.rfp_document_url || s.rfp_url;
                        const filename = getFilename(url);
                        const ext = filename.split(".").pop().toUpperCase();
                        const uploadDate = fmtUploadDate(s.rfp_upload_date);
                        const svcLabel = s.service_type || s.service_type_name || "Service Request";
                        const fnLabel  = s.function || "";
                        return (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
                            {/* Doc type icon */}
                            <div style={{ width:40, height:44, borderRadius:6, background:"#eff6ff", border:"1.5px solid #93c5fd", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <span style={{ fontSize:16 }}>📄</span>
                              <span style={{ fontSize:8, fontWeight:700, color:"#2563eb", marginTop:1 }}>{ext}</span>
                            </div>
                            {/* Doc info */}
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:"#111827", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {filename}
                              </div>
                              <div style={{ fontSize:11, color:"#64748b", marginBottom:2 }}>
                                {svcLabel}{fnLabel ? ` — ${fnLabel}` : ""}
                              </div>
                              {uploadDate && (
                                <div style={{ fontSize:10, color:"#94a3b8" }}>Uploaded {uploadDate}</div>
                              )}
                            </div>
                            {/* Link */}
                            <a href={url} target="_blank" rel="noreferrer"
                              style={{ flexShrink:0, fontSize:12, fontWeight:600, color:"#2563eb", textDecoration:"none" }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration="underline"}
                              onMouseLeave={e => e.currentTarget.style.textDecoration="none"}>
                              View RFP Documents ↗
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </Sec>
                );
              })()}

            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BidResponseOverview ───────────────────────────────────────────────────────
function BidResponseOverview({ token }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/tags`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "success") setData(d.data || []); })
      .catch(() => {});
  }, [token]);

  if (!data) return null;
  const responded = data.filter(t => t.responded);
  const won  = data.filter(t => t.bid_status === "won");
  const lost = data.filter(t => t.bid_status === "lost");
  const revenue = won.reduce((s, t) => s + (parseFloat(t.bid_amount) || 0), 0);
  const margins = won.filter(t => t.margin_pct != null).map(t => parseFloat(t.margin_pct));
  const avgMargin = margins.length ? (margins.reduce((a,b)=>a+b,0)/margins.length).toFixed(1) : null;
  const winRate = responded.length ? Math.round((won.length/responded.length)*100) : 0;

  return (
    <div className="card">
      <div className="card-hdr">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <StatusDot />
          <div className="card-title">Bid Response Overview</div>
        </div>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ background:"#f0fdf4", border:"1.5px solid #4ade80", borderRadius:10, padding:14, textAlign:"center", marginBottom:14, boxShadow:"0 0 12px rgba(34,197,94,0.1)" }}>
          <div style={{ fontSize:10, fontWeight:600, color:"#15803d", letterSpacing:0.5, marginBottom:4 }}>TOTAL REVENUE — BIDS WON</div>
          <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:26, color:"#16a34a", lineHeight:1, marginBottom:2 }}>{fmt(revenue)}</div>
          <div style={{ fontSize:10, color:"#4ade80" }}>{won.length} funded commitments · FY2026</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { label:"Responded", val:responded.length, sub:"total bids", color:"#7c3aed" },
            { label:"Won",       val:won.length,        sub:`${winRate}% win rate`, color:"#16a34a" },
            { label:"Lost",      val:lost.length,       sub:`${100-winRate}% loss rate`, color:"#dc2626" },
          ].map(({ label, val, sub, color }) => (
            <div key={label} style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"10px 8px", textAlign:"center" }}>
              <div style={{ fontSize:10, color:"#94a3b8", fontWeight:500, marginBottom:4 }}>{label}</div>
              <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:22, color, lineHeight:1, marginBottom:2 }}>{val}</div>
              <div style={{ fontSize:9, color:"#94a3b8" }}>{sub}</div>
            </div>
          ))}
        </div>
        {avgMargin && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontFamily:"'Aldrich',sans-serif", fontSize:14, color:"#2563eb" }}>{avgMargin}%</span>
              <span style={{ fontSize:11, color:"#94a3b8" }}>Avg Margin</span>
            </div>
            <div style={{ height:4, background:"#e2e8f0", borderRadius:99, overflow:"hidden" }}>
              <div style={{ width:`${Math.min(100,parseFloat(avgMargin))}%`, height:"100%", background:"linear-gradient(90deg,#93b4fd,#2563eb)", borderRadius:99 }}/>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── TagsPanel ─────────────────────────────────────────────────────────────────
function TagsPanel({ token, onTagsUpdated, onView470 }) {
  const [tags, setTags]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup]     = useState(null);
  const [stages, setStages]   = useState({});
  const [kwQuery, setKwQuery]     = useState("");
  const [kwResults, setKwResults] = useState(null);
  const [kwLoading, setKwLoading] = useState(false);
  const [kwError, setKwError]     = useState("");

  const STAGE_LABELS = ["Bid Submitted","Under Review","Final Review","Wave Ready","Funded","Denied","On Appeal"];
  const STAGE_COLORS = ["#2563eb","#7c3aed","#d97706","#0891b2","#16a34a","#dc2626","#ea580c"];

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/tags`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") {
        setTags(json.data || []);
        const nums = (json.data||[]).map(t=>t.application_number).join(",");
        if (nums) {
          const sr = await fetch(`${API_URL}/api/bid-stages?app_numbers=${nums}`, { headers:{ Authorization:`Bearer ${token}` } });
          const sj = await sr.json();
          if (sj.status === "success") setStages(sj.data || {});
        }
      }
    } catch {} finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [token]);

  async function removeTag(appNum) {
    await fetch(`${API_URL}/api/tags/${appNum}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
    setTags(t => t.filter(x => x.application_number !== appNum));
    onTagsUpdated?.();
  }

  async function updateTag(appNum, updates) {
    await fetch(`${API_URL}/api/tags/${appNum}`, { method:"PATCH", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body: JSON.stringify(updates) });
    await load();
  }

  async function doKwSearch() {
    const kw = kwQuery.trim();
    if (!kw) return;
    setKwLoading(true); setKwError(""); setKwResults(null);
    try {
      const res  = await fetch(`${API_URL}/api/tags/keyword-search?keyword=${encodeURIComponent(kw)}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") setKwResults(json);
      else setKwError(json.message || "Search failed");
    } catch { setKwError("Connection error"); }
    setKwLoading(false);
  }

  if (loading) return <div style={{ padding:32 }}><Spinner /></div>;
  if (!tags.length) return (
    <div style={{ padding:48, textAlign:"center" }}>
      <div style={{ fontSize:32, marginBottom:12 }}>☆</div>
      <div style={{ fontSize:14, fontWeight:600, color:"#94a3b8", marginBottom:6 }}>No tagged 470s yet</div>
      <div style={{ fontSize:12, color:"#cbd5e1" }}>Tag a Form 470 from the live feed to track your bids here</div>
    </div>
  );

  return (
    <div>
      {/* Keyword filter bar */}
      <div style={{ padding:"12px 16px", borderBottom:"1.5px solid #e2e8f0", background:"#f8fafc", display:"flex", gap:8, alignItems:"center" }}>
        <input className="inp inp-sm" style={{ flex:1, maxWidth:360 }}
          value={kwQuery} onChange={e => setKwQuery(e.target.value)}
          onKeyDown={e => e.key==="Enter" && doKwSearch()}
          placeholder='Filter tagged 470s by keyword e.g. "Ubiquiti", "Cisco", "WAP"' />
        <button className="btn btn-sm btn-primary" onClick={doKwSearch} disabled={kwLoading || !kwQuery.trim()}>
          {kwLoading ? "Searching..." : "Search →"}
        </button>
        {kwResults && (
          <button className="btn btn-sm" onClick={() => { setKwResults(null); setKwQuery(""); }}>Clear</button>
        )}
        {kwResults && (
          <span style={{ fontSize:11, color:"#64748b" }}>
            {kwResults.count} of {tags.length} tagged 470s mention "{kwResults.keyword}"
          </span>
        )}
        {kwError && <span style={{ fontSize:11, color:"#dc2626" }}>⚠ {kwError}</span>}
      </div>

      {/* Keyword results — compact cards */}
      {kwResults && kwResults.count > 0 && (
        <div style={{ borderBottom:"1.5px solid #e2e8f0", background:"#fffbeb" }}>
          {kwResults.data.map((r, i) => (
            <div key={i} style={{ padding:"12px 16px", borderBottom:"1px solid #fde68a", display:"flex", alignItems:"flex-start", gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#1e293b" }}>{r.billed_entity_name}</span>
                  {r.responded && <span className="badge badge-blue" style={{ fontSize:9 }}>Responded</span>}
                  {r.bid_status === "won"  && <span className="badge badge-green" style={{ fontSize:9 }}>Won</span>}
                  {r.bid_status === "lost" && <span className="badge badge-red"   style={{ fontSize:9 }}>Lost</span>}
                </div>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>{r.service_category}</div>
                {r.services?.length > 0 && (
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {r.services.map((s, si) => (
                      <span key={si} style={{ fontSize:10, fontWeight:600, padding:"1px 7px", borderRadius:4, background:"#ede9fe", color:"#6d28d9" }}>
                        {s.manufacturer || s.service_type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                {r.tech_contact_name && <div style={{ fontSize:12, fontWeight:500, color:"#1e293b" }}>{r.tech_contact_name}</div>}
                {r.tech_contact_email && <a href={`mailto:${r.tech_contact_email}`} style={{ fontSize:11, color:"#2563eb", textDecoration:"none" }}>{r.tech_contact_email}</a>}
                {r.tech_contact_phone && <div style={{ fontSize:11, color:"#64748b" }}>{r.tech_contact_phone}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {kwResults && kwResults.count === 0 && (
        <div style={{ padding:"20px 16px", background:"#fffbeb", borderBottom:"1.5px solid #e2e8f0", fontSize:12, color:"#92400e", textAlign:"center" }}>
          None of your tagged 470s mention "{kwResults.keyword}" in their services
        </div>
      )}

      {tags.map((tag, i) => {
        const stage = stages[tag.application_number];
        const days  = tag.bid_due_date ? Math.ceil((new Date(tag.bid_due_date)-new Date())/(1000*60*60*24)) : null;
        return (
          <div key={i} style={{ padding:"14px 20px", borderBottom:"1.5px solid #c8d6e8", background: popup?.appNum === tag.application_number ? "#fafbff" : undefined }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:"#2563eb", cursor:"pointer", textDecoration:"underline dotted" }}
                    onClick={() => onView470?.(String(tag.application_number))}>
                    {tag.application_number}
                  </span>
                  {tag.bid_status === "won"  && <span className="badge badge-green">WON</span>}
                  {tag.bid_status === "lost" && <span className="badge badge-red">LOST</span>}
                  {tag.responded && !tag.bid_status && <span className="badge badge-blue">RESPONDED</span>}
                  {days != null && days >= 0 && <span className={`badge ${days<=3?"badge-red":days<=14?"badge-amber":"badge-gray"}`}>{days}d left</span>}
                </div>
                <div style={{ fontSize:12, fontWeight:500, color:"#334155", marginBottom:2 }}>{tag.billed_entity_name}</div>
                <div style={{ fontSize:10, color:"#94a3b8" }}>{tag.service_category} · {tag.state} · FY{tag.funding_year}</div>
              </div>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button className="btn btn-sm" style={{ color:"#2563eb", borderColor:"#93c5fd", background:"#eff6ff" }}
                  onClick={() => onView470?.(String(tag.application_number))}>
                  View 470
                </button>
                <button className="btn btn-sm" style={{ color: tag.responded ? "#15803d" : undefined, borderColor: tag.responded ? "#86efac" : undefined, background: tag.responded ? "#f0fdf4" : undefined }}
                  onClick={() => updateTag(tag.application_number, { responded: !tag.responded })}>
                  {tag.responded ? "✓ Responded" : "Responded"}
                </button>
                <button className="btn btn-sm" style={{ color:"#16a34a", borderColor:"#86efac" }}
                  onClick={() => { const u = {responded:true,bid_status:"won"}; if (!tag.bid_amount) setPopup({ appNum:tag.application_number, tag, mode:"$" }); else updateTag(tag.application_number,u); }}>
                  Won
                </button>
                <button className="btn btn-sm" style={{ color:"#dc2626", borderColor:"#fca5a5" }}
                  onClick={() => updateTag(tag.application_number, { responded:true, bid_status:"lost" })}>
                  Lost
                </button>
                <button className="btn btn-sm" style={{ color:"#2563eb", borderColor:"#93c5fd" }}
                  onClick={() => setPopup({ appNum:tag.application_number, tag, mode:"$" })}>
                  $
                </button>
                <button className="btn btn-sm" style={{ color:"#dc2626" }}
                  onClick={() => removeTag(tag.application_number)}>✕</button>
              </div>
            </div>

            {/* Stage pipeline */}
            {stage && (
              <div style={{ marginTop:10, display:"flex", gap:6, alignItems:"center" }}>
                {STAGE_LABELS.map((s, idx) => {
                  const isActive = stage.stage_index === idx;
                  return (
                    <div key={idx} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background: isActive ? STAGE_COLORS[idx] : "#e2e8f0", boxShadow: isActive ? `0 0 6px ${STAGE_COLORS[idx]}80` : "none", transition:"all 0.2s" }}/>
                      <span style={{ fontSize:9, color: isActive ? STAGE_COLORS[idx] : "#94a3b8", fontWeight: isActive ? 600 : 400 }}>{s}</span>
                      {idx < STAGE_LABELS.length-1 && <span style={{ color:"#e2e8f0", fontSize:10 }}>›</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* $ popup */}
            {popup?.appNum === tag.application_number && (
              <BidPopup tag={tag} onSave={vals => { updateTag(tag.application_number, vals); setPopup(null); }} onClose={() => setPopup(null)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BidPopup({ tag, onSave, onClose }) {
  const [bidAmt, setBidAmt] = useState(tag.bid_amount || "");
  const [cogs, setCogs]     = useState(tag.cogs || "");
  const margin = bidAmt && cogs ? (((bidAmt-cogs)/bidAmt)*100).toFixed(1) : null;
  return (
    <div style={{ marginTop:12, background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:14 }}>
      <div style={{ fontSize:11, fontWeight:600, color:"#334155", marginBottom:10 }}>Bid Details — {tag.application_number}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div>
          <label style={{ fontSize:10, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Bid Amount</label>
          <input className="inp inp-sm" type="number" value={bidAmt} onChange={e => setBidAmt(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label style={{ fontSize:10, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>COGS</label>
          <input className="inp inp-sm" type="number" value={cogs} onChange={e => setCogs(e.target.value)} placeholder="0.00" />
        </div>
      </div>
      {margin && <div style={{ fontSize:11, color:"#2563eb", fontWeight:600, marginBottom:10 }}>Margin: {margin}%</div>}
      <div style={{ display:"flex", gap:6 }}>
        <button className="btn btn-primary btn-sm" onClick={() => onSave({ bid_amount:parseFloat(bidAmt)||null, cogs:parseFloat(cogs)||null, bid_status:"won", responded:true })}>Save & Mark Won</button>
        <button className="btn btn-sm" onClick={() => onSave({ bid_amount:parseFloat(bidAmt)||null, cogs:parseFloat(cogs)||null })}>Save</button>
        <button className="btn btn-sm" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}


// ── Detail471Fields ───────────────────────────────────────────────────────────
function Detail471Fields({ data: d }) {
  const fields = [
    { label:"Application #",         value: d.application_number },
    { label:"Organization",          value: d.organization_name },
    { label:"Funding Year",          value: d.funding_year ? `FY${d.funding_year}` : null },
    { label:"State",                 value: d.org_state },
    { label:"Category",              value: d.chosen_category_of_service },
    { label:"471 Status",            value: d.form_471_status_name },
    { label:"Funding Requested",     value: d.funding_request_amount ? fmt(d.funding_request_amount) : null },
    { label:"Pre-Discount Eligible", value: d.pre_discount_eligible_amount ? fmt(d.pre_discount_eligible_amount) : null },
    { label:"C1 Discount",           value: d.c1_discount ? `${Math.round(parseFloat(d.c1_discount)*100)}%` : null },
    { label:"C2 Discount",           value: d.c2_discount ? `${Math.round(parseFloat(d.c2_discount)*100)}%` : null },
    { label:"Contact",               value: [d.cnct_first_name, d.cnct_last_name].filter(Boolean).join(" ") || null },
    { label:"Email",                 value: d.cnct_email },
    { label:"Phone",                 value: d.cnct_phone },
    { label:"Certified",             value: d.certified_datetime ? fmtDate(d.certified_datetime) : null },
  ];
  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
        {fields.filter(f => f.value).map(f => (
          <div key={f.label} style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", padding:"8px 10px", borderRadius:8 }}>
            <div style={{ fontSize:9, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>{f.label}</div>
            <div style={{ fontSize:11, color:"#334155" }}>{f.value}</div>
          </div>
        ))}
      </div>
      {d.application_number && (
        <a href={`https://legacy.fundsforlearning.com/471/${d.application_number}`} target="_blank" rel="noreferrer"
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:10, border:"1.5px solid #cbd5e1", borderRadius:8, background:"#f8fafc", color:"#2563eb", textDecoration:"none", fontSize:11, fontWeight:500 }}
          onMouseEnter={e => { e.currentTarget.style.background="#eff6ff"; e.currentTarget.style.borderColor="#93b4fd"; }}
          onMouseLeave={e => { e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.borderColor="#cbd5e1"; }}>
          View on FundsForLearning →
        </a>
      )}
      <div style={{ fontSize:9, color:"#94a3b8", textAlign:"center", marginTop:8 }}>
        Source: {d.source === "local_db" ? "Local DB (FY2026)" : "USAC Live API"}
      </div>
    </>
  );
}

// ── FRN Status Modal ──────────────────────────────────────────────────────────
function FRNStatusModal({ token, onClose }) {
  const [q, setQ]             = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [detail, setDetail]   = useState(null);

  async function doSearch() {
    if (!q.trim()) return;
    setLoading(true); setSearched(true); setDetail(null);
    try {
      const params = new URLSearchParams();
      if (/^\d{10,}$/.test(q.trim())) params.set("frn", q.trim());
      else if (/^\d{6,9}$/.test(q.trim())) params.set("app", q.trim());
      else if (/^\d{4,6}$/.test(q.trim())) params.set("ben", q.trim());
      else params.set("org", q.trim());
      const res  = await fetch(`${API_URL}/api/frn-status?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setResults(json.status === "success" ? json.data || [] : []);
    } catch { setResults([]); }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box-sm">
        <div className="modal-hdr">
          <div><div className="modal-title">FRN Status Lookup</div><div className="modal-sub">Search by FRN, application #, BEN, or organization name</div></div>
          <button className="modal-close" onClick={onClose}>✕ Close</button>
        </div>
        <div style={{ padding:16, borderBottom:"1.5px solid #e2e8f0", display:"flex", gap:8 }}>
          <input className="inp" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key==="Enter" && doSearch()} placeholder="FRN, app number, BEN, or org name..." />
          <button className="btn btn-primary" onClick={doSearch}>Search</button>
        </div>
        <div className="modal-body">
          {loading && <Spinner />}
          {!loading && searched && results.length === 0 && <Empty title="No results found" />}
          {!loading && !searched && <Empty title="Enter a search term above" sub="Search by FRN number, application number, BEN, or organization name" />}
          {!loading && results.length > 0 && (
            <>
              <div className="tbl-hdr" style={{ gridTemplateColumns:"120px 1fr 140px 100px 110px" }}>
                {["FRN","ORGANIZATION","SERVICE TYPE","STATUS","COMMITTED"].map(h => <div key={h} className="tbl-hdr-cell">{h}</div>)}
              </div>
              {results.map((r, i) => {
                const sc = (r.frn_status||"").toLowerCase().includes("fund") ? "badge-green" : (r.frn_status||"").toLowerCase().includes("deny") ? "badge-red" : "badge-gray";
                return (
                  <div key={i} className="tbl-row" style={{ gridTemplateColumns:"120px 1fr 140px 100px 110px" }} onClick={() => setDetail(detail?.frn === r.frn ? null : r)}>
                    <div className="tbl-cell" style={{ color:"#2563eb", fontWeight:600 }}>{r.frn}</div>
                    <div className="tbl-cell">{r.organization_name}</div>
                    <div className="tbl-cell" style={{ fontSize:10 }}>{r.service_type}</div>
                    <div><span className={`badge ${sc}`} style={{ fontSize:9 }}>{(r.frn_status||"—").split(" ").slice(0,2).join(" ")}</span></div>
                    <div className="tbl-cell" style={{ color:"#16a34a", fontWeight:600 }}>{r.commitment ? fmt(r.commitment) : "—"}</div>
                  </div>
                );
              })}
            </>
          )}
          {detail && (
            <div style={{ padding:16, borderTop:"1.5px solid #e2e8f0", background:"#f8fafc" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#1e293b", marginBottom:12 }}>FRN Detail — {detail.frn}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                {[["Application #", detail.application_number],["Organization", detail.organization_name],["BEN", detail.ben],["Service Type", detail.service_type],["FRN Status", detail.frn_status],["Committed", fmt(detail.commitment)],["Discount", detail.discount_pct ? `${detail.discount_pct}%` : "—"],["FCDL Date", fmtDate(detail.fcdl_date)]].map(([l,v]) => v && (
                  <div key={l} style={{ background:"#fff", border:"1.5px solid #e2e8f0", padding:"8px 10px", borderRadius:8 }}>
                    <div style={{ fontSize:9, fontWeight:600, color:"#94a3b8", marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:11, color:"#334155" }}>{v}</div>
                  </div>
                ))}
              </div>
              {detail.application_number && (
                <a href={`https://legacy.fundsforlearning.com/471/${detail.application_number}`} target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:10, border:"1.5px solid #cbd5e1", borderRadius:8, background:"#fff", color:"#2563eb", textDecoration:"none", fontSize:11, fontWeight:500 }}>
                  View 471 on FundsForLearning →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Entity Search Modal ───────────────────────────────────────────────────────
function EntitySearchModal({ token, onClose }) {
  const [searchBy, setSearchBy] = useState("name");
  const [q, setQ]               = useState("");
  const [stateF, setStateF]     = useState("TX");
  const [typeF, setTypeF]       = useState("");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [history, setHistory]   = useState({});
  const [histLoading, setHistLoading] = useState({});
  const [detail471, setDetail471] = useState(null);

  const STATES = ["TX","CA","NY","FL","IL","PA","OH","GA","NC","MI","WA","AZ","CO","VA","MA","TN","IN","MO","WI","MN","OR","KY","OK","NV","CT","UT","AR","MS","KS","NM","NE","ID","WV","HI","NH","ME","RI","MT","DE","SD","ND","AK","VT","WY"];
  const TYPES  = ["","School","Library","School District","Library System","Non-Instructional Facility (Nif)","Consortium"];

  async function doSearch() {
    if (!q.trim()) return;
    setLoading(true); setSearched(true); setExpanded(null);
    try {
      const params = new URLSearchParams({ limit:100 });
      if (searchBy === "ben") params.set("ben", q.trim()); else params.set("search", q.trim());
      if (stateF !== "ALL") params.set("state", stateF);
      if (typeF) params.set("entity_type", typeF);
      const res  = await fetch(`${API_URL}/api/entity-search?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setResults(json.status === "success" ? json.data || [] : []);
    } catch { setResults([]); }
    setLoading(false);
  }

  async function loadHistory(ben) {
    if (history[ben] || histLoading[ben]) return;
    setHistLoading(p => ({...p,[ben]:true}));
    try {
      const res  = await fetch(`${API_URL}/api/entity-history?ben=${encodeURIComponent(ben)}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") setHistory(p => ({...p,[ben]:json}));
    } catch {} finally { setHistLoading(p => ({...p,[ben]:false})); }
  }

  async function loadDetail471(row, ben) {
    setDetail471({ data:null, loading:true, row });
    try {
      const params = new URLSearchParams({ ben });
      if (row.application_number) params.set("application_number", row.application_number);
      if (row.funding_year) params.set("funding_year", row.funding_year);
      const res  = await fetch(`${API_URL}/api/471-detail?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setDetail471({ data:json.data||null, loading:false, row });
    } catch { setDetail471({ data:null, loading:false, row }); }
  }

  const typeColor = t => {
    if (!t) return "#7c3aed";
    const tl = t.toLowerCase();
    if (tl.includes("district")) return "#2563eb";
    if (tl.includes("school")) return "#7c3aed";
    if (tl.includes("library")) return "#d97706";
    return "#64748b";
  };

  return (
    <>
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-hdr">
          <div><div className="modal-title">Entity Search</div><div className="modal-sub">Live · USAC Open Data · Schools, Libraries & Consortia</div></div>
          <button className="modal-close" onClick={onClose}>✕ Close</button>
        </div>
        <div style={{ padding:"12px 16px", borderBottom:"1.5px solid #e2e8f0", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", background:"#f8fafc" }}>
          <div style={{ display:"flex", gap:4 }}>
            {[["name","Entity Name"],["ben","BEN #"]].map(([key,label]) => (
              <button key={key} onClick={() => setSearchBy(key)} className={`btn btn-sm ${searchBy===key?"btn-active":""}`}>{label}</button>
            ))}
          </div>
          <select className="inp inp-sm" style={{ width:"auto" }} value={stateF} onChange={e => setStateF(e.target.value)}>
            <option value="ALL">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="inp inp-sm" style={{ width:"auto" }} value={typeF} onChange={e => setTypeF(e.target.value)}>
            <option value="">All Types</option>
            {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="inp inp-sm" style={{ flex:1, minWidth:200 }} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key==="Enter" && doSearch()} placeholder={searchBy==="ben" ? "Enter BEN number..." : "Enter entity name..."} />
          <button className="btn btn-primary btn-sm" onClick={doSearch}>Search →</button>
        </div>
        <div className="modal-body">
          {loading && <Spinner />}
          {!loading && searched && results.length === 0 && <Empty title="No results found" />}
          {!loading && !searched && <Empty title="Search for an entity above" sub="Search schools, libraries, and districts by name or BEN number" />}
          {!loading && results.length > 0 && (
            <>
              <div className="tbl-hdr" style={{ gridTemplateColumns:"2fr 1.2fr 90px 80px 60px 100px" }}>
                {["ENTITY NAME","TYPE","BEN","CITY","STATE","STATUS"].map(h => <div key={h} className="tbl-hdr-cell">{h}</div>)}
              </div>
              {results.map((r, i) => {
                const isExp = expanded === i;
                return (
                  <div key={i} style={{ borderBottom:"1px solid #f1f5f9" }}>
                    <div className="tbl-row" style={{ gridTemplateColumns:"2fr 1.2fr 90px 80px 60px 100px", background: isExp ? "#f8fafc" : undefined }} onClick={() => setExpanded(isExp ? null : i)}>
                      <div className="tbl-cell" style={{ fontWeight:500 }}>{r.entity_name}</div>
                      <div><span style={{ fontSize:10, fontWeight:600, color: typeColor(r.entity_type) }}>{r.entity_type||"—"}</span></div>
                      <div className="tbl-cell" style={{ color:"#2563eb", fontWeight:600 }}>{r.entity_number}</div>
                      <div className="tbl-cell">{r.city}</div>
                      <div className="tbl-cell">{r.state}</div>
                      <div><span className={`badge ${r.status==="Active"?"badge-green":"badge-gray"}`} style={{ fontSize:9 }}>{r.status}</span></div>
                    </div>
                    {isExp && (
                      <div style={{ background:"#f8fafc", borderTop:"1px solid #e2e8f0", padding:"12px 16px" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:8, marginBottom:12 }}>
                          {[["Address",`${r.address||""} ${r.city||""}, ${r.state||""} ${r.zip||""}`.trim()],["County",r.county],["Phone",r.phone],["Last Updated",r.last_updated?fmtDate(r.last_updated):null]].map(([l,v]) => v && (
                            <div key={l} style={{ background:"#fff", border:"1.5px solid #e2e8f0", padding:"8px 10px", borderRadius:8 }}>
                              <div style={{ fontSize:9, fontWeight:600, color:"#94a3b8", marginBottom:3 }}>{l}</div>
                              <div style={{ fontSize:11, color:"#334155" }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        {(() => {
                          const flags = ["public_school","private_school","charter_school","public_library","main_branch","head_start","pre_k","bie"].filter(f => r.raw?.[f]==="Yes");
                          return flags.length > 0 && (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
                              {flags.map(f => <span key={f} className="badge badge-blue" style={{ fontSize:9 }}>{f.replace(/_/g," ").toUpperCase()}</span>)}
                            </div>
                          );
                        })()}
                        {r.entity_number && (
                          <button className="btn btn-sm" style={{ borderColor:"#fcd34d", color:"#92400e", background:"#fffbeb" }}
                            onClick={() => loadHistory(r.entity_number)}>
                            {histLoading[r.entity_number] ? "Loading..." : history[r.entity_number] ? "▲ Hide E-Rate History" : "▼ View E-Rate History"}
                          </button>
                        )}
                        {history[r.entity_number] && (() => {
                          const h = history[r.entity_number];
                          const total = h.data.reduce((s,d)=>s+(d.commitment||0),0);
                          return (
                            <div style={{ marginTop:12, border:"1.5px solid #fcd34d", borderRadius:10, overflow:"hidden" }}>
                              <div style={{ background:"#fffbeb", padding:"10px 14px", borderBottom:"1px solid #fef3c7", display:"flex", gap:16, flexWrap:"wrap" }}>
                                {h.summary.map(y => (
                                  <div key={y.year} style={{ textAlign:"center" }}>
                                    <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:14, color:"#d97706" }}>FY{y.year}</div>
                                    <div style={{ fontSize:9, color:"#92400e" }}>{fmt(y.total)} · {y.count} FRN{y.count!==1?"s":""}</div>
                                  </div>
                                ))}
                                <div style={{ marginLeft:"auto", textAlign:"right" }}>
                                  <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:14, color:"#16a34a" }}>{fmt(total)}</div>
                                  <div style={{ fontSize:9, color:"#15803d" }}>Total Committed</div>
                                </div>
                              </div>
                              <div className="tbl-hdr" style={{ gridTemplateColumns:"70px 1.4fr 1fr 110px 70px", background:"#fffbeb" }}>
                                {["YEAR","SERVICE TYPE","PROVIDER","COMMITTED","DISC %"].map(h => <div key={h} className="tbl-hdr-cell">{h}</div>)}
                              </div>
                              {h.data.map((d, di) => (
                                <div key={di} className="tbl-row" style={{ gridTemplateColumns:"70px 1.4fr 1fr 110px 70px" }} onClick={() => loadDetail471(d, r.entity_number)}>
                                  <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:11, color:"#d97706", textDecoration:"underline dotted" }}>FY{d.funding_year}</div>
                                  <div className="tbl-cell" style={{ fontSize:10 }}>{d.service_type||"—"}</div>
                                  <div className="tbl-cell" style={{ fontSize:10, color:"#2563eb" }}>{d.spin_name||"—"}</div>
                                  <div className="tbl-cell" style={{ color:"#16a34a", fontWeight:600 }}>{d.commitment?fmt(d.commitment):"—"}</div>
                                  <div className="tbl-cell">{d.discount_pct?`${d.discount_pct}%`:"—"}</div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ padding:"10px 16px", fontSize:10, color:"#94a3b8", borderTop:"1px solid #f1f5f9" }}>{results.length} results · Click a row to expand · Click a funding year to see 471 details</div>
            </>
          )}
        </div>
      </div>
    </div>
    {detail471 && (
      <div className="modal-backdrop" style={{ zIndex:300 }} onClick={e => e.target===e.currentTarget && setDetail471(null)}>
        <div className="modal-box modal-box-sm">
          <div className="modal-hdr">
            <div><div className="modal-title">Form 471 Detail</div><div className="modal-sub">{detail471.row?.funding_year ? `FY${detail471.row.funding_year}` : ""}</div></div>
            <button className="modal-close" onClick={() => setDetail471(null)}>✕</button>
          </div>
          <div className="modal-body" style={{ padding:16 }}>
            {detail471.loading && <Spinner />}
            {!detail471.loading && !detail471.data && <Empty title="No Form 471 found for this year" />}
            {!detail471.loading && detail471.data && <Detail471Fields data={detail471.data} />}
          </div>
        </div>
      </div>
    )}
    </>
  );
}


// ── C2 Budget Modal ───────────────────────────────────────────────────────────
function C2BudgetModal({ token, onClose }) {
  const [searchBy, setSearchBy] = useState("name");
  const [q, setQ]               = useState("");
  const [stateF, setStateF]     = useState("TX");
  const [cycle, setCycle]       = useState("FY2026-2030");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const STATES = ["TX","CA","NY","FL","IL","PA","OH","GA","NC","MI","WA","AZ","CO","VA","MA","TN","IN","MO","WI","MN"];

  async function doSearch() {
    if (!q.trim()) return;
    setLoading(true); setSearched(true); setExpanded(null);
    try {
      const params = new URLSearchParams({ limit:50, cycle });
      if (searchBy === "ben") params.set("ben", q.trim()); else params.set("search", q.trim());
      if (stateF !== "ALL") params.set("state", stateF);
      const res  = await fetch(`${API_URL}/api/c2-budget?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setResults(json.status === "success" ? json.data || [] : []);
    } catch { setResults([]); }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-hdr">
          <div><div className="modal-title">E-Rate C2 Budget Lookup</div><div className="modal-sub">Live · USAC Open Data · {cycle}</div></div>
          <button className="modal-close" onClick={onClose}>✕ Close</button>
        </div>
        <div style={{ padding:"12px 16px", borderBottom:"1.5px solid #e2e8f0", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", background:"#f8fafc" }}>
          {[["name","Entity Name"],["ben","BEN"]].map(([key,label]) => (
            <button key={key} onClick={() => setSearchBy(key)} className={`btn btn-sm ${searchBy===key?"btn-active":""}`}>{label}</button>
          ))}
          <div style={{ display:"flex", gap:4 }}>
            {["FY2026-2030","FY2021-2025"].map(c => (
              <button key={c} onClick={() => setCycle(c)} className={`btn btn-sm`} style={{ borderColor: cycle===c?"#d97706":undefined, background: cycle===c?"#fffbeb":undefined, color: cycle===c?"#92400e":undefined }}>{c}</button>
            ))}
          </div>
          <select className="inp inp-sm" style={{ width:"auto" }} value={stateF} onChange={e => setStateF(e.target.value)}>
            <option value="ALL">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="inp inp-sm" style={{ flex:1, minWidth:200 }} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key==="Enter" && doSearch()} placeholder={searchBy==="ben"?"Enter BEN number...":"Enter district or entity name..."} />
          <button className="btn btn-primary btn-sm" onClick={doSearch}>Search →</button>
        </div>
        <div className="modal-body">
          {loading && <Spinner />}
          {!loading && searched && results.length === 0 && <Empty title="No results found" />}
          {!loading && !searched && <Empty title="Search for an entity above" sub="Look up C2 budget allocation by district name or BEN" />}
          {!loading && results.length > 0 && (
            <>
              <div className="tbl-hdr" style={{ gridTemplateColumns:"2fr 80px 80px 120px 120px 120px 120px" }}>
                {["ENTITY","STATE","BEN","TOTAL BUDGET","FUNDED","PENDING","AVAILABLE"].map(h => <div key={h} className="tbl-hdr-cell">{h}</div>)}
              </div>
              {results.map((r, i) => {
                const avPct = r.total_budget ? Math.round(((r.available||0)/r.total_budget)*100) : 0;
                const isExp = expanded === i;
                return (
                  <div key={i} style={{ borderBottom:"1px solid #f1f5f9" }}>
                    <div className="tbl-row" style={{ gridTemplateColumns:"2fr 80px 80px 120px 120px 120px 120px", background:isExp?"#f8fafc":undefined }} onClick={() => setExpanded(isExp?null:i)}>
                      <div className="tbl-cell" style={{ fontWeight:500 }}>{r.entity_name}</div>
                      <div className="tbl-cell">{r.state}</div>
                      <div className="tbl-cell" style={{ color:"#2563eb", fontWeight:600 }}>{r.ben}</div>
                      <div className="tbl-cell">{r.total_budget ? fmt(r.total_budget) : "—"}</div>
                      <div className="tbl-cell" style={{ color:"#16a34a" }}>{r.funded ? fmt(r.funded) : "$0"}</div>
                      <div className="tbl-cell" style={{ color:"#d97706" }}>{r.pending ? fmt(r.pending) : "$0"}</div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color: avPct>50?"#16a34a":avPct>20?"#d97706":"#dc2626" }}>{r.available ? fmt(r.available) : "$0"}</div>
                        <div style={{ height:2, background:"#e2e8f0", borderRadius:99, marginTop:3, overflow:"hidden", width:80 }}>
                          <div style={{ width:`${avPct}%`, height:"100%", background:"#2563eb", borderRadius:99 }}/>
                        </div>
                      </div>
                    </div>
                    {isExp && (
                      <div style={{ padding:"12px 16px", background:"#f8fafc", borderTop:"1px solid #e2e8f0" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:8 }}>
                          {[["City",r.city],["Applicant Type",r.applicant_type],["Budget Cycle",r.budget_cycle],["Budget Version",r.budget_version],["Students",r.students],["Consulting Firm",r.consulting_firm?r.consulting_firm.split("(")[0].trim():null]].map(([l,v]) => v && (
                            <div key={l} style={{ background:"#fff", border:"1.5px solid #e2e8f0", padding:"8px 10px", borderRadius:8 }}>
                              <div style={{ fontSize:9, fontWeight:600, color:"#94a3b8", marginBottom:3 }}>{l}</div>
                              <div style={{ fontSize:11, color:"#334155" }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ── C2 Prospects Modal ────────────────────────────────────────────────────────

// ── ContactSearchModal — search 470s by school type OR vendor product ─────────
function ContactSearchModal({ token, onClose, onView470 }) {
  // School search
  const [keywords, setKeywords] = useState("");
  const [serviceCategory, setServiceCategory] = useState("ALL");
  const [product, setProduct]   = useState("");
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");


  const PRESETS = ["Private", "Charter", "Christian", "Catholic", "Baptist", "Independent", "Academy", "Montessori"];

  async function doSearch() {
    const kw = keywords.trim();
    const prod = product.trim();
    if (!kw && !prod) return;
    setLoading(true); setError(""); setResults(null);
    try {
      const params = new URLSearchParams({ funding_year:"2026", limit:500 });
      if (kw) params.set("keywords", kw);
      if (prod) params.set("product", prod);
      if (serviceCategory !== "ALL") params.set("service_category", serviceCategory);
      if (product.trim()) params.set("product", product.trim());
      const res  = await fetch(`${API_URL}/api/contact-search?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") setResults(json);
      else setError(json.message || "Search failed");
    } catch { setError("Connection error"); }
    setLoading(false);
  }

  function exportCSV() {
    if (!results?.data?.length) return;
    const cols = ["billed_entity_name","billed_entity_number","state","service_category","application_status","bid_due_date","tech_contact_name","tech_contact_email","tech_contact_phone","application_number"];
    const csv  = [cols.join(","), ...results.data.map(r => cols.map(k => `"${(r[k]||"").toString().replace(/"/g,'""')}"`).join(","))].join("\n");
    const url  = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    const a    = document.createElement("a"); a.href=url; a.download=`kadera-contacts-${Date.now()}.csv`; a.click();
  }

  function toggleKeyword(word) {
    const parts = keywords.split(",").map(k => k.trim()).filter(Boolean);
    const idx   = parts.findIndex(p => p.toLowerCase() === word.toLowerCase());
    if (idx >= 0) parts.splice(idx, 1);
    else parts.push(word);
    setKeywords(parts.join(", "));
  }

  function isActive(word) {
    return keywords.split(",").map(k => k.trim().toLowerCase()).includes(word.toLowerCase());
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width:"min(1000px,96vw)" }}>
        <div className="modal-hdr">
          <div>
            <div className="modal-title">Contact Search</div>
            <div className="modal-sub">Search FY2026 Form 470s by school type and/or product — leave school type blank to search all</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕ Close</button>
        </div>

        {/* Search controls */}
        <div style={{ padding:"14px 20px", borderBottom:"1.5px solid #e2e8f0", background:"#f8fafc" }}>
          {/* Preset chips */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {PRESETS.map(w => (
              <button key={w} onClick={() => toggleKeyword(w)}
                style={{ padding:"3px 10px", borderRadius:99, border:`1.5px solid ${isActive(w) ? "#2563eb" : "#cbd5e1"}`, background: isActive(w) ? "#eff6ff" : "#fff", color: isActive(w) ? "#2563eb" : "#64748b", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                {w}
              </button>
            ))}
          </div>
          {/* Search row */}
          <div style={{ display:"flex", gap:8, alignItems:"flex-end", flexWrap:"wrap" }}>
            <div style={{ flex:2, minWidth:200 }}>
              <div style={{ fontSize:10, fontWeight:600, color:"#64748b", marginBottom:4, letterSpacing:0.3 }}>SCHOOL TYPE KEYWORDS <span style={{ color:"#94a3b8", fontWeight:400 }}>(optional — leave blank for all)</span></div>
              <input className="inp" value={keywords} onChange={e => setKeywords(e.target.value)}
                onKeyDown={e => e.key==="Enter" && doSearch()}
                placeholder='e.g. "Private, Charter, Christian" — leave blank for all schools' />
            </div>
            <div style={{ flex:1, minWidth:160 }}>
              <div style={{ fontSize:10, fontWeight:600, color:"#64748b", marginBottom:4, letterSpacing:0.3 }}>
                PRODUCT / MANUFACTURER <span style={{ color:"#94a3b8", fontWeight:400 }}>(optional)</span>
              </div>
              <input className="inp" value={product} onChange={e => setProduct(e.target.value)}
                onKeyDown={e => e.key==="Enter" && doSearch()}
                placeholder='e.g. "Ubiquiti", "Cisco"' />
            </div>
            <div style={{ width:160 }}>
              <div style={{ fontSize:10, fontWeight:600, color:"#64748b", marginBottom:4, letterSpacing:0.3 }}>SERVICE CATEGORY</div>
              <select className="inp" value={serviceCategory} onChange={e => setServiceCategory(e.target.value)}>
                <option value="ALL">All Categories</option>
                <option value="Internal Connections">Internal Connections</option>
                <option value="Basic Maintenance">Basic Maintenance</option>
                <option value="Internet">Internet Access</option>
                <option value="Telecommunications">Telecommunications</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={doSearch} disabled={loading || (!keywords.trim() && !product.trim())}>
              {loading ? "Searching..." : "Search →"}
            </button>
          </div>
          {error && <div style={{ marginTop:8, fontSize:11, color:"#dc2626" }}>⚠ {error}</div>}
        </div>

        {/* Results */}
        <div className="modal-body">
          {!results && !loading && (
            <div style={{ padding:"48px", textAlign:"center", fontSize:13, color:"#94a3b8" }}>
              Enter a school type keyword and/or product name above, then click Search
            </div>
          )}
          {loading && <Spinner />}
          {results && (
            <>
              {/* Summary bar */}
              <div style={{ padding:"10px 20px", borderBottom:"1.5px solid #e2e8f0", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, fontWeight:600, color:"#334155" }}>
                  {results.count} entities found
                  <span style={{ fontWeight:400, color:"#94a3b8", marginLeft:6 }}>
                    {product.trim() ? `mentioning "${product.trim()}" on FY2026 Form 470s` : "with contacts on FY2026 Form 470s"}
                  </span>
                </span>
                {results.count > 0 && (
                  <button className="btn btn-sm" onClick={exportCSV} style={{ color:"#16a34a", borderColor:"#86efac" }}>↓ Export CSV</button>
                )}
              </div>

              {results.count === 0 ? (
                <div style={{ padding:"48px", textAlign:"center", fontSize:13, color:"#94a3b8" }}>
                  No results — try different keywords
                </div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr style={{ background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0" }}>
                        {["View 470","Entity","BEN","Service Category",product.trim()?"Matched Services":"Status","Bid Due","Contact Name","Email","Phone"].map(h => (
                          <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:"#64748b", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.data.map((r, i) => {
                        const days = r.bid_due_date ? Math.ceil((new Date(r.bid_due_date)-new Date())/(1000*60*60*24)) : null;
                        return (
                          <tr key={i} style={{ borderBottom:"1px solid #f1f5f9" }}
                            onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <td style={{ padding:"8px 12px" }}>
                              {r.application_number
                                ? <button onClick={e => { e.stopPropagation(); onView470?.(String(r.application_number)); }}
                                    style={{ background:"none", border:"none", fontSize:11, fontWeight:600, color:"#2563eb", cursor:"pointer", padding:0, textDecoration:"none", whiteSpace:"nowrap", fontFamily:"inherit" }}
                                    onMouseEnter={e => e.currentTarget.style.textDecoration="underline"}
                                    onMouseLeave={e => e.currentTarget.style.textDecoration="none"}>
                                    View 470 ↗
                                  </button>
                                : <span style={{ color:"#94a3b8", fontSize:11 }}>—</span>}
                            </td>
                            <td style={{ padding:"8px 12px", fontWeight:600, color:"#1e293b", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={r.billed_entity_name}>{r.billed_entity_name}</td>
                            <td style={{ padding:"8px 12px", color:"#2563eb", fontWeight:500 }}>{r.billed_entity_number||"—"}</td>
                            <td style={{ padding:"8px 12px", color:"#64748b", whiteSpace:"nowrap" }}>{r.service_category||"—"}</td>
                            <td style={{ padding:"8px 12px" }}>
                              {product.trim() && r.matched_services?.length ? (
                                <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                                  {r.matched_services.slice(0,3).map((s, si) => (
                                    <span key={si} style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:4, background:"#ede9fe", color:"#6d28d9", whiteSpace:"nowrap" }}>
                                      {s.manufacturer || s.service_type}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4,
                                  background: (r.application_status||"").toLowerCase().includes("certif") ? "#dcfce7" : "#f1f5f9",
                                  color: (r.application_status||"").toLowerCase().includes("certif") ? "#15803d" : "#64748b" }}>
                                  {r.application_status||"—"}
                                </span>
                              )}
                            </td>
                            <td style={{ padding:"8px 12px", color: days!=null&&days<=7 ? "#dc2626" : "#334155", fontWeight: days!=null&&days<=7 ? 600 : 400, whiteSpace:"nowrap" }}>
                              {r.bid_due_date ? new Date(r.bid_due_date).toLocaleDateString() : "—"}
                              {days!=null&&days>=0&&days<=7 && <span style={{ fontSize:9, marginLeft:4, color:"#dc2626" }}>({days}d)</span>}
                            </td>
                            <td style={{ padding:"8px 12px", fontWeight:500, color:"#1e293b", whiteSpace:"nowrap" }}>{r.tech_contact_name||"—"}</td>
                            <td style={{ padding:"8px 12px" }}>
                              {r.tech_contact_email
                                ? <a href={`mailto:${r.tech_contact_email}`} style={{ color:"#2563eb", textDecoration:"none", fontSize:11 }} onClick={e => e.stopPropagation()}>{r.tech_contact_email}</a>
                                : <span style={{ color:"#94a3b8" }}>—</span>}
                            </td>
                            <td style={{ padding:"8px 12px", color:"#334155", whiteSpace:"nowrap" }}>{r.tech_contact_phone||"—"}</td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function C2ProspectsModal({ token, onClose }) {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [loaded, setLoaded]     = useState(false);
  const [error, setError]       = useState("");
  const [meta, setMeta]         = useState(null);
  const [filterType, setFilterType] = useState("ALL");
  const { sortField, sortAsc, toggle, apply } = useSort("available", false);

  async function load() {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_URL}/api/c2-prospects?limit=500`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") {
        setResults(json.data || []);
        setMeta({ total_checked: json.total_c2_checked, already_filed: json.already_filed, prospects: json.count });
        setLoaded(true);
      } else { setError(json.message || "Failed"); }
    } catch { setError("Connection error"); }
    setLoading(false);
  }

  const filtered = results.filter(r => filterType==="ALL" || (r.applicant_type||"").toLowerCase().includes(filterType.toLowerCase()));
  const sorted   = apply(filtered);
  const totalAvail = filtered.reduce((s,r) => s+(r.available||0), 0);

  const SH = ({ field, label }) => <SortHdr label={label} field={field} sortField={sortField} sortAsc={sortAsc} onSort={toggle} />;

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width:"min(1100px,96vw)" }}>
        <div className="modal-hdr">
          <div><div className="modal-title">C2 Prospect Finder</div><div className="modal-sub">TX Schools & Districts · FY2026-2030 C2 Budget · No FY2026 Form 470 Filed</div></div>
          <button className="modal-close" onClick={onClose}>✕ Close</button>
        </div>
        <div style={{ padding:"10px 16px", borderBottom:"1.5px solid #e2e8f0", background:"#f8fafc", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          {!loaded && !loading && <button className="btn btn-primary" onClick={load}>Run Search →</button>}
          {loading && <span style={{ fontSize:12, color:"#64748b", fontWeight:500 }}>Querying USAC + local DB... (may take 20–40s)</span>}
          {loaded && (
            <>
              <div style={{ display:"flex", gap:4 }}>
                {["ALL","School","District"].map(t => (
                  <button key={t} onClick={() => setFilterType(t)} className={`btn btn-sm ${filterType===t?"btn-active":""}`}>{t}</button>
                ))}
              </div>
              <div style={{ marginLeft:"auto", display:"flex", gap:20 }}>
                <div><div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:18, color:"#2563eb", lineHeight:1 }}>{sorted.length}</div><div style={{ fontSize:10, color:"#94a3b8" }}>Prospects</div></div>
                <div><div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:18, color:"#16a34a", lineHeight:1 }}>${(totalAvail/1000000).toFixed(1)}M</div><div style={{ fontSize:10, color:"#94a3b8" }}>Total Available</div></div>
                {meta && <div><div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:18, color:"#94a3b8", lineHeight:1 }}>{meta.already_filed}</div><div style={{ fontSize:10, color:"#94a3b8" }}>Already Filed</div></div>}
              </div>
            </>
          )}
          {error && <span style={{ fontSize:11, color:"#dc2626" }}>⚠ {error}</span>}
        </div>
        <div className="modal-body">
          {!loaded && !loading && <Empty title="Ready to search" sub="Click Run Search to query USAC live for TX schools with available C2 budget that haven't filed a FY2026 Form 470" />}
          {loading && <Spinner />}
          {loaded && sorted.length === 0 && <Empty title="No prospects found" />}
          {loaded && sorted.length > 0 && (
            <>
              <div className="tbl-hdr" style={{ gridTemplateColumns:"2fr 110px 90px 110px 120px 120px 140px 140px" }}>
                <SH field="entity_name" label="ENTITY" />
                <SH field="city" label="CITY" />
                <div className="tbl-hdr-cell">BEN</div>
                <SH field="applicant_type" label="TYPE" />
                <SH field="total_budget" label="BUDGET" />
                <SH field="funded" label="FUNDED" />
                <SH field="available" label="AVAILABLE" />
                <SH field="days_since_470" label="LAST 470" />
              </div>
              {sorted.map((r, i) => {
                const isDistrict = (r.applicant_type||"").toLowerCase().includes("district");
                const avPct = r.total_budget ? Math.round(((r.available||0)/r.total_budget)*100) : 0;
                return (
                  <div key={i} className="tbl-row" style={{ gridTemplateColumns:"2fr 110px 90px 110px 120px 120px 140px 140px" }}>
                    <div>
                      <div className="tbl-cell" style={{ fontWeight:500 }}>{r.entity_name}</div>
                      {r.consulting_firm && <div style={{ fontSize:9, color:"#d97706", marginTop:2 }}>Consultant: {r.consulting_firm.split("(")[0].trim()}</div>}
                    </div>
                    <div className="tbl-cell">{r.city}</div>
                    <div className="tbl-cell" style={{ color:"#2563eb", fontWeight:600 }}>{r.ben}</div>
                    <div><span className={`badge ${isDistrict?"badge-blue":"badge-purple"}`} style={{ fontSize:9 }}>{r.applicant_type}</span></div>
                    <div className="tbl-cell">{r.total_budget?fmt(r.total_budget):"—"}</div>
                    <div className="tbl-cell" style={{ color:"#d97706" }}>{r.funded?fmt(r.funded):"$0"}</div>
                    <div>
                      <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:13, color:"#16a34a", lineHeight:1, marginBottom:3 }}>{fmt(r.available)}</div>
                      <div style={{ height:2, background:"#e2e8f0", borderRadius:99, overflow:"hidden", width:80 }}>
                        <div style={{ width:`${avPct}%`, height:"100%", background:"#16a34a", borderRadius:99 }}/>
                      </div>
                    </div>
                    <div>
                      {r.days_since_470 == null
                        ? <div><div style={{ fontSize:10, color:"#dc2626", fontWeight:600 }}>Never filed</div><div style={{ fontSize:9, color:"#fca5a5" }}>No history</div></div>
                        : <div><div style={{ fontSize:10, fontWeight:600, color:r.days_since_470>365?"#dc2626":r.days_since_470>180?"#d97706":"#16a34a" }}>{r.days_since_470}d ago</div><div style={{ fontSize:9, color:"#94a3b8" }}>FY{r.last_470_year}</div></div>
                      }
                    </div>
                  </div>
                );
              })}
              <div style={{ padding:"10px 16px", fontSize:10, color:"#94a3b8", borderTop:"1px solid #f1f5f9" }}>
                {sorted.length} prospects · TX · Red = never/1yr+ · Amber = 6-12mo · Green = recent · Consultant shown if on file with USAC
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Competitive Intel Modal ───────────────────────────────────────────────────
function CompetitiveIntelModal({ token, onClose }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState("providers");
  const [mfrMetric, setMfrMetric] = useState("count");
  const [providerPopup, setProviderPopup] = useState(null);
  const [ciYear, setCiYear]           = useState("2026");
  const [partQuery, setPartQuery]   = useState("");
  const [partResults, setPartResults] = useState([]);
  const [partLoading, setPartLoading] = useState(false);
  const [partSearched, setPartSearched] = useState(false);
  const pSort = useSort("unit_price", false);
  const [providerQuery, setProviderQuery] = useState("");
  const [providerResults, setProviderResults] = useState(null);
  const [providerLoading, setProviderLoading] = useState(false);
  const provSort = useSort("commitment", false);
  const [areaQuery, setAreaQuery]     = useState("");
  const [areaSvcType, setAreaSvcType] = useState("c2");
  const [areaResults, setAreaResults] = useState(null);
  const [areaLoading, setAreaLoading] = useState(false);
  const [areaView, setAreaView]       = useState("providers");

  useEffect(() => {
    if (!token) return;
    setLoading(true); setData(null); setProviderPopup(null);
    fetch(`${API_URL}/api/competitive-intel?funding_year=${ciYear}`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "success") setData(d.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [token, ciYear]);

  async function doPartSearch() {
    if (!partQuery.trim() || partQuery.trim().length < 2) return;
    setPartLoading(true); setPartSearched(true);
    try {
      const res  = await fetch(`${API_URL}/api/part-lookup?q=${encodeURIComponent(partQuery.trim())}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setPartResults(json.status === "success" ? json.data || [] : []);
    } catch { setPartResults([]); }
    setPartLoading(false);
  }

  async function doProviderSearch() {
    if (!providerQuery.trim() || providerQuery.trim().length < 2) return;
    setProviderLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/provider-search?q=${encodeURIComponent(providerQuery.trim())}&limit=200`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setProviderResults(json.status === "success" ? json : null);
    } catch { setProviderResults(null); }
    setProviderLoading(false);
  }

  async function doAreaSearch() {
    if (!areaQuery.trim() || areaQuery.trim().length < 2) return;
    setAreaLoading(true); setAreaResults(null);
    try {
      const params = new URLSearchParams({ area: areaQuery.trim(), service_type: areaSvcType, limit:200 });
      const res  = await fetch(`${API_URL}/api/service-area-search?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setAreaResults(json.status === "success" ? json : null);
    } catch { setAreaResults(null); }
    setAreaLoading(false);
  }

  const TABS = [
    ["providers","Top 25 Providers"],
    ["manufacturers","Manufacturer Breakdown"],
    ["partlookup","Part Lookup"],
    ["providersearch","Provider Search"],
    ["areaservice","Service Area"],
  ];

  const maxProv = data?.top_providers?.[0]?.total || 1;
  const maxMfr  = data?.manufacturers?.[0]?.[mfrMetric==="count"?"count":"total"] || 1;

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width:"min(1100px,96vw)" }}>
        <div className="modal-hdr">
          <div>
            <div className="modal-title">Competitive Intelligence</div>
            <div className="modal-sub">FY{ciYear} TX Commitments · {data ? `${data.total?.toLocaleString()} commitments` : ""}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:11, fontWeight:500, color:"#64748b" }}>Funding Year</span>
            <select value={ciYear} onChange={e => setCiYear(e.target.value)}
              style={{ padding:"5px 10px", borderRadius:7, border:"1.5px solid #cbd5e1", fontSize:12, fontWeight:600, color:"#1e293b", background:"#fff", outline:"none", cursor:"pointer" }}>
              {["2026","2025","2024","2023","2022","2021"].map(y => (
                <option key={y} value={y}>FY{y}</option>
              ))}
            </select>
            <button className="modal-close" onClick={onClose}>✕ Close</button>
          </div>
        </div>
        <div className="tab-strip">
          {TABS.map(([key,label]) => (
            <div key={key} style={{ display:"flex" }}>
              <button className={`tab-btn ${view===key?"active":""}`} onClick={() => setView(key)}>{label}</button>
              {view===key && <button className="tab-close" onClick={onClose} title="Close">✕</button>}
            </div>
          ))}
        </div>

        <div className="modal-body" style={{ padding:20 }}>
          {loading && <Spinner />}
          {!loading && data && (
            <>
              {/* TOP 25 PROVIDERS */}
              {view === "providers" && (
                <>
                  {data.top_providers?.map((p, i) => {
                    const isOpen = providerPopup?.name === p.name;
                    return (
                      <div key={i}>
                        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom: isOpen ? "none" : "1px solid #f1f5f9", cursor:"pointer",
                          background: isOpen ? "#eff6ff" : "transparent" }}
                          onClick={() => setProviderPopup(isOpen ? null : p)}>
                          <div style={{ width:24, textAlign:"right", fontFamily:"'Aldrich',sans-serif", fontSize:11, color:"#94a3b8" }}>#{i+1}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:12, fontWeight:600, color: isOpen ? "#2563eb" : "#1e293b" }}>{p.name}</span>
                              <span style={{ fontSize:11, fontWeight:600, color:"#2563eb" }}>{fmt(p.total)}</span>
                            </div>
                            <div style={{ height:6, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
                              <div style={{ width:`${Math.round((p.total/maxProv)*100)}%`, height:"100%", background:"linear-gradient(90deg,#93b4fd,#2563eb)", borderRadius:99 }}/>
                            </div>
                            <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>{p.count} FRNs · {p.orgs} organizations</div>
                          </div>
                          <span style={{ fontSize:12, color:"#94a3b8" }}>{isOpen ? "▲" : "▼"}</span>
                        </div>
                        {isOpen && (
                          <div style={{ background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0", padding:"12px 0 12px 36px" }}>
                            <ProviderApplicants token={token} spinName={p.name} year={ciYear} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* MANUFACTURERS */}
              {view === "manufacturers" && (
                <>
                  <div style={{ display:"flex", gap:4, marginBottom:16 }}>
                    {[["count","Count"],["total","Dollar Volume"]].map(([key,label]) => (
                      <button key={key} onClick={() => setMfrMetric(key)} className={`btn btn-sm ${mfrMetric===key?"btn-active":""}`}>{label}</button>
                    ))}
                  </div>
                  {data.manufacturers?.map((m, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:500 }}>{m.name}</span>
                          <span style={{ fontSize:11, fontWeight:600, color:"#2563eb" }}>{mfrMetric==="count" ? m.count : fmt(m.total)}</span>
                        </div>
                        <div style={{ height:6, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
                          <div style={{ width:`${Math.round(((mfrMetric==="count"?m.count:m.total)/maxMfr)*100)}%`, height:"100%", background:"linear-gradient(90deg,#a78bfa,#7c3aed)", borderRadius:99 }}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* SERVICE TYPES */}
              {/* PART LOOKUP */}
              {view === "partlookup" && (
                <>
                  <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                    <input className="inp" value={partQuery} onChange={e => setPartQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && doPartSearch()} placeholder="Search model number, product name, or manufacturer..." />
                    <button className="btn btn-primary" onClick={doPartSearch}>Search →</button>
                  </div>
                  {partLoading && <Spinner />}
                  {!partLoading && partSearched && partResults.length === 0 && <Empty title="No parts found" />}
                  {!partLoading && !partSearched && <Empty title="Search for a part above" sub="Search FY2025 TX line items by model number, product name, or manufacturer" />}
                  {!partLoading && partResults.length > 0 && (
                    <>
                      <div className="tbl-hdr" style={{ gridTemplateColumns:"2fr 1.4fr 1.2fr 90px 90px 90px" }}>
                        <div className="tbl-hdr-cell">PRODUCT</div>
                        <div className="tbl-hdr-cell">SERVICE PROVIDER</div>
                        <div className="tbl-hdr-cell">APPLICANT</div>
                        <SortHdr label="UNIT PRICE" field="unit_price" sortField={pSort.sortField} sortAsc={pSort.sortAsc} onSort={pSort.toggle} />
                        <div className="tbl-hdr-cell">QTY</div>
                        <div className="tbl-hdr-cell">TOTAL</div>
                      </div>
                      {pSort.apply(partResults).map((r, i) => (
                        <div key={i} className="tbl-row" style={{ gridTemplateColumns:"2fr 1.4fr 1.2fr 90px 90px 90px" }}>
                          <div className="tbl-cell" style={{ fontWeight:500 }} title={r.product_name}>{(r.model_of_equipment||r.product_name||"—").slice(0,40)}{(r.model_of_equipment||r.product_name||"").length>40?"…":""}</div>
                          <div className="tbl-cell" style={{ fontSize:10, color:"#2563eb", fontWeight:500 }}>{r.spin_name||"—"}</div>
                          <div className="tbl-cell" style={{ fontSize:10 }}>{r.organization_name||"—"}</div>
                          <div className="tbl-cell" style={{ fontWeight:600, color:"#2563eb" }}>{r.unit_price?fmt(r.unit_price):"—"}</div>
                          <div className="tbl-cell">{r.quantity||"—"}</div>
                          <div className="tbl-cell" style={{ color:"#16a34a" }}>{r.total_cost?fmt(r.total_cost):"—"}</div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* PROVIDER SEARCH */}
              {view === "providersearch" && (
                <>
                  <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                    <input className="inp" value={providerQuery} onChange={e => setProviderQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && doProviderSearch()} placeholder="Enter service provider name (e.g. AT&T, Spectrum, Lumen)..." />
                    <button className="btn btn-primary" onClick={doProviderSearch}>Search →</button>
                  </div>
                  {providerLoading && <Spinner />}
                  {!providerLoading && !providerResults && <Empty title="Search for a provider" sub="See all FY2026 TX commitments for any service provider" />}
                  {!providerLoading && providerResults && providerResults.data.length === 0 && <Empty title="No results found" />}
                  {!providerLoading && providerResults && providerResults.data.length > 0 && (
                    <>
                      <div style={{ display:"flex", gap:20, marginBottom:16, padding:"12px 0", borderBottom:"1.5px solid #e2e8f0" }}>
                        {[["count","Commitments","#2563eb"],["total_committed","Total Committed","#16a34a"],["unique_orgs","Organizations","#94a3b8"]].map(([key,label,color]) => (
                          <div key={key}><div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:18, color, lineHeight:1 }}>{key==="total_committed"?fmt(providerResults[key]):providerResults[key]}</div><div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{label}</div></div>
                        ))}
                      </div>
                      <div className="tbl-hdr" style={{ gridTemplateColumns:"1.4fr 1.2fr 1fr 90px 120px 130px 80px" }}>
                        <SortHdr label="PROVIDER" field="spin_name" sortField={provSort.sortField} sortAsc={provSort.sortAsc} onSort={provSort.toggle} />
                        <SortHdr label="APPLICANT" field="organization" sortField={provSort.sortField} sortAsc={provSort.sortAsc} onSort={provSort.toggle} />
                        <SortHdr label="SERVICE TYPE" field="service_type" sortField={provSort.sortField} sortAsc={provSort.sortAsc} onSort={provSort.toggle} />
                        <div className="tbl-hdr-cell">FY</div>
                        <SortHdr label="COMMITTED" field="commitment" sortField={provSort.sortField} sortAsc={provSort.sortAsc} onSort={provSort.toggle} />
                        <SortHdr label="STATUS" field="frn_status" sortField={provSort.sortField} sortAsc={provSort.sortAsc} onSort={provSort.toggle} />
                        <SortHdr label="DISC %" field="discount_pct" sortField={provSort.sortField} sortAsc={provSort.sortAsc} onSort={provSort.toggle} />
                      </div>
                      {provSort.apply(providerResults.data).map((r, i) => {
                        const sc = (r.frn_status||"").toLowerCase().includes("fund") ? "badge-green" : (r.frn_status||"").toLowerCase().includes("deny") ? "badge-red" : "badge-gray";
                        return (
                          <div key={i} className="tbl-row" style={{ gridTemplateColumns:"1.4fr 1.2fr 1fr 90px 120px 130px 80px" }} onClick={() => r.application_number && window.open(`https://legacy.fundsforlearning.com/471/${r.application_number}`,"_blank")}>
                            <div className="tbl-cell" style={{ color:"#2563eb", fontWeight:500 }}>{r.spin_name}</div>
                            <div className="tbl-cell">{r.organization}</div>
                            <div className="tbl-cell" style={{ fontSize:10 }}>{r.service_type}</div>
                            <div className="tbl-cell" style={{ color:"#d97706" }}>FY{r.funding_year}</div>
                            <div className="tbl-cell" style={{ color:"#16a34a", fontWeight:600 }}>{r.commitment?fmt(r.commitment):"—"}</div>
                            <div><span className={`badge ${sc}`} style={{ fontSize:9 }}>{(r.frn_status||"—").split(" ").slice(0,2).join(" ")}</span></div>
                            <div className="tbl-cell">{r.discount_pct?`${r.discount_pct}%`:"—"}</div>
                          </div>
                        );
                      })}
                      <div style={{ padding:"10px 0", fontSize:10, color:"#94a3b8", borderTop:"1px solid #f1f5f9" }}>Click a row to view 471 on FundsForLearning</div>
                    </>
                  )}
                </>
              )}

              {/* SERVICE AREA */}
              {view === "areaservice" && (
                <>
                  <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                    <div style={{ display:"flex", gap:4 }}>
                      {[["c2","Category 2"],["internal","Internal Connections"],["all","All Services"]].map(([key,label]) => (
                        <button key={key} onClick={() => setAreaSvcType(key)} className={`btn btn-sm ${areaSvcType===key?"btn-active":""}`}>{label}</button>
                      ))}
                    </div>
                    <input className="inp" style={{ flex:1, minWidth:220 }} value={areaQuery} onChange={e => setAreaQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && doAreaSearch()} placeholder="Enter city, district name, or county (e.g. Houston, Garland ISD)..." />
                    <button className="btn btn-primary" onClick={doAreaSearch}>Search →</button>
                  </div>
                  {areaLoading && <Spinner />}
                  {!areaLoading && !areaResults && <Empty title="Find providers by service area" sub="Search by city, school district name, or county to see which providers have won commitments in that area" />}
                  {!areaLoading && areaResults && areaResults.count === 0 && <Empty title="No results found" sub="Try a broader search term" />}
                  {!areaLoading && areaResults && areaResults.count > 0 && (
                    <>
                      <div style={{ display:"flex", gap:12, marginBottom:14, alignItems:"center" }}>
                        <div style={{ display:"flex", gap:4 }}>
                          {[["providers","Providers"],["detail","All Records"]].map(([key,label]) => (
                            <button key={key} onClick={() => setAreaView(key)} className={`btn btn-sm ${areaView===key?"btn-active":""}`}>{label}</button>
                          ))}
                        </div>
                        <div style={{ marginLeft:"auto", display:"flex", gap:16 }}>
                          {[["providerSummary.length","Providers","#2563eb"],["total_committed","Committed","#16a34a"],["count","Records","#94a3b8"]].map(([key,label,color]) => {
                            const val = key==="providerSummary.length" ? areaResults.providerSummary.length : key==="total_committed" ? fmt(areaResults.total_committed) : areaResults.count;
                            return <div key={key}><div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:16, color, lineHeight:1 }}>{val}</div><div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{label}</div></div>;
                          })}
                        </div>
                      </div>
                      {areaView === "providers" && (
                        <>
                          <div className="tbl-hdr" style={{ gridTemplateColumns:"2fr 80px 140px 80px" }}>
                            {["PROVIDER","AWARDS","TOTAL COMMITTED","ORGS SERVED"].map(h => <div key={h} className="tbl-hdr-cell">{h}</div>)}
                          </div>
                          {areaResults.providerSummary.map((p, i) => {
                            const pct = Math.round((p.total/areaResults.total_committed)*100);
                            return (
                              <div key={i} className="tbl-row" style={{ gridTemplateColumns:"2fr 80px 140px 80px" }}>
                                <div>
                                  <div style={{ fontSize:11, fontWeight:500, color:"#2563eb", marginBottom:3 }}>{p.spin_name}</div>
                                  <div className="prov-bar"><div className="prov-bar-fill" style={{ width:`${pct}%` }}/></div>
                                </div>
                                <div className="tbl-cell">{p.count}</div>
                                <div><div style={{ fontSize:11, fontWeight:600, color:"#16a34a" }}>{fmt(p.total)}</div><div style={{ fontSize:9, color:"#94a3b8" }}>{pct}% share</div></div>
                                <div className="tbl-cell">{p.orgs}</div>
                              </div>
                            );
                          })}
                        </>
                      )}
                      {areaView === "detail" && (
                        <>
                          <div className="tbl-hdr" style={{ gridTemplateColumns:"1.2fr 1.2fr 1fr 70px 110px 80px" }}>
                            {["PROVIDER","APPLICANT","SERVICE TYPE","FY","COMMITTED","DISC %"].map(h => <div key={h} className="tbl-hdr-cell">{h}</div>)}
                          </div>
                          {areaResults.data.map((r, i) => (
                            <div key={i} className="tbl-row" style={{ gridTemplateColumns:"1.2fr 1.2fr 1fr 70px 110px 80px" }} onClick={() => r.application_number && window.open(`https://legacy.fundsforlearning.com/471/${r.application_number}`,"_blank")}>
                              <div className="tbl-cell" style={{ color:"#2563eb", fontWeight:500 }}>{r.spin_name}</div>
                              <div className="tbl-cell">{r.organization}</div>
                              <div className="tbl-cell" style={{ fontSize:10 }}>{r.service_type}</div>
                              <div className="tbl-cell" style={{ color:"#d97706" }}>FY{r.funding_year}</div>
                              <div className="tbl-cell" style={{ color:"#16a34a", fontWeight:600 }}>{r.commitment?fmt(r.commitment):"—"}</div>
                              <div className="tbl-cell">{r.discount_pct?`${r.discount_pct}%`:"—"}</div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProviderApplicants({ token, spinName, year }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");

  useEffect(() => {
    if (!token || !spinName) return;
    fetch(`${API_URL}/api/provider-applicants?spin_name=${encodeURIComponent(spinName)}&funding_year=${year || "2026"}`, {
      headers:{ Authorization:`Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.status !== "success") { setErr(d.message || "Error loading data"); return; }
        const raw = d.data || [];
        // Handle both new format (organization, commitment) and old format (name, total)
        const normalized = raw.map(r => ({
          organization:     r.organization     || r.name            || "—",
          service_type:     r.service_type     || r.service         || "—",
          commitment:       r.commitment       ?? r.total           ?? null,
          application_number: r.application_number,
          frn:              r.frn,
        }));
        const sorted = normalized.sort((a, b) => (b.commitment || 0) - (a.commitment || 0));
        setRows(sorted);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [token, spinName, year]);

  if (loading) return <Spinner />;
  if (err)     return <div style={{ fontSize:12, color:"#dc2626", padding:8 }}>⚠ {err}</div>;
  if (!rows.length) return <div style={{ fontSize:12, color:"#94a3b8", padding:8 }}>No records found.</div>;

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
          <tr style={{ borderBottom:"1.5px solid #e2e8f0", background:"#f0f4ff" }}>
            <th style={{ padding:"7px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#475569" }}>Applicant</th>
            <th style={{ padding:"7px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#475569" }}>Service Type</th>
            <th style={{ padding:"7px 12px", textAlign:"right", fontSize:11, fontWeight:700, color:"#475569" }}>Commitment</th>
            <th style={{ padding:"7px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#475569" }}>Form 471</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom:"1px solid #f1f5f9" }}
              onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <td style={{ padding:"7px 12px", fontWeight:500, color:"#1e293b" }}>{r.organization}</td>
              <td style={{ padding:"7px 12px", color:"#64748b" }}>{r.service_type}</td>
              <td style={{ padding:"7px 12px", textAlign:"right", fontWeight:600, color:"#16a34a" }}>
                {r.commitment != null ? fmt(r.commitment) : "—"}
              </td>
              <td style={{ padding:"7px 12px" }}>
                {r.application_number ? (
                  <a href={`https://legacy.fundsforlearning.com/471/${r.application_number}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize:11, color:"#2563eb", fontWeight:600, textDecoration:"none" }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration="underline"}
                    onMouseLeave={e => e.currentTarget.style.textDecoration="none"}>
                    View 471 ↗
                  </a>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize:10, color:"#94a3b8", padding:"6px 12px", borderTop:"1px solid #f1f5f9" }}>
        {rows.length} records
      </div>
    </div>
  );
}


// ── KaderaAI — Chat panel with direct DB access ───────────────────────────────
function KaderaAI({ token }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef(null);

  const SUGGESTIONS = [
    "Which open 470s close in the next 7 days?",
    "Who are the top 5 providers winning Cat 2 contracts in FY2026?",
    "Show me districts with C2 budget that haven't filed a 470 yet",
    "What's my current pipeline win rate?",
    "Which districts in Houston have open bids right now?",
    "How much total E-Rate funding did Cisco win in FY2026 TX?",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role:"user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res  = await fetch(`${API_URL}/api/claude-chat`, {
        method: "POST",
        headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const json = await res.json();
      if (json.status === "success") {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: json.response,
          tools: json.tools_used,
        }]);
      } else {
        setMessages(prev => [...prev, { role:"assistant", content:`Error: ${json.message}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role:"assistant", content:`Connection error: ${err.message}` }]);
    }
    setLoading(false);
  }

  function formatMessage(text) {
    // Convert markdown-style bold and bullets to styled spans
    return text.split("\n").map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("• ");
      return (
        <div key={i} style={{ marginBottom: isBullet ? 3 : line === "" ? 8 : 2, paddingLeft: isBullet ? 14 : 0, position:"relative" }}>
          {isBullet && <span style={{ position:"absolute", left:0, color:"#2563eb" }}>•</span>}
          <span dangerouslySetInnerHTML={{ __html: bold }} />
        </div>
      );
    });
  }

  return (
    <div style={{ maxWidth:860, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#6d28d9,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>✦</div>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:"#0f1e3d" }}>Kadera AI</div>
            <div style={{ fontSize:12, color:"#64748b" }}>Ask anything about your E-Rate data — bids, providers, pipeline, prospects</div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12, overflow:"hidden", minHeight:480, display:"flex", flexDirection:"column" }}>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:16, minHeight:400, maxHeight:560 }}>

          {messages.length === 0 && (
            <div style={{ textAlign:"center", paddingTop:32 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>✦</div>
              <div style={{ fontSize:15, fontWeight:600, color:"#1e293b", marginBottom:6 }}>What would you like to know?</div>
              <div style={{ fontSize:13, color:"#94a3b8", marginBottom:24 }}>I have direct access to your Form 470s, commitments, pipeline, and prospects.</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, maxWidth:640, margin:"0 auto", textAlign:"left" }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    style={{ padding:"10px 14px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"#f8fafc", color:"#334155", fontSize:12, cursor:"pointer", textAlign:"left", lineHeight:1.4, fontFamily:"inherit", transition:"all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="#2563eb"; e.currentTarget.style.background="#eff6ff"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.background="#f8fafc"; }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display:"flex", gap:12, flexDirection: m.role==="user" ? "row-reverse" : "row" }}>
              {/* Avatar */}
              <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
                background: m.role==="user" ? "#2563eb" : "linear-gradient(135deg,#6d28d9,#2563eb)", color:"#fff" }}>
                {m.role==="user" ? "B" : "✦"}
              </div>
              {/* Bubble */}
              <div style={{ maxWidth:"80%", background: m.role==="user" ? "#eff6ff" : "#f8fafc", border:`1.5px solid ${m.role==="user" ? "#93c5fd" : "#e2e8f0"}`, borderRadius: m.role==="user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px", padding:"12px 16px" }}>
                <div style={{ fontSize:13, color:"#1e293b", lineHeight:1.7 }}>
                  {m.role === "assistant" ? formatMessage(m.content) : m.content}
                </div>
                {m.tools?.length > 0 && (
                  <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid #e2e8f0", display:"flex", gap:6, flexWrap:"wrap" }}>
                    {m.tools.map((t, ti) => (
                      <span key={ti} style={{ fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:4, background:"#ede9fe", color:"#6d28d9" }}>
                        ⚡ {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display:"flex", gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#6d28d9,#2563eb)", color:"#fff", fontSize:14 }}>✦</div>
              <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:"4px 12px 12px 12px", padding:"12px 16px", display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ display:"flex", gap:4 }}>
                  {[0,1,2].map(d => (
                    <div key={d} style={{ width:6, height:6, borderRadius:"50%", background:"#6d28d9", animation:`bounce 1.2s ${d*0.2}s infinite` }}/>
                  ))}
                </div>
                <span style={{ fontSize:12, color:"#64748b" }}>Querying your database...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ borderTop:"1.5px solid #e2e8f0", padding:"14px 16px", background:"#f8fafc", display:"flex", gap:10 }}>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])}
              style={{ padding:"8px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"#fff", color:"#94a3b8", fontSize:11, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit" }}>
              Clear
            </button>
          )}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about bids, providers, your pipeline, prospects..."
            disabled={loading}
            style={{ flex:1, padding:"9px 14px", borderRadius:8, border:"1.5px solid #cbd5e1", background:"#fff", fontSize:13, color:"#1e293b", outline:"none", fontFamily:"inherit", transition:"border-color 0.15s" }}
            onFocus={e => e.target.style.borderColor="#6d28d9"}
            onBlur={e => e.target.style.borderColor="#cbd5e1"}
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background: loading || !input.trim() ? "#e2e8f0" : "linear-gradient(135deg,#6d28d9,#2563eb)", color: loading || !input.trim() ? "#94a3b8" : "#fff", fontSize:13, fontWeight:600, cursor: loading || !input.trim() ? "not-allowed" : "pointer", whiteSpace:"nowrap", fontFamily:"inherit", transition:"all 0.15s" }}>
            {loading ? "..." : "Send →"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}


// ── RenewalsPanel — subscription & renewal tracker ────────────────────────────
function computeRenewal(gl, tm) {
  if (!gl) return "";
  const d = new Date(gl + "T00:00:00Z");
  const day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + Number(tm));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

function SubscriptionForm({ token, customers, editing, onSaved, onClose, onCustomerAdded }) {
  const [customerId, setCustomerId]   = useState(editing?.customer_id || "");
  const [newCustomer, setNewCustomer] = useState("");
  const [showNewCust, setShowNewCust] = useState(false);
  const [productName, setProductName] = useState(editing?.product_name || "");
  const [category, setCategory]       = useState(editing?.category || "Managed Service");
  const [vendor, setVendor]           = useState(editing?.vendor || "");
  const [goLive, setGoLive]           = useState(editing?.go_live_date || "");
  const [term, setTerm]               = useState(editing?.term_months || 12);
  const [renewal, setRenewal]         = useState(editing?.renewal_date || "");
  const [renewalTouched, setRenewalTouched] = useState(!!editing);
  const [billing, setBilling]         = useState(editing?.billing_frequency || "monthly");
  const [qty, setQty]                 = useState(editing?.quantity ?? 1);
  const [unitCost, setUnitCost]       = useState(editing?.unit_cost ?? "");
  const [unitPrice, setUnitPrice]     = useState(editing?.unit_price ?? "");
  const [autoRenew, setAutoRenew]     = useState(editing?.auto_renew || false);
  const [notes, setNotes]             = useState(editing?.notes || "");
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState("");

  useEffect(() => {
    if (!renewalTouched && goLive) setRenewal(computeRenewal(goLive, term));
  }, [goLive, term, renewalTouched]);

  const periodRev  = (Number(qty) || 0) * (Number(unitPrice) || 0);
  const periodCost = (Number(qty) || 0) * (Number(unitCost) || 0);
  const gp     = periodRev - periodCost;
  const margin = periodRev > 0 ? Math.round((gp / periodRev) * 100) : 0;
  const perLabel = billing === "annual" ? "/yr" : billing === "one_time" ? " one-time" : "/mo";

  async function save() {
    setErr("");
    let cid = customerId;
    if (showNewCust) {
      if (!newCustomer.trim()) { setErr("Enter the new customer name"); return; }
      setSaving(true);
      try {
        const r = await fetch(`${API_URL}/api/customers`, {
          method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
          body: JSON.stringify({ name: newCustomer.trim() }),
        });
        const j = await r.json();
        if (j.status !== "success") { setErr(j.message || "Customer create failed"); setSaving(false); return; }
        cid = j.data.id;
        onCustomerAdded?.(j.data);
      } catch { setErr("Connection error"); setSaving(false); return; }
    }
    if (!cid)             { setErr("Select a customer"); return; }
    if (!productName.trim()) { setErr("Enter a product or service name"); return; }
    if (!goLive)          { setErr("Enter a go-live date"); return; }
    setSaving(true);
    const body = {
      customer_id: cid, product_name: productName, category, vendor,
      go_live_date: goLive, term_months: Number(term), renewal_date: renewal || undefined,
      billing_frequency: billing, quantity: Number(qty) || 1,
      unit_cost: Number(unitCost) || 0, unit_price: Number(unitPrice) || 0,
      auto_renew: autoRenew, notes,
    };
    try {
      const url    = editing ? `${API_URL}/api/subscriptions/${editing.id}` : `${API_URL}/api/subscriptions`;
      const method = editing ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (j.status === "success") { onSaved(); onClose(); }
      else setErr(j.message || "Save failed");
    } catch { setErr("Connection error"); }
    setSaving(false);
  }

  const lbl = { fontSize:10, fontWeight:600, color:"#64748b", marginBottom:4, letterSpacing:0.3 };

  return (
    <div className="modal-backdrop" style={{ zIndex:300 }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width:"min(560px,95vw)" }}>
        <div className="modal-hdr">
          <div className="modal-title">{editing ? "Edit subscription" : "Add subscription"}</div>
          <button className="modal-close" onClick={onClose}>✕ Close</button>
        </div>
        <div className="modal-body" style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={lbl}>CUSTOMER</div>
            {!showNewCust ? (
              <div style={{ display:"flex", gap:8 }}>
                <select className="inp" style={{ flex:1 }} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn btn-sm" onClick={() => setShowNewCust(true)}>+ New</button>
              </div>
            ) : (
              <div style={{ display:"flex", gap:8 }}>
                <input className="inp" style={{ flex:1 }} value={newCustomer} onChange={e => setNewCustomer(e.target.value)} placeholder="New customer name" />
                <button className="btn btn-sm" onClick={() => setShowNewCust(false)}>Cancel</button>
              </div>
            )}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10 }}>
            <div><div style={lbl}>PRODUCT / SERVICE</div><input className="inp" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Managed WiFi" /></div>
            <div><div style={lbl}>CATEGORY</div>
              <select className="inp" value={category} onChange={e => setCategory(e.target.value)}>
                <option>Managed Service</option><option>License</option><option>Support</option><option>Hosting</option><option>Hardware</option><option>Other</option>
              </select>
            </div>
            <div><div style={lbl}>VENDOR</div><input className="inp" value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Optional" /></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr 1fr", gap:10 }}>
            <div><div style={lbl}>GO-LIVE DATE</div><input className="inp" type="date" value={goLive} onChange={e => setGoLive(e.target.value)} /></div>
            <div><div style={lbl}>TERM (MONTHS)</div>
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                {[12,24,36,60].map(t => (
                  <button key={t} onClick={() => { setTerm(t); setRenewalTouched(false); }}
                    style={{ padding:"6px 10px", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                      border:`1.5px solid ${Number(term)===t ? "#2563eb" : "#cbd5e1"}`,
                      background: Number(term)===t ? "#eff6ff" : "#fff", color: Number(term)===t ? "#2563eb" : "#64748b" }}>
                    {t}
                  </button>
                ))}
                <input className="inp inp-sm" style={{ width:52 }} type="number" value={term} onChange={e => { setTerm(e.target.value); setRenewalTouched(false); }} />
              </div>
            </div>
            <div><div style={lbl}>RENEWAL DATE (auto)</div><input className="inp" type="date" value={renewal} onChange={e => { setRenewal(e.target.value); setRenewalTouched(true); }} /></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10 }}>
            <div><div style={lbl}>BILLING</div>
              <select className="inp" value={billing} onChange={e => setBilling(e.target.value)}>
                <option value="monthly">Monthly</option><option value="annual">Annual</option><option value="one_time">One-time</option>
              </select>
            </div>
            <div><div style={lbl}>QUANTITY</div><input className="inp" type="number" value={qty} onChange={e => setQty(e.target.value)} /></div>
            <div><div style={lbl}>UNIT COST ($)</div><input className="inp" type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="Our cost" /></div>
            <div><div style={lbl}>UNIT PRICE ($)</div><input className="inp" type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="Customer" /></div>
          </div>
          <div style={{ background: gp >= 0 ? "#f0fdf4" : "#fef2f2", border:`1.5px solid ${gp >= 0 ? "#86efac" : "#fecaca"}`, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color: gp >= 0 ? "#15803d" : "#b91c1c", fontWeight:600 }}>Gross profit preview</span>
            <span style={{ fontSize:15, fontWeight:700, color: gp >= 0 ? "#15803d" : "#b91c1c", fontFamily:"'Aldrich',sans-serif" }}>
              ${gp.toLocaleString(undefined,{maximumFractionDigits:0})}{perLabel} · {margin}% margin
            </span>
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <label style={{ display:"flex", gap:6, alignItems:"center", fontSize:12, color:"#334155", cursor:"pointer" }}>
              <input type="checkbox" checked={autoRenew} onChange={e => setAutoRenew(e.target.checked)} /> Auto-renews
            </label>
            <input className="inp inp-sm" style={{ flex:1 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" />
          </div>
          {err && <div style={{ fontSize:11, color:"#dc2626" }}>⚠ {err}</div>}
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Add subscription"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RenewalsPanel({ token }) {
  const [subs, setSubs]           = useState([]);
  const [summary, setSummary]     = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [filter, setFilter]       = useState("all");
  const [monthFilter, setMonthFilter] = useState(null);
  const [alertTest, setAlertTest] = useState({ running:false, msg:"" });

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const h = { Authorization:`Bearer ${token}` };
      const [sR, sumR, cR] = await Promise.all([
        fetch(`${API_URL}/api/subscriptions`, { headers:h }).then(r => r.json()),
        fetch(`${API_URL}/api/subscriptions/summary`, { headers:h }).then(r => r.json()),
        fetch(`${API_URL}/api/customers`, { headers:h }).then(r => r.json()),
      ]);
      if (sR.status === "success")   setSubs(sR.data);
      if (sumR.status === "success") setSummary(sumR.data);
      if (cR.status === "success")   setCustomers(cR.data);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function daysLeft(d) {
    if (!d) return null;
    return Math.ceil((new Date(d + "T00:00:00Z") - new Date(new Date().toISOString().slice(0,10) + "T00:00:00Z")) / 86400000);
  }
  function cdColor(days) {
    if (days === null) return "#94a3b8";
    if (days <= 30) return "#dc2626";
    if (days <= 60) return "#d97706";
    return "#16a34a";
  }
  function cdBg(days) {
    if (days === null) return "#f1f5f9";
    if (days <= 30) return "#fef2f2";
    if (days <= 60) return "#fffbeb";
    return "#f0fdf4";
  }

  async function renewSub(id) {
    await fetch(`${API_URL}/api/subscriptions/${id}/renew`, { method:"POST", headers:{ Authorization:`Bearer ${token}` } });
    load();
  }
  async function testAlerts() {
    setAlertTest({ running:true, msg:"" });
    try {
      const r = await fetch(`${API_URL}/api/renewal-alerts/run`, { method:"POST", headers:{ Authorization:`Bearer ${token}` } });
      const j = await r.json();
      if (j.status === "success") {
        setAlertTest({ running:false, msg:"✓ Alert check ran — see your inbox and Railway logs" });
      } else {
        setAlertTest({ running:false, msg:`⚠ ${j.message || "Run failed"}` });
      }
    } catch {
      setAlertTest({ running:false, msg:"⚠ Connection error" });
    }
    setTimeout(() => setAlertTest(a => ({ ...a, msg:"" })), 8000);
  }

  async function churnSub(id) {
    await fetch(`${API_URL}/api/subscriptions/${id}`, {
      method:"PATCH", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
      body: JSON.stringify({ status:"churned" }),
    });
    load();
  }

  function exportCSV() {
    const cols = ["customer_name","product_name","category","vendor","go_live_date","term_months","renewal_date","billing_frequency","quantity","unit_cost","unit_price","period_cost","period_revenue","monthly_gp","status"];
    const csv  = [cols.join(","), ...subs.map(r => cols.map(k => `"${(r[k] ?? "").toString().replace(/"/g,'""')}"`).join(","))].join("\n");
    const url  = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    const a    = document.createElement("a"); a.href=url; a.download=`kadera-subscriptions-${Date.now()}.csv`; a.click();
  }

  const active   = subs.filter(s => s.status === "active");
  const upcoming = [...active].sort((a,b) => new Date(a.renewal_date) - new Date(b.renewal_date)).slice(0, 5);
  const visible  = subs.filter(s => {
    if (monthFilter && (s.renewal_date || "").slice(0,7) !== monthFilter) return false;
    if (filter === "60d") return s.status === "active" && daysLeft(s.renewal_date) !== null && daysLeft(s.renewal_date) <= 60;
    if (filter === "30d") return s.status === "active" && daysLeft(s.renewal_date) !== null && daysLeft(s.renewal_date) <= 30;
    if (filter === "churned") return s.status === "churned";
    return true;
  });
  const maxMrr = Math.max(1, ...(summary?.months || []).map(m => m.renewal_mrr));

  if (loading) return <div style={{ padding:32 }}><Spinner /></div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:"#0f1e3d" }}>Renewals</div>
          <div style={{ fontSize:12, color:"#64748b" }}>Customer subscriptions, terms, and renewal alerts</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {alertTest.msg && <span style={{ fontSize:11, color: alertTest.msg.startsWith("✓") ? "#16a34a" : "#dc2626" }}>{alertTest.msg}</span>}
          <button className="btn" onClick={testAlerts} disabled={alertTest.running}>
            {alertTest.running ? "Running..." : "✉ Test alerts now"}
          </button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>+ Add subscription</button>
        </div>
      </div>

      {/* Financial cards */}
      {summary && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:10, marginBottom:16 }}>
          {[
            ["Monthly Revenue", `$${summary.monthly_revenue.toLocaleString()}`, "#2563eb", null],
            ["Monthly Cost",    `$${summary.monthly_cost.toLocaleString()}`, "#64748b", null],
            ["Gross Profit",    `$${summary.gross_profit.toLocaleString()}`, "#16a34a", `${summary.gross_margin_pct}%`],
            ["ARR",             `$${summary.arr.toLocaleString()}`, "#0f1e3d", null],
            ["At Risk (90d)",   `$${summary.revenue_at_risk_90d.toLocaleString()}`, "#d97706", null],
          ].map(([label, val, color, badge], i) => (
            <div key={i} className="card" style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:10, fontWeight:600, color:"#64748b", letterSpacing:0.4, marginBottom:4 }}>{String(label).toUpperCase()}</div>
              <div style={{ fontSize:20, fontWeight:700, color, fontFamily:"'Aldrich',sans-serif" }}>
                {val}
                {badge && <span style={{ fontSize:10, marginLeft:6, padding:"2px 7px", borderRadius:99, background:"#dcfce7", color:"#15803d", verticalAlign:3 }}>{badge}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 12-month chart */}
      {summary && (
        <div className="card" style={{ padding:"16px 20px", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#0f1e3d" }}>Renewal revenue by month {monthFilter && <button className="btn btn-sm" style={{ marginLeft:8 }} onClick={() => setMonthFilter(null)}>Clear filter ✕</button>}</div>
            <div style={{ display:"flex", gap:12, fontSize:10, color:"#64748b" }}>
              <span><span style={{ display:"inline-block", width:9, height:9, borderRadius:2, background:"#dc2626", marginRight:4 }}/>≤30d</span>
              <span><span style={{ display:"inline-block", width:9, height:9, borderRadius:2, background:"#d97706", marginRight:4 }}/>31–60d</span>
              <span><span style={{ display:"inline-block", width:9, height:9, borderRadius:2, background:"#2563eb", marginRight:4 }}/>Later</span>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(12, minmax(0,1fr))", gap:8, alignItems:"end", height:140 }}>
            {summary.months.map((m, i) => {
              const barColor = m.renewals_count === 0 ? "#e2e8f0" : m.min_days !== null && m.min_days <= 30 ? "#dc2626" : m.min_days !== null && m.min_days <= 60 ? "#d97706" : "#2563eb";
              const h = m.renewals_count === 0 ? 3 : Math.max(8, Math.round((m.renewal_mrr / maxMrr) * 100));
              return (
                <div key={i} onClick={() => m.renewals_count > 0 && setMonthFilter(monthFilter === m.month ? null : m.month)}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, height:"100%", justifyContent:"flex-end", cursor: m.renewals_count > 0 ? "pointer" : "default", opacity: monthFilter && monthFilter !== m.month ? 0.35 : 1 }}
                  title={`${m.renewals_count} renewals · $${m.renewal_mrr.toLocaleString()}/mo`}>
                  <span style={{ fontSize:9, fontWeight:600, color: m.renewals_count ? barColor : "#cbd5e1" }}>{m.renewals_count}</span>
                  <div style={{ width:"100%", height:`${h}%`, background:barColor, borderRadius:"4px 4px 0 0" }}/>
                </div>
              );
            })}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(12, minmax(0,1fr))", gap:8, marginTop:5 }}>
            {summary.months.map((m, i) => (
              <span key={i} style={{ fontSize:9, textAlign:"center", color: i === 0 ? "#0f1e3d" : "#94a3b8", fontWeight: i === 0 ? 700 : 400 }}>
                {new Date(m.month + "-01T00:00:00Z").toLocaleDateString("en-US",{ month:"short", timeZone:"UTC" })}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming renewals strip */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#0f1e3d", marginBottom:8 }}>Upcoming renewals</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap:10 }}>
            {upcoming.map((s, i) => {
              const d = daysLeft(s.renewal_date);
              return (
                <div key={i} className="card" style={{ padding:"10px 14px", borderLeft:`3px solid ${cdColor(d)}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.customer_name}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:cdBg(d), color:cdColor(d), flexShrink:0, marginLeft:6 }}>{d}d</span>
                  </div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{s.product_name} · renews {new Date(s.renewal_date + "T00:00:00Z").toLocaleDateString("en-US",{ month:"short", day:"numeric", timeZone:"UTC" })}</div>
                  <div style={{ fontSize:11, color:"#16a34a", fontWeight:600, marginTop:2 }}>${s.monthly_gp.toLocaleString()}/mo GP</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1.5px solid #e2e8f0" }}>
          <div style={{ display:"flex", gap:6 }}>
            {[["all",`All (${subs.length})`],["60d",`≤60d`],["30d",`≤30d`],["churned","Churned"]].map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ padding:"4px 12px", borderRadius:99, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                  border:`1.5px solid ${filter===k ? "#2563eb" : "#e2e8f0"}`,
                  background: filter===k ? "#eff6ff" : "#fff", color: filter===k ? "#2563eb" : "#64748b" }}>
                {label}
              </button>
            ))}
          </div>
          <button className="btn btn-sm" onClick={exportCSV} style={{ color:"#16a34a", borderColor:"#86efac" }}>↓ Export CSV</button>
        </div>
        {visible.length === 0 ? (
          <Empty title="No subscriptions yet" sub="Click + Add subscription to start tracking renewals" />
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0" }}>
                  {["Customer","Product","Go-Live","Term","Renewal","Billing","Qty","Unit Cost","Unit Price","GP/mo","Status",""].map(h => (
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:"#64748b", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((s, i) => {
                  const d = daysLeft(s.renewal_date);
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid #f1f5f9" }}
                      onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"8px 12px", fontWeight:600, color:"#1e293b", whiteSpace:"nowrap" }}>{s.customer_name || "—"}</td>
                      <td style={{ padding:"8px 12px", color:"#334155" }}>{s.product_name}</td>
                      <td style={{ padding:"8px 12px", color:"#64748b", whiteSpace:"nowrap" }}>{s.go_live_date}</td>
                      <td style={{ padding:"8px 12px", color:"#64748b" }}>{s.term_months} mo</td>
                      <td style={{ padding:"8px 12px", whiteSpace:"nowrap" }}>
                        <span style={{ fontWeight:600, color: s.status === "active" ? cdColor(d) : "#94a3b8" }}>{s.renewal_date}</span>
                        {s.status === "active" && d !== null && d >= 0 && d <= 60 && <span style={{ fontSize:9, marginLeft:5, fontWeight:700, color:cdColor(d) }}>({d}d)</span>}
                      </td>
                      <td style={{ padding:"8px 12px", color:"#64748b", textTransform:"capitalize" }}>{(s.billing_frequency || "").replace("_"," ")}</td>
                      <td style={{ padding:"8px 12px", color:"#334155" }}>{Number(s.quantity)}</td>
                      <td style={{ padding:"8px 12px", color:"#64748b" }}>${Number(s.unit_cost).toLocaleString()}</td>
                      <td style={{ padding:"8px 12px", color:"#334155", fontWeight:500 }}>${Number(s.unit_price).toLocaleString()}</td>
                      <td style={{ padding:"8px 12px", fontWeight:600, color: s.monthly_gp >= 0 ? "#16a34a" : "#dc2626" }}>${s.monthly_gp.toLocaleString()}</td>
                      <td style={{ padding:"8px 12px" }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99,
                          background: s.status==="active" ? "#dcfce7" : s.status==="churned" ? "#fee2e2" : "#f1f5f9",
                          color: s.status==="active" ? "#15803d" : s.status==="churned" ? "#b91c1c" : "#64748b" }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding:"8px 12px", whiteSpace:"nowrap" }}>
                        <button className="btn btn-sm" style={{ marginRight:4 }} onClick={() => { setEditing(s); setFormOpen(true); }}>Edit</button>
                        {s.status === "active" && <>
                          <button className="btn btn-sm" style={{ color:"#2563eb", marginRight:4 }} onClick={() => renewSub(s.id)} title="Advance renewal date by one term">↻ Renew</button>
                          <button className="btn btn-sm" style={{ color:"#dc2626" }} onClick={() => churnSub(s.id)}>Churn</button>
                        </>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <SubscriptionForm token={token} customers={customers} editing={editing}
          onSaved={load} onClose={() => setFormOpen(false)}
          onCustomerAdded={c => setCustomers(prev => [...prev, c])} />
      )}
    </div>
  );
}


// ── ToolsPanel — launchpad for management tool logins ─────────────────────────
const MGMT_TOOLS = [
  { name:"N-central",           url:"https://ncod126.n-able.com/login",   desc:"RMM & endpoint management", color:"#e8590c", initials:"N" },
  { name:"Cove Data Protection",url:"https://backup.management",           desc:"Cloud backup & recovery",   color:"#1971c2", initials:"C" },
  { name:"Domotz",              url:"https://portal.domotz.com",           desc:"Network monitoring",        color:"#0ca678", initials:"D" },
  { name:"Twingate",            url:"https://kadera.twingate.com",         desc:"Zero-trust remote access",  color:"#7048e8", initials:"T" },
  { name:"Hudu",                url:"https://kadera.huducloud.com",        desc:"IT documentation",          color:"#e03131", initials:"H" },
];

function ToolsPanel() {
  return (
    <div className="fade-in">
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:700, color:"#0f1e3d" }}>Management Tools</div>
        <div style={{ fontSize:12, color:"#64748b" }}>Quick access to our platform logins — opens each portal in a new tab</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:12 }}>
        {MGMT_TOOLS.map((t, i) => (
          <a key={i} href={t.url} target="_blank" rel="noreferrer"
            className="card"
            style={{ padding:"18px 18px", textDecoration:"none", display:"flex", alignItems:"center", gap:14, transition:"transform 0.12s, box-shadow 0.12s", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(15,30,61,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=""; }}>
            <div style={{ width:44, height:44, borderRadius:10, background:t.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"#fff", flexShrink:0, fontFamily:"'Aldrich',sans-serif" }}>
              {t.initials}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>{t.name} <span style={{ fontSize:11, color:"#2563eb", fontWeight:500 }}>↗</span></div>
              <div style={{ fontSize:11, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}


// ── RunbookPanel — technicians complete & log maintenance checklists ──────────
const RUNBOOK_CHECKLISTS = {
  daily: [
    "All servers & hosts checking in to N-central (no stale agents)",
    "Review and triage every alert raised overnight",
    "All Cove backups from last night succeeded",
    "No disk volume / datastore in a critical-space state",
    "Critical services up on role servers (AD/DNS/DHCP/SQL/etc.)",
    "No unresolved CRITICAL alerts left open without an owner",
  ],
  weekly: [
    "Disk-space trend reviewed; projected shortfalls flagged",
    "Antivirus/security agent healthy with current definitions everywhere",
    "Host datastore / CSV free space healthy on all VMware/Hyper-V hosts",
    "Event logs reviewed for recurring critical errors",
    "Resolved alerts cleared; open items aging tracked",
  ],
  monthly: [
    "Patch cycle completed; compliance recorded; failures remediated",
    "Test restore performed and verified from Cove",
    "All servers rebooted within policy where required; uptime reviewed",
    "Hardware health reviewed on hosts (RAID, PSU, temp)",
    "Monitoring thresholds still appropriate; noisy alerts tuned",
    "Account report produced for the account owner",
    "Hudu documentation updated for any change this month",
  ],
  quarterly: [
    "Firmware / driver levels reviewed on hosts and key servers",
    "N-central policies, automation, and alert rules reviewed end-to-end",
    "Backup retention & DR approach validated against current needs",
    "Capacity outlook reviewed (disk, host resources) for the next 1-2 quarters",
    "This runbook reviewed and versioned; Hudu records reconciled",
  ],
};
const CADENCE_META = {
  daily:     { label:"Daily",     color:"#2563eb", bg:"#eff6ff" },
  weekly:    { label:"Weekly",    color:"#0ca678", bg:"#f0fdf4" },
  monthly:   { label:"Monthly",   color:"#7c3aed", bg:"#f5f3ff" },
  quarterly: { label:"Quarterly", color:"#d97706", bg:"#fffbeb" },
};

function RunbookPanel({ token }) {
  const [cadence, setCadence]   = useState("daily");
  const [checks, setChecks]     = useState({});
  const [nas, setNas]           = useState({});
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");
  const [status, setStatus]     = useState({});
  const [history, setHistory]   = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [view, setView]         = useState("checklist"); // 'checklist' | 'history'
  const [tenants, setTenants]   = useState([]);
  const [tenantId, setTenantId] = useState("");
  const [addingTenant, setAddingTenant] = useState(false);
  const [newTenant, setNewTenant]       = useState("");
  const [histTenant, setHistTenant]     = useState("all");

  const items = RUNBOOK_CHECKLISTS[cadence];
  const tenantName = tenants.find(t => t.id === tenantId)?.name || "";

  const loadTenants = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/api/tenants`, { headers:{ Authorization:`Bearer ${token}` } });
      const j = await r.json();
      if (j.status === "success") setTenants(j.data);
    } catch {}
  }, [token]);

  const loadStatus = useCallback(async () => {
    if (!token || !tenantId) { setStatus({}); return; }
    try {
      const r = await fetch(`${API_URL}/api/runbook/status?tenant_id=${tenantId}`, { headers:{ Authorization:`Bearer ${token}` } });
      const j = await r.json();
      if (j.status === "success") setStatus(j.data);
    } catch {}
  }, [token, tenantId]);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      const tq = histTenant && histTenant !== "all" ? `&tenant_id=${histTenant}` : "";
      const r = await fetch(`${API_URL}/api/runbook/runs?limit=150${tq}`, { headers:{ Authorization:`Bearer ${token}` } });
      const j = await r.json();
      if (j.status === "success") setHistory(j.data);
    } catch {}
  }, [token, histTenant]);

  useEffect(() => { loadTenants(); }, [loadTenants]);
  useEffect(() => { loadStatus(); }, [loadStatus]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  function reset() { setChecks({}); setNas({}); setNotes(""); }
  function switchCadence(c) { setCadence(c); reset(); setMsg(""); }

  const checkedCount = items.filter((_, i) => checks[i] || nas[i]).length;
  const allDone = checkedCount === items.length;

  async function addTenant() {
    if (!newTenant.trim()) return;
    try {
      const r = await fetch(`${API_URL}/api/tenants`, {
        method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({ name: newTenant.trim() }),
      });
      const j = await r.json();
      if (j.status === "success") {
        setTenants(p => [...p, j.data].sort((a,b) => a.name.localeCompare(b.name)));
        setTenantId(j.data.id);
        setNewTenant(""); setAddingTenant(false);
      }
    } catch {}
  }

  async function submit() {
    if (!tenantId) { setMsg("⚠ Select a tenant first."); return; }
    setSaving(true); setMsg("");
    const payload = items.map((label, i) => ({ id: i, label, checked: !!checks[i], na: !!nas[i] }));
    if (checkedCount < items.length && !notes.trim()) {
      setMsg("⚠ Add a note explaining any unchecked items before submitting a partial run.");
      setSaving(false); return;
    }
    try {
      const r = await fetch(`${API_URL}/api/runbook/runs`, {
        method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({ cadence, items: payload, notes, tenant_id: tenantId }),
      });
      const j = await r.json();
      if (j.status === "success") {
        setMsg(`✓ ${CADENCE_META[cadence].label} check logged for ${tenantName} (${checkedCount}/${items.length})`);
        reset(); loadStatus(); loadHistory();
        setTimeout(() => setMsg(""), 6000);
      } else setMsg(`⚠ ${j.message || "Save failed"}`);
    } catch { setMsg("⚠ Connection error"); }
    setSaving(false);
  }

  function fmtWhen(ts) {
    if (!ts) return "Never";
    const d = new Date(ts);
    return d.toLocaleDateString("en-US",{ month:"short", day:"numeric" }) + " " + d.toLocaleTimeString("en-US",{ hour:"numeric", minute:"2-digit" });
  }
  function agoColor(ts, cad) {
    if (!ts) return "#dc2626";
    const hrs = (Date.now() - new Date(ts)) / 3600000;
    const limit = cad === "daily" ? 30 : cad === "weekly" ? 8*24 : cad === "monthly" ? 35*24 : 100*24;
    return hrs > limit ? "#d97706" : "#16a34a";
  }

  function exportCSV() {
    const rows = [["tenant","cadence","completed_at","user_email","checked","total","complete","notes"]];
    history.forEach(h => rows.push([h.tenant_name || "", h.cadence, h.completed_at, h.user_email || "", h.checked_count, h.total_count, h.complete, (h.notes||"").replace(/"/g,'""')]));
    const csv = rows.map(r => r.map(c => `"${(c ?? "").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    const a = document.createElement("a"); a.href=url; a.download=`kadera-runbook-log-${Date.now()}.csv`; a.click();
  }

  return (
    <div className="fade-in">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:"#0f1e3d" }}>Server Maintenance Runbook</div>
          <div style={{ fontSize:12, color:"#64748b" }}>Complete and log the maintenance checks for the managed servers</div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button className="btn" onClick={() => setView("checklist")} style={{ background: view==="checklist" ? "#eff6ff" : "#fff", color: view==="checklist" ? "#2563eb" : "#64748b", borderColor: view==="checklist" ? "#2563eb" : "#e2e8f0" }}>Checklist</button>
          <button className="btn" onClick={() => setView("history")} style={{ background: view==="history" ? "#eff6ff" : "#fff", color: view==="history" ? "#2563eb" : "#64748b", borderColor: view==="history" ? "#2563eb" : "#e2e8f0" }}>History</button>
        </div>
      </div>

      {/* Tenant picker */}
      <div className="card" style={{ padding:"12px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, fontWeight:700, color:"#0f1e3d", letterSpacing:0.3 }}>TENANT</span>
        {!addingTenant ? (
          <>
            <select className="inp" style={{ maxWidth:320 }} value={tenantId} onChange={e => { setTenantId(e.target.value); setMsg(""); }}>
              <option value="">Select managed client...</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button className="btn btn-sm" onClick={() => setAddingTenant(true)}>+ New tenant</button>
            {tenantId && <span style={{ fontSize:12, color:"#16a34a", fontWeight:600 }}>✓ {tenantName}</span>}
          </>
        ) : (
          <>
            <input className="inp" style={{ maxWidth:280 }} value={newTenant} onChange={e => setNewTenant(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTenant()} placeholder="New managed client name" autoFocus />
            <button className="btn btn-sm btn-primary" onClick={addTenant}>Add</button>
            <button className="btn btn-sm" onClick={() => { setAddingTenant(false); setNewTenant(""); }}>Cancel</button>
          </>
        )}
      </div>

      {/* Status strip — last completed per cadence (for selected tenant) */}
      {tenantId ? (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:10, marginBottom:16 }}>
        {Object.keys(CADENCE_META).map(c => {
          const s = status[c];
          return (
            <div key={c} className="card" style={{ padding:"12px 14px", cursor:"pointer", borderTop:`3px solid ${CADENCE_META[c].color}` }}
              onClick={() => { setView("checklist"); switchCadence(c); }}>
              <div style={{ fontSize:11, fontWeight:700, color:CADENCE_META[c].color, letterSpacing:0.4, textTransform:"uppercase" }}>{CADENCE_META[c].label}</div>
              <div style={{ fontSize:12, color:agoColor(s?.completed_at, c), fontWeight:600, marginTop:3 }}>
                {s ? `Last: ${fmtWhen(s.completed_at)}` : "Never completed"}
              </div>
              {s && <div style={{ fontSize:10, color:"#94a3b8", marginTop:1 }}>{s.user_email} · {s.checked_count}/{s.total_count}</div>}
            </div>
          );
        })}
      </div>
      ) : (
        <div className="card" style={{ padding:"24px", marginBottom:16, textAlign:"center", fontSize:13, color:"#94a3b8" }}>
          Select a tenant above to view their maintenance status and log checks
        </div>
      )}

      {view === "checklist" ? (
        !tenantId ? null : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {/* Cadence tabs */}
          <div style={{ display:"flex", gap:6, padding:"12px 16px", borderBottom:"1.5px solid #e2e8f0", background:"#f8fafc" }}>
            {Object.keys(CADENCE_META).map(c => (
              <button key={c} onClick={() => switchCadence(c)}
                style={{ padding:"5px 14px", borderRadius:99, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                  border:`1.5px solid ${cadence===c ? CADENCE_META[c].color : "#e2e8f0"}`,
                  background: cadence===c ? CADENCE_META[c].bg : "#fff",
                  color: cadence===c ? CADENCE_META[c].color : "#64748b" }}>
                {CADENCE_META[c].label}
              </button>
            ))}
          </div>

          {/* Checklist items */}
          <div style={{ padding:"8px 8px" }}>
            {items.map((label, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, background: checks[i] ? "#f0fdf4" : nas[i] ? "#f8fafc" : "transparent" }}
                onMouseEnter={e => { if (!checks[i] && !nas[i]) e.currentTarget.style.background="#f8fafc"; }}
                onMouseLeave={e => { if (!checks[i] && !nas[i]) e.currentTarget.style.background="transparent"; }}>
                <input type="checkbox" checked={!!checks[i]} disabled={!!nas[i]}
                  onChange={e => setChecks(p => ({ ...p, [i]: e.target.checked }))}
                  style={{ width:18, height:18, cursor:"pointer", accentColor:"#16a34a", flexShrink:0 }} />
                <span style={{ flex:1, fontSize:13, color: nas[i] ? "#94a3b8" : "#1e293b", textDecoration: nas[i] ? "line-through" : "none" }}>{label}</span>
                <button onClick={() => setNas(p => ({ ...p, [i]: !p[i] }))}
                  style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:99, cursor:"pointer", fontFamily:"inherit",
                    border:`1.5px solid ${nas[i] ? "#94a3b8" : "#e2e8f0"}`, background: nas[i] ? "#e2e8f0" : "#fff", color: nas[i] ? "#475569" : "#94a3b8" }}>
                  N/A
                </button>
              </div>
            ))}
          </div>

          {/* Notes + submit */}
          <div style={{ padding:"12px 16px", borderTop:"1.5px solid #e2e8f0", background:"#f8fafc" }}>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Notes (required if any item is left unchecked) — findings, follow-ups, anything worth logging"
              style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:"1.5px solid #cbd5e1", fontSize:12, fontFamily:"inherit", color:"#1e293b", resize:"vertical", boxSizing:"border-box" }} />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10 }}>
              <div style={{ fontSize:12, color: allDone ? "#16a34a" : "#64748b", fontWeight:600 }}>
                {checkedCount}/{items.length} complete{allDone ? " · all checks done" : ""}
                {msg && <span style={{ marginLeft:12, color: msg.startsWith("✓") ? "#16a34a" : "#dc2626", fontWeight:500 }}>{msg}</span>}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn" onClick={reset}>Reset</button>
                <button className="btn btn-primary" onClick={submit} disabled={saving || checkedCount === 0}>
                  {saving ? "Logging..." : "Submit & log check"}
                </button>
              </div>
            </div>
          </div>
        </div>
        )
      ) : (
        <div className="card">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1.5px solid #e2e8f0" }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#0f1e3d" }}>Completion log</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <select className="inp inp-sm" value={histTenant} onChange={e => setHistTenant(e.target.value)}>
                <option value="all">All tenants</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button className="btn btn-sm" onClick={exportCSV} style={{ color:"#16a34a", borderColor:"#86efac" }}>↓ Export CSV</button>
            </div>
          </div>
          {history.length === 0 ? (
            <Empty title="No runs logged yet" sub="Completed checklists will appear here" />
          ) : (
            <div>
              {history.map((h, i) => (
                <div key={i} style={{ borderBottom:"1px solid #f1f5f9" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", cursor:"pointer" }}
                    onClick={() => setExpanded(expanded === h.id ? null : h.id)}>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:99, background:CADENCE_META[h.cadence]?.bg, color:CADENCE_META[h.cadence]?.color, flexShrink:0 }}>{CADENCE_META[h.cadence]?.label || h.cadence}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#0f1e3d", minWidth:130 }}>{h.tenant_name || "—"}</span>
                    <span style={{ fontSize:12, color:"#334155", flex:1 }}>{h.user_email || "—"}</span>
                    <span style={{ fontSize:12, fontWeight:600, color: h.complete ? "#16a34a" : "#d97706" }}>{h.checked_count}/{h.total_count}{h.complete ? "" : " partial"}</span>
                    <span style={{ fontSize:12, color:"#64748b", flexShrink:0, minWidth:110, textAlign:"right" }}>{fmtWhen(h.completed_at)}</span>
                    <span style={{ fontSize:11, color:"#94a3b8" }}>{expanded === h.id ? "▲" : "▼"}</span>
                  </div>
                  {expanded === h.id && (
                    <div style={{ padding:"4px 16px 14px 16px", background:"#f8fafc" }}>
                      {(h.items || []).map((it, ii) => (
                        <div key={ii} style={{ fontSize:12, color: it.checked ? "#16a34a" : it.na ? "#94a3b8" : "#dc2626", padding:"2px 0" }}>
                          {it.checked ? "✓" : it.na ? "—" : "✗"} {it.label}{it.na ? " (N/A)" : ""}
                        </div>
                      ))}
                      {h.notes && <div style={{ marginTop:8, fontSize:12, color:"#475569", fontStyle:"italic", padding:"8px 12px", background:"#fff", borderRadius:6, border:"1px solid #e2e8f0" }}>Note: {h.notes}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ session }) {
  const [token, setToken]   = useState(null);
  const [stats, setStats]   = useState(null);
  const [tab, setTab]       = useState("dashboard");
  const [clock, setClock]   = useState("");
  const [tagCount, setTagCount] = useState(0);
  const [frnOpen, setFrnOpen]   = useState(false);
  const [form470App, setForm470App] = useState(null); // app number for 470 detail modal
  const [ciOpen, setCiOpen]     = useState(false);
  const [aiOpen, setAiOpen]     = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [c2Open, setC2Open]     = useState(false);
  const [entityOpen, setEntityOpen]     = useState(false);
  const [prospectsOpen, setProspectsOpen] = useState(false);

  const refreshTagCount = useCallback(async (t) => {
    if (!t) return;
    try {
      const res  = await fetch(`${API_URL}/api/tags`, { headers:{ Authorization:`Bearer ${t}` } });
      const json = await res.json();
      if (json.status === "success") setTagCount(json.data?.length || 0);
    } catch {}
  }, []);

  useEffect(() => {
    // Initial token load
    getAuthToken().then(t => { setToken(t); refreshTagCount(t); });

    // Refresh token every 10 minutes to prevent session expiry
    const tokenRefresh = setInterval(() => {
      getAuthToken().then(t => {
        if (t) setToken(t);
      }).catch(() => {});
    }, 10 * 60 * 1000);

    const t = setInterval(() => setClock(new Date().toLocaleTimeString("en-US",{hour12:false,timeZone:"America/Chicago"}) + " CDT"), 1000);
    return () => { clearInterval(t); clearInterval(tokenRefresh); };
  }, [refreshTagCount]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/stats`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status==="success") setStats(d.data); }).catch(()=>{});
  }, [token]);

  async function handleSync() {
    if (!token) return;
    await fetch(`${API_URL}/api/sync`, { method:"POST", headers:{ Authorization:`Bearer ${token}` } });
    alert("Sync started — data will update in the background.");
  }

  async function signOut() {
    try { await supaSignOut(); } catch {}
    window.location.reload();
  }

  const STAT_CARDS = [
    { label:"Current Funding Year", value: stats?.current_fy ? `FY${stats.current_fy}` : "FY2026", sub:"Window Open", color:"#7c3aed", bg:"#ede9fe", icon:"📅" },
    { label:"Synced Form 470s",     value: stats?.total_470s?.toLocaleString() || "—",              sub:"In database", color:"#2563eb", bg:"#dbeafe", icon:"📋" },
    { label:"Open 470s",            value: stats?.open_470s?.toLocaleString()  || "—",              sub:"Active bidding", color:"#d97706", bg:"#fef3c7", icon:"⏳" },
    { label:"Commitments",          value: stats?.total_commitments?.toLocaleString() || "—",       sub:"FY2026", color:"#16a34a", bg:"#dcfce7", icon:"✅" },
  ];

  const DEADLINES = [
    { name:"Form 470 Window", sub:"Open Now",              badge:"OPEN",     badgeClass:"badge-green", dot:"#22c55e" },
    { name:"Form 471 Window", sub:"Closes April 1, 2026",  badge:"UPCOMING", badgeClass:"badge-amber", dot:"#f59e0b" },
    { name:"SPIN Registration", sub:"Ongoing",             badge:"OPEN",     badgeClass:"badge-gray",  dot:"#cbd5e1" },
  ];

  const PORTAL_LINKS = [
    { icon:"🏛️", name:"EPC Portal",      sub:"E-Rate Productivity Center",  href:"https://portal.usac.org/suite/" },
    { icon:"📊", name:"USAC Open Data",   sub:"Datasets and API explorer",   href:"https://opendata.usac.org" },
    { icon:"📝", name:"Form 470 Guide",   sub:"Competitive bidding process", href:"https://www.usac.org/e-rate/applicant-process/before-you-begin/competitive-bidding/" },
    { icon:"📨", name:"Form 471 Guide",   sub:"Funding request submission",  href:"https://www.usac.org/e-rate/applicant-process/applying-for-discounts/form-471/" },
  ];

  return (
    <>
      <style>{css}</style>
      {frnOpen       && token && <FRNStatusModal       token={token} onClose={() => setFrnOpen(false)} />}
      {form470App    && token && <Form470Modal          token={token} appNum={form470App} onClose={() => setForm470App(null)} />}
      {ciOpen        && token && <CompetitiveIntelModal token={token} onClose={() => setCiOpen(false)} />}
      {contactOpen   && token && <ContactSearchModal token={token} onClose={() => setContactOpen(false)} onView470={setForm470App} />}
      {aiOpen        && token && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setAiOpen(false)}>
          <div className="modal-box" style={{ width:"min(880px,96vw)", maxHeight:"92vh", display:"flex", flexDirection:"column" }}>
            <div className="modal-hdr">
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#6d28d9,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>✦</div>
                <div>
                  <div className="modal-title">Kadera AI</div>
                  <div className="modal-sub">Ask anything about your E-Rate data</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setAiOpen(false)}>✕ Close</button>
            </div>
            <div className="modal-body" style={{ padding:"16px 20px", flex:1 }}>
              <KaderaAI token={token} />
            </div>
          </div>
        </div>
      )}
      {c2Open        && token && <C2BudgetModal         token={token} onClose={() => setC2Open(false)} />}
      {entityOpen    && token && <EntitySearchModal     token={token} onClose={() => setEntityOpen(false)} />}
      {prospectsOpen && token && <C2ProspectsModal      token={token} onClose={() => setProspectsOpen(false)} />}

      <div style={{ minHeight:"100vh", background:"#fff" }}>

        {/* ── Header ── */}
        <div style={{ background:"#0f1e3d", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"#2563eb", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Aldrich',sans-serif", fontSize:16, color:"#fff" }}>K</div>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:"#fff", letterSpacing:0.5 }}>KADERA</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:1.5 }}>E-RATE DASHBOARD</div>
            </div>
          </div>

          <div style={{ display:"flex", gap:2 }}>
            {[["dashboard","Dashboard"],["search","Search"],["tags",`★ My Tags${tagCount ? ` (${tagCount})` : ""}`],["renewals","Renewals"],["runbook","Runbook"],["tools","Tools"]].map(([key,label]) => (
              <button key={key} onClick={() => setTab(key)}
                style={{ padding:"6px 16px", borderRadius:6, border:"none", background: tab===key ? (key==="ai" ? "rgba(124,58,237,0.2)" : "rgba(37,99,235,0.3)") : "transparent", color: key==="tags" ? "#fbbf24" : key==="ai" ? (tab===key ? "#c4b5fd" : "rgba(196,181,253,0.7)") : tab===key ? "#93b4fd" : "rgba(255,255,255,0.5)", fontSize:12, fontWeight:500, cursor:"pointer" }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontVariantNumeric:"tabular-nums" }}>{clock}</span>
            <button onClick={handleSync} style={{ padding:"6px 14px", borderRadius:6, border:"1px solid rgba(59,130,246,0.5)", background:"rgba(59,130,246,0.1)", color:"#93b4fd", fontSize:11, fontWeight:500, cursor:"pointer" }}>↺ Sync</button>
            <button onClick={() => window.open("https://portal.usac.org/suite/","_blank")} style={{ padding:"6px 14px", borderRadius:6, border:"1px solid rgba(255,255,255,0.2)", background:"transparent", color:"#fff", fontSize:11, fontWeight:500, cursor:"pointer" }}>USAC Portal ↗</button>
            <button onClick={signOut} style={{ padding:"6px 14px", borderRadius:6, border:"1px solid rgba(239,68,68,0.3)", background:"transparent", color:"#fca5a5", fontSize:11, fontWeight:500, cursor:"pointer" }}>Sign Out</button>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"20px 24px 48px" }}>

          {/* DASHBOARD TAB */}
          {tab === "dashboard" && (
            <div className="fade-in">

              {/* Stat strip */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                {STAT_CARDS.map(({ label, value, sub, color, bg, icon }) => (
                  <div key={label} style={{ background:"#fff", borderRadius:12, padding:"16px 18px", border:"1.5px solid #cbd5e1", boxShadow:"0 1px 4px rgba(15,30,61,0.07)", display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize:11, color:"#64748b", fontWeight:500, marginBottom:4 }}>{label}</div>
                      <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:22, color, lineHeight:1 }}>{value}</div>
                      <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 290px", gap:16 }}>

                {/* Col 1: Tools + Deadlines */}
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div className="card">
                    <div className="card-hdr"><div className="card-title">Quick Access Tools</div></div>
                    <div style={{ padding:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <div style={{ gridColumn:"span 2", position:"relative", padding:1.5, borderRadius:10, overflow:"hidden", cursor:"pointer" }} onClick={() => setAiOpen(true)}>
                        <div className="kadera-ai-chase-border" />
                        <div style={{ position:"relative", zIndex:1, borderRadius:9, background:"#fff", border:"1.5px solid transparent", padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#6d28d9,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>✦</div>
                          <div>
                            <div style={{ fontSize:11, fontWeight:600, color:"#7c3aed", marginBottom:2 }}>Kadera AI</div>
                            <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.4 }}>Ask anything about bids, providers, pipeline, and prospects</div>
                          </div>
                        </div>
                      </div>
                      {[
                        { name:"C2 Budget",         desc:"Look up Category 2 budget by entity or BEN",          onClick:() => setC2Open(true) },
                        { name:"Entity Search",      desc:"Search schools, libraries, and districts",           onClick:() => setEntityOpen(true) },
                        { name:"Window Reporting",   desc:"Check filing windows and key dates",                 href:"https://www.usac.org/e-rate/applicant-process/the-e-rate-timeline/" },
                        { name:"FRN Status",         desc:"Search FRN status from local USAC data",             onClick:() => setFrnOpen(true) },
                      ].map(({ name, desc, onClick, href }) => (
                        <button key={name} className="tool-btn" onClick={onClick || (() => href && window.open(href,"_blank"))}>
                          <div style={{ fontSize:11, fontWeight:600, color:"#2563eb", marginBottom:3 }}>{name}</div>
                          <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.4 }}>{desc}</div>
                        </button>
                      ))}
                      <button className="tool-btn" style={{ gridColumn:"span 2" }} onClick={() => setCiOpen(true)}>
                        <div style={{ fontSize:11, fontWeight:600, color:"#2563eb", marginBottom:3 }}>Competitive Intelligence</div>
                        <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.4 }}>Top providers, manufacturer presence, and service type breakdown from FY2026 TX</div>
                      </button>
                      <button className="tool-btn green" style={{ gridColumn:"span 2" }} onClick={() => setProspectsOpen(true)}>
                        <div style={{ fontSize:11, fontWeight:600, color:"#16a34a", marginBottom:3 }}>🎯 C2 Prospect Finder</div>
                        <div style={{ fontSize:10, color:"#64748b", lineHeight:1.4 }}>TX schools with available C2 budget and no FY2026 Form 470 filed</div>
                      </button>
                      <button className="tool-btn" style={{ gridColumn:"span 2" }} onClick={() => setContactOpen(true)}>
                        <div style={{ fontSize:11, fontWeight:600, color:"#2563eb", marginBottom:3 }}>📋 Contact Search</div>
                        <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.4 }}>Find technical contacts on FY2026 470s by school type — Private, Charter, Christian, and more</div>
                      </button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-hdr"><div className="card-title">FY2026 Key Deadlines</div></div>
                    <div style={{ padding:"10px 14px" }}>
                      {DEADLINES.map(({ name, sub, badge, badgeClass, dot }) => (
                        <div key={name} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"#f8fafc", marginBottom:6 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:dot, flexShrink:0, boxShadow: dot==="#22c55e" ? "0 0 5px rgba(34,197,94,0.5)" : dot==="#f59e0b" ? "0 0 5px rgba(245,158,11,0.4)" : undefined }}/>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:11, fontWeight:500, color:"#334155" }}>{name}</div>
                            <div style={{ fontSize:9, color:"#94a3b8" }}>{sub}</div>
                          </div>
                          <span className={`badge ${badgeClass}`} style={{ fontSize:9 }}>{badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Col 2: 470 Feed */}
                {token && <Feed470 token={token} onTagsUpdated={() => refreshTagCount(token)} onView470={setForm470App} />}

                {/* Col 3: Sidebar */}
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ background:"#fff", borderRadius:10, border:"1.5px solid #e2e8f0", padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
                    <StatusDot />
                    <span style={{ fontSize:11, fontWeight:500, color:"#334155" }}>USAC Open Data API</span>
                    <span style={{ marginLeft:"auto", fontSize:10, fontWeight:600, color:"#16a34a" }}>Online</span>
                  </div>

                  {token && <BidResponseOverview token={token} />}

                  <div className="card">
                    <div className="card-hdr"><div className="card-title">USAC Portal Navigation</div></div>
                    <div style={{ padding:"10px 12px" }}>
                      {PORTAL_LINKS.map(({ icon, name, sub, href }) => (
                        <a key={name} href={href} target="_blank" rel="noreferrer"
                          style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"#f8fafc", marginBottom:6, textDecoration:"none", transition:"all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor="#93b4fd"; e.currentTarget.style.background="#eff6ff"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.background="#f8fafc"; }}>
                          <span style={{ fontSize:14 }}>{icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:11, fontWeight:500, color:"#334155" }}>{name}</div>
                            <div style={{ fontSize:9, color:"#94a3b8" }}>{sub}</div>
                          </div>
                          <span style={{ fontSize:12, color:"#cbd5e1" }}>→</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEARCH TAB */}
          {tab === "search" && token && (
            <div className="fade-in">
              <div className="card">
                <div className="card-hdr"><div className="card-title">Search USAC Data</div></div>
                <div style={{ background:"#fff" }}>
                  <SearchPanel token={token} onTagsUpdated={() => refreshTagCount(token)} onView470={setForm470App} />
                </div>
              </div>
            </div>
          )}

          {/* TAGS TAB */}
          {tab === "tags" && token && (
            <div className="fade-in">
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title">My Tagged 470s</div>
                  <div className="card-badge">{tagCount} tagged</div>
                </div>
                <TagsPanel token={token} onTagsUpdated={() => refreshTagCount(token)} onView470={setForm470App} />
              </div>
            </div>
          )}

          {tab === "renewals" && token && (
            <RenewalsPanel token={token} />
          )}

          {tab === "runbook" && token && (
            <RunbookPanel token={token} />
          )}

          {tab === "tools" && token && (
            <ToolsPanel />
          )}

        </div>
      </div>
    </>
  );
}
