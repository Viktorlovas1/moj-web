import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccessGate } from "@/components/access-gate";
import { ACCESS_COOKIE_NAME, isAccessCookieValid } from "@/lib/access";

export default async function Home() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (await isAccessCookieValid(accessCookie)) redirect("/shop");
  return <AccessGate />;
}
