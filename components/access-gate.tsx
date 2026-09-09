"use client";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccessGate() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      if (!response.ok) { const result = (await response.json().catch(() => null)) as { message?: string } | null; setError(result?.message ?? "Wrong access code"); return; }
      window.location.assign("/shop");
    } catch { setError("Access is temporarily unavailable"); } finally { setSubmitting(false); }
  }
  return <main className="cinematic-background gate-shell"><section className="gate-box" aria-labelledby="gate-title"><h1 className="brand-title" id="gate-title">Be Unreadable</h1><p className="brand-tagline">Identity Over Data</p><form onSubmit={unlock}><label className="sr-only" htmlFor="access-code">Access code</label><Input autoComplete="off" className="gate-input" id="access-code" name="access-code" onChange={(event) => setCode(event.target.value)} placeholder="Access code" required type="password" value={code}/><Button className="monochrome-button" disabled={submitting || code.length === 0} type="submit">{submitting ? "Unlocking" : "Unlock"}</Button></form><p aria-live="polite" className="gate-error">{error}</p><a className="gate-legal-link" href="/datenschutz">Datenschutz</a></section></main>;
}
