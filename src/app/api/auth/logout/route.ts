import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "lumina_session";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "লগআউট সফল হয়েছে" });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  response.cookies.set({
    name: "lumina_session",
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  response.cookies.set({
    name: "lumina_auth_method",
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}

