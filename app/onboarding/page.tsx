"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type UseCase =
  | "Quotes & pricing"
  | "Write emails & messages"
  | "Create SOPs & checklists"
  | "Staff onboarding & training"
  | "Job planning & next steps"
  | "Sales scripts & objections"
  | "Marketing content"
  | "Customer support drafts (internal)"
  | "Other";

export default function OnboardingPage() {
  const router = useRouter();

  // Existing fields
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [pricingRules, setPricingRules] = useState("");
  const [toneStyle, setToneStyle] = useState("");

  // New fields
  const [businessGoals, setBusinessGoals] = useState("");
  const [useCases, setUseCases] = useState<UseCase[]>([
    "Quotes & pricing",
    "Write emails & messages",
  ]);
  const [otherUseCase, setOtherUseCase] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const useCaseOptions: UseCase[] = useMemo(
    () => [
      "Quotes & pricing",
      "Write emails & messages",
      "Create SOPs & checklists",
      "Staff onboarding & training",
      "Job planning & next steps",
      "Sales scripts & objections",
      "Marketing content",
      "Customer support drafts (internal)",
      "Other",
    ],
    []
  );

  function toggleUseCase(val: UseCase) {
    setUseCases((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
    );
  }

  async function handleFinish() {
    setMsg(null);
    setLoading(true);

    try {
      if (!businessName.trim()) {
        setMsg("Please enter your business name.");
        return;
      }

      const payload = {
        business_name: businessName.trim(),
        business_type: businessType.trim(),
        location: location.trim(),
        pricing_rules: pricingRules.trim(),
        tone_style: toneStyle.trim(),
        business_goals: businessGoals.trim(),
        use_cases: useCases,
        other_use_case: useCases.includes("Other") ? otherUseCase.trim() : "",
        updated_at: new Date().toISOString(),
      };

      // If you already have a table, wire it here.
      // console.log for now so nothing breaks.
      console.log("ONBOARDING PAYLOAD:", payload);

      router.push("/chat");
    } catch (e: any) {
      setMsg(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- Styles ---------------- */

  const shell: React.CSSProperties = {
    minHeight: "100vh",
    padding: "42px 18px",
    background:
      "radial-gradient(1100px 550px at 20% 0%, #eef2ff 0%, transparent 60%), radial-gradient(1000px 500px at 100% 20%, #ecfeff 0%, transparent 55%), #f6f7fb",
    display: "flex",
    justifyContent: "center",
  };

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 980,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 16px 50px rgba(15, 23, 42, 0.10)",
    padding: 24,
  };

  const topRow: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  };

  const badge: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    border: "1px solid #e5e7eb",
    background: "white",
    padding: "10px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 900,
    color: "#334155",
    width: "fit-content",
  };

  const h1: React.CSSProperties = {
    margin: 0,
    fontSize: 28,
    fontWeight: 950,
    letterSpacing: -0.03,
    color: "#0f172a",
    lineHeight: 1.15,
  };

  const sub: React.CSSProperties = {
    margin: "10px 0 0",
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.55,
    maxWidth: 720,
  };

  const divider: React.CSSProperties = {
    height: 1,
    background: "#e5e7eb",
    margin: "18px 0 22px",
  };

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 16,
  };

  const colFull: React.CSSProperties = {
    gridColumn: "1 / -1",
  };

  const section: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "white",
    padding: 16,
  };

  const sectionTitle: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    fontWeight: 950,
    color: "#0f172a",
    letterSpacing: -0.01,
  };

  const sectionHint: React.CSSProperties = {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.45,
  };

  const label: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 850,
    color: "#334155",
    marginBottom: 6,
    marginTop: 12,
  };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "12px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    outline: "none",
    fontSize: 14,
    background: "white",
  };

  const textarea: React.CSSProperties = {
    ...input,
    minHeight: 120,
    resize: "vertical",
    fontFamily: "inherit",
  };

  const bigTextarea: React.CSSProperties = {
    ...input,
    minHeight: 160,
    resize: "vertical",
    fontFamily: "inherit",
  };

  const chipsWrap: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  };

  const chip: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "10px 12px",
    background: "white",
    cursor: "pointer",
    userSelect: "none",
  };

  const checkbox: React.CSSProperties = {
    width: 18,
    height: 18,
    accentColor: "#111827",
  };

  const chipText: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 900,
    color: "#0f172a",
  };

  const actions: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
    flexWrap: "wrap",
  };

  const msgStyle: React.CSSProperties = {
    color: "#6b7280",
    fontSize: 13,
  };

  const btnPrimary: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#111827",
    color: "white",
    fontWeight: 950,
    cursor: "pointer",
    minWidth: 160,
  };

  const tip: React.CSSProperties = {
    marginTop: 14,
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.5,
  };

  const responsiveStyle = `
    @media (max-width: 860px) {
      .md-grid { grid-template-columns: 1fr !important; }
    }
  `;

  return (
    <main style={shell}>
      <style>{responsiveStyle}</style>

      <section style={card}>
        <div style={topRow}>
          <div>
            <h1 style={h1}>Set up MotionDesk</h1>
            <p style={sub}>
              Fill this in once. Your team can update it later in <b>Settings</b>.
              The more detail you add here, the better your assistant behaves.
            </p>
          </div>

          <div style={badge}>
            <Image
              src="/pulse-logo.jpg"
              alt="Pulse"
              width={28}
              height={28}
              style={{ borderRadius: 7 }}
            />
            <span>Powered by Pulse</span>
          </div>
        </div>

        <div style={divider} />

        <div className="md-grid" style={grid}>
          {/* LEFT COLUMN */}
          <div style={section}>
            <p style={sectionTitle}>Business details</p>
            <p style={sectionHint}>
              This gives MotionDesk context (what you do, where you operate, and how you quote).
            </p>

            <label style={label}>Business name</label>
            <input
              style={input}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="JJ Cleanup Group"
            />

            <label style={label}>Business type</label>
            <input
              style={input}
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="Rubbish removal / electrician / plumber etc"
            />

            <label style={label}>Location</label>
            <input
              style={input}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Melbourne, VIC"
            />

            <label style={label}>Pricing / quoting rules</label>
            <textarea
              style={textarea}
              value={pricingRules}
              onChange={(e) => setPricingRules(e.target.value)}
              placeholder="Product price, what affects price, extras , common add-ons, callout minimums, ect."
            />

            <label style={label}>Tone & style</label>
            <textarea
              style={textarea}
              value={toneStyle}
              onChange={(e) => setToneStyle(e.target.value)}
              placeholder="Friendly Aussie. Professional. Short and confident."
            />
          </div>

          {/* RIGHT COLUMN */}
          <div style={section}>
            <p style={sectionTitle}>How you want to use MotionDesk</p>
            <p style={sectionHint}>
              Pick what matters most. This helps MotionDesk respond in the right format.
            </p>

            <div style={chipsWrap}>
              {useCaseOptions.map((opt) => {
                const checked = useCases.includes(opt);
                return (
                  <div
                    key={opt}
                    style={{
                      ...chip,
                      borderColor: checked ? "#111827" : "#e5e7eb",
                      background: checked ? "rgba(17,24,39,0.04)" : "white",
                    }}
                    onClick={() => toggleUseCase(opt)}
                    role="button"
                    aria-label={`Toggle ${opt}`}
                  >
                    <input type="checkbox" checked={checked} readOnly style={checkbox} />
                    <span style={chipText}>{opt}</span>
                  </div>
                );
              })}
            </div>

            {useCases.includes("Other") && (
              <>
                <label style={label}>Other (optional)</label>
                <input
                  style={input}
                  value={otherUseCase}
                  onChange={(e) => setOtherUseCase(e.target.value)}
                  placeholder="Safety checklists, internal FAQs, job notes, etc."
                />
              </>
            )}

            <div style={{ height: 14 }} />

            <p style={sectionTitle}>Business goals</p>
            <p style={sectionHint}>
              Tell MotionDesk what you are trying to achieve so it can prioritize the right outputs.
            </p>

            <label style={label}>Goals</label>
            <textarea
              style={bigTextarea}
              value={businessGoals}
              onChange={(e) => setBusinessGoals(e.target.value)}
              placeholder="Speed up quoting. Train staff faster. Keep replies consistent. Reduce admin."
            />

            <div style={tip}>
              Tip: Add examples of your best quotes or messages for even better results.
            </div>
          </div>

          {/* ACTIONS */}
          <div style={{ ...colFull, ...actions }}>
            <div style={msgStyle}>{msg ? msg : "You can refine this later in Settings."}</div>

            <button
              style={{ ...btnPrimary, opacity: loading ? 0.75 : 1 }}
              disabled={loading}
              onClick={handleFinish}
            >
              {loading ? "Saving..." : "Finish setup"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
