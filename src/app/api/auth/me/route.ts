import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/rbac/guards";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "প্রোফাইল লোড করতে ব্যর্থ: " + error.message },
      { status: 500 }
    );
  }
}

