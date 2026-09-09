import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Storefront } from "@/components/storefront";
import { ACCESS_COOKIE_NAME, isAccessCookieValid } from "@/lib/access";
import { getProducts } from "@/lib/shopify";

export default async function ShopPage() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!(await isAccessCookieValid(accessCookie))) redirect("/");
  let shopState: Awaited<ReturnType<typeof getProducts>>;
  try { shopState = await getProducts(); } catch { shopState = { configured: false, products: [] }; }
  return <Storefront products={shopState.products} shopConfigured={shopState.configured} />;
}
