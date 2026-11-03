import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

// Check if real Firebase Admin credentials are provided
export const isFirebaseAdminConfigured = (): boolean => {
  return !!(projectId && clientEmail && privateKey && !clientEmail.includes("xxxxx"));
};

export function getFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  if (isFirebaseAdminConfigured()) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Graceful fallback for local development/preview before keys are configured
  console.warn("⚠️ Firebase Admin credentials not set. Initializing default app.");
  return admin.initializeApp({
    projectId: projectId || "lumina-luggage-preview",
  });
}

export async function verifyFirebaseIdToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  if (!isFirebaseAdminConfigured()) {
    console.warn("⚠️ Firebase Admin not configured. Verifying mock token.");
    // In mock/test mode without credentials
    return null;
  }

  try {
    const adminApp = getFirebaseAdmin();
    return await adminApp.auth().verifyIdToken(idToken);
  } catch (err) {
    console.error("Firebase ID Token verification failed:", err);
    return null;
  }
}

export async function createSessionCookie(
  idToken: string,
  expiresInMs = 5 * 24 * 60 * 60 * 1000 // 5 days
): Promise<string | null> {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  try {
    const adminApp = getFirebaseAdmin();
    return await adminApp.auth().createSessionCookie(idToken, { expiresIn: expiresInMs });
  } catch (err) {
    console.error("Firebase Session Cookie creation failed:", err);
    return null;
  }
}

export async function verifySessionCookie(sessionCookie: string): Promise<admin.auth.DecodedIdToken | null> {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  try {
    const adminApp = getFirebaseAdmin();
    return await adminApp.auth().verifySessionCookie(sessionCookie, true);
  } catch (err) {
    return null;
  }
}

