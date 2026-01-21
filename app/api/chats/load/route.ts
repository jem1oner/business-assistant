import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const supabase = supabaseServer();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Missing auth token" }, { status: 401 });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { data: chat, error: chatErr } = await supabase
      .from("motiondesk_chats")
      .select("id, settings, user_id")
      .eq("id", id)
      .single();

    if (chatErr) throw chatErr;
    if (chat.user_id !== userData.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: msgs, error: msgErr } = await supabase
      .from("motiondesk_messages")
      .select("role, content, created_at")
      .eq("chat_id", id)
      .order("created_at", { ascending: true });

    if (msgErr) throw msgErr;

    return NextResponse.json({
      messages: (msgs || []).map((m) => ({ role: m.role, content: m.content })),
      settings: chat.settings ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
