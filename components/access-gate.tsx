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
    <main className="cinematic-background gate-shell" style={{ padding: "28px 20px" }}>
      <section
        aria-labelledby="gate-title"
        style={{
          width: "min(92vw, 430px)",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 34 }}>
          <h1
            id="gate-title"
            style={{
              margin: 0,
              color: "#fff",
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "clamp(44px, 11vw, 64px)",
              fontWeight: 400,
              letterSpacing: "0.025em",
              lineHeight: 1.02,
            }}
          >
            Be Unreadable
          </h1>
          <p
            style={{
              margin: "16px 0 0",
              color: "rgba(255,255,255,.58)",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 11,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
            }}
          >
            Identity Over Data
          </p>
        </div>

        <div
          style={{
            padding: "26px 22px 22px",
            border: "1px solid rgba(255,255,255,.14)",
            background: "rgba(0,0,0,.28)",
            boxShadow: "0 24px 70px rgba(0,0,0,.28)",
            backdropFilter: "blur(10px)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "rgba(255,255,255,.88)",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
            }}
          >
            Early Access
          </p>
          <p
            style={{
              margin: "0 auto 22px",
              maxWidth: 300,
              color: "rgba(255,255,255,.48)",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 12,
              lineHeight: 1.55,
            }}
          >
            Be first to know when the first drop opens.
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
              style={{
                minHeight: 54,
                marginBottom: 12,
                borderColor: "rgba(255,255,255,.22)",
                background: "rgba(255,255,255,.035)",
                fontSize: 14,
              }}
            />

            <label
              style={{
                display: "grid",
                gridTemplateColumns: "18px 1fr",
                gap: 10,
                alignItems: "start",
                margin: "2px 2px 18px",
                color: "rgba(255,255,255,.48)",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 10,
                lineHeight: 1.5,
                textAlign: "left",
              }}
            >
              <input
                checked={consent}
                name="consent"
                onChange={(event) => setConsent(event.target.checked)}
                required
                type="checkbox"
                value="yes"
                style={{ width: 16, height: 16, margin: "1px 0 0" }}
              />
              <span>I agree to receive Be Unreadable Early Access updates by email.</span>
            </label>

            <Button
              className="monochrome-button"
              disabled={submitting}
              type="submit"
              style={{ minHeight: 54, fontSize: 12, letterSpacing: "0.22em" }}
            >
              {submitting ? "Joining" : "Join Early Access"}
            </Button>
          </form>

          <p
            aria-live="polite"
            style={{
              minHeight: 18,
              margin: "14px 0 0",
              color: "rgba(255,255,255,.62)",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 10,
              letterSpacing: "0.04em",
            }}
          >
            {message}
          </p>
        </div>

        <a
          href="/datenschutz"
          style={{
            display: "inline-block",
            marginTop: 22,
            color: "rgba(255,255,255,.34)",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 8,
            letterSpacing: "0.2em",
            textDecorationColor: "rgba(255,255,255,.2)",
            textUnderlineOffset: 4,
            textTransform: "uppercase",
          }}
        >
          Datenschutz
        </a>
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
