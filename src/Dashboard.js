import React, { useState, useEffect, useCallback } from "react";
import { getAuthToken, signOut } from "./supabaseClient";
import SearchPanel from "./SearchPanel";

const API_URL = process.env.REACT_APP_API_URL || "https://kadera-backend-production-6a21.up.railway.app";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Aldrich&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:#05050d; font-family:'DM Mono',monospace; color:#e8e4f0; overflow-x:hidden; }
  ::-webkit-scrollbar { width:2px; } ::-webkit-scrollbar-thumb { background:rgba(138,99,210,0.4); }
  @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes scan        { 0%{top:-2px} 100%{top:100%} }
  @keyframes pulse-dot   { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes pulse-slow  { 0%,100%{opacity:1} 50%{opacity:0.25} }
  @keyframes fade-up     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow-p      { 0%,100%{box-shadow:0 0 10px rgba(138,99,210,0.2)} 50%{box-shadow:0 0 22px rgba(138,99,210,0.5)} }
  @keyframes shimmer     { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .pulse-urgent          { animation: pulse-slow 2.4s ease-in-out infinite; }
`;

function Panel({ children, style }) {
  return (
    <div style={{ background:"rgba(10,8,20,0.95)", border:"1px solid rgba(138,99,210,0.3)", position:"relative", overflow:"hidden", clipPath:"polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)", ...style }}>
      <div style={{ position:"absolute", top:0, left:0, width:12, height:12, borderTop:"1.5px solid #a07ee0", borderLeft:"1.5px solid #a07ee0", zIndex:5, pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:13, right:-1, width:20, height:1.5, background:"rgba(138,99,210,0.35)", transform:"rotate(-45deg)", transformOrigin:"right center", zIndex:5, pointerEvents:"none" }}/>
      <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(138,99,210,0.18),transparent)", animation:"scan 4s linear infinite", pointerEvents:"none", zIndex:4 }}/>
      {children}
    </div>
  );
}

function PTitle({ children }) {
  return <div style={{ fontSize:7, letterSpacing:2.5, color:"rgba(232,228,240,0.45)", padding:"11px 14px 8px", borderBottom:"1px solid rgba(138,99,210,0.15)", position:"relative", zIndex:5 }}>{children}</div>;
}

function ToolBtn({ href, onClick, color, icon, name, desc, wide }) {
  const colors = {
    purple: { border:"rgba(138,99,210,0.35)", bg:"rgba(138,99,210,0.05)", hover:"rgba(138,99,210,0.12)", text:"#a07ee0", corner:"#a07ee0" },
    blue:   { border:"rgba(59,158,255,0.3)",  bg:"rgba(59,158,255,0.04)",  hover:"rgba(59,158,255,0.1)",  text:"#3b9eff", corner:"#3b9eff" },
    gold:   { border:"rgba(240,180,41,0.3)",  bg:"rgba(240,180,41,0.04)",  hover:"rgba(240,180,41,0.1)",  text:"#f0b429", corner:"#f0b429" },
  };
  const c = colors[color] || colors.purple;
  const [hov, setHov] = useState(false);
  const sharedStyle = { display:"flex", flexDirection: wide ? "row" : "column", alignItems: wide ? "center" : "flex-start", gap: wide ? 12 : 5, padding:"12px 12px", border:`1px solid ${c.border}`, background: hov ? c.hover : c.bg, cursor:"pointer", textDecoration:"none", position:"relative", transition:"all 0.2s", clipPath:"polygon(0 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%)", gridColumn: wide ? "span 2" : undefined };
  const inner = (
    <>
      <div style={{ position:"absolute", top:0, left:0, width:7, height:7, borderTop:`1px solid ${c.corner}`, borderLeft:`1px solid ${c.corner}` }}/>
      <div style={{ fontSize:wide ? 18 : 16 }}>{icon}</div>
      <div style={{ flex: wide ? 1 : undefined }}>
        <div style={{ fontSize:7.5, letterSpacing:1.5, color:c.text, marginBottom:3 }}>{name}</div>
        <div style={{ fontSize:6.5, color:"rgba(232,228,240,0.45)", lineHeight:1.5 }}>{desc}</div>
      </div>
      <div style={{ fontSize:7.5, color:c.text, opacity:0.5, marginTop: wide ? 0 : "auto", alignSelf: wide ? "center" : "flex-end" }}>→</div>
    </>
  );
  if (onClick) return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ ...sharedStyle, fontFamily:"inherit" }}>{inner}</div>
  );
  return (
    <a href={href} target="_blank" rel="noreferrer" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={sharedStyle}>{inner}</a>
  );
}

function StatCard({ label, value, sub, color }) {
  const colors = { purple:"#a07ee0", gold:"#f0b429", blue:"#3b9eff", green:"#39ff14" };
  const borders = { purple:"rgba(138,99,210,0.4)", gold:"rgba(240,180,41,0.5)", blue:"rgba(59,158,255,0.4)", green:"rgba(57,255,20,0.4)" };
  const c = colors[color] || colors.purple;
  const b = borders[color] || borders.purple;
  return (
    <div style={{ background:"rgba(10,8,20,0.95)", border:"1px solid rgba(138,99,210,0.15)", padding:"12px 14px", position:"relative", overflow:"hidden", clipPath:"polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)" }}>
      <div style={{ position:"absolute", top:0, left:0, width:10, height:10, borderTop:`1.5px solid ${b}`, borderLeft:`1.5px solid ${b}` }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,${c},transparent)` }}/>
      <div style={{ fontSize:6.5, letterSpacing:2, color:"rgba(232,228,240,0.45)", marginBottom:5 }}>{label}</div>
      <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:20, color:c }}>{value}</div>
      <div style={{ fontSize:7, color:"rgba(232,228,240,0.35)", marginTop:3 }}>{sub}</div>
    </div>
  );
}

