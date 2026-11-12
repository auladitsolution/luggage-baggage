import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/rbac/guards";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { getMockStore } from "@/lib/db/memoryStore";
import { isFirebaseAdminConfigured, getFirebaseAdmin } from "@/lib/firebase/admin";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে প্রথমে লগইন করুন।" },
        { status: 401 }
      );
    }

    if (session.authMethod === "google") {
      return NextResponse.json(
        {
          error:
            "আপনার অ্যাকাউন্টটি গুগল সাইন-ইন দিয়ে নিবন্ধিত। গুগল অ্যাকাউন্টের পাসওয়ার্ড গুগল সিকিউরিটি থেকেই নিয়ন্ত্রিত হয়।",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    if (!oldPassword) {
      return NextResponse.json(
        { error: "আপনার বর্তমান (ওল্ড) পাসওয়ার্ডটি লিখুন।" },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।" },
        { status: 400 }
      );
    }

    if (oldPassword === newPassword) {
      return NextResponse.json(
        { error: "নতুন পাসওয়ার্ডটি বর্তমান পাসওয়ার্ড থেকে ভিন্ন হতে হবে।" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    let user: any = null;

    if (!db) {
      const store = getMockStore();
      user = store.users.find(
        (u) => u._id === session.userId || u.email === session.email
      );
    } else {
      const isObjectId = mongoose.Types.ObjectId.isValid(session.userId);
      const orConditions: any[] = [];
      if (isObjectId) orConditions.push({ _id: session.userId });
      if (session.firebaseUid) orConditions.push({ firebaseUid: session.firebaseUid });
      if (session.email) orConditions.push({ email: session.email.toLowerCase() });

      user = await User.findOne({ $or: orConditions });
    }

    if (!user) {
      return NextResponse.json(
        { error: "ব্যবহারকারী অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Verify current (old) password
    const isOldPasswordValid = verifyPassword(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      return NextResponse.json(
        { error: "বর্তমান (ওল্ড) পাসওয়ার্ডটি ভুল। অনুগ্রহ করে সঠিক পাসওয়ার্ড লিখুন।" },
        { status: 400 }
      );
    }

    // Hash and update new password
    user.passwordHash = hashPassword(newPassword);

    if (db && typeof user.save === "function") {
      await user.save();
    }

    // Sync to Firebase Auth if user has firebaseUid
    if (user.firebaseUid && isFirebaseAdminConfigured()) {
      try {
        const adminApp = getFirebaseAdmin();
        await adminApp.auth().updateUser(user.firebaseUid, {
          password: newPassword,
        });
      } catch (fbErr) {
        console.warn("Firebase password sync skipped:", fbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "পাসওয়ার্ড পরিবর্তনে ত্রুটি ঘটেছে: " + error.message },
      { status: 500 }
    );
  }
}

