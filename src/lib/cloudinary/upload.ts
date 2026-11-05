import crypto from "crypto";
import fs from "fs";
import path from "path";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Check if Cloudinary credentials are fully configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    CLOUD_NAME &&
    API_KEY &&
    API_SECRET &&
    !CLOUD_NAME.includes("<") &&
    !API_KEY.includes("<")
  );
}

/**
 * Upload an image file (Buffer or Base64) to Cloudinary
 * Falls back gracefully to safe mock data URL if credentials are not configured
 */
export async function uploadImageToCloudinary(
  fileBuffer: Buffer | string,
  options: {
    folder?: string;
    filename?: string;
  } = {}
): Promise<UploadResult> {
  const folder = options.folder || "lumina_luggage/products";

  if (!isCloudinaryConfigured()) {
    console.warn("⚠️ Cloudinary is not configured in .env.local. Saving image to local /uploads/ directory.");
    const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const extMatch = options.filename?.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const fileName = `${id}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      let bufferToSave: Buffer;
      if (Buffer.isBuffer(fileBuffer)) {
        bufferToSave = fileBuffer;
      } else if (typeof fileBuffer === "string" && fileBuffer.startsWith("data:image/")) {
        const base64Data = fileBuffer.replace(/^data:image\/\w+;base64,/, "");
        bufferToSave = Buffer.from(base64Data, "base64");
      } else {
        bufferToSave = Buffer.from(fileBuffer);
      }

      fs.writeFileSync(path.join(uploadsDir, fileName), bufferToSave);

      return {
        publicId: id,
        secureUrl: `/uploads/${fileName}`,
        width: 800,
        height: 800,
        format: ext,
      };
    } catch (err) {
      console.warn("Local image save fallback error:", err);
      return {
        publicId: id,
        secureUrl: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=800",
        width: 800,
        height: 800,
        format: "jpg",
      };
    }
  }

  // Real Cloudinary Signed Upload
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
  };

  // Generate SHA-1 Signature: param1=val1&param2=val2<api_secret>
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join("&");
  const stringToSign = `${sortedParams}${API_SECRET}`;
  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

  const formData = new FormData();
  formData.append("timestamp", timestamp.toString());
  formData.append("folder", folder);
  formData.append("api_key", API_KEY!);
  formData.append("signature", signature);

  if (Buffer.isBuffer(fileBuffer)) {
    const blob = new Blob([new Uint8Array(fileBuffer)]);
    formData.append("file", blob, options.filename || "upload.jpg");
  } else {
    formData.append("file", fileBuffer);
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Cloudinary upload failed: ${errorData.error?.message || res.statusText}`);
  }

  const result = await res.json();
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

/**
 * Generate optimized Cloudinary Image URL with auto format and compression
 */
export function getOptimizedImageUrl(
  urlOrPublicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: "auto" | "good" | number;
    crop?: "fill" | "fit" | "scale" | "thumb";
  } = {}
): string {
  if (!urlOrPublicId) return "";

  // If already full non-cloudinary or data URL
  if (urlOrPublicId.startsWith("data:") || !urlOrPublicId.includes("cloudinary.com")) {
    return urlOrPublicId;
  }

  const width = options.width ? `w_${options.width}` : "";
  const height = options.height ? `h_${options.height}` : "";
  const crop = options.crop ? `c_${options.crop}` : "c_fill";
  const quality = options.quality ? `q_${options.quality}` : "q_auto";
  const format = "f_auto";

  const transforms = [crop, width, height, format, quality].filter(Boolean).join(",");

  // Insert transforms after /image/upload/
  return urlOrPublicId.replace("/image/upload/", `/image/upload/${transforms}/`);
}

