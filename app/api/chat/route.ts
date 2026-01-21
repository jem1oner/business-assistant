import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

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

// Build a strong system prompt from onboarding settings
function buildSystemPrompt(settings: MotionDeskSettings | null) {
  const businessName = settings?.business_name?.trim() || "";
  const businessType = settings?.business_type?.trim() || "";
  const location = settings?.location?.trim() || "";
  const pricingRules = settings?.pricing_rules?.trim() || "";
  const tone = settings?.tone_style?.trim() || "";
  const goals = settings?.business_goals?.trim() || "";
  const useCases = settings?.use_cases?.length ? settings.use_cases.join(", ") : "";
  const other = settings?.other_use_case?.trim() || "";

  return `
You are MotionDesk — an internal assistant for business owners and staff (NOT customer-facing).
You help with quotes/pricing, emails/messages, SOPs/checklists, staff onboarding, job planning, and internal support.

MEMORY:
- You will be given the full conversation history in "messages". Use it.
- If the user references "number 1/2/3", infer from your prior list in the same conversation.
- If the user answers with "1." etc, assume they are answering your numbered questions.

STYLE:
- Keep responses short, direct, and actionable.
- When drafting a quote/email: provide a "Ready to send" version.

BUSINESS SETTINGS (from onboarding):
${businessName ? `Business name: ${businessName}` : ""}
${businessType ? `Business type: ${businessType}` : ""}
${location ? `Location: ${location}` : ""}
${pricingRules ? `Pricing / quoting rules: ${pricingRules}` : ""}
${tone ? `Tone & style: ${tone}` : ""}
${goals ? `Business goals: ${goals}` : ""}
${useCases ? `Preferred use cases: ${useCases}` : ""}
${other ? `Other notes: ${other}` : ""}
`.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // --- Backwards compatible parsing ---
    // New format:
    // { messages: ChatMsg[], settings: MotionDeskSettings|null }
    // Old format:
    // { message: string, businessInfo: string, pricingRules: string, tone: string }
    let messages: ChatMsg[] | null = Array.isArray(body?.messages) ? body.messages : null;

    // If they still send old style "message", convert it into messages
    if (!messages && typeof body?.message === "string") {
      messages = [{ role: "user", content: body.message }];
    }

    // Settings (prefer new)
    let settings: MotionDeskSettings | null = body?.settings ?? null;

    // If old style fields exist, map them into settings so prompt still works
    if (!settings && (body?.businessInfo || body?.pricingRules || body?.tone)) {
      settings = {
        business_name: undefined,
        business_type: undefined,
        location: undefined,
        pricing_rules: body?.pricingRules || "",
        tone_style: body?.tone || "",
        // businessInfo is a combined string in your old payload. We can include it inside pricing_rules if needed.
      };
      // If businessInfo exists, blend it into the prompt via pricing_rules
      if (body?.businessInfo) {
        settings.pricing_rules = `${body.businessInfo}\n\nPricing rules:\n${settings.pricing_rules || ""}`.trim();
      }
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ reply: "Send a message to start." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: buildSystemPrompt(settings) }, ...messages],
    });

    return NextResponse.json({
      reply: completion.choices[0]?.message?.content ?? "",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
