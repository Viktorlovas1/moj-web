import { redirect } from "next/navigation";

const SHOPIFY_PRIVACY_POLICY_URL = "https://zx0n6q-qg.myshopify.com/policies/privacy-policy";

export default function DatenschutzPage() {
  redirect(SHOPIFY_PRIVACY_POLICY_URL);
}
