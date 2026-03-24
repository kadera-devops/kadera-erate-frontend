import React, { useState } from "react";
import { signIn } from "./supabaseClient";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Aldrich&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --bg:#05050d; --purple:#8a63d2; --purple2:#a07ee0;
    --white:#e8e4f0; --muted:rgba(232,228,240,0.45); --border:rgba(138,99,210,0.3);
  }
  body { background:var(--bg); font-family:'DM Mono',monospace; }
  @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fade-up  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 20px rgba(138,99,210,0.2)} 50%{box-shadow:0 0 40px rgba(138,99,210,0.45)} }
`;

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await signIn(email, password);
    if (err) { setError(err.message); setLoading(false); }
  }

  return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight:"100vh", background:"#05050d", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
        {/* Background effects */}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 50% at 50% 40%, rgba(138,99,210,0.1) 0%, transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, rgba(138,99,210,0.7) 1px, transparent 1px)", backgroundSize:"28px 28px", opacity:0.04, pointerEvents:"none" }}/>

        {/* Login card */}
        <div style={{ width:380, background:"rgba(10,8,20,0.97)", border:"1px solid rgba(138,99,210,0.35)", position:"relative", clipPath:"polygon(0 0,100% 0,100% calc(100% - 20px),calc(100% - 20px) 100%,0 100%)", animation:"fade-up 0.5s ease both, glow 4s ease-in-out infinite" }}>
          {/* Corner brackets */}
          <div style={{ position:"absolute", top:0, left:0, width:14, height:14, borderTop:"2px solid #a07ee0", borderLeft:"2px solid #a07ee0" }}/>
          <div style={{ position:"absolute", bottom:19, right:-1, width:28, height:1.5, background:"rgba(138,99,210,0.4)", transform:"rotate(-45deg)", transformOrigin:"right center" }}/>

          {/* Header */}
          <div style={{ padding:"28px 28px 20px", borderBottom:"1px solid rgba(138,99,210,0.15)", textAlign:"center" }}>
            {/* Hex logo */}
            <div style={{ position:"relative", width:52, height:52, margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="52" height="52" viewBox="0 0 52 52" style={{ position:"absolute", inset:0, animation:"spin 18s linear infinite" }}>
                <polygon points="26,2 47,13.5 47,38.5 26,50 5,38.5 5,13.5" fill="none" stroke="rgba(138,99,210,0.55)" strokeWidth="1.2"/>
                <polygon points="26,7 42,16.5 42,35.5 26,45 10,35.5 10,16.5" fill="none" stroke="rgba(138,99,210,0.22)" strokeWidth="0.6"/>
              </svg>
              <span style={{ fontFamily:"'Aldrich',sans-serif", fontSize:20, color:"#a07ee0", position:"relative", zIndex:1 }}>K</span>
            </div>
            <div style={{ fontFamily:"'Aldrich',sans-serif", fontSize:18, color:"#e8e4f0", letterSpacing:1, marginBottom:4 }}>KADERA</div>
            <div style={{ fontSize:7.5, color:"rgba(232,228,240,0.45)", letterSpacing:3 }}>E-RATE DASHBOARD</div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ padding:"24px 28px 28px" }}>
            <div style={{ fontSize:7, letterSpacing:2.5, color:"rgba(138,99,210,0.6)", marginBottom:18, textAlign:"center" }}>// AUTHORIZED ACCESS ONLY</div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:7, letterSpacing:2, color:"rgba(232,228,240,0.4)", marginBottom:6 }}>EMAIL ADDRESS</div>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width:"100%", background:"rgba(138,99,210,0.06)", border:"1px solid rgba(138,99,210,0.3)", color:"#e8e4f0", fontFamily:"'DM Mono',monospace", fontSize:11, padding:"10px 12px", outline:"none", transition:"border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor="rgba(138,99,210,0.7)"}
                onBlur={e => e.target.style.borderColor="rgba(138,99,210,0.3)"}
              />
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:7, letterSpacing:2, color:"rgba(232,228,240,0.4)", marginBottom:6 }}>PASSWORD</div>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width:"100%", background:"rgba(138,99,210,0.06)", border:"1px solid rgba(138,99,210,0.3)", color:"#e8e4f0", fontFamily:"'DM Mono',monospace", fontSize:11, padding:"10px 12px", outline:"none", transition:"border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor="rgba(138,99,210,0.7)"}
                onBlur={e => e.target.style.borderColor="rgba(138,99,210,0.3)"}
              />
            </div>

            {error && (
              <div style={{ fontSize:8, color:"#f0614a", marginBottom:14, padding:"8px 10px", background:"rgba(240,97,74,0.08)", border:"1px solid rgba(240,97,74,0.3)", letterSpacing:1 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width:"100%", padding:"11px", background: loading ? "rgba(138,99,210,0.1)" : "rgba(138,99,210,0.15)", border:"1px solid rgba(138,99,210,0.6)", color:"#a07ee0", fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:3, cursor: loading ? "not-allowed" : "pointer", transition:"all 0.2s", clipPath:"polygon(0 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%)" }}>
              {loading ? "AUTHENTICATING..." : "SIGN IN →"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
