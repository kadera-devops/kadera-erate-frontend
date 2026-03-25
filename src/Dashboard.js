import React, { useState, useEffect, useCallback } from "react";
import { getAuthToken, signOut } from "./supabaseClient";
import SearchPanel from "./SearchPanel";

const API_URL = process.env.REACT_APP_API_URL || "https://kadera-backend-production-6a21.up.railway.app";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Aldrich&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:#05050d; font-family:'DM Mono',monospace; color:#e8e4f0; overflow-x:hidden; }
  ::-webkit-scrollbar { width:2px; } ::-webkit-scrollbar-thumb { background:rgba(138,99,210,0.4); }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes scan      { 0%{top:-2px} 100%{top:100%} }
  @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes fade-up   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow-p    { 0%,100%{box-shadow:0 0 10px rgba(138,99,210,0.2)} 50%{box-shadow:0 0 22px rgba(138,99,210,0.5)} }
  @keyframes shimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
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

function ToolBtn({ href, color, icon, name, desc, wide }) {
  const colors = {
    purple: { border:"rgba(138,99,210,0.35)", bg:"rgba(138,99,210,0.05)", hover:"rgba(138,99,210,0.12)", text:"#a07ee0", corner:"#a07ee0" },
    blue:   { border:"rgba(59,158,255,0.3)",  bg:"rgba(59,158,255,0.04)",  hover:"rgba(59,158,255,0.1)",  text:"#3b9eff", corner:"#3b9eff" },
    gold:   { border:"rgba(240,180,41,0.3)",  bg:"rgba(240,180,41,0.04)",  hover:"rgba(240,180,41,0.1)",  text:"#f0b429", corner:"#f0b429" },
  };
  const c = colors[color] || colors.purple;
  const [hov, setHov] = useState(false);
  return (
    <a href={href} target="_blank" rel="noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"flex", flexDirection: wide ? "row" : "column", alignItems: wide ? "center" : "flex-start", gap: wide ? 12 : 5, padding:"12px 12px", border:`1px solid ${c.border}`, background: hov ? c.hover : c.bg, cursor:"pointer", textDecoration:"none", position:"relative", transition:"all 0.2s", clipPath:"polygon(0 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%)", gridColumn: wide ? "span 2" : undefined }}>
      <div style={{ position:"absolute", top:0, left:0, width:7, height:7, borderTop:`1px solid ${c.corner}`, borderLeft:`1px solid ${c.corner}` }}/>
      <div style={{ fontSize:wide ? 18 : 16 }}>{icon}</div>
      <div style={{ flex: wide ? 1 : undefined }}>
        <div style={{ fontSize:7.5, letterSpacing:1.5, color:c.text, marginBottom:3 }}>{name}</div>
        <div style={{ fontSize:6.5, color:"rgba(232,228,240,0.45)", lineHeight:1.5 }}>{desc}</div>
      </div>
      <div style={{ fontSize:7.5, color:c.text, opacity:0.5, marginTop: wide ? 0 : "auto", alignSelf: wide ? "center" : "flex-end" }}>→</div>
    </a>
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
    const s = (item.application_status || "").toLowerCase();
    if (s.includes("certif") && !s.includes("pending")) return "open";
    if (s.includes("pending") || s.includes("review") || s.includes("progress")) return "review";
    if (s.includes("cancel") || s.includes("withdraw")) return "closed";
    return "open";
  }

  const filtered = filter === "all" ? data : data.filter(d => getStatus(d) === filter);
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
        {["all","open","review","closed"].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(0); }} style={{ padding:"3px 9px", fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:1.5, border:`1px solid ${filter===f ? "rgba(138,99,210,0.6)" : "rgba(138,99,210,0.2)"}`, background: filter===f ? "rgba(138,99,210,0.1)" : "transparent", color: filter===f ? "#a07ee0" : "rgba(232,228,240,0.4)", cursor:"pointer" }}>{f.toUpperCase()}</button>
        ))}
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
          const status   = getStatus(item);
          const isTagged = tags.has(item.application_number);
          const badgeColor = status === "open" ? "#39ff14" : status === "review" ? "#f0b429" : "rgba(232,228,240,0.3)";
          const badgeBg    = status === "open" ? "rgba(57,255,20,0.08)" : status === "review" ? "rgba(240,180,41,0.08)" : "rgba(138,99,210,0.08)";
          const badgeTxt   = status === "open" ? "CERTIFIED" : status === "review" ? "PENDING" : "CLOSED";
          return (
            <a key={i} href={get470Link(item.application_number)} target="_blank" rel="noreferrer"
              style={{ display:"flex", flexDirection:"column", gap:3, padding:"9px 14px", borderBottom:"1px solid rgba(138,99,210,0.1)", textDecoration:"none", transition:"background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(138,99,210,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:9, color:"#3b9eff", flex:1, fontWeight:500 }}>Form 470 · {item.application_number}</span>
                <span style={{ fontSize:6, letterSpacing:1.5, padding:"2px 7px", background:badgeBg, border:`1px solid ${badgeColor}40`, color:badgeColor }}>{badgeTxt}</span>
                <button onClick={e => toggleTag(e, item)}
                  style={{ fontSize:6.5, letterSpacing:1.5, padding:"2px 8px", border:`1px solid ${isTagged ? "rgba(240,180,41,0.7)" : "rgba(138,99,210,0.3)"}`, background: isTagged ? "rgba(240,180,41,0.12)" : "rgba(138,99,210,0.06)", color: isTagged ? "#f0b429" : "rgba(232,228,240,0.4)", cursor:"pointer", fontFamily:"'DM Mono',monospace", transition:"all 0.15s" }}>
                  {isTagged ? "★ TAGGED" : "☆ TAG"}
                </button>
              </div>
              <div style={{ fontSize:8, color:"rgba(232,228,240,0.75)" }}>{item.billed_entity_name}{item.state ? ` · ${item.state}` : ""}</div>
              <div style={{ display:"flex", gap:10 }}>
                <span style={{ fontSize:6.5, color:"#a07ee0" }}>FY{item.funding_year}</span>
                {item.service_category && <span style={{ fontSize:6.5, color:"rgba(232,228,240,0.4)" }}>{item.service_category}</span>}
                {item.bid_due_date && <span style={{ fontSize:6.5, color:"rgba(240,180,41,0.6)" }}>Bid Due: {new Date(item.bid_due_date).toLocaleDateString()}</span>}
                {item.date_posted && <span style={{ fontSize:6.5, color:"rgba(232,228,240,0.4)" }}>Posted: {new Date(item.date_posted).toLocaleDateString()}</span>}
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
function TagsPanel({ token, onTagsUpdated }) {
  const [tags, setTags]     = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/tags`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") setTags(json.data || []);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function removeTag(appNum) {
    await fetch(`${API_URL}/api/tags/${appNum}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
    setTags(prev => prev.filter(t => t.application_number !== appNum));
    if (onTagsUpdated) onTagsUpdated();
  }

  return (
    <div style={{ animation:"fade-up 0.4s ease both" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:14, color:"#f0b429", letterSpacing:1 }}>★ MY TAGGED 470s</div>
        <span style={{ fontSize:7.5, color:"rgba(232,228,240,0.4)", letterSpacing:2 }}>{tags.length} TAGGED</span>
      </div>

      <div style={{ background:"rgba(10,8,20,0.95)", border:"1px solid rgba(240,180,41,0.3)", position:"relative", clipPath:"polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)" }}>
        <div style={{ position:"absolute", top:0, left:0, width:12, height:12, borderTop:"1.5px solid #f0b429", borderLeft:"1.5px solid #f0b429" }}/>
        <div style={{ position:"absolute", bottom:13, right:-1, width:20, height:1.5, background:"rgba(240,180,41,0.35)", transform:"rotate(-45deg)", transformOrigin:"right center" }}/>

        {/* Table header */}
        <div style={{ display:"grid", gridTemplateColumns:"1.5fr 2fr 1fr 1fr 1.2fr 80px", gap:0, padding:"8px 16px", borderBottom:"1px solid rgba(240,180,41,0.2)", background:"rgba(240,180,41,0.04)" }}>
          {["APP #","ENTITY","STATE","SERVICE","BID DUE DATE",""].map((h,i) => (
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
        ) : tags.map((tag, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"1.5fr 2fr 1fr 1fr 1.2fr 80px", gap:0, padding:"10px 16px", borderBottom: i < tags.length-1 ? "1px solid rgba(240,180,41,0.08)" : "none", alignItems:"center", transition:"background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(240,180,41,0.04)"}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            <a href={`https://legacy.fundsforlearning.com/470/${tag.application_number}`} target="_blank" rel="noreferrer"
              style={{ fontSize:8.5, color:"#3b9eff", textDecoration:"none", fontWeight:500 }}>
              {tag.application_number}
            </a>
            <div style={{ fontSize:8, color:"rgba(232,228,240,0.8)", paddingRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tag.billed_entity_name || "—"}</div>
            <div style={{ fontSize:8, color:"rgba(232,228,240,0.5)" }}>{tag.state || "—"}</div>
            <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.4)", paddingRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tag.service_category || "—"}</div>
            <div style={{ fontSize:8, color: tag.bid_due_date ? "#f0b429" : "rgba(232,228,240,0.3)", fontWeight: tag.bid_due_date ? 500 : 400 }}>
              {tag.bid_due_date ? new Date(tag.bid_due_date).toLocaleDateString() : "—"}
            </div>
            <button onClick={() => removeTag(tag.application_number)}
              style={{ fontSize:7, letterSpacing:1, padding:"3px 8px", border:"1px solid rgba(240,97,74,0.3)", background:"rgba(240,97,74,0.06)", color:"rgba(240,97,74,0.7)", cursor:"pointer", fontFamily:"'DM Mono',monospace", transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(240,97,74,0.15)"; e.currentTarget.style.color="#f0614a"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(240,97,74,0.06)"; e.currentTarget.style.color="rgba(240,97,74,0.7)"; }}>
              ✕ REMOVE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ session }) {
  const [token, setToken]     = useState(null);
  const [stats, setStats]     = useState(null);
  const [tab, setTab]         = useState("dashboard");
  const [clock, setClock]     = useState("");
  const [tagCount, setTagCount] = useState(0);

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
                <StatCard label="// CURRENT FUNDING YEAR" value="FY2025"    sub="Window Open"                          color="purple"/>
                <StatCard label="// SYNCED FORM 470s"     value={stats ? stats.total_470s : "—"}  sub="In database"   color="blue"/>
                <StatCard label="// OPEN 470s"            value={stats ? stats.open_470s  : "—"}  sub="Active bidding" color="gold"/>
                <StatCard label="// COMMITMENTS"          value={stats ? stats.total_commitments : "—"} sub="FY2025"   color="green"/>
              </div>

              {/* MAIN GRID */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 340px", gap:14, animation:"fade-up 0.5s ease 0.2s both" }}>

                {/* COL 1: TOOLS */}
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <Panel>
                    <PTitle>{'// E-RATE '}<span style={{ color:"#a07ee0" }}>QUICK ACCESS TOOLS</span></PTitle>
                    <div style={{ padding:"12px 14px" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        <ToolBtn href="https://www.usac.org/e-rate/applicant-process/before-you-begin/budget-tool/"          color="purple" icon="💰" name="E-RATE C2 BUDGET"     desc="Calculate and track your Category 2 five-year budget cycle."/>
                        <ToolBtn href="https://opendata.usac.org/E-rate/E-Rate-Entity-Search/qe3b-nkqm"                       color="blue"   icon="🔍" name="ENTITY SEARCH"        desc="Search schools, libraries, and providers by name or BEN."/>
                        <ToolBtn href="https://www.usac.org/e-rate/tools/window-status/"                                      color="gold"   icon="📅" name="WINDOW REPORTING"     desc="Check filing windows, open/close dates, and deadlines."/>
                        <ToolBtn href="https://www.usac.org/e-rate/tools/frn-status-tool/"                                    color="blue"   icon="📋" name="FRN STATUS FY2016+"   desc="Track Funding Request Number status for FY2016 and later."/>
                        <ToolBtn href="https://www.usac.org/e-rate/tools/commitments-search/" wide color="purple" icon="✅" name="SEARCH COMMITMENTS TOOL" desc="Search commitment decisions, funding amounts, and disbursement records across all funding years."/>
                      </div>
                    </div>
                  </Panel>

                  {/* Deadlines */}
                  <Panel>
                    <PTitle>{'// FY2025 '}<span style={{ color:"#a07ee0" }}>KEY DEADLINES</span></PTitle>
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

          {tab === "search" && token && <SearchPanel token={token} />}
          {tab === "tags"   && token && <TagsPanel token={token} onTagsUpdated={() => refreshTagCount(token)} />}

        </div>
      </div>
    </>
  );
}

