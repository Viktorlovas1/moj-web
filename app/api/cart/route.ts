import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, isAccessCookieValid } from "@/lib/access";
import { addCartLine, getCart, updateCartLine } from "@/lib/shopify";

async function isAuthorized(request: NextRequest) { return isAccessCookieValid(request.cookies.get(ACCESS_COOKIE_NAME)?.value); }
function errorResponse(error: unknown) { const message = error instanceof Error ? error.message : "Cart request failed"; return NextResponse.json({ message }, { status: 400 }); }

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const cartId = request.nextUrl.searchParams.get("cartId");
  if (!cartId) return NextResponse.json({ message: "Missing cartId" }, { status: 400 });
  try { return NextResponse.json({ cart: await getCart(cartId) }); } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { cartId?: unknown; merchandiseId?: unknown; quantity?: unknown } | null;
  const merchandiseId = typeof body?.merchandiseId === "string" ? body.merchandiseId : "";
  const cartId = typeof body?.cartId === "string" ? body.cartId : undefined;
  const quantity = typeof body?.quantity === "number" && Number.isInteger(body.quantity) ? body.quantity : 1;
  if (!merchandiseId || quantity < 1 || quantity > 20) return NextResponse.json({ message: "Invalid cart line" }, { status: 400 });
  try { return NextResponse.json({ cart: await addCartLine(merchandiseId, quantity, cartId) }); } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthorized(request))) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { cartId?: unknown; lineId?: unknown; quantity?: unknown } | null;
  const cartId = typeof body?.cartId === "string" ? body.cartId : "";
  const lineId = typeof body?.lineId === "string" ? body.lineId : "";
  const quantity = typeof body?.quantity === "number" && Number.isInteger(body.quantity) ? body.quantity : -1;
  if (!cartId || !lineId || quantity < 0 || quantity > 20) return NextResponse.json({ message: "Invalid cart update" }, { status: 400 });
  try { return NextResponse.json({ cart: await updateCartLine(cartId, lineId, quantity) }); } catch (error) { return errorResponse(error); }
}
