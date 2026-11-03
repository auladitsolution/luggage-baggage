import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Role } from "@/models/Role";
import { seedDefaultRoles } from "@/lib/rbac/seed";
import { 
  verifyFirebaseIdToken, 
  createSessionCookie, 
  isFirebaseAdminConfigured 
} from "@/lib/firebase/admin";
import { DEFAULT_ROLES } from "@/lib/constants/permissions";
import { RoleSlug, ALL_PERMISSIONS } from "@/types/auth";
import { getMockStore } from "@/lib/db/memoryStore";
import { ensureOwnerConfigured } from "@/lib/auth/seedOwner";
import { verifyPassword } from "@/lib/auth/password";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "lumina_session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      email, 
      username, 
      password, 
      idToken, 
      firebaseUid, 
      displayName, 
      photoUrl,
      authProvider
    } = body;

    const db = await connectToDatabase();
    await seedDefaultRoles();
    await ensureOwnerConfigured();

    let user: any = null;

    // =========================================================================
    // CASE A: Direct Email / Username & Password Authentication
    // =========================================================================
    if (password) {
      const loginIdentifier = (email || username || "").trim().toLowerCase();
      if (!loginIdentifier) {
        return NextResponse.json(
          { error: "ইমেইল বা ইউজার আইডি প্রদান করা আবশ্যক।" },
          { status: 400 }
        );
      }

      if (!db) {
        const store = getMockStore();
        user = store.users.find(
          (u) =>
            u.email?.toLowerCase() === loginIdentifier ||
            (u as any).username?.toLowerCase() === loginIdentifier
        );
      } else {
        user = await User.findOne({
          $or: [
            { email: loginIdentifier },
            { username: loginIdentifier },
          ],
        }).populate("roleId");
      }

      if (!user) {
        return NextResponse.json(
          { error: "ভুল ইমেইল/আইডি অথবা পাসওয়ার্ড।" },
          { status: 401 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: "আপনার অ্যাকাউন্টটি সাময়িকভাবে নিষ্ক্রিয় করা হয়েছে। স্টোর ওনারের সাথে যোগাযোগ করুন।" },
          { status: 403 }
        );
      }

      const isValidPassword = verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "ভুল ইমেইল/আইডি অথবা পাসওয়ার্ড।" },
          { status: 401 }
        );
      }

      // Update last login
      user.lastLoginAt = new Date();
      if (db && typeof user.save === "function") {
        await user.save();
      }
    } 
    // =========================================================================
    // CASE B: Google ID Token or Firebase UID Authentication
    // =========================================================================
    else {
      if (!idToken && !firebaseUid) {
        return NextResponse.json(
          { error: "ইমেইল ও পাসওয়ার্ড অথবা আইডি টোকেন প্রদান করা আবশ্যক" },
          { status: 400 }
        );
      }

      let verifiedUid = firebaseUid;
      let verifiedEmail = email;
      let verifiedName = displayName || "ব্যবহারকারী";
      let verifiedPhoto = photoUrl;

      // Verify token with Firebase Admin if configured
      if (isFirebaseAdminConfigured() && idToken) {
        const decoded = await verifyFirebaseIdToken(idToken);
        if (!decoded) {
          return NextResponse.json(
            { error: "অবৈধ বা মেয়াদোত্তীর্ণ ফায়ারবেস টোকেন" },
            { status: 401 }
          );
        }
        verifiedUid = decoded.uid;
        verifiedEmail = decoded.email || verifiedEmail;
        verifiedName = decoded.name || verifiedName;
        verifiedPhoto = decoded.picture || verifiedPhoto;
      }

      if (!db) {
        const store = getMockStore();
        user = store.users.find((u) => u.firebaseUid === verifiedUid);

        if (!user) {
          const customerRole = store.roles.find((r) => r.slug === "customer")!;
          user = {
            _id: `mock-user-${Date.now()}`,
            firebaseUid: verifiedUid,
            email: verifiedEmail ? verifiedEmail.toLowerCase() : "customer@demo.com",
            displayName: verifiedName,
            photoUrl: verifiedPhoto,
            roleId: customerRole,
            isActive: true,
            isOwner: false, // NEVER grant owner/admin automatically to new Google account!
            lastLoginAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          store.users.push(user);
        } else {
          user.lastLoginAt = new Date();
          if (verifiedName && !user.displayName) user.displayName = verifiedName;
          if (verifiedPhoto && !user.photoUrl) user.photoUrl = verifiedPhoto;
        }
      } else {
        user = await User.findOne({ firebaseUid: verifiedUid }).populate("roleId");

        // CRITICAL SECURITY RULE: First-time sign-in must STRICTLY receive 'customer' role
        if (!user) {
          const customerRole = await Role.findOne({ slug: "customer" });
          if (!customerRole) {
            return NextResponse.json({ error: "ডিফল্ট রোল লোড করা সম্ভব হয়নি" }, { status: 500 });
          }

          user = await User.create({
            firebaseUid: verifiedUid,
            email: verifiedEmail ? verifiedEmail.toLowerCase() : undefined,
            displayName: verifiedName,
            photoUrl: verifiedPhoto,
            roleId: customerRole._id,
            isActive: true,
            isOwner: false, // NEVER grant owner/admin automatically!
            lastLoginAt: new Date(),
          });

          user = await User.findById(user._id).populate("roleId");
        } else {
          user.lastLoginAt = new Date();
          if (verifiedName && !user.displayName) user.displayName = verifiedName;
          if (verifiedPhoto && !user.photoUrl) user.photoUrl = verifiedPhoto;
          await user.save();
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "ইউজার লোড করা সম্ভব হয়নি" }, { status: 500 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "আপনার অ্যাকাউন্টটি সাময়িকভাবে নিষ্ক্রিয় করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।" },
        { status: 403 }
      );
    }

    const isGoogleLogin = authProvider === "google" || (Boolean(idToken) && !password);
    const isCredentialsLogin = Boolean(password) || (!isGoogleLogin && (user.isOwner || (user.roleId && (user.roleId as any).slug !== "customer")));
    const authMethod: "credentials" | "google" = isGoogleLogin ? "google" : "credentials";

    // CRITICAL SECURITY RULE:
    // If logged in via Google, NEVER grant owner or management permissions under any circumstances!
    // Google logins are strictly restricted to regular customer storefront access.
    let role = DEFAULT_ROLES.customer;
    let isOwner = false;
    let permissions: string[] = [];

    if (isCredentialsLogin && !isGoogleLogin) {
      role = (user.roleId as any) || DEFAULT_ROLES.customer;
      isOwner = user.isOwner || role.slug === "owner";
      permissions = isOwner ? [...ALL_PERMISSIONS] : (role.permissions || []);
    }

    // 3. Create Session Token / Cookie
    let cookieValue = "";

    if (isFirebaseAdminConfigured() && idToken && !isCredentialsLogin) {
      const fbSessionCookie = await createSessionCookie(idToken);
      if (fbSessionCookie) {
        cookieValue = fbSessionCookie;
      }
    }

    // Safe session payload fallback
    if (!cookieValue) {
      const sessionPayload = {
        userId: user._id.toString(),
        firebaseUid: user.firebaseUid || `usr-${user._id}`,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        roleSlug: role.slug as RoleSlug,
        roleNameBangla: role.nameBangla,
        isOwner,
        permissions,
        authMethod,
        createdAt: Date.now(),
      };
      cookieValue = Buffer.from(JSON.stringify(sessionPayload)).toString("base64");
    }

    const response = NextResponse.json({
      success: true,
      user: {
        userId: user._id.toString(),
        displayName: user.displayName,
        email: user.email,
        photoUrl: user.photoUrl,
        roleSlug: role.slug,
        roleNameBangla: role.nameBangla,
        isOwner,
        permissions,
        authMethod,
      },
    });

    // Set HttpOnly, Secure Session Cookie (5 days duration)
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: cookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 24 * 60 * 60, // 5 days
      path: "/",
    });

    // Set Auth Method cookie for lightning-fast Edge middleware checks
    response.cookies.set({
      name: "lumina_auth_method",
      value: authMethod,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "সার্ভারে সেশন তৈরিতে ত্রুটি ঘটেছে: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "লগআউট সফল হয়েছে" });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
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
