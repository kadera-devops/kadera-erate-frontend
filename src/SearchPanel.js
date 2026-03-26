import React, { useState, useEffect, useCallback } from "react";

const API_URL = process.env.REACT_APP_API_URL || "https://kadera-backend-production-6a21.up.railway.app";

const STATES = ["ALL","TX","CA","NY","FL","IL","PA","OH","GA","NC","MI","WA","AZ","CO","VA","MA","TN","IN","MO","WI","MN","OR","KY","OK","NV","CT","UT","AR","MS","KS","NM","NE","ID","WV","HI","NH","ME","RI","MT","DE","SD","ND","AK","VT","WY"];

export default function SearchPanel({ token, onTagsUpdated }) {
  const [searchType, setSearchType] = useState("contacts");
  const [query,      setQuery]      = useState("");
  const [state,      setState]      = useState("TX");
  const [results,    setResults]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [tags,       setTags]       = useState(new Set());

  const loadTags = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/tags`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") setTags(new Set((json.data||[]).map(t => t.application_number)));
    } catch {}
  }, [token]);

  useEffect(() => { loadTags(); }, [loadTags]);

  const [tagError, setTagError] = useState("");

  async function toggleTag(e, row) {
    e.preventDefault();
    e.stopPropagation();
    setTagError("");
    const appNum   = row.application_number;
    const isTagged = tags.has(appNum);
    try {
      if (isTagged) {
        const res  = await fetch(`${API_URL}/api/tags/${appNum}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
        const json = await res.json();
        if (json.status === "success") {
          setTags(prev => { const n = new Set(prev); n.delete(appNum); return n; });
        } else setTagError(json.message || "Failed to remove tag");
      } else {
        const res  = await fetch(`${API_URL}/api/tags`, { method:"POST",
          headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
          body: JSON.stringify({ application_number: appNum, billed_entity_name: row.billed_entity_name, state: row.state, service_category: row.service_category, bid_due_date: row.bid_due_date, funding_year: row.funding_year }) });
        const json = await res.json();
        if (json.status === "success") {
          setTags(prev => new Set([...prev, appNum]));
        } else setTagError(json.message || "Failed to tag 470");
      }
      if (onTagsUpdated) onTagsUpdated();
    } catch (err) {
      setTagError(err.message || "Network error");
    }
  }

  const SEARCH_TYPES = [
    { id:"contacts",    label:"TECHNICAL CONTACTS",  desc:"Search contacts listed on Form 470s" },
    { id:"470s",        label:"FORM 470 SEARCH",      desc:"Search competitive bidding applications" },
    { id:"471s",        label:"FORM 471 SEARCH",      desc:"Search funding requests" },
    { id:"commitments", label:"COMMITMENTS SEARCH",   desc:"Search commitment decisions" },
  ];

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const params = new URLSearchParams({ ...(query && { search: query }), ...(state !== "ALL" && { state }), limit: 200 });
      const endpoint = searchType === "contacts" ? "search/contacts" : searchType;
      const res  = await fetch(`${API_URL}/api/${endpoint}?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.status === "success") setResults(json.data || []);
      else setError(json.message || "Search failed");
    } catch (err) {
      setError("Connection error — check backend");
    }
    setLoading(false);
  }

  function exportCSV() {
    if (!results?.length) return;
    const keys = Object.keys(results[0]).filter(k => k !== "raw");
    const csv  = [keys.join(","), ...results.map(r => keys.map(k => `"${(r[k]||"").toString().replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = `kadera-erate-${searchType}-${Date.now()}.csv`; a.click();
  }

  const cols = {
    contacts:    ["billed_entity_name","state","tech_contact_name","tech_contact_email","tech_contact_phone","service_category","application_status"],
    "470s":      ["application_number","billed_entity_name","billed_entity_number","state","service_category","application_status","date_posted","bid_due_date"],
    "471s":      ["application_number","organization_name","org_state","chosen_category_of_service","form_471_status_name","funding_request_amount","certified_datetime"],
    commitments: ["funding_request_number","organization_name","state","form_471_service_type_name","funding_commitment_request","form_471_frn_status_name","fcdl_letter_date","spin_name"],
  };

  const colLabels = {
    application_number:"APP #", billed_entity_name:"ENTITY", billed_entity_number:"BEN",
    state:"STATE", org_state:"STATE", service_category:"SERVICE", application_status:"STATUS",
    date_posted:"POSTED", bid_due_date:"BID DUE", frn:"FRN",
    service_type:"SERVICE TYPE", amount_requested:"REQUESTED", amount_committed:"COMMITTED",
    disbursed_amount:"DISBURSED", commitment_date:"DATE", status:"STATUS",
    tech_contact_name:"CONTACT NAME", tech_contact_email:"EMAIL", tech_contact_phone:"PHONE",
    organization_name:"ORGANIZATION", chosen_category_of_service:"CATEGORY",
    form_471_status_name:"STATUS", funding_request_amount:"REQUESTED",
    certified_datetime:"CERTIFIED", funding_request_number:"FRN #",
    form_471_service_type_name:"SERVICE TYPE", funding_commitment_request:"COMMITTED",
    form_471_frn_status_name:"FRN STATUS", fcdl_letter_date:"FCDL DATE", spin_name:"PROVIDER",
  };

  const currentCols = cols[searchType] || cols["470s"];

  return (
    <div style={{ animation:"fade-up 0.4s ease both" }}>
      {/* Search type selector */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        {SEARCH_TYPES.map(t => (
          <div key={t.id} onClick={() => { setSearchType(t.id); setResults(null); }}
            style={{ padding:"12px 14px", border:`1px solid ${searchType===t.id ? "rgba(138,99,210,0.6)" : "rgba(138,99,210,0.2)"}`, cursor:"pointer", position:"relative", clipPath:"polygon(0 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%)", transition:"all 0.2s", background: searchType===t.id ? "rgba(138,99,210,0.1)" : "rgba(10,8,20,0.95)" }}>
            <div style={{ position:"absolute", top:0, left:0, width:9, height:9, borderTop:`1.5px solid ${searchType===t.id ? "#a07ee0" : "rgba(138,99,210,0.35)"}`, borderLeft:`1.5px solid ${searchType===t.id ? "#a07ee0" : "rgba(138,99,210,0.35)"}` }}/>
            <div style={{ fontSize:7.5, letterSpacing:1.5, color: searchType===t.id ? "#a07ee0" : "rgba(232,228,240,0.5)", marginBottom:4 }}>{t.label}</div>
            <div style={{ fontSize:6.5, color:"rgba(232,228,240,0.3)" }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Search form */}
      <div style={{ background:"rgba(10,8,20,0.95)", border:"1px solid rgba(138,99,210,0.3)", padding:"16px 18px", marginBottom:18, position:"relative", clipPath:"polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)" }}>
        <div style={{ position:"absolute", top:0, left:0, width:12, height:12, borderTop:"1.5px solid #a07ee0", borderLeft:"1.5px solid #a07ee0" }}/>
        <form onSubmit={handleSearch} style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:6.5, letterSpacing:2, color:"rgba(232,228,240,0.4)", marginBottom:6 }}>SEARCH QUERY</div>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder={searchType === "contacts" ? "Name, email, or entity..." : "Entity name, BEN, or application #..."}
              style={{ width:"100%", background:"rgba(138,99,210,0.06)", border:"1px solid rgba(138,99,210,0.3)", color:"#e8e4f0", fontFamily:"'DM Mono',monospace", fontSize:11, padding:"9px 12px", outline:"none" }}
              onFocus={e => e.target.style.borderColor="rgba(138,99,210,0.65)"}
              onBlur={e => e.target.style.borderColor="rgba(138,99,210,0.3)"}
            />
          </div>
          <div style={{ width:120 }}>
            <div style={{ fontSize:6.5, letterSpacing:2, color:"rgba(232,228,240,0.4)", marginBottom:6 }}>STATE</div>
            <select value={state} onChange={e => setState(e.target.value)}
              style={{ width:"100%", background:"rgba(138,99,210,0.06)", border:"1px solid rgba(138,99,210,0.3)", color:"#e8e4f0", fontFamily:"'DM Mono',monospace", fontSize:10, padding:"9px 10px", outline:"none" }}>
              {STATES.map(s => <option key={s} value={s} style={{ background:"#0a0814" }}>{s}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading}
            style={{ padding:"9px 22px", fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:2, border:"1px solid rgba(138,99,210,0.5)", background: loading ? "rgba(138,99,210,0.06)" : "rgba(138,99,210,0.12)", color:"#a07ee0", cursor: loading ? "not-allowed" : "pointer", whiteSpace:"nowrap", clipPath:"polygon(0 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%)" }}>
            {loading ? "SEARCHING..." : "SEARCH →"}
          </button>
        </form>
        {error && <div style={{ marginTop:10, fontSize:8, color:"#f0614a", padding:"6px 10px", background:"rgba(240,97,74,0.08)", border:"1px solid rgba(240,97,74,0.3)" }}>{error}</div>}
      </div>

      {/* Results */}
      {results && (
        <div style={{ background:"rgba(10,8,20,0.95)", border:"1px solid rgba(138,99,210,0.3)", position:"relative", clipPath:"polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)" }}>
          <div style={{ position:"absolute", top:0, left:0, width:12, height:12, borderTop:"1.5px solid #a07ee0", borderLeft:"1.5px solid #a07ee0" }}/>
          <div style={{ padding:"10px 16px", borderBottom:"1px solid rgba(138,99,210,0.15)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:7, letterSpacing:2, color:"rgba(232,228,240,0.45)" }}>{results.length} RESULTS FOUND</span>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {tagError && <span style={{ fontSize:7, color:"#f0614a" }}>⚠ {tagError}</span>}
              {results.length > 0 && (
                <button onClick={exportCSV} style={{ padding:"4px 12px", fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:1.5, border:"1px solid rgba(57,255,20,0.35)", background:"rgba(57,255,20,0.06)", color:"#39ff14", cursor:"pointer" }}>↓ EXPORT CSV</button>
              )}
            </div>
          </div>
          {results.length === 0 ? (
            <div style={{ padding:"30px", textAlign:"center", fontSize:9, color:"rgba(138,99,210,0.4)" }}>NO RESULTS FOUND — TRY A DIFFERENT SEARCH</div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid rgba(138,99,210,0.2)" }}>
                    {currentCols.map(col => (
                      <th key={col} style={{ padding:"8px 12px", fontSize:6.5, letterSpacing:1.5, color:"rgba(138,99,210,0.6)", textAlign:"left", fontWeight:"normal", whiteSpace:"nowrap", background:"rgba(138,99,210,0.04)" }}>
                        {colLabels[col] || col.toUpperCase()}
                      </th>
                    ))}
                    <th style={{ padding:"8px 12px", fontSize:6.5, color:"rgba(138,99,210,0.6)", background:"rgba(138,99,210,0.04)", fontWeight:"normal" }}>LINK</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => {
                    const is470Row = row.application_number && (searchType === "470s" || searchType === "contacts");
                    const is471Row = row.application_number && searchType === "471s";
                    const link = is470Row
                      ? `https://legacy.fundsforlearning.com/470/${row.application_number}`
                      : is471Row
                      ? `https://legacy.fundsforlearning.com/471/${row.application_number}`
                      : null;
                    return (
                    <tr key={i} style={{ borderBottom:"1px solid rgba(138,99,210,0.08)", transition:"background 0.15s", cursor: link ? "pointer" : "default" }}
                      onClick={() => link && window.open(link, "_blank")}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(138,99,210,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      {currentCols.map(col => {
                        let val = row[col] || "—";
                        if (typeof val === "number") val = col.includes("amount") || col.includes("committed") || col.includes("disbursed") || col.includes("request") ? `$${val.toLocaleString()}` : val;
                        if (["date_posted","bid_due_date","commitment_date","certified_datetime","fcdl_letter_date"].includes(col)) val = val && val !== "—" ? new Date(val).toLocaleDateString() : "—";
                        const isStatus = col.includes("status");
                        const statusColor = isStatus ? ((val||"").toLowerCase().includes("open") ? "#39ff14" : (val||"").toLowerCase().includes("review") ? "#f0b429" : "rgba(232,228,240,0.4)") : null;
                        return (
                          <td key={col} style={{ padding:"8px 12px", fontSize:8, color: statusColor || "rgba(232,228,240,0.75)", whiteSpace: col === "billed_entity_name" ? "normal" : "nowrap", maxWidth: col === "billed_entity_name" ? 200 : undefined }}>
                            {col === "tech_contact_email" && val !== "—" ? <a href={`mailto:${val}`} onClick={e => e.stopPropagation()} style={{ color:"#3b9eff", textDecoration:"none" }}>{val}</a> : val}
                          </td>
                        );
                      })}
                      <td style={{ padding:"8px 12px" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                          {link && (
                            <a href={link} target="_blank" rel="noreferrer"
                              style={{ fontSize:7, color:"#3b9eff", textDecoration:"none", padding:"2px 8px", border:"1px solid rgba(59,158,255,0.3)", background:"rgba(59,158,255,0.05)", whiteSpace:"nowrap" }}>
                              VIEW →
                            </a>
                          )}
                          {is470Row && (
                            <button onClick={e => toggleTag(e, row)}
                              style={{ fontSize:7, letterSpacing:1, padding:"2px 7px", border:`1px solid ${tags.has(row.application_number) ? "rgba(240,180,41,0.6)" : "rgba(138,99,210,0.3)"}`, background: tags.has(row.application_number) ? "rgba(240,180,41,0.1)" : "rgba(138,99,210,0.05)", color: tags.has(row.application_number) ? "#f0b429" : "rgba(232,228,240,0.45)", cursor:"pointer", fontFamily:"'DM Mono',monospace", whiteSpace:"nowrap" }}>
                              {tags.has(row.application_number) ? "★" : "☆"}
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
