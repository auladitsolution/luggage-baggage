import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "lumina_session";

function safeDecodeBase64(str: string): string {
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(str, "base64").toString("utf-8");
    }
    const binary = atob(str);
    const bytes = Uint8Array.from(binary, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authMethodCookie = request.cookies.get("lumina_auth_method")?.value;

  // Protect Admin dashboard & POS interface
  const isProtectedAdminRoute = pathname.startsWith("/admin");
  const isProtectedPosRoute = pathname === "/pos";

  if (isProtectedAdminRoute || isProtectedPosRoute) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 1. Strict check: Anyone logged in with Google is completely blocked from POS and Admin
    if (authMethodCookie === "google") {
      const redirectUrl = new URL("/account", request.url);
      redirectUrl.searchParams.set("error", "google_management_blocked");
      return NextResponse.redirect(redirectUrl);
    }

    // 2. Decode session to verify credentials and role
    const decodedJson = safeDecodeBase64(sessionCookie);
    if (decodedJson) {
      try {
        const session = JSON.parse(decodedJson);

        // If session was created via Google, strictly block
        if (session.authMethod === "google") {
          const redirectUrl = new URL("/account", request.url);
          redirectUrl.searchParams.set("error", "google_management_blocked");
          return NextResponse.redirect(redirectUrl);
        }

        // If user is a customer, block from admin and POS
        if (session.roleSlug === "customer" || !session.roleSlug) {
          const redirectUrl = new URL("/account", request.url);
          redirectUrl.searchParams.set("error", "unauthorized_management");
          return NextResponse.redirect(redirectUrl);
        }

        // Cashiers only can access POS, block from Admin
        if (isProtectedAdminRoute && session.roleSlug === "cashier" && !session.isOwner) {
          return NextResponse.redirect(new URL("/pos", request.url));
        }
      } catch {
        // Fall through
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pos"],
};
