import React, { useState, useEffect, useCallback } from "react";

const API_URL = process.env.REACT_APP_API_URL || "https://kadera-backend-production-6a21.up.railway.app";

const STATES = ["ALL","TX","CA","NY","FL","IL","PA","OH","GA","NC","MI","WA","AZ","CO","VA","MA","TN","IN","MO","WI","MN","OR","KY","OK","NV","CT","UT","AR","MS","KS","NM","NE","ID","WV","HI","NH","ME","RI","MT","DE","SD","ND","AK","VT","WY"];

const SEARCH_TYPES = [
  { id:"contacts",    label:"Technical Contacts",  desc:"Search contacts listed on Form 470s" },
  { id:"470s",        label:"Form 470 Search",      desc:"Search competitive bidding applications" },
  { id:"471s",        label:"Form 471 Search",      desc:"Search funding requests" },
  { id:"commitments", label:"Commitments Search",   desc:"Search commitment decisions" },
];

const cols = {
  contacts:    ["billed_entity_name","state","tech_contact_name","tech_contact_email","tech_contact_phone","service_category","application_status"],
  "470s":      ["application_number","billed_entity_name","billed_entity_number","state","service_category","application_status","date_posted","bid_due_date"],
  "471s":      ["application_number","organization_name","org_state","chosen_category_of_service","form_471_status_name","funding_request_amount","certified_datetime"],
  commitments: ["funding_request_number","organization_name","state","form_471_service_type_name","funding_commitment_request","form_471_frn_status_name","fcdl_letter_date","spin_name"],
};

const colLabels = {
  application_number:"App #", billed_entity_name:"Entity", billed_entity_number:"BEN",
  state:"State", org_state:"State", service_category:"Service", application_status:"Status",
  date_posted:"Posted", bid_due_date:"Bid Due", tech_contact_name:"Contact Name",
  tech_contact_email:"Email", tech_contact_phone:"Phone", organization_name:"Organization",
  chosen_category_of_service:"Category", form_471_status_name:"Status",
  funding_request_amount:"Requested", certified_datetime:"Certified",
  funding_request_number:"FRN #", form_471_service_type_name:"Service Type",
  funding_commitment_request:"Committed", form_471_frn_status_name:"FRN Status",
  fcdl_letter_date:"FCDL Date", spin_name:"Provider",
};

const DATE_COLS = ["date_posted","bid_due_date","certified_datetime","fcdl_letter_date"];
const MONEY_COLS = ["funding_request_amount","funding_commitment_request"];

function fmtCell(col, val) {
  if (!val || val === "—") return "—";
  if (DATE_COLS.includes(col)) return new Date(val).toLocaleDateString();
  if (MONEY_COLS.includes(col) && typeof val === "number") return `$${val.toLocaleString()}`;
  return val;
}

function statusBadge(val) {
  const v = (val||"").toLowerCase();
  if (v.includes("open"))    return { bg:"#dcfce7", color:"#15803d", border:"#86efac" };
  if (v.includes("review"))  return { bg:"#fef3c7", color:"#92400e", border:"#fcd34d" };
  if (v.includes("commit") || v.includes("fund")) return { bg:"#dbeafe", color:"#1d4ed8", border:"#93c5fd" };
  if (v.includes("deny"))    return { bg:"#fff1f2", color:"#be123c", border:"#fca5a5" };
  return null;
}

