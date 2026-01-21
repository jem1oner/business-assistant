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
    if (!token) return NextResponse.json({ chats: [] });

    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (!user) return NextResponse.json({ chats: [] });

    const { data, error } = await supabase
      .from("motiondesk_chats")
      .select("id,title,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ chats: data || [] });
  } catch {
    return NextResponse.json({ chats: [] });
  }
}
