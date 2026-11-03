import { NextRequest, NextResponse } from "next/server";
import { provisionInitialOwner } from "@/lib/rbac/seed";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { setupToken, email, displayName, firebaseUid } = body;

    if (!setupToken || !email || !displayName || !firebaseUid) {
      return NextResponse.json(
        { error: "setupToken, email, displayName এবং firebaseUid আবশ্যক।" },
        { status: 400 }
      );
    }

    const owner = await provisionInitialOwner({
      setupToken,
      email,
      displayName,
      firebaseUid,
    });

    return NextResponse.json({
      success: true,
      message: "স্টোর ওনার (মালিক) সফলভাবে প্রোভিশন করা হয়েছে।",
      user: {
        id: owner._id,
        email: owner.email,
        displayName: owner.displayName,
        isOwner: owner.isOwner,
        role: (owner.roleId as any)?.nameBangla,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ওনার তৈরিতে সমস্যা হয়েছে" },
      { status: 403 }
    );
  }
}

