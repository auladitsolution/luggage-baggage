import crypto from "crypto";

/**
 * Hash a password using PBKDF2 with a secure random salt
 */
export function hashPassword(password: string): string {
  if (!password) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a plaintext password against a stored salt:hash string
 */
export function verifyPassword(password: string, combinedHash?: string | null): boolean {
  if (!password || !combinedHash || !combinedHash.includes(":")) {
    return false;
  }

  try {
    const [salt, originalHash] = combinedHash.split(":");
    const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(testHash, "hex"));
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

