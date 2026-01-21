"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

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
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [settings, setSettings] = useState<MotionDeskSettings | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Use MotionDesk to help achieve business goals, reduce admin, quote and much more!",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // -------- Load onboarding settings --------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings(JSON.parse(raw));
    } catch {}
  }, []);

  // -------- Auto scroll --------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // -------- Helpers --------
  const headerTitle = useMemo(() => {
    return settings?.business_name
      ? `MotionDesk • ${settings.business_name}`
      : "MotionDesk";
  }, [settings]);

  async function getAccessToken() {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  }

  // -------- Send message --------
  async function sendMessage() {
    if (!input.trim() || loading) return;

    setErrorMsg(null);
    setLoading(true);

    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          settings,
        }),
      });

      const data = await res.json();

      if (!data?.reply) throw new Error("No response");

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply },
      ]);
    } catch (e: any) {
      setErrorMsg(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // -------- Save chat (manual) --------
  async function saveChat() {
    try {
      setSaving(true);
      const token = await getAccessToken();

      await fetch("/api/chats/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title:
            messages.find((m) => m.role === "user")?.content.slice(0, 60) ||
            "Saved chat",
          messages,
          settings,
        }),
      });
    } catch {
      alert("Failed to save chat");
    } finally {
      setSaving(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // -------- Styles --------
  const shell: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f6f7fb",
    display: "flex",
    flexDirection: "column",
  };

  const topBar: React.CSSProperties = {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px",
    borderBottom: "1px solid #e5e7eb",
    background: "white",
  };

  const wrap: React.CSSProperties = {
    maxWidth: 980,
    margin: "0 auto",
    padding: "18px 16px 160px",
    width: "100%",
  };

  const bubbleRow = (role: Role) => ({
    display: "flex",
    justifyContent: role === "user" ? "flex-end" : "flex-start",
    marginBottom: 14,
  });

  const bubble = (role: Role) => ({
    maxWidth: "92%",
    borderRadius: 18,
    padding: "14px 16px",
    lineHeight: 1.55,
    background: role === "user" ? "#111827" : "white",
    color: role === "user" ? "white" : "#0f172a",
    border: "1px solid #e5e7eb",
    position: "relative" as const,
  });

  const composer: React.CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "white",
    borderTop: "1px solid #e5e7eb",
    padding: "16px",
  };

  return (
    <main style={shell}>
      {/* ---------- Header ---------- */}
      <header style={topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image
            src="/pulse-logo.jpg"
            alt="Pulse"
            width={32}
            height={32}
            style={{ borderRadius: 8 }}
          />
          <div>
            <div style={{ fontWeight: 900 }}>{headerTitle}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Powered by Pulse
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={saveChat} disabled={saving}>
            {saving ? "Saving..." : "Save chat"}
          </button>
          <button onClick={() => router.push("/onboarding")}>Settings</button>
          <button
            onClick={() =>
              setMessages([
                {
                  role: "assistant",
                  content:
                    "Use MotionDesk to help achieve business goals, reduce admin, quote and much more!",
                },
              ])
            }
          >
            New chat
          </button>
        </div>
      </header>

      {/* ---------- Chat ---------- */}
      <div style={wrap}>
        {messages.map((m, i) => (
          <div key={i} style={bubbleRow(m.role)}>
            <div style={bubble(m.role)}>
              {m.role === "assistant" && (
                <div style={{ marginBottom: 6 }}>
                  <Image
                    src="/pulse-logo.jpg"
                    alt="Pulse"
                    width={18}
                    height={18}
                  />
                </div>
              )}
              {m.content}
              {m.role === "assistant" && (
                <button
                  style={{ fontSize: 12, marginTop: 6 }}
                  onClick={() => copy(m.content)}
                >
                  Copy
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={bubbleRow("assistant")}>
            <div style={bubble("assistant")}>Thinking…</div>
          </div>
        )}

        {errorMsg && <div style={{ color: "red" }}>{errorMsg}</div>}
        <div ref={bottomRef} />
      </div>

      {/* ---------- Composer ---------- */}
      <div style={composer}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Let MotionDesk know what you need!"
            style={{
              width: "100%",
              minHeight: 64,
              borderRadius: 16,
              padding: "14px",
              fontSize: 15,
              border: "1px solid #e5e7eb",
            }}
          />
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Tip: Be specific and detailed to get the most out of replies!
          </div>
        </div>
      </div>
    </main>
  );
}
