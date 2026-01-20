import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const message = (body?.message ?? "").toString().trim();
    const businessInfo = (body?.businessInfo ?? "").toString();
    const pricingRules = (body?.pricingRules ?? "").toString();
    const tone = (body?.tone ?? "").toString() || "Clear, friendly, professional.";

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Server missing OPENAI_API_KEY. Add it to .env.local and restart." },
        { status: 500 }
      );
    }

    const systemPrompt = `
You are a business assistant that helps write quotes, emails, SMS replies, and internal checklists.

Business details:
${businessInfo || "Not provided."}

Pricing / quoting rules:
${pricingRules || "Not provided. If asked for a quote, ask clarifying questions first."}

Tone & style:
${tone}

Rules:
- Be practical and concise.
- If the user asks for a quote and important details are missing, ask 2–5 clarifying questions first.
- Do NOT say "I can't remember" or "I don't have memory". If info isn't provided above, ask for it.
- When writing quotes: provide a clean format with assumptions + next steps.
- When writing emails/SMS: keep it ready-to-send.
`.trim();

    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_output_tokens: 450,
    });

    return NextResponse.json({ text: resp.output_text || "" });
  } catch (e: any) {
    // Return a readable error (not a silent 500)
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
