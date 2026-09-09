"use client";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EarlyAccessGate() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submitEarlyAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setMessage("");
    try {
      const body = new URLSearchParams({ "form-name": "early-access", email, consent: consent ? "yes" : "no" });
      const response = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
      if (!response.ok) throw new Error("submit failed");
      setEmail(""); setConsent(false); setMessage("You're on the Early Access list.");
    } catch { setMessage("Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  }

  return (
    <main className="cinematic-background" style={{ minHeight: "100svh", display: "flex", flexDirection: "column", padding: "34px 22px 22px" }}>
      <section aria-labelledby="gate-title" style={{ width: "min(88vw, 430px)", margin: "auto", textAlign: "center" }}>
        <h1 id="gate-title" style={{ margin: 0, color: "#fff", fontFamily: 'Georgia, "Times New Roman", serif', fontSize: "clamp(42px, 10.5vw, 62px)", fontWeight: 400, letterSpacing: ".025em", lineHeight: 1.02 }}>Be Unreadable</h1>
        <p style={{ margin: "15px 0 52px", color: "rgba(255,255,255,.58)", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11, letterSpacing: ".34em", textTransform: "uppercase" }}>Identity Over Data</p>
        <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,.82)", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".24em", textTransform: "uppercase" }}>Early Access · First Drop</p>
        <form onSubmit={submitEarlyAccess}>
          <label className="sr-only" htmlFor="early-access-email">Email address</label>
          <Input className="gate-input" id="early-access-email" name="email" onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required type="email" value={email} style={{ minHeight: 58, marginBottom: 14, borderColor: "rgba(255,255,255,.26)", background: "rgba(0,0,0,.12)", fontSize: 14 }} />
          <label style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 10, alignItems: "start", margin: "0 2px 20px", color: "rgba(255,255,255,.48)", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 10, lineHeight: 1.5, textAlign: "left" }}>
            <input checked={consent} name="consent" onChange={(e) => setConsent(e.target.checked)} required type="checkbox" value="yes" style={{ width: 16, height: 16, margin: "1px 0 0" }} />
            <span>I agree to receive Be Unreadable Early Access updates by email.</span>
          </label>
          <Button className="monochrome-button" disabled={submitting} type="submit" style={{ minHeight: 56, fontSize: 12, letterSpacing: ".22em" }}>{submitting ? "Joining" : "Join Early Access"}</Button>
        </form>
        <p aria-live="polite" style={{ minHeight: 18, margin: "14px 0 0", color: "rgba(255,255,255,.62)", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 10 }}>{message}</p>
      </section>
      <footer style={{ width: "100%", textAlign: "center", paddingTop: 28 }}>
        <a href="/datenschutz" style={{ color: "rgba(255,255,255,.38)", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 8, letterSpacing: ".2em", textDecorationColor: "rgba(255,255,255,.2)", textUnderlineOffset: 4, textTransform: "uppercase" }}>Datenschutz</a>
      </footer>
    </main>
  );
}

export const AccessGate = EarlyAccessGate;

export function SellerAccessGate() {
  const [code, setCode] = useState(""); const [error, setError] = useState(""); const [submitting, setSubmitting] = useState(false);
  async function unlock(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSubmitting(true); setError(""); try { const response = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }); if (!response.ok) { const result = (await response.json().catch(() => null)) as { message?: string } | null; setError(result?.message ?? "Wrong access code"); return; } window.location.assign("/shop"); } catch { setError("Access is temporarily unavailable"); } finally { setSubmitting(false); } }
  return <main className="cinematic-background gate-shell"><section className="gate-box" aria-labelledby="seller-title"><h1 className="brand-title" id="seller-title">Seller Access</h1><p className="brand-tagline">Be Unreadable</p><form onSubmit={unlock}><label className="sr-only" htmlFor="seller-access-code">Access code</label><Input autoComplete="off" className="gate-input" id="seller-access-code" name="access-code" onChange={(e) => setCode(e.target.value)} placeholder="Access code" required type="password" value={code}/><Button className="monochrome-button" disabled={submitting || code.length === 0} type="submit">{submitting ? "Unlocking" : "Enter"}</Button></form><p aria-live="polite" className="gate-error">{error}</p></section></main>;
}
