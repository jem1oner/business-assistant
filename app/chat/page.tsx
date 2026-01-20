"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase-browser";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);

  const locationLine = useMemo(() => {
    return profile?.location ? String(profile.location) : "";
  }, [profile]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabaseBrowser.auth.getUser();
      if (!auth?.user) {
        router.push("/login");
        return;
      }

      const { data: p } = await supabaseBrowser
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (!p?.onboarding_complete) {
        router.push("/onboarding");
        return;
      }

      setProfile(p);
      setLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
  }

  function injectQuickPrompt(kind: "quote" | "email" | "sms") {
    const templates: Record<typeof kind, string> = {
      quote:
        "Write a professional quote. Ask any missing questions first.\n\n" +
        "Job / service details:\n" +
        "• Write job specifics here\n" +
        "• Location (if relevant)\n" +
        "• Timeframe or urgency\n" +
        "• Any special requirements\n",

      email:
        "Write a professional business email.\n\n" +
        "Context:\n" +
        "• Write what you want the email to say here\n" +
        "• Who is it to?\n" +
        "• What is the purpose?\n" +
        "• Any important dates, prices, or actions\n",

      sms:
        "Write a short, professional SMS.\n\n" +
        "Context:\n" +
        "• Write the customer’s message here\n" +
        "• Write what you want to reply here\n" +
        "• Any next steps or timing\n",
    };

    setMessage(templates[kind]);
  }

  async function sendMessage() {
    if (!message.trim() || sending) return;

    const userText = message.trim();
    setMessage("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: userText }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          businessInfo: `Business name: ${profile.business_name}\nBusiness type: ${profile.business_type}\nLocation: ${profile.location}`,
          pricingRules: profile.pricing_rules,
          tone: profile.tone,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `ERROR (${res.status}): ${data?.error || "Request failed"}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data?.text || "No response text." },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `ERROR: ${e?.message || "Unknown error"}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <main style={{ padding: 24, color: "#6b7280" }}>Loading…</main>;
  }

  // ---------------- Styles ----------------
  const shell: React.CSSProperties = {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background:
      "radial-gradient(1000px 500px at 20% 0%, #eef2ff 0%, transparent 60%), radial-gradient(900px 450px at 100% 20%, #ecfeff 0%, transparent 55%), #f6f7fb",
  };

  const container: React.CSSProperties = {
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
    padding: 18,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const topBar: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  };

  const avatar: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "linear-gradient(135deg, #111827 0%, #334155 70%)",
    boxShadow: "0 10px 25px rgba(17,24,39,0.18)",
    flexShrink: 0,
  };

  const btn: React.CSSProperties = {
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "white",
    cursor: "pointer",
    fontWeight: 750,
  };

  const btnPrimary: React.CSSProperties = {
    ...btn,
    background: "#111827",
    color: "white",
    border: "1px solid rgba(0,0,0,0.08)",
  };

  const card: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "white",
    boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
    minHeight: 0,
  };

  const cardHeader: React.CSSProperties = {
    padding: "12px 14px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const chipRow: React.CSSProperties = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  };

  const chip: React.CSSProperties = {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    fontWeight: 650,
    color: "#334155",
  };

  const chatArea: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: 16,
    background:
      "linear-gradient(180deg, rgba(249,250,251,1) 0%, rgba(255,255,255,1) 30%)",
  };

  const bubbleWrap = (isUser: boolean): React.CSSProperties => ({
    display: "flex",
    justifyContent: isUser ? "flex-end" : "flex-start",
    marginBottom: 10,
  });

  const bubble = (isUser: boolean): React.CSSProperties => ({
    maxWidth: "78%",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: isUser ? "#111827" : "white",
    color: isUser ? "white" : "#111827",
    whiteSpace: "pre-wrap",
    lineHeight: 1.45,
    fontSize: 14,
  });

  const composer: React.CSSProperties = {
    borderTop: "1px solid #e5e7eb",
    padding: 12,
    background: "#fafafa",
  };

  const input: React.CSSProperties = {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    background: "white",
  };

  // ----------------------------------------

  return (
    <main style={shell}>
      <div style={container}>
        {/* Top bar */}
        <div style={topBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={avatar} />

            <div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.2 }}>
                {profile.business_name || "Business Assistant"}
              </div>

              {locationLine && (
                <div style={{ fontSize: 12, color: "#6b7280" }}>{locationLine}</div>
              )}

              {/* Powered by Pulse */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 6,
                  fontSize: 11,
                  color: "#6b7280",
                }}
              >
                <Image
                  src="/pulse-logo.jpg"
                  alt="Pulse"
                  width={18}
                  height={18}
                  style={{ borderRadius: 5, opacity: 0.9 }}
                />
                <span>Powered by Pulse</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={btn} onClick={() => router.push("/onboarding")}>
              Settings
            </button>
            <button style={btn} onClick={logout}>
              Log out
            </button>
          </div>
        </div>

        {/* Chat card */}
        <div style={card}>
          <div style={cardHeader}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Quotes • Emails • SMS replies • Staff Q&amp;A
            </div>

            <div style={chipRow}>
              <button style={chip} onClick={() => injectQuickPrompt("quote")}>
                + Quote
              </button>
              <button style={chip} onClick={() => injectQuickPrompt("email")}>
                + Email
              </button>
              <button style={chip} onClick={() => injectQuickPrompt("sms")}>
                + SMS
              </button>
            </div>
          </div>

          <div style={chatArea}>
            {messages.length === 0 && (
              <div style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.5 }}>
                Try:
                <ul>
                  <li>“Write a professional quote for a new customer.”</li>
                  <li>“Write a follow-up message for a customer who hasn’t replied.”</li>
                  <li>“What information should we collect before providing a quote?”</li>
                </ul>
              </div>
            )}

            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div key={i} style={bubbleWrap(isUser)}>
                  <div style={bubble(isUser)}>{m.content}</div>
                </div>
              );
            })}

            {sending && (
              <div style={bubbleWrap(false)}>
                <div style={bubble(false)}>
                  <span style={{ color: "#6b7280" }}>typing…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div style={composer}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message…"
                style={input}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={sending}
                style={{ ...btnPrimary, opacity: sending ? 0.75 : 1 }}
              >
                Send
              </button>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              Tip: Include specific information and key details to get the best results.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
