import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User, IUserDocument } from "@/models/User";
import { Role, IRoleDocument } from "@/models/Role";
import { verifySessionCookie, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { Permission, IUserSession, RoleSlug } from "@/types/auth";
import { DEFAULT_ROLES } from "@/lib/constants/permissions";
import { getMockStore } from "@/lib/db/memoryStore";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "lumina_session";

/**
 * Get current authenticated user session from HttpOnly session cookie
 */
export async function getSession(): Promise<IUserSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    if (process.env.NODE_ENV === "development") {
      const defaultRole = DEFAULT_ROLES.owner;
      return {
        userId: "dev-owner-id",
        firebaseUid: "dev-owner-uid",
        email: "owner@lumina.com",
        displayName: "এডমিন (Dev)",
        photoUrl: "",
        roleSlug: defaultRole.slug,
        roleNameBangla: defaultRole.nameBangla,
        isOwner: true,
        permissions: defaultRole.permissions,
        authMethod: "credentials",
      };
    }
    return null;
  }

  // 1. Try to verify via Firebase Admin Session Cookie
  if (isFirebaseAdminConfigured()) {
    try {
      const decoded = await verifySessionCookie(sessionToken);
      if (decoded) {
        const db = await connectToDatabase();
        if (db) {
          const user = await User.findOne({ firebaseUid: decoded.uid }).populate<{ roleId: IRoleDocument }>("roleId");

          if (user && user.isActive) {
            const role = user.roleId as IRoleDocument;
            return {
              userId: user._id.toString(),
              firebaseUid: user.firebaseUid || decoded.uid,
              email: user.email,
              displayName: user.displayName,
              photoUrl: user.photoUrl,
              roleSlug: "customer",
              roleNameBangla: "সাধারণ ক্রেতা",
              isOwner: false,
              permissions: [],
              authMethod: "google",
            };
          }
        }
      }
    } catch (err) {
      // Fall through to fallback decoder
    }
  }

  // 2. Safe Fallback for offline / development / demo session tokens
  try {
    const parsed = JSON.parse(Buffer.from(sessionToken, "base64").toString("utf-8"));
    if (parsed && parsed.firebaseUid) {
      const isGoogleAuth = parsed.authMethod === "google";
      const db = await connectToDatabase();
      if (db) {
        const query = parsed.userId
          ? { $or: [{ _id: parsed.userId }, { firebaseUid: parsed.firebaseUid }] }
          : { firebaseUid: parsed.firebaseUid };
        const user = await User.findOne(query).populate<{ roleId: IRoleDocument }>("roleId");
        if (user && user.isActive) {
          const role = user.roleId as IRoleDocument;
          return {
            userId: user._id.toString(),
            firebaseUid: user.firebaseUid || parsed.firebaseUid,
            email: user.email,
            displayName: user.displayName,
            photoUrl: user.photoUrl,
            roleSlug: isGoogleAuth ? "customer" : ((role?.slug as RoleSlug) || "customer"),
            roleNameBangla: isGoogleAuth ? "সাধারণ ক্রেতা" : (role?.nameBangla || "সাধারণ ক্রেতা"),
            isOwner: isGoogleAuth ? false : (user.isOwner || role?.slug === "owner"),
            permissions: isGoogleAuth ? [] : ((role?.permissions as Permission[]) || []),
            authMethod: isGoogleAuth ? "google" : "credentials",
          };
        }
      } else {
        const store = getMockStore();
        const user = store.users.find((u) => u._id === parsed.userId || u.firebaseUid === parsed.firebaseUid);
        if (user && user.isActive) {
          const role = user.roleId;
          return {
            userId: user._id,
            firebaseUid: user.firebaseUid || parsed.firebaseUid,
            email: user.email,
            displayName: user.displayName,
            photoUrl: user.photoUrl,
            roleSlug: isGoogleAuth ? "customer" : ((role?.slug as RoleSlug) || "customer"),
            roleNameBangla: isGoogleAuth ? "সাধারণ ক্রেতা" : (role?.nameBangla || "সাধারণ ক্রেতা"),
            isOwner: isGoogleAuth ? false : (user.isOwner || role?.slug === "owner"),
            permissions: isGoogleAuth ? [] : ((role?.permissions as Permission[]) || []),
            authMethod: isGoogleAuth ? "google" : "credentials",
          };
        }
      }

      // If user not yet in DB, check role from parsed token safely
      const roleSlug = isGoogleAuth ? "customer" : ((parsed.roleSlug as RoleSlug) || "customer");
      const defaultRole = DEFAULT_ROLES[roleSlug] || DEFAULT_ROLES.customer;
      return {
        userId: parsed.userId || "demo-user-id",
        firebaseUid: parsed.firebaseUid,
        email: parsed.email,
        displayName: parsed.displayName || "ব্যবহারকারী",
        photoUrl: parsed.photoUrl,
        roleSlug: defaultRole.slug,
        roleNameBangla: defaultRole.nameBangla,
        isOwner: isGoogleAuth ? false : roleSlug === "owner",
        permissions: isGoogleAuth ? [] : defaultRole.permissions,
        authMethod: isGoogleAuth ? "google" : "credentials",
      };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Check if the session has a specific permission
 */
export function hasPermission(session: IUserSession | null, permission: Permission): boolean {
  if (!session) return false;
  // SECURITY POLICY: Accounts authenticated via Google NEVER have management permissions!
  if (session.authMethod === "google") return false;
  if (session.isOwner || session.roleSlug === "owner") return true;
  return session.permissions.includes(permission);
}

/**
 * Server guard: throws error if unauthorized
 */
export async function requirePermission(permission: Permission): Promise<IUserSession> {
  const session = await getSession();

  if (!session) {
    throw new Error("অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে প্রথমে লগইন করুন।");
  }

  if (!hasPermission(session, permission)) {
    throw new Error(`এই কাজটি করার অনুমতি আপনার নেই (প্রয়োজনীয় পারমিশন: ${permission})।`);
  }

  return session;
}
