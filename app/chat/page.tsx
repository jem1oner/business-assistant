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

type SavedChat = {
  id: string;
  title: string | null;
  created_at: string;
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

  // Saved chats UI
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Copy feedback
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

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

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Close dropdown on outside click / ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSavedOpen(false);
    }
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest?.("[data-saved-root]")) setSavedOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const headerTitle = useMemo(() => {
    const name = settings?.business_name?.trim();
    return name ? `MotionDesk • ${name}` : "MotionDesk";
  }, [settings]);

  async function getAccessToken() {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  }

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

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }

      const data = (await res.json()) as { reply?: string };

      const assistantMsg: ChatMsg = {
        role: "assistant",
        content: data.reply || "No response.",
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

  function newChat() {
    setActiveChatId(null);
    setMessages([
      {
        role: "assistant",
        content:
          "Hey — what do you need done? (quote, email, SOP/checklist, staff message, or something else)",
      },
    ]);
    setErrorMsg(null);
    setInput("");
  }

  async function copyAssistant(idx: number) {
    try {
      const text = messages[idx]?.content ?? "";
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1200);
    } catch {
      // ignore
    }
  }

  // ---- Saved chats: list / load ----
  async function refreshSavedChats() {
    setSavedLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/chats/list", {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load saved chats");

      setSavedChats((data?.chats ?? []) as SavedChat[]);
    } catch (e: any) {
      setErrorMsg(e?.message || "Could not load saved chats.");
    } finally {
      setSavedLoading(false);
    }
  }

  async function loadChat(chatId: string) {
    setSavedOpen(false);
    setLoading(true);
    setErrorMsg(null);

    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/chats/get?chatId=${encodeURIComponent(chatId)}`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load chat");

      const loadedMessages = (data?.messages ?? []) as ChatMsg[];
      setMessages(
        loadedMessages.length
          ? loadedMessages
          : [
              {
                role: "assistant",
                content:
                  "This saved chat has no messages (yet). Start typing below.",
              },
            ]
      );

      // If saved settings exist in DB, use them; otherwise keep local settings
      if (data?.settings) setSettings(data.settings);

      setActiveChatId(chatId);
    } catch (e: any) {
      setErrorMsg(e?.message || "Could not load that chat.");
    } finally {
      setLoading(false);
    }
  }

  async function saveChat() {
    // If you already have /api/chats/save wired, keep it.
    // This button will still work with your existing route.
    try {
      setErrorMsg(null);
      const token = await getAccessToken();

      // simple title from first user message
      const firstUser = messages.find((m) => m.role === "user")?.content?.trim();
      const title =
        (firstUser ? firstUser.slice(0, 48) : "Saved chat") +
        (firstUser && firstUser.length > 48 ? "…" : "");

      const res = await fetch("/api/chats/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          chatId: activeChatId, // allow overwrite if exists
          title,
          messages,
          settings: settings ?? null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Save failed");

      if (data?.chatId) setActiveChatId(data.chatId);

      // refresh list so it appears
      await refreshSavedChats();
      setSavedOpen(true);
    } catch (e: any) {
      setErrorMsg(e?.message || "Could not save chat.");
    }
  }

  // Styles
  const shell: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "radial-gradient(1100px 550px at 10% 0%, #eef2ff 0%, transparent 60%), radial-gradient(1000px 500px at 100% 15%, #ecfeff 0%, transparent 55%), #f6f7fb",
    display: "flex",
    flexDirection: "column",
  };

  const topBar: React.CSSProperties = {
    height: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px",
    borderBottom: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  };

  const brandWrap: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 260,
  };

  const logoBox: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };

  const brandText: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.1,
  };

  const title: React.CSSProperties = {
    fontWeight: 950,
    color: "#0f172a",
    letterSpacing: -0.02,
    fontSize: 18,
  };

  const subtitle: React.CSSProperties = {
    color: "#64748b",
    fontWeight: 800,
    fontSize: 13,
    marginTop: 2,
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
    padding: "18px 14px 150px",
  };

  const banner: React.CSSProperties = {
    width: "100%",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 18px 55px rgba(15, 23, 42, 0.10)",
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  };

  const bannerLeft: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };

  const bannerTitle: React.CSSProperties = {
    margin: 0,
    fontWeight: 950,
    color: "#0f172a",
    letterSpacing: -0.02,
  };

  const bannerSub: React.CSSProperties = {
    margin: 0,
    color: "#64748b",
    fontSize: 13,
    fontWeight: 700,
  };

  const bubbleRow = (role: Role): React.CSSProperties => ({
    display: "flex",
    justifyContent: role === "user" ? "flex-end" : "flex-start",
    marginBottom: 12,
  });

  const assistantWrapRow: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  };

  const assistantAvatar: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
    marginTop: 2,
  };

  const bubble = (role: Role): React.CSSProperties => ({
    maxWidth: "min(760px, 92%)",
    borderRadius: 18,
    padding: "12px 14px",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    border: role === "user" ? "1px solid rgba(0,0,0,0.08)" : "1px solid #e5e7eb",
    background: role === "user" ? "#111827" : "white",
    color: role === "user" ? "white" : "#0f172a",
    boxShadow: role === "user" ? "0 10px 24px rgba(15, 23, 42, 0.12)" : "none",
    position: "relative",
  });

  const copyBtn: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    background: "white",
    borderRadius: 10,
    padding: "7px 10px",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 12,
    color: "#0f172a",
    alignSelf: "flex-start",
    whiteSpace: "nowrap",
  };

  const composer: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    borderTop: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    paddingBottom: "env(safe-area-inset-bottom)",
  };

  const composerInner: React.CSSProperties = {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
    padding: "14px 14px 12px",
    display: "flex",
    gap: 12,
    alignItems: "center",
  };

  const inputShell: React.CSSProperties = {
    flex: 1,
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "white",
    boxShadow: "0 18px 55px rgba(15, 23, 42, 0.10)",
    padding: "14px 14px",
    minHeight: 70,
    display: "flex",
    alignItems: "center",
  };

  const inputBox: React.CSSProperties = {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: 16,
    lineHeight: 1.35,
    resize: "none",
    background: "transparent",
    minHeight: 40,
    maxHeight: 160,
  };

  const sendBtn: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#111827",
    color: "white",
    borderRadius: 18,
    padding: "14px 18px",
    fontWeight: 950,
    cursor: "pointer",
    minWidth: 120,
    height: 56,
    opacity: loading ? 0.7 : 1,
    boxShadow: "0 18px 55px rgba(15, 23, 42, 0.12)",
  };

  const helper: React.CSSProperties = {
    color: "#64748b",
    fontSize: 13,
    marginTop: 8,
    fontWeight: 700,
  };

  const dropdownWrap: React.CSSProperties = {
    position: "relative",
  };

  const dropdown: React.CSSProperties = {
    position: "absolute",
    right: 0,
    top: 52,
    width: 360,
    maxWidth: "90vw",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "white",
    boxShadow: "0 18px 55px rgba(15, 23, 42, 0.16)",
    overflow: "hidden",
    zIndex: 20,
  };

  const dropdownHead: React.CSSProperties = {
    padding: "12px 12px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  };

  const dropdownTitle: React.CSSProperties = {
    fontWeight: 950,
    color: "#0f172a",
  };

  const dropdownList: React.CSSProperties = {
    maxHeight: 360,
    overflowY: "auto",
  };

  const chatItem: React.CSSProperties = {
    padding: "12px 12px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
  };

  const chatItemTitle: React.CSSProperties = {
    fontWeight: 900,
    color: "#0f172a",
    fontSize: 13,
    margin: 0,
  };

  const chatItemMeta: React.CSSProperties = {
    color: "#64748b",
    fontSize: 12,
    margin: "6px 0 0",
    fontWeight: 700,
  };

  return (
    <main style={shell}>
      <header style={topBar}>
        <div style={brandWrap}>
          <div style={logoBox}>
            <Image
              src="/pulse-logo.jpg"
              alt="Pulse"
              width={28}
              height={28}
              style={{ borderRadius: 8 }}
            />
          </div>

          <div style={brandText}>
            <div style={title}>{headerTitle}</div>
            <div style={subtitle}>Powered by Pulse</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={btnSmall} onClick={saveChat} title="Save this chat">
            Save chat
          </button>

          <div data-saved-root style={dropdownWrap}>
            <button
              style={btnSmall}
              onClick={async () => {
                const next = !savedOpen;
                setSavedOpen(next);
                if (next) await refreshSavedChats();
              }}
              title="Show saved chats"
            >
              Saved chats
            </button>

            {savedOpen && (
              <div style={dropdown}>
                <div style={dropdownHead}>
                  <div style={dropdownTitle}>
                    {savedLoading ? "Loading…" : "Saved chats"}
                  </div>
                  <button
                    style={{ ...btnSmall, padding: "8px 10px" }}
                    onClick={refreshSavedChats}
                    title="Refresh"
                  >
                    Refresh
                  </button>
                </div>

                <div style={dropdownList}>
                  {savedChats.length === 0 && !savedLoading && (
                    <div style={{ padding: 12, color: "#64748b", fontWeight: 700 }}>
                      No saved chats yet. Hit <b>Save chat</b> to store one.
                    </div>
                  )}

                  {savedChats.map((c) => {
                    const label = (c.title || "Saved chat").trim();
                    const when = c.created_at
                      ? new Date(c.created_at).toLocaleString()
                      : "";
                    const active = activeChatId === c.id;

                    return (
                      <div
                        key={c.id}
                        style={{
                          ...chatItem,
                          background: active ? "rgba(17,24,39,0.04)" : "white",
                        }}
                        onClick={() => loadChat(c.id)}
                        role="button"
                      >
                        <p style={chatItemTitle}>{label}</p>
                        <p style={chatItemMeta}>{when}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            style={btnSmall}
            onClick={() => router.push("/onboarding")}
            title="Edit your business settings"
          >
            Settings
          </button>

          <button style={btnSmall} onClick={newChat} title="Clear chat">
            New chat
          </button>
        </div>
      </header>

      <div style={wrap}>
        <div style={banner}>
          <div style={bannerLeft}>
            <p style={bannerTitle}>
              Use MotionDesk to help achieve business goals, reduce admin, quote and much more!
            </p>
            <p style={bannerSub}>
              It uses your onboarding rules + remembers the conversation while you chat.
            </p>
          </div>
        </div>

        {messages.map((m, idx) => {
          if (m.role === "assistant") {
            return (
              <div key={idx} style={bubbleRow(m.role)}>
                <div style={assistantWrapRow}>
                  <div style={assistantAvatar}>
                    <Image
                      src="/pulse-logo.jpg"
                      alt="Pulse"
                      width={22}
                      height={22}
                      style={{ borderRadius: 6 }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={bubble(m.role)}>{m.content}</div>
                    <button
                      style={copyBtn}
                      onClick={() => copyAssistant(idx)}
                      title="Copy reply"
                    >
                      {copiedIdx === idx ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // user
          return (
            <div key={idx} style={bubbleRow(m.role)}>
              <div style={bubble(m.role)}>{m.content}</div>
            </div>
          );
        })}

        {loading && (
          <div style={bubbleRow("assistant")}>
            <div style={assistantWrapRow}>
              <div style={assistantAvatar}>
                <Image
                  src="/pulse-logo.jpg"
                  alt="Pulse"
                  width={22}
                  height={22}
                  style={{ borderRadius: 6 }}
                />
              </div>
              <div style={bubble("assistant")}>Thinking…</div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 10, fontWeight: 700 }}>
            {errorMsg}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={composer}>
        <div style={composerInner}>
          <div style={{ flex: 1 }}>
            <div style={inputShell}>
              <textarea
                style={inputBox}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Let MotionDesk know what you need!"
              />
            </div>
            <div style={helper}>
              Tip: Be specific and detailed to get the most out of replies!
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
