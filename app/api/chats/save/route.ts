import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ChatMsg = { role: "user" | "assistant"; content: string };

function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Missing auth token" }, { status: 401 });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const title = String(body.title || "Saved chat").slice(0, 120);
    const settings = body.settings ?? null;
    const messages = (body.messages || []) as ChatMsg[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const user_id = userData.user.id;

    const { data: chatRow, error: chatErr } = await supabase
      .from("motiondesk_chats")
      .insert([{ user_id, title, settings }])
      .select("id")
      .single();

    if (chatErr) throw chatErr;

    const chat_id = chatRow.id;

    const rows = messages.map((m) => ({
      chat_id,
      role: m.role,
      content: m.content,
    }));

    const { error: msgErr } = await supabase.from("motiondesk_messages").insert(rows);
    if (msgErr) throw msgErr;

    return NextResponse.json({ ok: true, id: chat_id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
