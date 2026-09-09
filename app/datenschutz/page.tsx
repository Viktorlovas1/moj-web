import { redirect } from "next/navigation";

const SHOPIFY_PRIVACY_POLICY_URL = "https://checkout.shopify.com/101428101450/policies/59035517258.html?locale=en";

export default function DatenschutzPage() {
  redirect(SHOPIFY_PRIVACY_POLICY_URL);
}
