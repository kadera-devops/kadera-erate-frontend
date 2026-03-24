import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ background:"#05050d", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(138,99,210,0.6)", letterSpacing:3 }}>INITIALIZING...</div>
    </div>
  );

  return session ? <Dashboard session={session} /> : <LoginPage />;
}
