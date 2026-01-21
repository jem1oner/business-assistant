import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function GET(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");
    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Get messages
    const { data: msgs, error: msgErr } = await supabase
      .from("motiondesk_messages")
      .select("role,content,created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (msgErr) throw msgErr;

    // Try to fetch settings from chats table if you store it there (optional).
    // If you don't have `settings` column, this will error; we safely ignore.
    let settings: any = null;
    const { data: chatRow, error: chatErr } = await supabase
      .from("motiondesk_chats")
      .select("settings")
      .eq("id", chatId)
      .maybeSingle();

    if (!chatErr && chatRow && (chatRow as any).settings) {
      settings = (chatRow as any).settings;
    }

    return NextResponse.json({
      messages: (msgs ?? []).map((m) => ({ role: m.role, content: m.content })),
      settings,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load chat" },
      { status: 500 }
    );
  }
}
