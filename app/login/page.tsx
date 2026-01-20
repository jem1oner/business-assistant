"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase-browser";

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

  // ---------------- Styles ----------------
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
    font
