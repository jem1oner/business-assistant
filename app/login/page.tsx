"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit() {
    setMsg(null);
    setLoading(true);

    try {
      if (!email || !password) {
        setMsg("Enter your email and password.");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabaseBrowser.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        setMsg("Account created. Log in to continue.");
        setMode("login");
        return;
      }

      const { error } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      router.push("/onboarding");
    } catch (e: any) {
      setMsg(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- Styles ---------------- */

  const shell: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    background:
      "radial-gradient(1100px 550px at 20% 0%, #eef2ff 0%, transparent 60%), radial-gradient(1000px 500px at 100% 20%, #ecfeff 0%, transparent 55%), #f6f7fb",
  };

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 520,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 16px 50px rgba(15, 23, 42, 0.10)",
    padding: 24,
  };

  const badge: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    border: "1px solid #e5e7eb",
    background: "white",
    padding: "10px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 900,
    color: "#334155",
    width: "fit-content",
  };

  const h1: React.CSSProperties = {
    margin: 0,
    marginTop: 16,
    fontSize: 32,
    fontWeight: 950,
    letterSpacing: -0.035,
    color: "#0f172a",
    lineHeight: 1.1,
    textAlign: "center",
  };

  const slogan: React.CSSProperties = {
    marginTop: 10,
    marginBottom: 0,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.55,
    textAlign: "center",
    maxWidth: 440,
    marginLeft: "auto",
    marginRight: "auto",
  };

  const divider: React.CSSProperties = {
    height: 1,
    background: "#e5e7eb",
    margin: "20px 0",
  };

  const row: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  };

  const modeTitle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 950,
    letterSpacing: -0.02,
    color: "#0f172a",
    margin: 0,
  };

  const modeSub: React.CSSProperties = {
    marginTop: 6,
    marginBottom: 0,
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.45,
  };

  const btnGhost: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const label: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 850,
    color: "#334155",
    marginBottom: 6,
  };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    outline: "none",
    fontSize: 14,
    background: "white",
  };

  const help: React.CSSProperties = {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 12,
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#111827",
    color: "white",
    fontWeight: 950,
    cursor: "pointer",
    marginTop: 16,
  };

  const muted: React.CSSProperties = {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.55,
    textAlign: "center",
    marginTop: 14,
  };

  const footerTip: React.CSSProperties = {
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid #e5e7eb",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.5,
    textAlign: "center",
  };

  /* ---------------- JSX ---------------- */

  return (
    <main style={shell}>
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={badge}>
            <Image
              src="/pulse-logo.jpg"
              alt="Pulse"
              width={28}
              height={28}
              style={{ borderRadius: 7 }}
            />
            <span>Powered by Pulse</span>
          </div>
        </div>

        <h1 style={h1}>MotionDesk</h1>

        <p style={slogan}>
          Your internal AI workspace for owners and staff — generate quotes,
          emails, and answers using your business rules and tone.
        </p>

        <div style={divider} />

        <div style={row}>
          <div>
            <p style={modeTitle}>
              {mode === "login" ? "Log in" : "Create account"}
            </p>
            <p style={modeSub}>
              {mode === "login"
                ? "Access MotionDesk."
                : "Create an account to get started."}
            </p>
          </div>

          <button
            style={btnGhost}
            onClick={() => {
              setMsg(null);
              setMode(mode === "login" ? "signup" : "login");
            }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={label}>Email</label>
          <input
            style={input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            autoComplete="email"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={label}>Password</label>
          <input
            style={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <div style={help}>Use at least 8 characters.</div>
        </div>

        <button
          style={{ ...btnPrimary, opacity: loading ? 0.75 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>

        {msg && <div className="text-sm text-slate-500 mt-3">{msg}</div>}

        <div style={muted}>
          By continuing you agree to use MotionDesk responsibly for internal
          business use.
        </div>

        <div style={footerTip}>
          Tip: You can update business details any time in <b>Settings</b>.
        </div>
      </section>
    </main>
  );
}
