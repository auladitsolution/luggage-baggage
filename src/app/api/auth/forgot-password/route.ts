import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getMockStore } from "@/lib/db/memoryStore";
import { sendEmail } from "@/lib/email/mailer";
import { STORE_INFO } from "@/lib/config/storeInfo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier } = body;

    const cleanId = (identifier || "").trim().toLowerCase();
    if (!cleanId) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে আপনার নিবন্ধিত ইমেইল অথবা ইউজার আইডি লিখুন।" },
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
        { error: "এই ইমেইল বা ইউজার আইডির কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় রয়েছে। স্টোর ওনারের সাথে যোগাযোগ করুন।" },
        { status: 403 }
      );
    }

    // 1. Generate secure 6-digit numeric verification OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    user.resetPasswordToken = resetOtp;
    user.resetPasswordExpires = expiresAt;

    if (db && typeof user.save === "function") {
      await user.save();
    }

    // 2. Dispatch Email:
    let emailDispatched = false;

    // A. If custom SMTP is configured, send the 6-digit OTP code in an email
    if (user.email && (process.env.SMTP_USER || process.env.GMAIL_USER)) {
      try {
        const smtpRes = await sendEmail({
          to: user.email,
          subject: `${STORE_INFO.name} - পাসওয়ার্ড রিসেট ভেরিফিকেশন কোড`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">পাসওয়ার্ড রিসেট ভেরিফিকেশন</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                প্রিয় গ্রাহক/ব্যবহারকারী,<br>
                আপনার <strong>${STORE_INFO.nameBangla}</strong> অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার জন্য নিচের ৬-ডিজিটের ভেরিফিকেশন কোডটি ব্যবহার করুন:
              </p>
              <div style="text-align: center; margin: 24px 0; padding: 16px; background-color: #f0fdf4; border: 1px dashed #22c55e; border-radius: 12px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #15803d; font-family: monospace;">${resetOtp}</span>
              </div>
              <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
                • এই কোডটির মেয়াদ <strong>১৫ মিনিট</strong> থাকবে।<br>
                • আপনি যদি পাসওয়ার্ড রিসেটের অনুরোধ না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন।
              </p>
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;">
              <p style="color: #94a3b8; font-size: 11px; margin-bottom: 0;">
                ${STORE_INFO.name} • ${STORE_INFO.addressBangla} • হেল্পলাইন: ${STORE_INFO.phoneFormatted}
              </p>
            </div>
          `,
        });
        if (smtpRes.success) {
          emailDispatched = true;
        }
      } catch (smtpErr) {
        console.warn("SMTP email dispatch error:", smtpErr);
      }
    }

    // B. Also dispatch official Firebase Password Reset email via Google Identity Toolkit
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (user.email && apiKey) {
      try {
        const fbRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestType: "PASSWORD_RESET",
              email: user.email,
            }),
          }
        );
        const fbData = await fbRes.json();
        if (fbRes.ok && fbData.email) {
          emailDispatched = true;
        } else {
          console.warn("Firebase sendOobCode notification:", fbData?.error?.message || fbData);
        }
      } catch (fbErr) {
        console.warn("Firebase sendOobCode error:", fbErr);
      }
    }

    // 3. Mask email for user privacy display (e.g. l***6@gmail.com)
    let maskedEmail = user.email || "";
    if (maskedEmail && maskedEmail.includes("@")) {
      const [namePart, domainPart] = maskedEmail.split("@");
      if (namePart.length > 2) {
        maskedEmail = `${namePart[0]}***${namePart[namePart.length - 1]}@${domainPart}`;
      } else {
        maskedEmail = `${namePart[0]}*@${domainPart}`;
      }
    }

    // CRITICAL SECURITY FIX: Do NOT return resetCode in the API response!
    // The code is sent privately to the user's email only.
    return NextResponse.json({
      success: true,
      message: emailDispatched
        ? `পাসওয়ার্ড রিসেটের ভেরিফিকেশন কোড ও নির্দেশনা আপনার ইমেইল (${maskedEmail})-এ পাঠানো হয়েছে।`
        : `পাসওয়ার্ড রিসেটের অনুরোধ গ্রহণ করা হয়েছে। আপনার ইমেইল ইনবক্স চেক করুন।`,
      email: maskedEmail || user.username,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "পাসওয়ার্ড রিসেট রিকোয়েস্টে ত্রুটি ঘটেছে: " + error.message },
      { status: 500 }
    );
  }
}
