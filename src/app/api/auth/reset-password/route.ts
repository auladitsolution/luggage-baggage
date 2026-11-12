import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { getMockStore } from "@/lib/db/memoryStore";
import { isFirebaseAdminConfigured, getFirebaseAdmin } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, code, newPassword } = body;

    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();
    const cleanPassword = (newPassword || "").trim();

    if (!cleanId) {
      return NextResponse.json(
        { error: "ইমেইল বা ইউজার আইডি প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    if (!cleanCode) {
      return NextResponse.json(
        { error: "৬-ডিজিটের ভেরিফিকেশন কোড লিখুন।" },
        { status: 400 }
      );
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json(
        { error: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    let user: any = null;

    if (!db) {
      const store = getMockStore();
      user = store.users.find(
        (u) =>
          u.email?.toLowerCase() === cleanId ||
          (u as any).username?.toLowerCase() === cleanId
      );
    } else {
      user = await User.findOne({
        $or: [{ email: cleanId }, { username: cleanId }],
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "ব্যবহারকারী খুঁজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Check verification OTP code
    if (!user.resetPasswordToken || user.resetPasswordToken !== cleanCode) {
      return NextResponse.json(
        { error: "ভুল ভেরিফিকেশন কোড। অনুগ্রহ করে সঠিক কোডটি লিখুন।" },
        { status: 400 }
      );
    }

    // Check expiration
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
      return NextResponse.json(
        { error: "ভেরিফিকেশন কোডের মেয়াদ শেষ হয়ে গেছে। দয়া করে পুনরায় নতুন কোড চেয়ে আবেদন করুন।" },
        { status: 400 }
      );
    }

    // Set new password
    user.passwordHash = hashPassword(cleanPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    if (db && typeof user.save === "function") {
      await user.save();
    }

    // Also update Firebase user password if applicable
    if (user.firebaseUid && isFirebaseAdminConfigured()) {
      try {
        const adminApp = getFirebaseAdmin();
        await adminApp.auth().updateUser(user.firebaseUid, {
          password: cleanPassword,
        });
      } catch (fbErr) {
        console.warn("Firebase user password sync skipped:", fbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "পাসওয়ার্ড সফলভাবে রিসেট ও পরিবর্তন করা হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "পাসওয়ার্ড পরিবর্তনে ত্রুটি ঘটেছে: " + error.message },
      { status: 500 }
    );
  }
}

