import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.BIASBOOST_SESSION_COOKIE ?? "bb_session";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(COOKIE_NAME);
  if (!hasSession) {
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/welcome", "/onboarding", "/settings", "/biases/:path*", "/quiz/:path*", "/analysis/:path*"],
};
