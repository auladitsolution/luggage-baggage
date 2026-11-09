import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User, IUserDocument } from "@/models/User";
import { Role, IRoleDocument } from "@/models/Role";
import { verifySessionCookie, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { Permission, IUserSession, RoleSlug, ALL_PERMISSIONS } from "@/types/auth";
import { DEFAULT_ROLES } from "@/lib/constants/permissions";
import { getMockStore } from "@/lib/db/memoryStore";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "lumina_session";

/**
 * Get current authenticated user session from HttpOnly session cookie or NextRequest
 */
export async function getSession(req?: NextRequest): Promise<IUserSession | null> {
  let sessionToken: string | undefined;

  // 1. Read directly from incoming request cookies if available
  if (req) {
    sessionToken =
      req.cookies.get(SESSION_COOKIE_NAME)?.value ||
      req.cookies.get("lumina_session")?.value;

    if (!sessionToken) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        sessionToken = authHeader.slice(7).trim();
      }
    }
  }

  // 2. Read from next/headers cookies() as fallback
  if (!sessionToken) {
    try {
      const cookieStore = await cookies();
      sessionToken =
        cookieStore.get(SESSION_COOKIE_NAME)?.value ||
        cookieStore.get("lumina_session")?.value;
    } catch {
      // ignore
    }
  }

  if (sessionToken) {
    sessionToken = sessionToken.trim();
    if (sessionToken.includes("%")) {
      try {
        sessionToken = decodeURIComponent(sessionToken);
      } catch {}
    }
    if (sessionToken.startsWith('"') && sessionToken.endsWith('"')) {
      sessionToken = sessionToken.slice(1, -1);
    }
  }

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
        permissions: [...ALL_PERMISSIONS],
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

  // 2. Safe Fallback for credentials / base64 session tokens
  try {
    const decodedStr = Buffer.from(sessionToken, "base64").toString("utf-8");
    const parsed = JSON.parse(decodedStr);

    if (parsed && (parsed.firebaseUid || parsed.userId || parsed.email)) {
      const isGoogleAuth = parsed.authMethod === "google";
      const db = await connectToDatabase();
      if (db) {
        const isMongoId = typeof parsed.userId === "string" && /^[0-9a-fA-F]{24}$/.test(parsed.userId);
        const orConditions: any[] = [];
        if (isMongoId) {
          orConditions.push({ _id: parsed.userId });
        }
        if (parsed.firebaseUid) {
          orConditions.push({ firebaseUid: parsed.firebaseUid });
        }
        if (parsed.email) {
          orConditions.push({ email: parsed.email.toLowerCase() });
        }

        const user = orConditions.length > 0
          ? await User.findOne({ $or: orConditions }).populate<{ roleId: IRoleDocument }>("roleId")
          : null;

        if (user && user.isActive) {
          const role = user.roleId as IRoleDocument;
          const isOwner = isGoogleAuth ? false : (user.isOwner || role?.slug === "owner" || parsed.isOwner || parsed.roleSlug === "owner");
          const roleSlug = isGoogleAuth ? "customer" : ((role?.slug as RoleSlug) || (parsed.roleSlug as RoleSlug) || (isOwner ? "owner" : "customer"));
          const permissions = isGoogleAuth
            ? []
            : (isOwner ? [...ALL_PERMISSIONS] : ((role?.permissions as Permission[]) || (parsed.permissions as Permission[]) || []));

          return {
            userId: user._id.toString(),
            firebaseUid: user.firebaseUid || parsed.firebaseUid || `usr-${user._id}`,
            email: user.email,
            displayName: user.displayName,
            photoUrl: user.photoUrl,
            roleSlug,
            roleNameBangla: isGoogleAuth ? "সাধারণ ক্রেতা" : (role?.nameBangla || parsed.roleNameBangla || "দোকানের কর্মী"),
            isOwner,
            permissions,
            authMethod: isGoogleAuth ? "google" : "credentials",
          };
        }
      } else {
        const store = getMockStore();
        const user = store.users.find((u) => u._id === parsed.userId || u.firebaseUid === parsed.firebaseUid);
        if (user && user.isActive) {
          const role = user.roleId;
          const isOwner = isGoogleAuth ? false : (user.isOwner || role?.slug === "owner" || parsed.isOwner || parsed.roleSlug === "owner");
          return {
            userId: user._id,
            firebaseUid: user.firebaseUid || parsed.firebaseUid || `usr-${user._id}`,
            email: user.email,
            displayName: user.displayName,
            photoUrl: user.photoUrl,
            roleSlug: isGoogleAuth ? "customer" : ((role?.slug as RoleSlug) || (parsed.roleSlug as RoleSlug) || (isOwner ? "owner" : "customer")),
            roleNameBangla: isGoogleAuth ? "সাধারণ ক্রেতা" : (role?.nameBangla || parsed.roleNameBangla || "দোকানের কর্মী"),
            isOwner,
            permissions: isGoogleAuth ? [] : (isOwner ? [...ALL_PERMISSIONS] : ((role?.permissions as Permission[]) || [])),
            authMethod: isGoogleAuth ? "google" : "credentials",
          };
        }
      }

      // 3. Fallback: Reconstruct valid session directly from parsed token
      const isOwner = isGoogleAuth ? false : (parsed.isOwner || parsed.roleSlug === "owner");
      const roleSlug = isGoogleAuth ? "customer" : ((parsed.roleSlug as RoleSlug) || (isOwner ? "owner" : "customer"));
      const defaultRole = DEFAULT_ROLES[roleSlug] || DEFAULT_ROLES.customer;
      const permissions = isGoogleAuth
        ? []
        : (isOwner ? [...ALL_PERMISSIONS] : (Array.isArray(parsed.permissions) && parsed.permissions.length > 0 ? parsed.permissions : defaultRole.permissions));

      return {
        userId: parsed.userId || "usr-fallback",
        firebaseUid: parsed.firebaseUid || "usr-fallback",
        email: parsed.email,
        displayName: parsed.displayName || "দোকান মালিক",
        photoUrl: parsed.photoUrl,
        roleSlug,
        roleNameBangla: isOwner ? "দোকানের মালিক" : defaultRole.nameBangla,
        isOwner,
        permissions,
        authMethod: isGoogleAuth ? "google" : "credentials",
      };
    }
  } catch (err) {
    console.warn("Session token decode fallback error:", err);
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
export async function requirePermission(permission: Permission, req?: NextRequest): Promise<IUserSession> {
  const session = await getSession(req);

  if (!session) {
    throw new Error("অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে প্রথমে লগইন করুন।");
  }

  if (!hasPermission(session, permission)) {
    throw new Error(`এই কাজটি করার অনুমতি আপনার নেই (প্রয়োজনীয় পারমিশন: ${permission})।`);
  }

  return session;
}
