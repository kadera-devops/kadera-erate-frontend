import React, { useState, useEffect, useCallback } from "react";
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
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
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
    fetch(`${API_URL}/api/competitive-intel`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "success") setData(d.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [token]);

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
    ["services","Service Types"],
    ["products","Top Products"],
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
            <div className="modal-sub">FY2026 TX Commitments · FY2025 Line Items · {data ? `${data.total?.toLocaleString()} commitments` : ""}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕ Close</button>
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
                            <ProviderApplicants token={token} spinName={p.name} />
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
              {view === "services" && (
                <>
                  {data.service_types?.map((s, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:500 }}>{s.name}</span>
                          <span style={{ fontSize:11, fontWeight:600, color:"#16a34a" }}>{s.count} FRNs</span>
                        </div>
                        <div style={{ height:6, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
                          <div style={{ width:`${Math.round((s.count/(data.service_types[0]?.count||1))*100)}%`, height:"100%", background:"linear-gradient(90deg,#6ee7b7,#16a34a)", borderRadius:99 }}/>
                        </div>
                        <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>{s.count} FRNs</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* TOP PRODUCTS */}
              {view === "products" && (
                <>
                  {data.top_products?.map((p, i) => (
                    <div key={i} style={{ padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                        <span style={{ fontSize:11, fontWeight:500 }} title={p.name}>{p.name?.length>60?p.name.slice(0,60)+"…":p.name}</span>
                        <span style={{ fontSize:11, fontWeight:600, color:"#2563eb", flexShrink:0, marginLeft:8 }}>{p.count} records</span>
                      </div>
                    </div>
                  ))}
                </>
              )}

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
                      <div className="tbl-hdr" style={{ gridTemplateColumns:"2fr 1.2fr 1fr 90px 90px 90px" }}>
                        <div className="tbl-hdr-cell">PRODUCT</div>
                        <div className="tbl-hdr-cell">MANUFACTURER</div>
                        <div className="tbl-hdr-cell">ORGANIZATION</div>
                        <SortHdr label="UNIT PRICE" field="unit_price" sortField={pSort.sortField} sortAsc={pSort.sortAsc} onSort={pSort.toggle} />
                        <div className="tbl-hdr-cell">QTY</div>
                        <div className="tbl-hdr-cell">TOTAL</div>
                      </div>
                      {pSort.apply(partResults).map((r, i) => (
                        <div key={i} className="tbl-row" style={{ gridTemplateColumns:"2fr 1.2fr 1fr 90px 90px 90px" }}>
                          <div className="tbl-cell" style={{ fontWeight:500 }} title={r.product_name}>{(r.model||r.product_name||"—").slice(0,40)}{(r.model||r.product_name||"").length>40?"…":""}</div>
                          <div className="tbl-cell" style={{ fontSize:10 }}>{r.manufacturer||"—"}</div>
                          <div className="tbl-cell" style={{ fontSize:10 }}>{r.organization||"—"}</div>
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

function ProviderApplicants({ token, spinName }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/provider-applicants?spin_name=${encodeURIComponent(spinName)}`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        console.log("provider-applicants raw response:", JSON.stringify(d).slice(0, 500));
        if (d.status === "success") {
          const sorted = (d.data || []).sort((a, b) => (b.commitment || 0) - (a.commitment || 0));
          console.log("first row:", sorted[0]);
          setRows(sorted);
        }
      })
      .catch(err => console.error("provider-applicants error:", err))
      .finally(() => setLoading(false));
  }, [token, spinName]);

  if (loading) return <Spinner />;
  if (!rows.length) return <Empty title="No applicants found" />;

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
          <tr style={{ borderBottom:"1.5px solid #e2e8f0", background:"#f8fafc" }}>
            <th style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b" }}>Applicant</th>
            <th style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b" }}>Service Type</th>
            <th style={{ padding:"8px 12px", textAlign:"right", fontSize:11, fontWeight:700, color:"#64748b" }}>Commitment</th>
            <th style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b" }}>Form 471</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom:"1px solid #f1f5f9" }}
              onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <td style={{ padding:"8px 12px", fontWeight:500, color:"#1e293b" }}>{r.organization || "—"}</td>
              <td style={{ padding:"8px 12px", color:"#64748b" }}>{r.service_type || "—"}</td>
              <td style={{ padding:"8px 12px", textAlign:"right", fontWeight:600, color:"#16a34a" }}>{r.commitment ? fmt(r.commitment) : "—"}</td>
              <td style={{ padding:"8px 12px" }}>
                <a href={`https://legacy.fundsforlearning.com/471/${r.application_number}`} target="_blank" rel="noreferrer"
                  style={{ fontSize:11, color:"#2563eb", textDecoration:"none", fontWeight:600 }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration="underline"}
                  onMouseLeave={e => e.currentTarget.style.textDecoration="none"}>
                  View 471 ↗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize:10, color:"#94a3b8", padding:"8px 12px", borderTop:"1px solid #f1f5f9" }}>
        {rows.length} records
      </div>
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
    getAuthToken().then(t => { setToken(t); refreshTagCount(t); });
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("en-US",{hour12:false,timeZone:"America/Chicago"}) + " CDT"), 1000);
    return () => clearInterval(t);
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
            {[["dashboard","Dashboard"],["search","Search"],["tags",`★ My Tags${tagCount ? ` (${tagCount})` : ""}`]].map(([key,label]) => (
              <button key={key} onClick={() => setTab(key)}
                style={{ padding:"6px 16px", borderRadius:6, border:"none", background: tab===key ? "rgba(37,99,235,0.3)" : "transparent", color: key==="tags" ? "#fbbf24" : tab===key ? "#93b4fd" : "rgba(255,255,255,0.5)", fontSize:12, fontWeight:500, cursor:"pointer" }}>
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
        </div>
      </div>
    </>
  );
}
