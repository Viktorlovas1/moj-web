import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, accessCookieMaxAge, createAccessCookie, isAccessConfigured, verifyAccessCode } from "@/lib/access";

export async function POST(request: Request) {
  if (!isAccessConfigured()) return NextResponse.json({ message: "Private access is not configured yet" }, { status: 503 });
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";
  if (!(await verifyAccessCode(code))) return NextResponse.json({ message: "Wrong access code" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE_NAME, await createAccessCookie(), { httpOnly: true, maxAge: accessCookieMaxAge, path: "/", sameSite: "lax", secure: true });
  return response;
}
