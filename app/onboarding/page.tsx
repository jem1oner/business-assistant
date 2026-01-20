"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase-browser";

export default function OnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [pricingRules, setPricingRules] = useState("");
  const [tone, setTone] = useState("");

  // If user already onboarded, skip this page
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabaseBrowser.auth.getUser();
      if (!auth?.user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (profile?.onboarding_complete) {
        router.push("/chat");
        return;
      }

      setLoading(false);
    })();
  }, [router]);

  async function save() {
    setMsg(null);
    setSaving(true);

    try {
      const { data: auth } = await supabaseBrowser.auth.getUser();
      if (!auth?.user) {
        router.push("/login");
        return;
      }

      const { error } = await supabaseBrowser.from("profiles").upsert({
        id: auth.user.id,
        onboarding_complete: true,
        business_name: businessName,
        business_type: businessType,
        location,
        pricing_rules: pricingRules,
        tone,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      router.push("/chat");
    } catch (e: any) {
      setMsg(e?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 600, margin: "60px auto", padding: 16 }}>
        Loading...
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 700, margin: "60px auto", padding: 16 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700 }}>Set up your business</h1>
      <p style={{ marginTop: 8, color: "#444" }}>
        Fill this in once. You can change it later.
      </p>

      <div style={{ marginTop: 18 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Business name</label>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          placeholder="JJ Cleanup Group"
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Business type</label>
        <input
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          placeholder="Rubbish removal / electrician / plumber etc"
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Location</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          placeholder="Melbourne, VIC"
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Pricing / quoting rules</label>
        <textarea
          value={pricingRules}
          onChange={(e) => setPricingRules(e.target.value)}
          style={{ width: "100%", minHeight: 120, padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          placeholder="Minimum callout, per-metre pricing, extras, etc."
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Tone & style</label>
        <textarea
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          style={{ width: "100%", minHeight: 90, padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          placeholder="Friendly Aussie, professional, short and confident, etc."
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          marginTop: 16,
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid #ddd",
          cursor: "pointer",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? "Saving..." : "Finish setup"}
      </button>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