export default function SearchPanel({ token, onTagsUpdated, onView470 }) {
  const [searchType, setSearchType] = useState("contacts");
  const [query, setQuery]           = useState("");
  const [state, setState]           = useState("TX");
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [tags, setTags]             = useState(new Set());
  const [tagError, setTagError]     = useState("");

  const loadTags = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/tags`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") setTags(new Set((json.data||[]).map(t => t.application_number)));
    } catch {}
  }, [token]);

  useEffect(() => { loadTags(); }, [loadTags]);

  async function toggleTag(e, row) {
    e.preventDefault(); e.stopPropagation();
    setTagError("");
    const appNum   = row.application_number;
    const isTagged = tags.has(appNum);
    try {
      if (isTagged) {
        const res  = await fetch(`${API_URL}/api/tags/${appNum}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
        const json = await res.json();
        if (json.status === "success") setTags(p => { const n = new Set(p); n.delete(appNum); return n; });
        else setTagError(json.message || "Failed to remove tag");
      } else {
        const res  = await fetch(`${API_URL}/api/tags`, { method:"POST",
          headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
          body: JSON.stringify({ application_number: appNum, billed_entity_name: row.billed_entity_name, state: row.state, service_category: row.service_category, bid_due_date: row.bid_due_date, funding_year: row.funding_year }) });
        const json = await res.json();
        if (json.status === "success") setTags(p => new Set([...p, appNum]));
        else setTagError(json.message || "Failed to tag");
      }
      if (onTagsUpdated) onTagsUpdated();
    } catch (err) { setTagError(err.message || "Network error"); }
  }

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true); setError(""); setResults(null);
    try {
      const params = new URLSearchParams({ ...(query && { search: query }), ...(state !== "ALL" && { state }), limit: 200 });
      const endpoint = searchType === "contacts" ? "search/contacts" : searchType;
      const res  = await fetch(`${API_URL}/api/${endpoint}?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") setResults(json.data || []);
      else setError(json.message || "Search failed");
    } catch { setError("Connection error — check backend"); }
    setLoading(false);
  }

  function exportCSV() {
    if (!results?.length) return;
    const keys = Object.keys(results[0]).filter(k => k !== "raw");
    const csv  = [keys.join(","), ...results.map(r => keys.map(k => `"${(r[k]||"").toString().replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = `kadera-${searchType}-${Date.now()}.csv`; a.click();
  }

  const currentCols = cols[searchType] || cols["470s"];

  return (
    <div style={{ padding:"16px", fontFamily:"'Inter', system-ui, sans-serif" }}>

      {/* Search type tabs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
        {SEARCH_TYPES.map(t => (
          <button key={t.id} onClick={() => { setSearchType(t.id); setResults(null); }}
            style={{ padding:"12px 14px", border:`1.5px solid ${searchType===t.id ? "#2563eb" : "#cbd5e1"}`, borderRadius:10, background: searchType===t.id ? "#eff6ff" : "#f8fafc", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}
            onMouseEnter={e => { if (searchType !== t.id) { e.currentTarget.style.borderColor="#93b4fd"; e.currentTarget.style.background="#f0f7ff"; } }}
            onMouseLeave={e => { if (searchType !== t.id) { e.currentTarget.style.borderColor="#cbd5e1"; e.currentTarget.style.background="#f8fafc"; } }}>
            <div style={{ fontSize:11, fontWeight:600, color: searchType===t.id ? "#2563eb" : "#475569", marginBottom:3 }}>{t.label}</div>
            <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.4 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display:"flex", gap:10, alignItems:"flex-end", marginBottom:16 }}>
        <div style={{ flex:1 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#475569", marginBottom:4 }}>Search Query</label>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder={searchType === "contacts" ? "Name, email, or entity..." : "Entity name, BEN, or application #..."}
            style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:"1.5px solid #cbd5e1", background:"#fff", fontSize:12, color:"#1e293b", outline:"none", fontFamily:"inherit", transition:"border-color 0.15s" }}
            onFocus={e => e.target.style.borderColor="#2563eb"}
            onBlur={e => e.target.style.borderColor="#cbd5e1"} />
        </div>
        <div style={{ width:120 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#475569", marginBottom:4 }}>State</label>
          <select value={state} onChange={e => setState(e.target.value)}
            style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1.5px solid #cbd5e1", background:"#fff", fontSize:12, color:"#1e293b", outline:"none", fontFamily:"inherit" }}>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading}
          style={{ padding:"8px 22px", borderRadius:8, border:"none", background: loading ? "#93b4fd" : "#2563eb", color:"#fff", fontSize:12, fontWeight:600, cursor: loading ? "not-allowed" : "pointer", whiteSpace:"nowrap", transition:"background 0.15s", fontFamily:"inherit" }}>
          {loading ? "Searching..." : "Search →"}
        </button>
      </form>

      {error && (
        <div style={{ padding:"10px 14px", borderRadius:8, border:"1.5px solid #fca5a5", background:"#fff1f2", color:"#be123c", fontSize:12, marginBottom:14 }}>
          ⚠ {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ border:"1.5px solid #cbd5e1", borderRadius:12, overflow:"hidden" }}>
          {/* Results header */}
          <div style={{ padding:"10px 16px", background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, fontWeight:600, color:"#475569" }}>{results.length} result{results.length !== 1 ? "s" : ""} found</span>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {tagError && <span style={{ fontSize:11, color:"#dc2626" }}>⚠ {tagError}</span>}
              {results.length > 0 && (
                <button onClick={exportCSV}
                  style={{ padding:"5px 12px", borderRadius:6, border:"1.5px solid #86efac", background:"#f0fdf4", color:"#15803d", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  ↓ Export CSV
                </button>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <div style={{ padding:"48px", textAlign:"center", fontSize:13, fontWeight:600, color:"#94a3b8" }}>
              No results found — try a different search term
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ borderBottom:"1.5px solid #e2e8f0", background:"#f8fafc" }}>
                    {currentCols.map(col => (
                      <th key={col} style={{ padding:"9px 14px", fontSize:10, fontWeight:600, color:"#64748b", textAlign:"left", whiteSpace:"nowrap", letterSpacing:0.3 }}>
                        {colLabels[col] || col}
                      </th>
                    ))}
                    <th style={{ padding:"9px 14px", fontSize:10, fontWeight:600, color:"#64748b" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => {
                    const is470Row = row.application_number && (searchType === "470s" || searchType === "contacts");
                    const is471Row = row.application_number && searchType === "471s";
                    const link = is471Row
                      ? `https://legacy.fundsforlearning.com/471/${row.application_number}`
                      : null;
                    return (
                      <tr key={i}
                        style={{ borderBottom:"1.5px solid #c8d6e8", cursor: link ? "pointer" : "default", transition:"background 0.1s" }}
                        onClick={() => {
                        if (is470Row && onView470) { onView470(String(row.application_number)); }
                        else if (link) window.open(link, "_blank");
                      }}
                        onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        {currentCols.map(col => {
                          const raw = row[col];
                          const val = fmtCell(col, raw);
                          const isStatus = col.includes("status");
                          const badge = isStatus ? statusBadge(val) : null;
                          return (
                            <td key={col} style={{ padding:"9px 14px", color:"#334155", whiteSpace: col === "billed_entity_name" || col === "organization_name" ? "normal" : "nowrap", maxWidth: col === "billed_entity_name" || col === "organization_name" ? 220 : undefined }}>
                              {badge ? (
                                <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, background:badge.bg, color:badge.color, border:`1px solid ${badge.border}`, fontSize:10, fontWeight:600 }}>{val}</span>
                              ) : col === "tech_contact_email" && val !== "—" ? (
                                <a href={`mailto:${val}`} onClick={e => e.stopPropagation()} style={{ color:"#2563eb", textDecoration:"none" }}>{val}</a>
                              ) : (
                                <span style={{ color: col === "application_number" || col === "funding_request_number" ? "#2563eb" : col === "funding_commitment_request" || col === "funding_request_amount" ? "#16a34a" : undefined, fontWeight: col === "application_number" || col === "funding_request_number" ? 600 : undefined }}>
                                  {val}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ padding:"9px 14px" }} onClick={e => e.stopPropagation()}>
                          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                            {is470Row && onView470 ? (
                              <button onClick={e => { e.stopPropagation(); onView470(String(row.application_number)); }}
                                style={{ background:"none", border:"none", color:"#2563eb", fontSize:11, fontWeight:600, cursor:"pointer", padding:0, textDecoration:"none", whiteSpace:"nowrap", fontFamily:"inherit" }}>
                                View 470 →
                              </button>
                            ) : link ? (
                              <a href={link} target="_blank" rel="noreferrer"
                                style={{ color:"#2563eb", fontSize:11, fontWeight:600, textDecoration:"none", whiteSpace:"nowrap" }}>
                                View →
                              </a>
                            ) : null}
                            {is470Row && (
                              <button onClick={e => toggleTag(e, row)}
                                style={{ padding:"3px 10px", borderRadius:5, border:`1.5px solid ${tags.has(row.application_number) ? "#86efac" : "#cbd5e1"}`, background: tags.has(row.application_number) ? "#f0fdf4" : "#f8fafc", color: tags.has(row.application_number) ? "#15803d" : "#64748b", fontSize:10, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit" }}>
                                {tags.has(row.application_number) ? "★ Tagged" : "☆ Tag"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
