import type { Metadata } from "next";
import Link from "next/link";
import { getPrivacyPolicy } from "@/lib/shopify";

export const metadata: Metadata = { title: "Datenschutzerklärung | Be Unreadable", description: "Datenschutzerklärung von Be Unreadable" };
export const dynamic = "force-dynamic";

export default async function DatenschutzPage() {
  let policy: Awaited<ReturnType<typeof getPrivacyPolicy>>["policy"] = null;
  try { policy = (await getPrivacyPolicy()).policy; } catch { policy = null; }
  return <main className="legal-page"><article className="legal-document"><header className="legal-header"><Link href="/">Be Unreadable</Link><span>Datenschutz</span></header><h1 className="legal-title">Datenschutzerklärung</h1>{policy ? <div className="legal-content" dangerouslySetInnerHTML={{ __html: policy.body }} /> : <p className="legal-unavailable">Die Datenschutzerklärung ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.</p>}</article></main>;
}
