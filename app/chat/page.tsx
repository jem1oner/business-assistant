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
          messages: newMessages, // ✅ full conversation (memory)
          settings: settings ?? null, // ✅ onboarding injected
        }),
      });

      // IMPORTANT: only read the response body ONCE
      const raw = await res.text();

      if (!res.ok) {
        throw new Error(raw || "Request failed");
      }

      // Parse JSON if possible, otherwise treat as plain text
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

  // -------- Styles (unchanged) --------
  const shell: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f6f7fb",
    display: "flex",
    flexDirection: "column",
  };

  const topBar: React.CSSProperties = {
    height: 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    borderBottom: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  };

  const title: React.CSSProperties = {
    fontWeight: 950,
    color: "#0f172a",
    letterSpacing: -0.02,
  };

  const btnSmall: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    background: "white",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
  };

  const wrap: React.CSSProperties = {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
    padding: "18px 14px 110px",
  };

  const bubbleRow = (role: Role): React.CSSProperties => ({
    display: "flex",
    justifyContent: role === "user" ? "flex-end" : "flex-start",
    marginBottom: 12,
  });

  const bubble = (role: Role): React.CSSProperties => ({
    maxWidth: "min(760px, 92%)",
    borderRadius: 18,
    padding: "12px 14px",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    border: role === "user" ? "1px solid rgba(0,0,0,0.08)" : "1px solid #e5e7eb",
    background: role === "user" ? "#111827" : "white",
    color: role === "user" ? "white" : "#0f172a",
    boxShadow: role === "user" ? "0 10px 24px rgba(15, 23, 42, 0.12)" : "none",
  });

  const composer: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    borderTop: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
  };

  const composerInner: React.CSSProperties = {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
    padding: "12px 14px",
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
  };

  const inputBox: React.CSSProperties = {
    flex: 1,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "12px 12px",
    fontSize: 14,
    outline: "none",
    minHeight: 46,
    maxHeight: 140,
    resize: "none",
  };

  const sendBtn: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#111827",
    color: "white",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 950,
    cursor: "pointer",
    minWidth: 92,
    opacity: loading ? 0.7 : 1,
  };

  const helper: React.CSSProperties = {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 8,
  };
  // -----------------------------------

  return (
    <main style={shell}>
      <header style={topBar}>
        <div style={title}>{headerTitle}</div>
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

      <div style={wrap}>
        {messages.map((m, idx) => (
          <div key={idx} style={bubbleRow(m.role)}>
            <div style={bubble(m.role)}>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div style={bubbleRow("assistant")}>
            <div style={bubble("assistant")}>Thinking…</div>
          </div>
        )}

        {errorMsg && (
          <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 10 }}>
            {errorMsg}
          </div>
        )}

        <div ref={bottomRef} />
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
              MotionDesk is for <b>internal</b> business help (quotes, emails, SOPs, staff support).
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
