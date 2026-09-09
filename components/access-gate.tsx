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
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const body = new URLSearchParams({
        "form-name": "early-access",
        email,
        consent: consent ? "yes" : "no",
      });
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!response.ok) throw new Error("submit failed");
      setEmail("");
      setConsent(false);
      setMessage("You're on the Early Access list.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="cinematic-background gate-shell">
      <section className="gate-box" aria-labelledby="gate-title">
        <h1 className="brand-title" id="gate-title">Be Unreadable</h1>
        <p className="brand-tagline">Identity Over Data</p>

        <div>
          <p style={{ margin: "0 0 14px", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,.72)" }}>
            Early Access
          </p>
          <form onSubmit={submitEarlyAccess}>
            <label className="sr-only" htmlFor="early-access-email">Email address</label>
            <Input
              className="gate-input"
              id="early-access-email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              required
              type="email"
              value={email}
            />
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "0 0 14px", color: "rgba(255,255,255,.6)", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 10, lineHeight: 1.5, textAlign: "left" }}>
              <input checked={consent} name="consent" onChange={(event) => setConsent(event.target.checked)} required type="checkbox" value="yes" style={{ marginTop: 2 }} />
              <span>I agree to receive Be Unreadable Early Access updates by email.</span>
            </label>
            <Button className="monochrome-button" disabled={submitting} type="submit">{submitting ? "Joining" : "Join Early Access"}</Button>
          </form>
          <p aria-live="polite" className="gate-error">{message}</p>
        </div>

        <a className="gate-legal-link" href="/datenschutz">Datenschutz</a>
      </section>
    </main>
  );
}

export const AccessGate = EarlyAccessGate;

export function SellerAccessGate() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(result?.message ?? "Wrong access code");
        return;
      }
      window.location.assign("/shop");
    } catch {
      setError("Access is temporarily unavailable");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="cinematic-background gate-shell">
      <section className="gate-box" aria-labelledby="seller-title">
        <h1 className="brand-title" id="seller-title">Seller Access</h1>
        <p className="brand-tagline">Be Unreadable</p>
        <form onSubmit={unlock}>
          <label className="sr-only" htmlFor="seller-access-code">Access code</label>
          <Input autoComplete="off" className="gate-input" id="seller-access-code" name="access-code" onChange={(event) => setCode(event.target.value)} placeholder="Access code" required type="password" value={code} />
          <Button className="monochrome-button" disabled={submitting || code.length === 0} type="submit">{submitting ? "Unlocking" : "Enter"}</Button>
        </form>
        <p aria-live="polite" className="gate-error">{error}</p>
      </section>
    </main>
  );
}