function Feed470({ token, onTagsUpdated }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, setState]     = useState("TX");
  const [filter, setFilter]   = useState("all");
  const [page, setPage]       = useState(0);
  const [tags, setTags]       = useState(new Set());
  const PAGE_SIZE = 10;

  const loadTags = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/tags`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") setTags(new Set((json.data||[]).map(t => t.application_number)));
    } catch {}
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit:200, ...(state !== "ALL" && { state }) });
      const res  = await fetch(`${API_URL}/api/470s?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setData(json.data || []);
      setPage(0);
    } catch { setData([]); }
    setLoading(false);
  }, [token, state]);

  useEffect(() => { load(); loadTags(); }, [load, loadTags]);

  async function toggleTag(e, item) {
    e.preventDefault();
    e.stopPropagation();
    const appNum = item.application_number;
    const isTagged = tags.has(appNum);
    try {
      if (isTagged) {
        await fetch(`${API_URL}/api/tags/${appNum}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
        setTags(prev => { const n = new Set(prev); n.delete(appNum); return n; });
      } else {
        await fetch(`${API_URL}/api/tags`, { method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
          body: JSON.stringify({ application_number: appNum, billed_entity_name: item.billed_entity_name, state: item.state, service_category: item.service_category, bid_due_date: item.bid_due_date, funding_year: item.funding_year }) });
        setTags(prev => new Set([...prev, appNum]));
      }
      if (onTagsUpdated) onTagsUpdated();
    } catch {}
  }

  function getStatus(item) {
    if (item.bid_due_date) {
      const bidDate = new Date(item.bid_due_date);
      const now     = new Date();
      return bidDate >= now ? "open" : "closed";
    }
    const s = (item.application_status || "").toLowerCase();
    if (s.includes("certif") && !s.includes("pending")) return "open";
    if (s.includes("pending") || s.includes("review") || s.includes("progress")) return "review";
    if (s.includes("cancel") || s.includes("withdraw")) return "closed";
    return "open";
  }

  function isNew(item) {
    if (!item.date_posted && !item.synced_at) return false;
    const posted = new Date(item.date_posted || item.synced_at);
    const today  = new Date();
    return posted.getFullYear() === today.getFullYear() &&
           posted.getMonth()    === today.getMonth()    &&
           posted.getDate()     === today.getDate();
  }

  function daysLeft(item) {
    if (!item.bid_due_date) return null;
    return Math.ceil((new Date(item.bid_due_date) - new Date()) / (1000*60*60*24));
  }

  // Always show open only — closed filtered out at source
  const openData = data.filter(d => getStatus(d) === "open");
  const filtered = filter === "all" ? openData : openData.filter(d => {
    const days = daysLeft(d);
    if (filter === "urgent") return days !== null && days <= 7;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const STATES = ["ALL","TX","CA","NY","FL","IL","PA","OH","GA","NC","MI"];

  function get470Link(appNum) {
    return `https://legacy.fundsforlearning.com/470/${appNum}`;
  }

  return (
    <Panel style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <PTitle>{'// USAC OPEN API — '}<span style={{ color:"#a07ee0" }}>FORM 470 LIVE FEED</span></PTitle>
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 14px", borderBottom:"1px solid rgba(138,99,210,0.12)" }}>
        <div style={{ width:5, height:5, borderRadius:"50%", background:"#39ff14", animation:"pulse-dot 1s infinite", boxShadow:"0 0 5px #39ff14" }}/>
        <span style={{ fontSize:6.5, letterSpacing:2, color:"rgba(57,255,20,0.55)" }}>LIVE · USAC OPEN DATA API</span>
      </div>
      <div style={{ display:"flex", gap:5, padding:"7px 14px", borderBottom:"1px solid rgba(138,99,210,0.12)", flexWrap:"wrap" }}>
        <span style={{ fontSize:6.5, color:"rgba(232,228,240,0.35)", alignSelf:"center", marginRight:4 }}>STATE:</span>
        {STATES.map(s => (
          <button key={s} onClick={() => setState(s)} style={{ padding:"3px 8px", fontFamily:"'DM Mono',monospace", fontSize:6.5, letterSpacing:1, border:`1px solid ${state===s ? "rgba(240,180,41,0.6)" : "rgba(138,99,210,0.2)"}`, background: state===s ? "rgba(240,180,41,0.08)" : "transparent", color: state===s ? "#f0b429" : "rgba(232,228,240,0.4)", cursor:"pointer" }}>{s}</button>
        ))}
      </div>
      <div style={{ display:"flex", gap:5, padding:"7px 14px", borderBottom:"1px solid rgba(138,99,210,0.12)" }}>
        {["all","urgent"].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(0); }} style={{ padding:"3px 9px", fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:1.5, border:`1px solid ${filter===f ? (f==="urgent" ? "rgba(240,97,74,0.6)" : "rgba(138,99,210,0.6)") : "rgba(138,99,210,0.2)"}`, background: filter===f ? (f==="urgent" ? "rgba(240,97,74,0.1)" : "rgba(138,99,210,0.1)") : "transparent", color: filter===f ? (f==="urgent" ? "#f0614a" : "#a07ee0") : "rgba(232,228,240,0.4)", cursor:"pointer" }}>{f === "urgent" ? "⚠ URGENT ≤7d" : "ALL OPEN"}</button>
        ))}
        <span style={{ marginLeft:"auto", fontSize:7, color:"rgba(232,228,240,0.35)", alignSelf:"center" }}>{openData.length} OPEN 470s</span>
      </div>
      <div style={{ flex:1, overflow:"hidden" }}>
        {loading ? (
          [1,2,3,4,5].map(i => (
            <div key={i} style={{ padding:"10px 14px", borderBottom:"1px solid rgba(138,99,210,0.1)", display:"flex", flexDirection:"column", gap:5 }}>
              <div style={{ height:10, width:`${55+i*5}%`, borderRadius:1, background:"linear-gradient(90deg,rgba(138,99,210,0.07) 25%,rgba(138,99,210,0.14) 50%,rgba(138,99,210,0.07) 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }}/>
              <div style={{ height:8, width:"40%", borderRadius:1, background:"linear-gradient(90deg,rgba(138,99,210,0.07) 25%,rgba(138,99,210,0.14) 50%,rgba(138,99,210,0.07) 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }}/>
            </div>
          ))
        ) : paged.length === 0 ? (
          <div style={{ padding:"24px 14px", textAlign:"center", fontSize:9, color:"rgba(138,99,210,0.4)" }}>NO 470s FOUND</div>
        ) : paged.map((item, i) => {
          const isTagged = tags.has(item.application_number);
          const newToday = isNew(item);
          const days     = daysLeft(item);
          const cdColor  = days === null ? "rgba(232,228,240,0.3)" : days > 14 ? "#39ff14" : days > 7 ? "#f0b429" : "#f0614a";
          const cdBg     = days === null ? "rgba(138,99,210,0.04)" : days > 14 ? "rgba(57,255,20,0.07)" : days > 7 ? "rgba(240,180,41,0.08)" : "rgba(240,97,74,0.1)";
          const cdBorder = days === null ? "rgba(138,99,210,0.15)" : days > 14 ? "rgba(57,255,20,0.35)" : days > 7 ? "rgba(240,180,41,0.5)" : "rgba(240,97,74,0.65)";
          const urgent   = days !== null && days <= 7;
          return (
            <a key={i} href={get470Link(item.application_number)} target="_blank" rel="noreferrer"
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderBottom:"1px solid rgba(138,99,210,0.1)", textDecoration:"none", transition:"background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(138,99,210,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              {/* Info section */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:9, color:"#3b9eff", fontWeight:500 }}>Form 470 · {item.application_number}</span>
                  {newToday && <span style={{ fontSize:5.5, letterSpacing:2, padding:"2px 6px", background:"rgba(138,99,210,0.15)", border:"1px solid rgba(138,99,210,0.5)", color:"#a07ee0", flexShrink:0 }}>NEW</span>}
                  <span style={{ fontSize:6, letterSpacing:1.5, padding:"2px 7px", background:"rgba(57,255,20,0.08)", border:"1px solid rgba(57,255,20,0.35)", color:"#39ff14", flexShrink:0 }}>OPEN</span>
                  <button onClick={e => toggleTag(e, item)} style={{ fontSize:6.5, letterSpacing:1.5, padding:"2px 8px", border:`1px solid ${isTagged ? "rgba(240,180,41,0.7)" : "rgba(138,99,210,0.3)"}`, background: isTagged ? "rgba(240,180,41,0.12)" : "rgba(138,99,210,0.06)", color: isTagged ? "#f0b429" : "rgba(232,228,240,0.4)", cursor:"pointer", fontFamily:"'DM Mono',monospace", transition:"all 0.15s", flexShrink:0 }}>
                    {isTagged ? "★ TAGGED" : "☆ TAG"}
                  </button>
                </div>
                <div style={{ fontSize:8, color:"rgba(232,228,240,0.8)", marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.billed_entity_name}{item.state ? ` · ${item.state}` : ""}</div>
                <div style={{ display:"flex", gap:10 }}>
                  <span style={{ fontSize:6.5, color:"#a07ee0" }}>FY{item.funding_year}</span>
                  {item.service_category && <span style={{ fontSize:6.5, color:"rgba(232,228,240,0.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.service_category}</span>}
                  {item.date_posted && <span style={{ fontSize:6.5, color:"rgba(232,228,240,0.35)", flexShrink:0 }}>Posted: {new Date(item.date_posted).toLocaleDateString()}</span>}
                </div>
              </div>
              {/* Large countdown block */}
              <div className={urgent ? "pulse-urgent" : ""} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minWidth:68, padding:"7px 10px", background:cdBg, border:`1px solid ${cdBorder}`, clipPath:"polygon(0 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%)", flexShrink:0, position:"relative" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${cdColor},transparent)`, opacity:0.6 }}/>
                <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:22, lineHeight:1, color:cdColor, marginBottom:2 }}>
                  {days === null ? "—" : days === 0 ? "0" : days}
                </div>
                <div style={{ fontSize:6, letterSpacing:2, color:cdColor, opacity:0.7 }}>DAYS LEFT</div>
                {item.bid_due_date && <div style={{ fontSize:6, color:cdColor, opacity:0.5, marginTop:2 }}>{new Date(item.bid_due_date).toLocaleDateString()}</div>}
              </div>
            </a>
          );
        })}
      </div>
      <div style={{ padding:"9px 14px", borderTop:"1px solid rgba(138,99,210,0.12)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:7, color:"rgba(232,228,240,0.4)" }}>{filtered.length} TOTAL · PAGE {page+1}/{totalPages||1}</span>
        <div style={{ display:"flex", gap:5 }}>
          <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0} style={{ padding:"3px 10px", fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:1, border:"1px solid rgba(138,99,210,0.25)", background:"transparent", color: page===0 ? "rgba(232,228,240,0.2)" : "rgba(232,228,240,0.5)", cursor: page===0 ? "not-allowed" : "pointer" }}>← PREV</button>
          <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{ padding:"3px 10px", fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:1, border:"1px solid rgba(138,99,210,0.25)", background:"transparent", color: page>=totalPages-1 ? "rgba(232,228,240,0.2)" : "rgba(232,228,240,0.5)", cursor: page>=totalPages-1 ? "not-allowed" : "pointer" }}>NEXT →</button>
        </div>
      </div>
    </Panel>
  );
}
// ── Tags Panel ────────────────────────────────────────────────────────────────
const STAGES = ["Bid Submitted","Under Review","Final Review","Wave Ready","Funded","Denied","On Appeal"];
const STAGE_COLORS = {
  "Bid Submitted": { color:"#3b9eff", bg:"rgba(59,158,255,0.1)",  border:"rgba(59,158,255,0.4)"  },
  "Under Review":  { color:"#a07ee0", bg:"rgba(138,99,210,0.1)", border:"rgba(138,99,210,0.4)"  },
  "Final Review":  { color:"#f0b429", bg:"rgba(240,180,41,0.1)",  border:"rgba(240,180,41,0.4)"  },
  "Wave Ready":    { color:"#00d4ff", bg:"rgba(0,212,255,0.1)",   border:"rgba(0,212,255,0.4)"   },
  "Funded":        { color:"#22c97a", bg:"rgba(34,201,122,0.1)",  border:"rgba(34,201,122,0.4)"  },
  "Denied":        { color:"#f0614a", bg:"rgba(240,97,74,0.1)",   border:"rgba(240,97,74,0.4)"   },
  "On Appeal":     { color:"#ff9f43", bg:"rgba(255,159,67,0.1)",  border:"rgba(255,159,67,0.4)"  },
};

function TagsPanel({ token, onTagsUpdated }) {
  const [tags, setTags]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [popup, setPopup]       = useState(null);
  const [stages, setStages]     = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/tags`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      const data = json.data || [];
      if (json.status === "success") {
        setTags(data);
        if (data.length > 0) {
          const nums  = data.map(t => t.application_number).join(",");
          const sRes  = await fetch(`${API_URL}/api/bid-stages?app_numbers=${nums}`, { headers:{ Authorization:`Bearer ${token}` } });
          const sJson = await sRes.json();
          if (sJson.status === "success") setStages(sJson.data || {});
        }
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function removeTag(appNum) {
    await fetch(`${API_URL}/api/tags/${appNum}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
    setTags(prev => prev.filter(t => t.application_number !== appNum));
    if (onTagsUpdated) onTagsUpdated();
  }

  async function patchTag(appNum, fields) {
    try {
      await fetch(`${API_URL}/api/tags/${appNum}`, {
        method: "PATCH",
        headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify(fields)
      });
      setTags(prev => prev.map(t => t.application_number === appNum ? { ...t, ...fields } : t));
    } catch {}
  }

  function toggleResponded(tag) {
    const newVal = !tag.responded;
    // If turning off, also clear bid_status and financials
    const fields = newVal
      ? { responded: true }
      : { responded: false, bid_status: null, bid_amount: null, cogs: null };
    patchTag(tag.application_number, fields);
  }

  function toggleStatus(tag, status) {
    const newStatus = tag.bid_status === status ? null : status;
    patchTag(tag.application_number, { bid_status: newStatus });
  }

  function openPopup(tag) {
    setPopup({ appNum: tag.application_number, entityName: tag.billed_entity_name, bidAmount: tag.bid_amount || "", cogs: tag.cogs || "" });
  }

  async function savePopup() {
    const bid  = parseFloat(popup.bidAmount) || 0;
    const cogs = parseFloat(popup.cogs) || 0;
    await patchTag(popup.appNum, { bid_amount: bid, cogs });
    setPopup(null);
  }

  const popupBid    = parseFloat(popup?.bidAmount) || 0;
  const popupCogs   = parseFloat(popup?.cogs) || 0;
  const popupMargin = popupBid > 0 ? (((popupBid - popupCogs) / popupBid) * 100).toFixed(1) : "—";

  const btnBase = { fontSize:7, letterSpacing:1, padding:"3px 7px", fontFamily:"'DM Mono',monospace", cursor:"pointer", border:"1px solid", transition:"all 0.15s" };

  return (
    <div style={{ animation:"fade-up 0.4s ease both", position:"relative" }}>

      {/* $ Popup */}
      {popup && (
        <div style={{ position:"fixed", inset:0, background:"rgba(5,5,13,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:"#0b0a1a", border:"1px solid rgba(240,180,41,0.35)", clipPath:"polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))", padding:"20px 22px 22px", width:300, position:"relative" }}>
            <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg,transparent,rgba(240,180,41,0.5),transparent)" }}/>
            <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:9, letterSpacing:2, color:"#f0b429", marginBottom:6, textTransform:"uppercase" }}>Bid Financials</div>
            <div style={{ fontSize:7, letterSpacing:1.5, color:"rgba(232,228,240,0.35)", marginBottom:16, textTransform:"uppercase" }}>{popup.appNum} — {popup.entityName}</div>

            {[{ label:"Total Bid Amount", key:"bidAmount" }, { label:"Cost of Goods", key:"cogs" }].map(({ label, key }) => (
              <div key={key} style={{ marginBottom:12 }}>
                <div style={{ fontSize:7, letterSpacing:1.8, color:"rgba(232,228,240,0.4)", textTransform:"uppercase", marginBottom:5 }}>{label}</div>
                <div style={{ display:"flex", border:"1px solid rgba(138,99,210,0.25)", background:"rgba(255,255,255,0.02)" }}>
                  <div style={{ padding:"6px 9px", fontSize:9, color:"#a07ee0", borderRight:"1px solid rgba(138,99,210,0.2)" }}>$</div>
                  <input type="number" value={popup[key]} onChange={e => setPopup(p => ({ ...p, [key]: e.target.value }))}
                    style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'DM Mono',monospace", fontSize:9, color:"#e8e4f0", padding:"6px 9px" }}/>
                </div>
              </div>
            ))}

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"rgba(138,99,210,0.06)", border:"1px solid rgba(138,99,210,0.2)", marginBottom:14 }}>
              <span style={{ fontSize:7, letterSpacing:1.8, color:"rgba(138,99,210,0.6)", textTransform:"uppercase" }}>Calculated Margin</span>
              <span style={{ fontFamily:"'Aldrich',sans-serif", fontSize:16, color:"#8a63d2" }}>{popupMargin}{popupBid > 0 ? "%" : ""}</span>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={savePopup} style={{ flex:1, padding:"7px", fontFamily:"'DM Mono',monospace", fontSize:7.5, letterSpacing:1.5, border:"1px solid rgba(34,201,122,0.4)", background:"rgba(34,201,122,0.08)", color:"#22c97a", cursor:"pointer" }}>SAVE</button>
              <button onClick={() => setPopup(null)} style={{ padding:"7px 14px", fontFamily:"'DM Mono',monospace", fontSize:7.5, letterSpacing:1.5, border:"1px solid rgba(138,99,210,0.2)", background:"transparent", color:"rgba(232,228,240,0.35)", cursor:"pointer" }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:14, color:"#f0b429", letterSpacing:1 }}>★ MY TAGGED 470s</div>
        <span style={{ fontSize:7.5, color:"rgba(232,228,240,0.4)", letterSpacing:2 }}>{tags.length} TAGGED</span>
      </div>

      {/* Stage pipeline strip */}
      {!loading && tags.length > 0 && (
        <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
          {STAGES.map(stage => {
            const count = tags.filter(t => stages[t.application_number] === stage).length;
            const sc    = STAGE_COLORS[stage];
            return (
              <div key={stage} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", border:`1px solid ${count > 0 ? sc.border : "rgba(255,255,255,0.07)"}`, background: count > 0 ? sc.bg : "rgba(255,255,255,0.02)", borderRadius:2, opacity: count > 0 ? 1 : 0.45, transition:"all 0.2s" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background: count > 0 ? sc.color : "rgba(255,255,255,0.2)", flexShrink:0 }}/>
                <span style={{ fontSize:7, letterSpacing:1.2, color: count > 0 ? sc.color : "rgba(232,228,240,0.3)", textTransform:"uppercase", whiteSpace:"nowrap" }}>{stage}</span>
                <span style={{ fontFamily:"'Aldrich',sans-serif", fontSize:11, color: count > 0 ? sc.color : "rgba(232,228,240,0.2)", marginLeft:2 }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ background:"rgba(10,8,20,0.95)", border:"1px solid rgba(240,180,41,0.3)", position:"relative", clipPath:"polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)", overflowX:"auto" }}>
        <div style={{ position:"absolute", top:0, left:0, width:12, height:12, borderTop:"1.5px solid #f0b429", borderLeft:"1.5px solid #f0b429" }}/>
        <div style={{ position:"absolute", bottom:13, right:-1, width:20, height:1.5, background:"rgba(240,180,41,0.35)", transform:"rotate(-45deg)", transformOrigin:"right center" }}/>

        {/* Table header */}
        <div style={{ display:"grid", gridTemplateColumns:"130px 1.8fr 60px 1fr 100px 90px 1fr", gap:0, padding:"8px 16px", borderBottom:"1px solid rgba(240,180,41,0.2)", background:"rgba(240,180,41,0.04)", minWidth:1020 }}>
          {["APP #","ENTITY","STATE","SERVICE","BID DUE","DAYS LEFT","ACTIONS"].map((h,i) => (
            <div key={i} style={{ fontSize:6.5, letterSpacing:1.5, color:"rgba(240,180,41,0.6)", fontFamily:"'DM Mono',monospace" }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding:"24px", textAlign:"center", fontSize:9, color:"rgba(240,180,41,0.4)" }}>LOADING...</div>
        ) : tags.length === 0 ? (
          <div style={{ padding:"40px", textAlign:"center" }}>
            <div style={{ fontSize:11, color:"rgba(240,180,41,0.4)", marginBottom:8 }}>NO TAGGED 470s YET</div>
            <div style={{ fontSize:8, color:"rgba(232,228,240,0.3)" }}>Click ☆ TAG on any 470 in the feed to add it here</div>
          </div>
        ) : tags.map((tag, i) => {
          const days      = tag.bid_due_date ? Math.ceil((new Date(tag.bid_due_date) - new Date()) / (1000*60*60*24)) : null;
          const dayColor  = days === null ? "rgba(232,228,240,0.3)" : days > 14 ? "#39ff14" : days > 7 ? "#f0b429" : days >= 0 ? "#f0614a" : "rgba(232,228,240,0.3)";
          const dayBg     = days === null ? "rgba(138,99,210,0.04)" : days > 14 ? "rgba(57,255,20,0.08)" : days > 7 ? "rgba(240,180,41,0.08)" : days >= 0 ? "rgba(240,97,74,0.1)" : "rgba(138,99,210,0.06)";
          const dayLabel  = days === null ? "—" : days < 0 ? "CLOSED" : days === 0 ? "TODAY!" : `${days}d left`;
          const responded = !!tag.responded;
          const isWon     = tag.bid_status === "won";
          const isLost    = tag.bid_status === "lost";
          const hasMoney  = tag.bid_amount > 0;

          const stage    = stages[tag.application_number] || null;
          const stageIdx = stage ? STAGES.indexOf(stage) : -1;

          return (
            <div key={i} style={{ borderBottom: i < tags.length-1 ? "1px solid rgba(240,180,41,0.08)" : "none", transition:"background 0.15s", minWidth:1020 }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(240,180,41,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>

              {/* Main data row */}
              <div style={{ display:"grid", gridTemplateColumns:"130px 1.8fr 60px 1fr 100px 90px 1fr", gap:0, padding:"9px 16px 6px", alignItems:"center" }}>

              <a href={`https://legacy.fundsforlearning.com/470/${tag.application_number}`} target="_blank" rel="noreferrer"
                style={{ fontSize:8.5, color:"#3b9eff", textDecoration:"none", fontWeight:500 }}>{tag.application_number}</a>

              <a href={`https://legacy.fundsforlearning.com/470/${tag.application_number}`} target="_blank" rel="noreferrer"
                style={{ fontSize:8, color:"rgba(232,228,240,0.8)", textDecoration:"none", paddingRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                onMouseEnter={e => e.currentTarget.style.color="#3b9eff"}
                onMouseLeave={e => e.currentTarget.style.color="rgba(232,228,240,0.8)"}>
                {tag.billed_entity_name || "—"}
              </a>

              <div style={{ fontSize:8, color:"rgba(232,228,240,0.5)" }}>{tag.state || "—"}</div>
              <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.4)", paddingRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tag.service_category || "—"}</div>
              <div style={{ fontSize:8, color: tag.bid_due_date ? "#f0b429" : "rgba(232,228,240,0.3)" }}>
                {tag.bid_due_date ? new Date(tag.bid_due_date).toLocaleDateString() : "—"}
              </div>

              <div style={{ display:"flex", alignItems:"center" }}>
                <span className={days !== null && days >= 0 && days <= 7 ? "pulse-urgent" : ""} style={{ fontSize:8, color:dayColor, padding:"2px 8px", background:dayBg, border:`1px solid ${dayColor}40`, borderRadius:1 }}>
                  {dayLabel}
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"nowrap" }}>
                {/* RESPONDED */}
                <button onClick={() => toggleResponded(tag)}
                  style={{ ...btnBase, color: responded ? "#3b9eff" : "rgba(232,228,240,0.3)", borderColor: responded ? "rgba(59,158,255,0.5)" : "rgba(255,255,255,0.1)", background: responded ? "rgba(59,158,255,0.1)" : "transparent" }}>
                  RESPONDED
                </button>

                {/* WON */}
                <button onClick={() => responded && toggleStatus(tag, "won")}
                  style={{ ...btnBase, color: isWon ? "#22c97a" : "rgba(34,201,122,0.3)", borderColor: isWon ? "rgba(34,201,122,0.6)" : "rgba(34,201,122,0.15)", background: isWon ? "rgba(34,201,122,0.1)" : "transparent", opacity: responded ? 1 : 0.35, cursor: responded ? "pointer" : "not-allowed" }}>
                  WON
                </button>

                {/* LOST */}
                <button onClick={() => responded && toggleStatus(tag, "lost")}
                  style={{ ...btnBase, color: isLost ? "#f0614a" : "rgba(240,97,74,0.3)", borderColor: isLost ? "rgba(240,97,74,0.6)" : "rgba(240,97,74,0.15)", background: isLost ? "rgba(240,97,74,0.1)" : "transparent", opacity: responded ? 1 : 0.35, cursor: responded ? "pointer" : "not-allowed" }}>
                  LOST
                </button>

                {/* $ */}
                <button onClick={() => responded && openPopup(tag)}
                  style={{ ...btnBase, fontSize:9, padding:"2px 7px", color: hasMoney ? "#f0b429" : "rgba(240,180,41,0.4)", borderColor: hasMoney ? "rgba(240,180,41,0.6)" : "rgba(240,180,41,0.2)", background: hasMoney ? "rgba(240,180,41,0.1)" : "transparent", opacity: responded ? 1 : 0.35, cursor: responded ? "pointer" : "not-allowed" }}>
                  $
                </button>

                {/* REMOVE */}
                <button onClick={() => removeTag(tag.application_number)}
                  style={{ ...btnBase, color:"rgba(240,97,74,0.6)", borderColor:"rgba(240,97,74,0.25)", background:"rgba(240,97,74,0.06)" }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(240,97,74,0.15)"; e.currentTarget.style.color="#f0614a"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="rgba(240,97,74,0.06)"; e.currentTarget.style.color="rgba(240,97,74,0.6)"; }}>
                  ✕ REMOVE
                </button>
              </div>
              </div>

              {/* Stage pipeline */}
              <div style={{ padding:"0 16px 9px", display:"flex", alignItems:"center", gap:0 }}>
                {STAGES.map((s, si) => {
                  const isCurrent  = si === stageIdx;
                  const isPast     = stageIdx >= 0 && si < stageIdx && s !== "Denied" && s !== "On Appeal";
                  const sc         = STAGE_COLORS[s];
                  const dotColor   = isCurrent ? sc.color : isPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)";
                  const labelColor = isCurrent ? sc.color : "rgba(232,228,240,0.18)";
                  const isLast     = si === STAGES.length - 1;
                  return (
                    <div key={s} style={{ display:"flex", alignItems:"center", flex: isLast ? "0 0 auto" : 1, minWidth:0 }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, flexShrink:0 }}>
                        <div style={{ width: isCurrent ? 7 : 5, height: isCurrent ? 7 : 5, borderRadius:"50%", background: dotColor, boxShadow: isCurrent ? `0 0 6px ${sc.color}` : "none", transition:"all 0.2s", border: isCurrent ? `1px solid ${sc.color}` : "none" }}/>
                        <div style={{ fontSize:5.5, letterSpacing:0.8, color:labelColor, whiteSpace:"nowrap", fontWeight: isCurrent ? 500 : 400, textTransform:"uppercase" }}>{s}</div>
                      </div>
                      {!isLast && (
                        <div style={{ flex:1, height:1, background: isPast ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)", margin:"0 3px", marginBottom:10, minWidth:8 }}/>
                      )}
                    </div>
                  );
                })}
                {stageIdx === -1 && (
                  <span style={{ fontSize:6.5, color:"rgba(232,228,240,0.2)", letterSpacing:1 }}>No stage data found — sync to refresh</span>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Competitive Intel Modal ───────────────────────────────────────────────────
function CompetitiveIntelModal({ token, onClose }) {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("providers");
  const [mfrMetric, setMfrMetric]     = useState("count");
  const [providerPopup, setProviderPopup] = useState(null);
  const [partQuery, setPartQuery]     = useState("");
  const [partResults, setPartResults] = useState([]);
  const [partLoading, setPartLoading] = useState(false);
  const [partSearched, setPartSearched] = useState(false);
  const [partSortAsc, setPartSortAsc] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/competitive-intel`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.status === "success") setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  async function doPartSearch() {
    if (!partQuery.trim() || partQuery.trim().length < 2) return;
    setPartLoading(true);
    setPartSearched(true);
    try {
      const res  = await fetch(`${API_URL}/api/part-lookup?q=${encodeURIComponent(partQuery.trim())}&limit=100`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setPartResults(json.data || []);
    } catch { setPartResults([]); }
    setPartLoading(false);
  }

  async function openProviderPopup(providerName) {
    setProviderPopup({ name: providerName, applicants: [], loading: true });
    try {
      const res  = await fetch(`${API_URL}/api/provider-applicants?spin_name=${encodeURIComponent(providerName)}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setProviderPopup({ name: providerName, applicants: json.data || [], loading: false });
    } catch {
      setProviderPopup({ name: providerName, applicants: [], loading: false });
    }
  }

  const MFR_COLORS = {
    "Cisco":      "#3b9eff", "Meraki":     "#3b9eff",
    "Juniper":    "#22c97a", "Aruba":      "#a07ee0",
    "HPE":        "#a07ee0", "Ubiquiti":   "#f0b429",
    "Extreme":    "#f0614a", "Fortinet":   "#ff9f43",
    "Palo Alto":  "#f0614a", "Sophos":     "#00d4ff",
    "Dell":       "#3b9eff", "Ruckus":     "#22c97a",
    "Netgear":    "#f0b429", "Cambium":    "#a07ee0",
    "Zyxel":      "#00d4ff",
  };

  function BarChart({ items, colorFn, maxCount, onClick }) {
    const max = maxCount || Math.max(...items.map(d => d.count), 1);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {items.map((item, i) => {
          const pct   = Math.round((item.count / max) * 100);
          const color = colorFn ? colorFn(item.name, i) : "#a07ee0";
          return (
            <div key={i} onClick={() => onClick && onClick(item)}
              style={{ display:"flex", alignItems:"center", gap:8, cursor: onClick ? "pointer" : "default", borderRadius:2, padding:"1px 0", transition:"background 0.1s" }}
              onMouseEnter={e => { if (onClick) e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}
              onMouseLeave={e => { if (onClick) e.currentTarget.style.background="transparent"; }}>
              <div style={{ width:160, fontSize:7, color:"rgba(232,228,240,0.6)", textAlign:"right", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={item.name}>
                {onClick && <span style={{ color:"rgba(138,99,210,0.5)", marginRight:4 }}>↗</span>}
                {item.name}
              </div>
              <div style={{ flex:1, height:14, background:"rgba(255,255,255,0.04)", borderRadius:2, overflow:"hidden" }}>
                <div style={{ width:`${pct}%`, height:"100%", background: color, borderRadius:2, opacity:0.85, transition:"width 0.4s ease", minWidth: item.count > 0 ? 4 : 0 }}/>
              </div>
              <div style={{ width:36, fontSize:7, color:"rgba(232,228,240,0.45)", textAlign:"right", flexShrink:0 }}>{item.count}</div>
            </div>
          );
        })}
      </div>
    );
  }

  function MfrBarChart({ items, metric, colorFn }) {
    const vals = items.map(d => metric === "amount" ? d.amount : d.count);
    const max  = Math.max(...vals, 1);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {items.map((item, i) => {
          const val   = metric === "amount" ? item.amount : item.count;
          const pct   = Math.round((val / max) * 100);
          const color = colorFn ? colorFn(item.name) : "#a07ee0";
          const label = metric === "amount" ? (val > 0 ? `$${(val/1000).toFixed(0)}k` : "—") : val;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:100, fontSize:7, color:"rgba(232,228,240,0.6)", textAlign:"right", flexShrink:0 }}>{item.name}</div>
              <div style={{ flex:1, height:14, background:"rgba(255,255,255,0.04)", borderRadius:2, overflow:"hidden" }}>
                <div style={{ width:`${pct}%`, height:"100%", background: color, borderRadius:2, opacity:0.85, transition:"width 0.4s ease", minWidth: val > 0 ? 4 : 0 }}/>
              </div>
              <div style={{ width:48, fontSize:7, color:"rgba(232,228,240,0.45)", textAlign:"right", flexShrink:0 }}>{label}</div>
            </div>
          );
        })}
      </div>
    );
  }

  function GaugeRow({ items, metric, colorFn }) {
    const vals = items.map(d => metric === "amount" ? d.amount : d.count);
    const max  = Math.max(...vals, 1);
    return (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(130px, 1fr))", gap:10 }}>
        {items.map((item, i) => {
          const val   = metric === "amount" ? item.amount : item.count;
          const color = colorFn ? colorFn(item.name) : "#a07ee0";
          const pct   = val > 0 ? Math.round((val / max) * 100) : 0;
          const r = 28, circ = 2 * Math.PI * r;
          const dash = (pct / 100) * circ;
          const label = metric === "amount" ? (val > 0 ? `$${(val/1000).toFixed(0)}k` : "0") : val;
          return (
            <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${val > 0 ? color + "30" : "rgba(255,255,255,0.06)"}`, borderRadius:8, padding:"12px 10px", display:"flex", flexDirection:"column", alignItems:"center", gap:6, opacity: val > 0 ? 1 : 0.4 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
                <circle cx="36" cy="36" r={r} fill="none" stroke={val > 0 ? color : "rgba(255,255,255,0.1)"} strokeWidth="5"
                  strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                  transform="rotate(-90 36 36)" style={{ transition:"stroke-dasharray 0.5s ease" }}/>
                <text x="36" y="36" textAnchor="middle" dominantBaseline="central"
                  style={{ fontFamily:"Aldrich,sans-serif", fontSize: metric === "amount" ? 9 : 13, fill: val > 0 ? color : "rgba(232,228,240,0.2)" }}>{label}</text>
              </svg>
              <div style={{ fontSize:7, letterSpacing:1, color: val > 0 ? "rgba(232,228,240,0.7)" : "rgba(232,228,240,0.25)", textAlign:"center", textTransform:"uppercase" }}>{item.name}</div>
            </div>
          );
        })}
      </div>
    );
  }

  const providerColors = ["#a07ee0","#8a63d2","#7a53c2","#6a43b2","#5a33a2","#4a2392","#3b9eff","#2b8eef","#1b7edf","#0b6ecf",
    "#22c97a","#18b96a","#0ea95a","#f0b429","#e0a419","#d09409","#f0614a","#e0513a","#d0412a","#ff9f43","#ef8f33","#00d4ff","#00c4ef","#a07ee0","#8a63d2"];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(5,5,13,0.92)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#07061a", border:"1px solid rgba(138,99,210,0.4)", clipPath:"polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,20px 100%,0 calc(100% - 20px))", width:"min(1100px, 96vw)", maxHeight:"90vh", display:"flex", flexDirection:"column", position:"relative" }}>
        <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg,transparent,rgba(138,99,210,0.7),transparent)" }}/>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", borderBottom:"1px solid rgba(138,99,210,0.15)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#a07ee0", boxShadow:"0 0 8px rgba(138,99,210,0.9)" }}/>
            <span style={{ fontFamily:"'Aldrich',sans-serif", fontSize:11, letterSpacing:2.5, color:"#a07ee0" }}>COMPETITIVE INTELLIGENCE</span>
            <span style={{ fontSize:7, letterSpacing:1.5, color:"rgba(232,228,240,0.25)" }}>· FY2026 COMMITMENTS · FY2025 LINE ITEMS · TX · {data ? `${data.total.toLocaleString()} commitments · ${(data.lineItemTotal||0).toLocaleString()} line items` : ""}</span>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"1px solid rgba(232,228,240,0.15)", color:"rgba(232,228,240,0.4)", cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:8, padding:"4px 10px", letterSpacing:1 }}>✕ CLOSE</button>
        </div>

        {/* Tab strip */}
        <div style={{ display:"flex", gap:4, padding:"10px 22px", borderBottom:"1px solid rgba(138,99,210,0.1)", flexShrink:0 }}>
          {[["providers","TOP 25 PROVIDERS"],["manufacturers","MANUFACTURER BREAKDOWN"],["services","SERVICE TYPES"],["products","TOP PRODUCTS"],["partlookup","PART LOOKUP"]].map(([key,label]) => (
            <button key={key} onClick={() => setView(key)}
              style={{ padding:"5px 14px", fontFamily:"'DM Mono',monospace", fontSize:7.5, letterSpacing:1.5, border:`1px solid ${view===key ? "rgba(138,99,210,0.6)" : "rgba(138,99,210,0.15)"}`, background: view===key ? "rgba(138,99,210,0.12)" : "transparent", color: view===key ? "#a07ee0" : "rgba(232,228,240,0.35)", cursor:"pointer", transition:"all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 22px" }}>
          {loading && <div style={{ textAlign:"center", padding:"60px", fontSize:9, color:"rgba(138,99,210,0.4)", letterSpacing:2 }}>LOADING INTELLIGENCE DATA...</div>}

          {!loading && data && view === "providers" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ fontSize:7, letterSpacing:2, color:"rgba(138,99,210,0.5)", textTransform:"uppercase" }}>Top 25 Service Providers by Commitment Count · FY2026 TX</div>
                <span style={{ fontSize:7, color:"rgba(232,228,240,0.3)", letterSpacing:1 }}>↗ click a provider to see their applicants</span>
              </div>
              <BarChart items={data.topProviders} colorFn={(name, i) => providerColors[i % providerColors.length]} onClick={item => openProviderPopup(item.name)} />
            </>
          )}

          {!loading && data && view === "manufacturers" && (
            <>
              {data.manufacturers.every(m => m.count === 0) ? (
                <div style={{ padding:"48px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:"rgba(138,99,210,0.3)", letterSpacing:2, marginBottom:8 }}>NO LINE ITEM DATA YET</div>
                  <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.2)" }}>Hit ↺ SYNC on the dashboard to pull FRN line items, then check back.</div>
                </div>
              ) : (
                <>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                    <div style={{ fontSize:7, letterSpacing:2, color:"rgba(138,99,210,0.5)", textTransform:"uppercase" }}>Manufacturer Presence · {(data.lineItemTotal||0).toLocaleString()} TX FRN Line Items · FY2025</div>
                    <div style={{ display:"flex", gap:4 }}>
                      {[["count","Line Items"],["amount","Dollar Value"]].map(([key,label]) => (
                        <button key={key} onClick={() => setMfrMetric(key)}
                          style={{ padding:"3px 10px", fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:1, border:`1px solid ${mfrMetric===key ? "rgba(138,99,210,0.6)" : "rgba(138,99,210,0.2)"}`, background: mfrMetric===key ? "rgba(138,99,210,0.12)" : "transparent", color: mfrMetric===key ? "#a07ee0" : "rgba(232,228,240,0.3)", cursor:"pointer" }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <GaugeRow items={data.manufacturers} metric={mfrMetric} colorFn={name => MFR_COLORS[name] || "#a07ee0"} />
                  <div style={{ marginTop:20 }}>
                    <div style={{ fontSize:7, letterSpacing:2, color:"rgba(138,99,210,0.5)", marginBottom:12, textTransform:"uppercase" }}>{mfrMetric === "amount" ? "Dollar Value" : "Line Item Count"} by Manufacturer</div>
                    <MfrBarChart items={data.manufacturers} metric={mfrMetric} colorFn={name => MFR_COLORS[name] || "#a07ee0"} />
                  </div>
                </>
              )}
            </>
          )}

          {!loading && data && view === "services" && (
            <>
              <div style={{ fontSize:7, letterSpacing:2, color:"rgba(138,99,210,0.5)", marginBottom:14, textTransform:"uppercase" }}>Top Service Types by Commitment Count · FY2026 TX</div>
              <BarChart items={data.serviceTypes} colorFn={(name, i) => ["#3b9eff","#a07ee0","#22c97a","#f0b429","#f0614a","#ff9f43","#00d4ff","#8a63d2"][i % 8]} />
            </>
          )}

          {!loading && data && view === "products" && (
            <>
              {(!data.topProducts || data.topProducts.length === 0) ? (
                <div style={{ padding:"48px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:"rgba(138,99,210,0.3)", letterSpacing:2, marginBottom:8 }}>NO LINE ITEM DATA YET</div>
                  <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.2)" }}>Hit ↺ SYNC on the dashboard to pull FRN line items, then check back.</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize:7, letterSpacing:2, color:"rgba(138,99,210,0.5)", marginBottom:14, textTransform:"uppercase" }}>Top 10 Product Types · FY2025 TX FRN Line Items · {(data.lineItemTotal||0).toLocaleString()} records</div>
                  <BarChart items={data.topProducts} colorFn={(name, i) => ["#a07ee0","#3b9eff","#22c97a","#f0b429","#f0614a","#ff9f43","#00d4ff","#8a63d2","#a07ee0","#3b9eff"][i % 10]} />
                </>
              )}
            </>
          )}

          {view === "partlookup" && (
            <>
              {/* Search bar */}
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:16 }}>
                <input value={partQuery} onChange={e => setPartQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doPartSearch()}
                  placeholder="Enter part number, model, or product name..."
                  style={{ flex:1, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(138,99,210,0.25)", outline:"none", fontFamily:"'DM Mono',monospace", fontSize:9, color:"#e8e4f0", padding:"8px 12px" }}/>
                <button onClick={doPartSearch}
                  style={{ padding:"8px 20px", fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:2, border:"1px solid rgba(138,99,210,0.5)", background:"rgba(138,99,210,0.1)", color:"#a07ee0", cursor:"pointer", whiteSpace:"nowrap" }}>
                  SEARCH →
                </button>
              </div>

              {!partSearched && (
                <div style={{ padding:"40px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:"rgba(138,99,210,0.3)", letterSpacing:2, marginBottom:8 }}>SEARCH FY2025 TX LINE ITEMS</div>
                  <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.2)" }}>Enter a full or partial model number, part name, or manufacturer — results sorted by total cost, highest first</div>
                </div>
              )}
              {partSearched && partLoading && (
                <div style={{ padding:"40px", textAlign:"center", fontSize:9, color:"rgba(138,99,210,0.4)", letterSpacing:2 }}>SEARCHING...</div>
              )}
              {partSearched && !partLoading && partResults.length === 0 && (
                <div style={{ padding:"40px", textAlign:"center", fontSize:9, color:"rgba(232,228,240,0.25)", letterSpacing:2 }}>NO RESULTS FOUND</div>
              )}
              {partSearched && !partLoading && partResults.length > 0 && (
                <>
                  {/* Results header */}
                  <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1.2fr 1fr 130px 80px 110px", gap:0, padding:"7px 12px", borderBottom:"1px solid rgba(138,99,210,0.2)", background:"rgba(138,99,210,0.05)" }}>
                    {["MODEL (471)","APPLICANT","SERVICE PROVIDER","QTY","TOTAL COST"].map((h,i) => (
                      <div key={i} style={{ fontSize:6.5, letterSpacing:1.5, color:"rgba(138,99,210,0.55)", fontFamily:"'DM Mono',monospace" }}>{h}</div>
                    ))}
                    <div onClick={() => setPartSortAsc(p => !p)}
                      style={{ fontSize:6.5, letterSpacing:1.5, color:"#a07ee0", fontFamily:"'DM Mono',monospace", cursor:"pointer", display:"flex", alignItems:"center", gap:4, userSelect:"none" }}
                      title="Toggle sort order">
                      UNIT PRICE <span style={{ fontSize:9 }}>{partSortAsc ? "↑" : "↓"}</span>
                    </div>
                  </div>
                  {[...partResults].sort((a,b) => {
                      const av = a.unit_price || 0;
                      const bv = b.unit_price || 0;
                      return partSortAsc ? av - bv : bv - av;
                    }).map((r, i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"1.6fr 1.2fr 1fr 130px 80px 110px", gap:0, padding:"9px 12px", borderBottom:"1px solid rgba(138,99,210,0.07)", alignItems:"center", transition:"background 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(138,99,210,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <div>
                        <div title={r.model_of_equipment || ""} style={{ fontSize:8, color:"#a07ee0", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {r.model_of_equipment ? (r.model_of_equipment.length > 40 ? r.model_of_equipment.slice(0, 40) + "…" : r.model_of_equipment) : "—"}
                        </div>
                        {r.manufacturer && <div style={{ fontSize:6.5, color:"rgba(232,228,240,0.35)", marginTop:2 }}>{r.manufacturer}</div>}
                      </div>
                      <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.75)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{r.organization_name || "—"}</div>
                      <div style={{ fontSize:7.5, color:"rgba(59,158,255,0.8)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{r.spin_name || "—"}</div>
                      <div style={{ fontSize:8, color:"rgba(232,228,240,0.5)" }}>{r.quantity ? r.quantity.toLocaleString() : "—"}</div>
                      <div style={{ fontSize:8, color:"rgba(232,228,240,0.45)" }}>{r.total_cost ? `$${Math.round(r.total_cost).toLocaleString()}` : "—"}</div>
                      <div>
                        {r.unit_price ? (
                          <>
                            <div style={{ fontSize:9, color:"#a07ee0", fontWeight:500 }}>${Number(r.unit_price).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                            <div style={{ fontSize:6, color:"rgba(138,99,210,0.4)", marginTop:1, letterSpacing:1 }}>PER UNIT</div>
                          </>
                        ) : (
                          <div style={{ fontSize:8, color:"rgba(232,228,240,0.2)" }}>—</div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{ padding:"8px 12px", fontSize:7, color:"rgba(232,228,240,0.2)", letterSpacing:1.5, borderTop:"1px solid rgba(138,99,210,0.08)" }}>
                    {partResults.length} RESULT{partResults.length !== 1 ? "S" : ""} · FY2025 TX · Click UNIT PRICE header to toggle sort direction
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Provider applicants popup */}
      {providerPopup && (
        <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:400 }}
          onClick={e => e.target === e.currentTarget && setProviderPopup(null)}>
          <div style={{ background:"#0a0920", border:"1px solid rgba(59,158,255,0.4)", clipPath:"polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))", width:"min(600px, 92vw)", maxHeight:"70vh", display:"flex", flexDirection:"column", position:"relative" }}>
            <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg,transparent,rgba(59,158,255,0.5),transparent)" }}/>

            {/* Popup header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid rgba(59,158,255,0.12)", flexShrink:0 }}>
              <div>
                <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:9, letterSpacing:2, color:"#3b9eff", marginBottom:3 }}>APPLICANTS</div>
                <div style={{ fontSize:8, color:"rgba(232,228,240,0.6)", maxWidth:380, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{providerPopup.name}</div>
              </div>
              <button onClick={() => setProviderPopup(null)} style={{ background:"transparent", border:"1px solid rgba(232,228,240,0.12)", color:"rgba(232,228,240,0.4)", cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:8, padding:"3px 8px" }}>✕</button>
            </div>

            {/* Popup body */}
            <div style={{ flex:1, overflowY:"auto" }}>
              {providerPopup.loading && (
                <div style={{ padding:"32px", textAlign:"center", fontSize:8, color:"rgba(59,158,255,0.4)", letterSpacing:2 }}>LOADING...</div>
              )}
              {!providerPopup.loading && providerPopup.applicants.length === 0 && (
                <div style={{ padding:"32px", textAlign:"center", fontSize:8, color:"rgba(232,228,240,0.25)" }}>No applicants found</div>
              )}
              {!providerPopup.loading && providerPopup.applicants.length > 0 && (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px", padding:"7px 18px", borderBottom:"1px solid rgba(59,158,255,0.12)", background:"rgba(59,158,255,0.04)" }}>
                    {["ORGANIZATION","AWARDS","COMMITTED"].map((h,i) => (
                      <div key={i} style={{ fontSize:6.5, letterSpacing:1.5, color:"rgba(59,158,255,0.5)" }}>{h}</div>
                    ))}
                  </div>
                  {providerPopup.applicants.map((a, i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 80px 100px", padding:"8px 18px", borderBottom:"1px solid rgba(59,158,255,0.06)", alignItems:"center", transition:"background 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(59,158,255,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <div style={{ fontSize:8, color:"rgba(232,228,240,0.8)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{a.name}</div>
                      <div style={{ fontSize:8, color:"rgba(232,228,240,0.45)" }}>{a.count}</div>
                      <div style={{ fontSize:8, color:"#22c97a" }}>${a.total.toLocaleString()}</div>
                    </div>
                  ))}
                  <div style={{ padding:"8px 18px", fontSize:6.5, color:"rgba(232,228,240,0.2)", letterSpacing:1, borderTop:"1px solid rgba(59,158,255,0.06)" }}>
                    {providerPopup.applicants.length} ORGANIZATIONS · FY2026 TX COMMITMENTS
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// ── C2 Budget Modal ────────────────────────────────────────────────────────────
const C2_STATES = ["TX","CA","NY","FL","IL","PA","OH","GA","NC","MI","WA","AZ","CO","VA","MA","TN","IN","MO","WI","MN","OR","KY","OK","NV","CT","UT","AR","MS","KS","NM","NE","ID","WV","HI","NH","ME","RI","MT","DE","SD","ND","AK","VT","WY"];

function C2BudgetModal({ token, onClose }) {
  const [searchBy, setSearchBy]   = useState("name");
  const [query, setQuery]         = useState("");
  const [stateFilter, setStateFilter] = useState("TX");
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [error, setError]         = useState("");
  const [rawFields, setRawFields] = useState([]);
  const [expanded, setExpanded]   = useState(null);

  const searchByOptions = [
    { key:"name", label:"Entity / District Name", placeholder:"Enter district or entity name..." },
    { key:"ben",  label:"BEN",                    placeholder:"Enter BEN entity number..." },
  ];

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setError("");
    setExpanded(null);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (searchBy === "ben")  params.set("ben", query.trim());
      else                     params.set("search", query.trim());
      if (stateFilter !== "ALL") params.set("state", stateFilter);
      const res  = await fetch(`${API_URL}/api/c2-budget?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") {
        setResults(json.data || []);
        if (json.fields) setRawFields(json.fields);
      } else {
        setError(json.message || "Search failed");
        setResults([]);
      }
    } catch { setError("Connection error — check backend"); setResults([]); }
    setLoading(false);
  }

  function handleKey(e) { if (e.key === "Enter") doSearch(); }

  function fmt(val) {
    if (val === null || val === undefined || val === 0) return "—";
    return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })}`;
  }

  function BudgetBar({ total, committed, disbursed }) {
    if (!total) return null;
    const committedPct  = Math.min(100, Math.round(((committed||0) / total) * 100));
    const disbursedPct  = Math.min(committedPct, Math.round(((disbursed||0) / total) * 100));
    const remainingPct  = 100 - committedPct;
    return (
      <div style={{ marginTop:6 }}>
        <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden", display:"flex" }}>
          <div style={{ width:`${disbursedPct}%`, height:"100%", background:"#22c97a", borderRadius:"99px 0 0 99px" }}/>
          <div style={{ width:`${committedPct - disbursedPct}%`, height:"100%", background:"rgba(240,180,41,0.7)" }}/>
          <div style={{ width:`${remainingPct}%`, height:"100%", background:"rgba(138,99,210,0.25)", borderRadius:"0 99px 99px 0" }}/>
        </div>
        <div style={{ display:"flex", gap:12, marginTop:5 }}>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c97a", flexShrink:0 }}/>
            <span style={{ fontSize:6.5, color:"rgba(232,228,240,0.4)" }}>Disbursed</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"rgba(240,180,41,0.7)", flexShrink:0 }}/>
            <span style={{ fontSize:6.5, color:"rgba(232,228,240,0.4)" }}>Committed</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"rgba(138,99,210,0.4)", flexShrink:0 }}/>
            <span style={{ fontSize:6.5, color:"rgba(232,228,240,0.4)" }}>Remaining</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(5,5,13,0.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#07061a", border:"1px solid rgba(240,180,41,0.35)", clipPath:"polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px))", width:"min(920px, 96vw)", maxHeight:"88vh", display:"flex", flexDirection:"column", position:"relative" }}>
        <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg,transparent,rgba(240,180,41,0.5),transparent)" }}/>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", borderBottom:"1px solid rgba(240,180,41,0.12)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#f0b429", boxShadow:"0 0 8px rgba(240,180,41,0.9)" }}/>
            <span style={{ fontFamily:"'Aldrich',sans-serif", fontSize:11, letterSpacing:2.5, color:"#f0b429" }}>C2 BUDGET LOOKUP</span>
            <span style={{ fontSize:7, letterSpacing:1.5, color:"rgba(232,228,240,0.25)" }}>· LIVE · USAC OPEN DATA</span>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"1px solid rgba(232,228,240,0.15)", color:"rgba(232,228,240,0.4)", cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:8, padding:"4px 10px", letterSpacing:1 }}>✕ CLOSE</button>
        </div>

        {/* Search bar */}
        <div style={{ padding:"14px 22px", borderBottom:"1px solid rgba(240,180,41,0.08)", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", flexShrink:0 }}>
          {/* Search by toggle */}
          <div style={{ display:"flex", gap:4 }}>
            {searchByOptions.map(o => (
              <button key={o.key} onClick={() => setSearchBy(o.key)}
                style={{ padding:"4px 12px", fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:1.5, border:`1px solid ${searchBy===o.key ? "rgba(240,180,41,0.6)" : "rgba(240,180,41,0.15)"}`, background: searchBy===o.key ? "rgba(240,180,41,0.1)" : "transparent", color: searchBy===o.key ? "#f0b429" : "rgba(232,228,240,0.35)", cursor:"pointer", transition:"all 0.15s" }}>
                {o.label}
              </button>
            ))}
          </div>
          {/* State dropdown */}
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(240,180,41,0.2)", color:"#e8e4f0", fontFamily:"'DM Mono',monospace", fontSize:8, padding:"6px 8px", outline:"none" }}>
            <option value="ALL">ALL STATES</option>
            {C2_STATES.map(s => <option key={s} value={s} style={{ background:"#0a0814" }}>{s}</option>)}
          </select>
          {/* Query input */}
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey}
            placeholder={searchByOptions.find(o => o.key === searchBy)?.placeholder}
            style={{ flex:1, minWidth:220, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(240,180,41,0.25)", outline:"none", fontFamily:"'DM Mono',monospace", fontSize:9, color:"#e8e4f0", padding:"7px 12px" }}/>
          <button onClick={doSearch}
            style={{ padding:"7px 18px", fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:2, border:"1px solid rgba(240,180,41,0.5)", background:"rgba(240,180,41,0.1)", color:"#f0b429", cursor:"pointer", whiteSpace:"nowrap" }}>
            SEARCH →
          </button>
        </div>

        {/* Results */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {!searched && (
            <div style={{ padding:"48px 22px", textAlign:"center" }}>
              <div style={{ fontSize:9, color:"rgba(240,180,41,0.3)", letterSpacing:2, marginBottom:8 }}>SEARCH FOR AN ENTITY ABOVE</div>
              <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.2)" }}>Returns live C2 budget data directly from USAC · Shows total budget, committed, disbursed, and remaining amounts</div>
            </div>
          )}
          {searched && loading && <div style={{ padding:"48px", textAlign:"center", fontSize:9, color:"rgba(240,180,41,0.4)", letterSpacing:2 }}>FETCHING FROM USAC...</div>}
          {searched && !loading && error && <div style={{ padding:"24px 22px", fontSize:8, color:"#f0614a" }}>⚠ {error}</div>}
          {searched && !loading && !error && results.length === 0 && (
            <div style={{ padding:"48px", textAlign:"center", fontSize:9, color:"rgba(232,228,240,0.25)", letterSpacing:2 }}>NO RESULTS FOUND</div>
          )}
          {searched && !loading && results.length > 0 && (
            <>
              {/* Table header */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 60px 80px 130px 130px 130px 120px", padding:"8px 22px", borderBottom:"1px solid rgba(240,180,41,0.15)", background:"rgba(240,180,41,0.04)", position:"sticky", top:0 }}>
                {["ENTITY","STATE","BEN","TOTAL BUDGET","COMMITTED","DISBURSED","REMAINING"].map((h,i) => (
                  <div key={i} style={{ fontSize:6.5, letterSpacing:1.5, color:"rgba(240,180,41,0.55)", fontFamily:"'DM Mono',monospace" }}>{h}</div>
                ))}
              </div>

              {results.map((r, i) => {
                const remaining    = r.remaining || (r.total_budget - (r.committed||0)) || null;
                const remainingPct = r.total_budget ? Math.round(((remaining||0) / r.total_budget) * 100) : null;
                const isExpanded   = expanded === i;
                const rawKeys      = rawFields.filter(k => !["billed_entity_name","billed_entity_number","state","entity_type"].includes(k));
                return (
                  <div key={i} style={{ borderBottom:"1px solid rgba(240,180,41,0.07)" }}>
                    {/* Main row */}
                    <div onClick={() => setExpanded(isExpanded ? null : i)}
                      style={{ display:"grid", gridTemplateColumns:"1fr 60px 80px 130px 130px 130px 120px", padding:"10px 22px", alignItems:"center", cursor:"pointer", transition:"background 0.15s", background: isExpanded ? "rgba(240,180,41,0.05)" : "transparent" }}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background="rgba(240,180,41,0.03)"; }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background="transparent"; }}>
                      <div>
                        <div style={{ fontSize:8, color:"rgba(232,228,240,0.85)", fontWeight:500 }}>{r.entity_name || "—"}</div>
                        {r.entity_type && <div style={{ fontSize:6.5, color:"rgba(232,228,240,0.3)", marginTop:2 }}>{r.entity_type}</div>}
                      </div>
                      <div style={{ fontSize:8, color:"rgba(232,228,240,0.45)" }}>{r.state || "—"}</div>
                      <div style={{ fontSize:8, color:"#3b9eff" }}>{r.ben || "—"}</div>
                      <div style={{ fontSize:8, color:"rgba(232,228,240,0.6)" }}>{fmt(r.total_budget)}</div>
                      <div style={{ fontSize:8, color:"#f0b429" }}>{fmt(r.committed)}</div>
                      <div style={{ fontSize:8, color:"#22c97a" }}>{fmt(r.disbursed)}</div>
                      <div>
                        <div style={{ fontSize:8, color: remainingPct > 50 ? "#22c97a" : remainingPct > 20 ? "#f0b429" : "#f0614a", fontWeight:500 }}>{fmt(remaining)}</div>
                        {remainingPct !== null && <div style={{ fontSize:6.5, color:"rgba(232,228,240,0.3)", marginTop:1 }}>{remainingPct}% left</div>}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ padding:"12px 22px 16px", background:"rgba(240,180,41,0.03)", borderTop:"1px solid rgba(240,180,41,0.08)" }}>
                        <BudgetBar total={r.total_budget} committed={r.committed} disbursed={r.disbursed} />
                        {rawKeys.length > 0 && (
                          <div style={{ marginTop:14, display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:8 }}>
                            {rawKeys.map(k => (
                              <div key={k} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", padding:"7px 10px", borderRadius:4 }}>
                                <div style={{ fontSize:6, letterSpacing:1.5, color:"rgba(232,228,240,0.25)", textTransform:"uppercase", marginBottom:3 }}>{k.replace(/_/g," ")}</div>
                                <div style={{ fontSize:8, color:"rgba(232,228,240,0.7)" }}>{r.raw[k] !== null && r.raw[k] !== undefined ? String(r.raw[k]) : "—"}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ padding:"10px 22px", fontSize:7, color:"rgba(232,228,240,0.2)", letterSpacing:1.5, borderTop:"1px solid rgba(240,180,41,0.08)" }}>
                {results.length} RESULT{results.length !== 1 ? "S" : ""} · LIVE DATA FROM USAC · Click a row to expand all fields
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ── FRN Status Modal ──────────────────────────────────────────────────────────
function FRNStatusModal({ token, onClose }) {
  const [query, setQuery]         = useState("");
  const [searchBy, setSearchBy]   = useState("frn");
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [selected, setSelected]   = useState(null);   // selected commitment row
  const [form471, setForm471]     = useState(null);    // matched 471 record
  const [detail471Loading, setDetail471Loading] = useState(false);

  const searchByOptions = [
    { key:"frn",          label:"FRN #",   placeholder:"Enter FRN number..." },
    { key:"application",  label:"App #",    placeholder:"Enter application number..." },
    { key:"organization", label:"Org Name", placeholder:"Enter organization name..." },
    { key:"ben",          label:"BEN",      placeholder:"Enter BEN entity number..." },
  ];

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setSelected(null);
    setForm471(null);
    try {
      const params = new URLSearchParams({ search: query.trim(), search_by: searchBy, limit: 50 });
      const res  = await fetch(`${API_URL}/api/frn-status?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setResults(json.data || []);
    } catch { setResults([]); }
    setLoading(false);
  }

  async function selectRow(r) {
    setSelected(r);
    setForm471(null);
    if (!r.application_number) return;
    setDetail471Loading(true);
    try {
      const params = new URLSearchParams({ search: r.application_number, limit: 1 });
      const res  = await fetch(`${API_URL}/api/471s?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setForm471((json.data || [])[0] || null);
    } catch {}
    setDetail471Loading(false);
  }

  function handleKey(e) { if (e.key === "Enter") doSearch(); }

  const statusColor = (s) => {
    if (!s) return "rgba(232,228,240,0.35)";
    const sl = s.toLowerCase();
    if (sl.includes("commit") || sl.includes("fund")) return "#22c97a";
    if (sl.includes("deny")   || sl.includes("reject")) return "#f0614a";
    if (sl.includes("review") || sl.includes("pend"))   return "#f0b429";
    return "#a07ee0";
  };

  const field = (label, value, color) => (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:6.5, letterSpacing:1.8, color:"rgba(232,228,240,0.3)", textTransform:"uppercase", marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:8.5, color: color || "rgba(232,228,240,0.8)", wordBreak:"break-word" }}>{value || "—"}</div>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(5,5,13,0.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#08071a", border:"1px solid rgba(59,158,255,0.35)", clipPath:"polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px))", width:"min(1100px, 96vw)", maxHeight:"88vh", display:"flex", flexDirection:"column", position:"relative" }}>
        <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg,transparent,rgba(59,158,255,0.6),transparent)" }}/>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid rgba(59,158,255,0.15)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#3b9eff", boxShadow:"0 0 6px rgba(59,158,255,0.8)" }}/>
            <span style={{ fontFamily:"'Aldrich',sans-serif", fontSize:10, letterSpacing:2.5, color:"#3b9eff" }}>FRN STATUS LOOKUP</span>
            <span style={{ fontSize:7, letterSpacing:1.5, color:"rgba(232,228,240,0.3)" }}>· LOCAL DATABASE · FY2026 TX</span>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"1px solid rgba(232,228,240,0.15)", color:"rgba(232,228,240,0.4)", cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:8, padding:"4px 10px", letterSpacing:1 }}>✕ CLOSE</button>
        </div>

        {/* Search bar */}
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(59,158,255,0.1)", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", flexShrink:0 }}>
          <div style={{ display:"flex", gap:4 }}>
            {searchByOptions.map(o => (
              <button key={o.key} onClick={() => setSearchBy(o.key)}
                style={{ padding:"4px 10px", fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:1.5, border:`1px solid ${searchBy===o.key ? "rgba(59,158,255,0.6)" : "rgba(59,158,255,0.15)"}`, background: searchBy===o.key ? "rgba(59,158,255,0.12)" : "transparent", color: searchBy===o.key ? "#3b9eff" : "rgba(232,228,240,0.35)", cursor:"pointer", transition:"all 0.15s" }}>
                {o.label}
              </button>
            ))}
          </div>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey}
            placeholder={searchByOptions.find(o => o.key === searchBy)?.placeholder}
            style={{ flex:1, minWidth:200, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(59,158,255,0.25)", outline:"none", fontFamily:"'DM Mono',monospace", fontSize:9, color:"#e8e4f0", padding:"7px 12px" }}/>
          <button onClick={doSearch}
            style={{ padding:"7px 18px", fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:2, border:"1px solid rgba(59,158,255,0.5)", background:"rgba(59,158,255,0.1)", color:"#3b9eff", cursor:"pointer", whiteSpace:"nowrap" }}>
            SEARCH →
          </button>
        </div>

        {/* Body: results + optional detail panel */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* Results list */}
          <div style={{ flex:1, overflowY:"auto", borderRight: selected ? "1px solid rgba(59,158,255,0.12)" : "none" }}>
            {!searched && (
              <div style={{ padding:"48px 20px", textAlign:"center" }}>
                <div style={{ fontSize:9, color:"rgba(59,158,255,0.3)", letterSpacing:2, marginBottom:8 }}>ENTER A SEARCH TERM ABOVE</div>
                <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.2)" }}>Search by FRN number, application number, organization name, or BEN</div>
              </div>
            )}
            {searched && loading && (
              <div style={{ padding:"48px 20px", textAlign:"center", fontSize:9, color:"rgba(59,158,255,0.4)", letterSpacing:2 }}>SEARCHING...</div>
            )}
            {searched && !loading && results.length === 0 && (
              <div style={{ padding:"48px 20px", textAlign:"center", fontSize:9, color:"rgba(232,228,240,0.25)", letterSpacing:2 }}>NO RESULTS FOUND</div>
            )}
            {searched && !loading && results.length > 0 && (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 90px 150px 110px 120px", padding:"8px 16px", borderBottom:"1px solid rgba(59,158,255,0.15)", background:"rgba(59,158,255,0.04)", position:"sticky", top:0 }}>
                  {["FRN #","ORGANIZATION","BEN","SERVICE TYPE","COMMITMENT","STATUS"].map((h,i) => (
                    <div key={i} style={{ fontSize:6.5, letterSpacing:1.5, color:"rgba(59,158,255,0.55)", fontFamily:"'DM Mono',monospace" }}>{h}</div>
                  ))}
                </div>
                {results.map((r, i) => {
                  const sc         = statusColor(r.form_471_frn_status_name);
                  const commitment = r.funding_commitment_request ? `$${Number(r.funding_commitment_request).toLocaleString()}` : "—";
                  const isSelected = selected?.funding_request_number === r.funding_request_number;
                  return (
                    <div key={i}
                      onClick={() => selectRow(r)}
                      style={{ display:"grid", gridTemplateColumns:"110px 1fr 90px 150px 110px 120px", padding:"10px 16px", borderBottom:"1px solid rgba(59,158,255,0.07)", alignItems:"center", cursor:"pointer", transition:"background 0.15s", background: isSelected ? "rgba(59,158,255,0.08)" : "transparent", borderLeft: isSelected ? "2px solid #3b9eff" : "2px solid transparent" }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background="rgba(59,158,255,0.04)"; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background="transparent"; }}>
                      <div style={{ fontSize:8, color:"#3b9eff", fontWeight:500 }}>{r.funding_request_number || "—"}</div>
                      <div style={{ fontSize:8, color:"rgba(232,228,240,0.8)", paddingRight:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.organization_name || "—"}</div>
                      <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.45)" }}>{r.ben || "—"}</div>
                      <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.45)", paddingRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.form_471_service_type_name || "—"}</div>
                      <div style={{ fontSize:8, color:"#22c97a" }}>{commitment}</div>
                      <div><span style={{ fontSize:7, letterSpacing:1, padding:"2px 8px", border:`1px solid ${sc}40`, background:`${sc}10`, color:sc }}>{r.form_471_frn_status_name || "UNKNOWN"}</span></div>
                    </div>
                  );
                })}
                <div style={{ padding:"10px 16px", fontSize:7, color:"rgba(232,228,240,0.25)", letterSpacing:1.5, borderTop:"1px solid rgba(59,158,255,0.08)" }}>
                  {results.length} RESULT{results.length !== 1 ? "S" : ""} · CLICK A ROW TO SEE 471 DETAILS
                </div>
              </>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ width:300, flexShrink:0, overflowY:"auto", background:"rgba(5,5,18,0.6)", padding:"16px 18px", display:"flex", flexDirection:"column", gap:0 }}>
              {/* Detail header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ fontSize:7, letterSpacing:2, color:"rgba(138,99,210,0.7)", textTransform:"uppercase" }}>FRN Detail</div>
                <button onClick={() => { setSelected(null); setForm471(null); }}
                  style={{ background:"transparent", border:"none", color:"rgba(232,228,240,0.3)", cursor:"pointer", fontSize:10, padding:"0 2px" }}>✕</button>
              </div>

              {/* Commitment fields */}
              <div style={{ paddingBottom:14, borderBottom:"1px solid rgba(138,99,210,0.15)", marginBottom:14 }}>
                <div style={{ fontSize:6.5, letterSpacing:2, color:"rgba(59,158,255,0.5)", marginBottom:10, textTransform:"uppercase" }}>Commitment Record</div>
                {field("FRN #", selected.funding_request_number, "#3b9eff")}
                {field("Organization", selected.organization_name)}
                {field("BEN", selected.ben)}
                {field("Service Type", selected.form_471_service_type_name)}
                {field("FRN Status", selected.form_471_frn_status_name, statusColor(selected.form_471_frn_status_name))}
                {field("Commitment Amount", selected.funding_commitment_request ? `$${Number(selected.funding_commitment_request).toLocaleString()}` : null, "#22c97a")}
                {field("Discount %", selected.dis_pct ? `${Math.round(parseFloat(selected.dis_pct) * 100)}%` : null)}
                {field("FCDL Date", selected.fcdl_letter_date ? new Date(selected.fcdl_letter_date).toLocaleDateString() : null)}
                {field("Service Provider", selected.spin_name)}
              </div>

              {/* 471 fields */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:6.5, letterSpacing:2, color:"rgba(138,99,210,0.5)", marginBottom:10, textTransform:"uppercase" }}>Form 471 Record</div>
                {detail471Loading && <div style={{ fontSize:8, color:"rgba(138,99,210,0.4)", letterSpacing:1.5 }}>LOADING...</div>}
                {!detail471Loading && !form471 && <div style={{ fontSize:8, color:"rgba(232,228,240,0.2)" }}>No matching 471 found in local DB</div>}
                {!detail471Loading && form471 && (
                  <>
                    {field("App #", form471.application_number, "#a07ee0")}
                    {field("471 Status", form471.form_471_status_name)}
                    {field("Category of Service", form471.chosen_category_of_service)}
                    {field("Funding Request Amt", form471.funding_request_amount ? `$${Number(form471.funding_request_amount).toLocaleString()}` : null, "#22c97a")}
                    {field("Contact", form471.cnct_first_name ? `${form471.cnct_first_name} ${form471.cnct_last_name || ""}`.trim() : null)}
                    {field("Contact Email", form471.cnct_email, "#3b9eff")}
                    {field("Contact Phone", form471.cnct_phone)}
                    {field("Certified", form471.certified_datetime ? new Date(form471.certified_datetime).toLocaleDateString() : null)}
                  </>
                )}
              </div>

              {/* Link out button */}
              {selected.application_number && (
                <a href={`https://legacy.fundsforlearning.com/471/${selected.application_number}`} target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"9px 14px", border:"1px solid rgba(138,99,210,0.4)", background:"rgba(138,99,210,0.08)", color:"#a07ee0", textDecoration:"none", fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:1.5, textTransform:"uppercase", marginTop:"auto", transition:"all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(138,99,210,0.18)"; e.currentTarget.style.borderColor="rgba(138,99,210,0.7)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="rgba(138,99,210,0.08)"; e.currentTarget.style.borderColor="rgba(138,99,210,0.4)"; }}>
                  View on FundsForLearning →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BidResponseOverview({ token }) {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/tags`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.status === "success") setTags(d.data || []); })
      .catch(() => {});
  }, [token]);

  const responded = tags.filter(t => t.responded).length;
  const wonTags   = tags.filter(t => t.bid_status === "won");
  const lostTags  = tags.filter(t => t.bid_status === "lost");
  const won       = wonTags.length;
  const lost      = lostTags.length;
  const winRate   = responded > 0 ? Math.round((won / responded) * 100) : 0;
  const lossRate  = responded > 0 ? Math.round((lost / responded) * 100) : 0;
  const totalRev  = wonTags.reduce((sum, t) => sum + (parseFloat(t.bid_amount) || 0), 0);
  const margins   = wonTags.filter(t => t.bid_amount > 0).map(t => ((t.bid_amount - t.cogs) / t.bid_amount) * 100);
  const avgMargin = margins.length > 0 ? (margins.reduce((a,b) => a+b, 0) / margins.length).toFixed(1) : null;
  const revenue   = totalRev > 0 ? `$${totalRev.toLocaleString()}` : "$0";
  const revNote   = `${won} funded commitment${won !== 1 ? "s" : ""} · FY2026`;

  return (
    <Panel>
      <PTitle>{'// BID '}<span style={{ color:"#a07ee0" }}>RESPONSE OVERVIEW</span></PTitle>
      <div style={{ padding:"14px 14px 16px" }}>

        {/* Revenue block */}
        <div style={{ background:"rgba(10,30,18,0.7)", border:"1px solid rgba(34,201,122,0.15)", borderRadius:10, padding:"13px 16px", marginBottom:12, textAlign:"center", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:"15%", right:"15%", height:1, background:"linear-gradient(90deg,transparent,rgba(34,201,122,0.5),transparent)" }}/>
          <div style={{ fontSize:7, letterSpacing:2, color:"#1a7a4a", textTransform:"uppercase", marginBottom:5 }}>Total Revenue — Bids Won</div>
          <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:30, color:"#22c97a", lineHeight:1, marginBottom:4, textShadow:"0 0 12px rgba(34,201,122,0.8), 0 0 35px rgba(34,201,122,0.4), 0 0 70px rgba(34,201,122,0.15)" }}>{revenue}</div>
          <div style={{ fontSize:6.5, letterSpacing:1.2, color:"#0d5530", textTransform:"uppercase" }}>{revNote}</div>
        </div>

        {/* 3 counters */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { label:"Responded", value:responded, sub:"total bids",      color:"#a07ee0", subColor:"rgba(138,99,210,0.35)" },
            { label:"Won",        value:won,       sub:`${winRate}% rate`,  color:"#22c97a", subColor:"rgba(34,201,122,0.35)" },
            { label:"Lost",       value:lost,      sub:`${lossRate}% rate`, color:"#f0614a", subColor:"rgba(240,97,74,0.35)"  },
          ].map(({ label, value, sub, color, subColor }) => (
            <div key={label} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"10px 11px" }}>
              <div style={{ fontSize:6.5, letterSpacing:1.8, color:"rgba(232,228,240,0.3)", textTransform:"uppercase", marginBottom:6 }}>{label}</div>
              <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:26, color, lineHeight:1, marginBottom:3 }}>{value}</div>
              <div style={{ fontSize:6.5, letterSpacing:1, textTransform:"uppercase", color:subColor }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Avg margin bar */}
        <div>
          <div style={{ display:"flex", alignItems:"baseline", gap:7, marginBottom:6 }}>
            <span style={{ fontFamily:"'Aldrich',sans-serif", fontSize:12, color:"#8a63d2" }}>{avgMargin !== null ? `${avgMargin}%` : "—"}</span>
            <span style={{ fontSize:7, letterSpacing:1.8, color:"rgba(138,99,210,0.4)", textTransform:"uppercase" }}>Avg Margin</span>
          </div>
          <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${avgMargin || 0}%`, borderRadius:99, background:"linear-gradient(90deg,#2a1a5e,#5a3ab0,#8a63d2,#c0a0ff)" }}/>
          </div>
        </div>

      </div>
    </Panel>
  );
}

export default function Dashboard({ session }) {
  const [token, setToken]     = useState(null);
  const [stats, setStats]     = useState(null);
  const [tab, setTab]         = useState("dashboard");
  const [clock, setClock]     = useState("");
  const [tagCount, setTagCount] = useState(0);
  const [frnOpen, setFrnOpen] = useState(false);
  const [ciOpen, setCiOpen]   = useState(false);
  const [c2Open, setC2Open]     = useState(false);

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
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("en-US",{hour12:false}) + " CDT"), 1000);
    return () => clearInterval(t);
  }, [refreshTagCount]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/stats`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "success") setStats(d.data); })
      .catch(() => {});
  }, [token]);

  async function handleSync() {
    if (!token) return;
    await fetch(`${API_URL}/api/sync`, { method:"POST", headers:{ Authorization:`Bearer ${token}` } });
    alert("Sync started — data will update in the background.");
  }

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight:"100vh", background:"#05050d", position:"relative" }}>
        {frnOpen && token && <FRNStatusModal token={token} onClose={() => setFrnOpen(false)} />}
        {ciOpen && token && <CompetitiveIntelModal token={token} onClose={() => setCiOpen(false)} />}
        {c2Open && token && <C2BudgetModal token={token} onClose={() => setC2Open(false)} />}
        <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 70% 50% at 15% 15%, rgba(138,99,210,0.09) 0%, transparent 60%)", pointerEvents:"none", zIndex:0 }}/>
        <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle, rgba(138,99,210,0.8) 1px, transparent 1px)", backgroundSize:"28px 28px", opacity:0.035, pointerEvents:"none", zIndex:0 }}/>

        <div style={{ position:"relative", zIndex:1, maxWidth:1400, margin:"0 auto", padding:"20px 22px 48px" }}>

          {/* HEADER */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, paddingBottom:16, borderBottom:"1px solid rgba(138,99,210,0.15)", animation:"fade-up 0.5s ease both" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ position:"relative", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="40" height="40" viewBox="0 0 40 40" style={{ position:"absolute", inset:0, animation:"spin 18s linear infinite" }}>
                  <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="rgba(138,99,210,0.5)" strokeWidth="1"/>
                  <polygon points="20,6 32,13 32,27 20,34 8,27 8,13" fill="none" stroke="rgba(138,99,210,0.22)" strokeWidth="0.5"/>
                </svg>
                <span style={{ fontFamily:"'Aldrich',sans-serif", fontSize:16, color:"#a07ee0", position:"relative", zIndex:1 }}>K</span>
              </div>
              <div>
                <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:16, color:"#e8e4f0", letterSpacing:1 }}>KADERA</div>
                <div style={{ fontSize:7, color:"rgba(232,228,240,0.4)", letterSpacing:3 }}>E-RATE DASHBOARD</div>
              </div>
            </div>

            {/* Nav tabs */}
            <div style={{ display:"flex", gap:6 }}>
              {["dashboard","search"].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 16px", fontFamily:"'DM Mono',monospace", fontSize:7.5, letterSpacing:2, border:`1px solid ${tab===t ? "rgba(138,99,210,0.6)" : "rgba(138,99,210,0.2)"}`, background: tab===t ? "rgba(138,99,210,0.12)" : "transparent", color: tab===t ? "#a07ee0" : "rgba(232,228,240,0.45)", cursor:"pointer", transition:"all 0.2s" }}>
                  {t.toUpperCase()}
                </button>
              ))}
              <button onClick={() => setTab("tags")} style={{ padding:"7px 16px", fontFamily:"'DM Mono',monospace", fontSize:7.5, letterSpacing:2, border:`1px solid ${tab==="tags" ? "rgba(240,180,41,0.6)" : "rgba(240,180,41,0.25)"}`, background: tab==="tags" ? "rgba(240,180,41,0.12)" : "transparent", color: tab==="tags" ? "#f0b429" : "rgba(240,180,41,0.5)", cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:6 }}>
                ★ MY TAGS {tagCount > 0 && <span style={{ background:"rgba(240,180,41,0.2)", border:"1px solid rgba(240,180,41,0.4)", borderRadius:10, padding:"1px 6px", fontSize:6.5 }}>{tagCount}</span>}
              </button>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:10, color:"rgba(232,228,240,0.4)", letterSpacing:1.5 }}>{clock}</span>
              <button onClick={handleSync} style={{ padding:"7px 14px", fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:2, border:"1px solid rgba(59,158,255,0.35)", background:"rgba(59,158,255,0.06)", color:"#3b9eff", cursor:"pointer" }}>↺ SYNC</button>
              <a href="https://forms.universalservice.org/portal/" target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 14px", fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:2, border:"1px solid rgba(138,99,210,0.5)", background:"rgba(138,99,210,0.1)", color:"#a07ee0", textDecoration:"none", animation:"glow-p 3s infinite", clipPath:"polygon(0 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%)" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#a07ee0", animation:"pulse-dot 1.5s infinite" }}/>
                USAC PORTAL
              </a>
              <button onClick={() => signOut()} style={{ padding:"7px 12px", fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:2, border:"1px solid rgba(240,97,74,0.3)", background:"transparent", color:"rgba(240,97,74,0.6)", cursor:"pointer" }}>SIGN OUT</button>
            </div>
          </div>

          {tab === "dashboard" && (
            <>
              {/* STAT STRIP */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20, animation:"fade-up 0.5s ease 0.1s both" }}>
                <StatCard label="// CURRENT FUNDING YEAR" value="FY2026"    sub="Window Open"                          color="purple"/>
                <StatCard label="// SYNCED FORM 470s"     value={stats ? stats.total_470s : "—"}  sub="In database"   color="blue"/>
                <StatCard label="// OPEN 470s"            value={stats ? stats.open_470s  : "—"}  sub="Active bidding" color="gold"/>
                <StatCard label="// COMMITMENTS"          value={stats ? stats.total_commitments : "—"} sub="FY2026"   color="green"/>
              </div>

              {/* MAIN GRID */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 340px", gap:14, animation:"fade-up 0.5s ease 0.2s both" }}>

                {/* COL 1: TOOLS */}
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <Panel>
                    <PTitle>{'// E-RATE '}<span style={{ color:"#a07ee0" }}>QUICK ACCESS TOOLS</span></PTitle>
                    <div style={{ padding:"12px 14px" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        <ToolBtn onClick={() => setC2Open(true)} color="gold" icon="💰" name="E-RATE C2 BUDGET" desc="Look up Category 2 budget, committed, disbursed, and remaining amounts by entity or BEN."/>
                        <ToolBtn href="https://opendata.usac.org/E-rate/E-Rate-Entity-Search/qe3b-nkqm"                       color="blue"   icon="🔍" name="ENTITY SEARCH"        desc="Search schools, libraries, and providers by name or BEN."/>
                        <ToolBtn href="https://www.usac.org/e-rate/tools/window-status/"                                      color="gold"   icon="📅" name="WINDOW REPORTING"     desc="Check filing windows, open/close dates, and deadlines."/>
                        <ToolBtn onClick={() => setFrnOpen(true)}                                                              color="blue"   icon="📋" name="FRN STATUS FY2016+"   desc="Search FRN status from local USAC commitment data."/>
                        <ToolBtn onClick={() => setCiOpen(true)} wide color="purple" icon="📡" name="COMPETITIVE INTELLIGENCE" desc="Top providers, manufacturer presence, and service type breakdown from FY2026 TX commitments."/>
                      </div>
                    </div>
                  </Panel>

                  {/* Deadlines */}
                  <Panel>
                    <PTitle>{'// FY2026 '}<span style={{ color:"#a07ee0" }}>KEY DEADLINES</span></PTitle>
                    <div style={{ padding:"10px 14px" }}>
                      {[
                        { name:"Form 470 Window", sub:"Open Now", status:"OPEN", color:"#39ff14", pulse:true },
                        { name:"Form 471 Window", sub:"Opens Jan 2026", status:"UPCOMING", color:"#f0b429", pulse:true },
                        { name:"SPIN Registration", sub:"Ongoing", status:"OPEN", color:"rgba(232,228,240,0.35)", pulse:false },
                        { name:"BEAR / 486 Deadlines", sub:"120 days after service start", status:"ROLLING", color:"rgba(232,228,240,0.35)", pulse:false },
                      ].map((d,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 9px", border:`1px solid ${d.color}25`, background:`${d.color}06`, marginBottom:6, borderRadius:1 }}>
                          <div style={{ width:6, height:6, borderRadius:"50%", background:d.color, flexShrink:0, ...(d.pulse && { animation:"pulse-dot 1.5s infinite" }) }}/>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:8, color:"#e8e4f0" }}>{d.name}</div>
                            <div style={{ fontSize:6.5, color:"rgba(232,228,240,0.4)", marginTop:1 }}>{d.sub}</div>
                          </div>
                          <div style={{ fontSize:7, color:d.color }}>{d.status}</div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>

                {/* COL 2: 470 FEED */}
                {token && <Feed470 token={token} onTagsUpdated={() => refreshTagCount(token)} />}

                {/* COL 3: SIDEBAR */}
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {/* USAC status */}
                  <div style={{ background:"rgba(10,8,20,0.95)", border:"1px solid rgba(57,255,20,0.3)", padding:"9px 14px", display:"flex", alignItems:"center", gap:9, position:"relative", clipPath:"polygon(0 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%)" }}>
                    <div style={{ position:"absolute", top:0, left:0, width:9, height:9, borderTop:"1.5px solid #39ff14", borderLeft:"1.5px solid #39ff14" }}/>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:"#39ff14", animation:"pulse-dot 1.5s infinite", boxShadow:"0 0 6px #39ff14" }}/>
                    <span style={{ fontSize:7.5, color:"#e8e4f0", flex:1, letterSpacing:1 }}>USAC OPEN DATA API ONLINE</span>
                  </div>

                  <BidResponseOverview token={token} />

                  <Panel>
                    <PTitle>{'// USAC '}<span style={{ color:"#a07ee0" }}>PORTAL NAVIGATION</span></PTitle>
                    <div style={{ padding:"9px 14px", display:"flex", flexDirection:"column", gap:6 }}>
                      {[
                        { href:"https://forms.universalservice.org/portal/", icon:"🏛️", name:"EPC PORTAL", sub:"E-Rate Productivity Center" },
                        { href:"https://opendata.usac.org/browse?category=E-rate", icon:"📊", name:"USAC OPEN DATA", sub:"Datasets and API explorer" },
                        { href:"https://www.usac.org/e-rate/applicant-process/the-application-process/form-470-competitive-bidding/", icon:"📝", name:"FORM 470 GUIDE", sub:"Competitive bidding process" },
                        { href:"https://www.usac.org/e-rate/applicant-process/the-application-process/form-471-funding-request/", icon:"📨", name:"FORM 471 GUIDE", sub:"Funding request submission" },
                        { href:"https://www.usac.org/e-rate/resources/rules-policies/", icon:"📚", name:"RULES & POLICIES", sub:"E-Rate program guidelines" },
                      ].map((l,i) => (
                        <a key={i} href={l.href} target="_blank" rel="noreferrer"
                          style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", border:"1px solid rgba(138,99,210,0.15)", background:"rgba(138,99,210,0.03)", textDecoration:"none", transition:"all 0.2s", clipPath:"polygon(0 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%)" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(138,99,210,0.5)"; e.currentTarget.style.background="rgba(138,99,210,0.08)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(138,99,210,0.15)"; e.currentTarget.style.background="rgba(138,99,210,0.03)"; }}>
                          <div style={{ fontSize:14 }}>{l.icon}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:8, color:"#e8e4f0" }}>{l.name}</div>
                            <div style={{ fontSize:6.5, color:"rgba(232,228,240,0.4)", marginTop:1 }}>{l.sub}</div>
                          </div>
                          <div style={{ fontSize:8, color:"rgba(232,228,240,0.35)" }}>→</div>
                        </a>
                      ))}
                    </div>
                  </Panel>

                  {/* Logged in user */}
                  <Panel>
                    <PTitle>{'// SESSION'}</PTitle>
                    <div style={{ padding:"10px 14px" }}>
                      <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.6)", marginBottom:4 }}>{session?.user?.email}</div>
                      <div style={{ fontSize:6.5, color:"rgba(138,99,210,0.5)" }}>KADERA INTERNAL · E-RATE TEAM</div>
                    </div>
                  </Panel>
                </div>
              </div>
            </>
          )}

          {tab === "search" && token && <SearchPanel token={token} onTagsUpdated={() => refreshTagCount(token)} />}
          {tab === "tags"   && token && <TagsPanel token={token} onTagsUpdated={() => refreshTagCount(token)} />}

        </div>
      </div>
    </>
  );
}

