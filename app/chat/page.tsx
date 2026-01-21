"use client";

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

  const headerTitle = useMemo(() => {
    const name = settings?.business_name?.trim();
    return name ? `MotionDesk • ${name}` : "MotionDesk";
  }, [settings]);

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
      "radial-gradient(1100px 550px at 15% 0%, #eef2ff 0%, transparent 60%), radial-gradient(1000px 600px at 100% 20%, #ecfeff 0%, transparent 55%), #f6f7fb",
  };

  const topBar: React.CSSProperties = {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px",
    borderBottom: "1px solid rgba(229,231,235,0.9)",
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  };

  const brand: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 950,
    color: "#0f172a",
    letterSpacing: -0.02,
  };

  const logoDot: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: "#111827",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.18)",
  };

  const titleWrap: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.1,
  };

  const title: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 950,
  };

  const subtitle: React.CSSProperties = {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
    marginTop: 2,
  };

  const btnSmall: React.CSSProperties = {
    border: "1px solid rgba(229,231,235,1)",
    background: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
    color: "#0f172a",
  };

  const mainWrap: React.CSSProperties = {
    width: "100%",
    maxWidth: 1080,
    margin: "0 auto",
    padding: "18px 16px 120px",
    flex: 1,
  };

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
    borderRadius: 22,
    border: "1px solid rgba(229,231,235,0.9)",
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(15, 23, 42, 0.08)",
    padding: "18px 18px 10px",
  };

  const bubbleRow = (role: Role): React.CSSProperties => ({
    display: "flex",
    justifyContent: role === "user" ? "flex-end" : "flex-start",
    gap: 10,
    marginBottom: 12,
  });

  const avatar = (role: Role): React.CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: 14,
    border: "1px solid rgba(229,231,235,1)",
    background: role === "assistant" ? "white" : "transparent",
    display: role === "assistant" ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: role === "assistant" ? "0 12px 28px rgba(15, 23, 42, 0.08)" : "none",
    flex: "0 0 auto",
  });

  const avatarDot: React.CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "#111827",
  };

  const bubble = (role: Role): React.CSSProperties => ({
    maxWidth: "min(780px, 92%)",
    borderRadius: 18,
    padding: "12px 14px",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    fontSize: 14,
    border: role === "user" ? "1px solid rgba(0,0,0,0.10)" : "1px solid rgba(229,231,235,1)",
    background:
      role === "user"
        ? "linear-gradient(180deg, #111827 0%, #0b1220 100%)"
        : "rgba(255,255,255,0.95)",
    color: role === "user" ? "white" : "#0f172a",
    boxShadow:
      role === "user"
        ? "0 14px 30px rgba(15, 23, 42, 0.18)"
        : "0 10px 22px rgba(15, 23, 42, 0.06)",
  });

  const composer: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    borderTop: "1px solid rgba(229,231,235,0.9)",
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(12px)",
  };

  const composerInner: React.CSSProperties = {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
    padding: "14px 16px",
    display: "flex",
    gap: 12,
    alignItems: "flex-end",
  };

  const inputBox: React.CSSProperties = {
    flex: 1,
    border: "1px solid rgba(229,231,235,1)",
    borderRadius: 16,
    padding: "12px 12px",
    fontSize: 14,
    outline: "none",
    minHeight: 48,
    maxHeight: 160,
    resize: "none",
    background: "rgba(255,255,255,0.95)",
  };

  const sendBtn: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#111827",
    color: "white",
    borderRadius: 16,
    padding: "12px 16px",
    fontWeight: 950,
    cursor: "pointer",
    minWidth: 96,
    opacity: loading ? 0.7 : 1,
    boxShadow: "0 16px 34px rgba(15, 23, 42, 0.18)",
  };

  const helper: React.CSSProperties = {
    color: "#64748b",
    fontSize: 12,
    marginTop: 8,
    lineHeight: 1.4,
  };

  const errorStyle: React.CSSProperties = {
    color: "#b91c1c",
    fontSize: 13,
    marginTop: 10,
  };

  const divider: React.CSSProperties = {
    height: 1,
    background: "rgba(229,231,235,0.9)",
    margin: "10px 0 14px",
  };

  /* ---------------- UI ---------------- */

  return (
    <main style={shell}>
      <header style={topBar}>
        <div style={brand}>
          <div style={logoDot} />
          <div style={titleWrap}>
            <div style={title}>{headerTitle}</div>
            <div style={subtitle}>Internal assistant • quotes • emails • SOPs</div>
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
        <div style={card}>
          <div style={divider} />

          {messages.map((m, idx) => (
            <div key={idx} style={bubbleRow(m.role)}>
              <div style={avatar(m.role)}>{m.role === "assistant" && <div style={avatarDot} />}</div>
              <div style={bubble(m.role)}>{m.content}</div>
            </div>
          ))}

          {loading && (
            <div style={bubbleRow("assistant")}>
              <div style={avatar("assistant")}>
                <div style={avatarDot} />
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
          <div style={{ flex: 1 }}>
            <textarea
              style={inputBox}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type here… (Enter to send, Shift+Enter for new line)"
            />
            <div style={helper}>
              MotionDesk is for <b>internal</b> business help — keep it practical and ready-to-send.
            </div>
          </div>

          <button style={sendBtn} onClick={sendMessage} disabled={loading}>
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </main>
  );
}
