"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "user" | "assistant";

type ChatMsg = {
  role: Role;
  content: string;
};

type MotionDeskSettings = {
  business_name?: string;
  business_type?: string;
  location?: string;
  pricing_rules?: string;
  tone_style?: string;
  business_goals?: string;
  use_cases?: string[];
  other_use_case?: string;
};

const SETTINGS_KEY = "motiondesk_settings_v1";

export default function ChatPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<MotionDeskSettings | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hey — what do you need done? (quote, email, SOP/checklist, staff message, or something else)",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load onboarding settings (localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as MotionDeskSettings;
      setSettings(parsed);
    } catch {
      // ignore
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const businessName = useMemo(() => {
    const name = settings?.business_name?.trim();
    return name || "";
  }, [settings]);

  const headerTitle = useMemo(() => {
    return businessName ? `MotionDesk • ${businessName}` : "MotionDesk";
  }, [businessName]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    setErrorMsg(null);
    setLoading(true);

    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          settings: settings ?? null,
        }),
      });

      const raw = await res.text();

      if (!res.ok) {
        throw new Error(raw || "Request failed");
      }

      let reply = "";
      try {
        const data = JSON.parse(raw);
        reply =
          (typeof data?.reply === "string" && data.reply) ||
          (typeof data?.message === "string" && data.message) ||
          (typeof data?.text === "string" && data.text) ||
          (typeof data?.content === "string" && data.content) ||
          (typeof data?.response === "string" && data.response) ||
          (typeof data?.error === "string" && `Error: ${data.error}`) ||
          "";
      } catch {
        reply = raw || "";
      }

      const assistantMsg: ChatMsg = {
        role: "assistant",
        content: reply?.trim() ? reply : "No response.",
      };

      setMessages([...newMessages, assistantMsg]);
    } catch (e: any) {
      setErrorMsg(e?.message || "Something went wrong.");
      setInput(userMsg.content);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  /* ---------------- Styles ---------------- */

  const shell: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background:
      "radial-gradient(1100px 650px at 15% 0%, #eef2ff 0%, transparent 60%), radial-gradient(1000px 650px at 100% 20%, #ecfeff 0%, transparent 55%), #f6f7fb",
  };

  const topBar: React.CSSProperties = {
    height: 68,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px",
    borderBottom: "1px solid rgba(229,231,235,0.9)",
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(14px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  };

  const brand: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 240,
  };

  const brandText: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.12,
  };

  const title: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 950,
    color: "#0f172a",
    letterSpacing: -0.02,
  };

  const subtitle: React.CSSProperties = {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    marginTop: 2,
  };

  const btnSmall: React.CSSProperties = {
    border: "1px solid rgba(229,231,235,1)",
    background: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
    color: "#0f172a",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
  };

  const mainWrap: React.CSSProperties = {
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "22px 16px 170px",
    flex: 1,
  };

  const chatCard: React.CSSProperties = {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
    borderRadius: 22,
    border: "1px solid rgba(229,231,235,0.9)",
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(15, 23, 42, 0.10)",
    padding: "18px 18px 10px",
  };

  const bubbleRow = (role: Role): React.CSSProperties => ({
    display: "flex",
    justifyContent: role === "user" ? "flex-end" : "flex-start",
    gap: 10,
    marginBottom: 12,
  });

  const avatarWrap = (role: Role): React.CSSProperties => ({
    width: 38,
    height: 38,
    borderRadius: 14,
    border: role === "assistant" ? "1px solid rgba(229,231,235,1)" : "none",
    background: role === "assistant" ? "rgba(255,255,255,0.95)" : "transparent",
    display: role === "assistant" ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: role === "assistant" ? "0 14px 30px rgba(15, 23, 42, 0.08)" : "none",
    flex: "0 0 auto",
  });

  const bubble = (role: Role): React.CSSProperties => ({
    maxWidth: "min(800px, 92%)",
    borderRadius: 18,
    padding: "12px 14px",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    fontSize: 14,
    border: role === "user" ? "1px solid rgba(0,0,0,0.10)" : "1px solid rgba(229,231,235,1)",
    background:
      role === "user"
        ? "linear-gradient(180deg, #111827 0%, #0b1220 100%)"
        : "rgba(255,255,255,0.96)",
    color: role === "user" ? "white" : "#0f172a",
    boxShadow:
      role === "user"
        ? "0 14px 32px rgba(15, 23, 42, 0.18)"
        : "0 10px 22px rgba(15, 23, 42, 0.07)",
  });

  const errorStyle: React.CSSProperties = {
    color: "#b91c1c",
    fontSize: 13,
    marginTop: 12,
  };

  const hintBar: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(229,231,235,0.9)",
    background: "rgba(255,255,255,0.70)",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
  };

  const hintText: React.CSSProperties = {
    color: "#0f172a",
    fontWeight: 850,
    fontSize: 13,
  };

  const hintSub: React.CSSProperties = {
    color: "#64748b",
    fontWeight: 700,
    fontSize: 12,
    marginTop: 2,
  };

  const smallTag: React.CSSProperties = {
    border: "1px solid rgba(229,231,235,1)",
    background: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 900,
    color: "#0f172a",
    whiteSpace: "nowrap",
  };

  // ✅ NEW: composer feels like one clean “bar”
  const composer: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    borderTop: "1px solid rgba(229,231,235,0.9)",
    background: "rgba(255,255,255,0.86)",
    backdropFilter: "blur(14px)",
    padding: "14px 0 18px",
  };

  const composerInner: React.CSSProperties = {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
    padding: "0 16px",
  };

  const composerBar: React.CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "flex-end",
    borderRadius: 18,
    border: "1px solid rgba(229,231,235,1)",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.10)",
    padding: "12px 12px",
  };

  const textarea: React.CSSProperties = {
    flex: 1,
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: 15,
    lineHeight: 1.5,
    padding: "10px 10px",
    minHeight: 56,
    maxHeight: 180,
    resize: "none",
    background: "transparent",
    color: "#0f172a",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  };

  const sendBtn: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#111827",
    color: "white",
    borderRadius: 16,
    padding: "14px 18px",
    fontWeight: 950,
    cursor: "pointer",
    minWidth: 110,
    opacity: loading ? 0.7 : 1,
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.20)",
  };

  const helper: React.CSSProperties = {
    color: "#64748b",
    fontSize: 12,
    marginTop: 10,
    lineHeight: 1.4,
    paddingLeft: 4,
  };

  const placeholderCSS = `
    textarea::placeholder {
      color: #94a3b8;
      opacity: 1;
    }
  `;

  /* ---------------- UI ---------------- */

  return (
    <main style={shell}>
      <style>{placeholderCSS}</style>

      <header style={topBar}>
        <div style={brand}>
          <Image
            src="/pulse-logo.jpg"
            alt="Pulse"
            width={36}
            height={36}
            style={{ borderRadius: 12, boxShadow: "0 14px 30px rgba(15,23,42,0.12)" }}
            priority
          />
          <div style={brandText}>
            <div style={title}>{headerTitle}</div>
            <div style={subtitle}>Powered by Pulse</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={btnSmall}
            onClick={() => router.push("/onboarding")}
            title="Edit your business settings"
          >
            Settings
          </button>
          <button
            style={btnSmall}
            onClick={() =>
              setMessages([
                {
                  role: "assistant",
                  content:
                    "Hey — what do you need done? (quote, email, SOP/checklist, staff message, or something else)",
                },
              ])
            }
            title="Clear chat"
          >
            New chat
          </button>
        </div>
      </header>

      <div style={mainWrap}>
        <div style={hintBar}>
          <div>
            <div style={hintText}>Ask MotionDesk to write, plan, quote, or draft.</div>
            <div style={hintSub}>
              It uses your onboarding rules + remembers the conversation while you chat.
            </div>
          </div>
          <div style={smallTag}>Enter = send • Shift+Enter = new line</div>
        </div>

        <div style={chatCard}>
          {messages.map((m, idx) => (
            <div key={idx} style={bubbleRow(m.role)}>
              <div style={avatarWrap(m.role)}>
                {m.role === "assistant" && (
                  <Image
                    src="/pulse-logo.jpg"
                    alt="Pulse"
                    width={22}
                    height={22}
                    style={{ borderRadius: 7 }}
                  />
                )}
              </div>
              <div style={bubble(m.role)}>{m.content}</div>
            </div>
          ))}

          {loading && (
            <div style={bubbleRow("assistant")}>
              <div style={avatarWrap("assistant")}>
                <Image
                  src="/pulse-logo.jpg"
                  alt="Pulse"
                  width={22}
                  height={22}
                  style={{ borderRadius: 7 }}
                />
              </div>
              <div style={bubble("assistant")}>Thinking…</div>
            </div>
          )}

          {errorMsg && <div style={errorStyle}>{errorMsg}</div>}

          <div ref={bottomRef} />
        </div>
      </div>

      <div style={composer}>
        <div style={composerInner}>
          <div style={composerBar}>
            <textarea
              style={textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type what you need… e.g. Quote a 2m³ load, include callout, keep it short"
            />
            <button style={sendBtn} onClick={sendMessage} disabled={loading}>
              {loading ? "..." : "Send"}
            </button>
          </div>

          <div style={helper}>
            Tip: Include job details, pricing rules, deadlines — MotionDesk will keep your tone.
          </div>
        </div>
      </div>
    </main>
  );
}
