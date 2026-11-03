import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac/guards";
import { uploadImageToCloudinary } from "@/lib/cloudinary/upload";

export async function POST(req: NextRequest) {
  try {
    // Require products.create or products.update permission
    await requirePermission("products.create");

    const contentType = req.headers.get("content-type") || "";

    let fileBuffer: Buffer | string;
    let filename = "image.jpg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "কোনো ফাইল পাওয়া যায়নি" }, { status: 400 });
      }
      filename = file.name;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      const body = await req.json();
      if (!body.dataUrl) {
        return NextResponse.json({ error: "dataUrl আবশ্যক" }, { status: 400 });
      }
      fileBuffer = body.dataUrl;
    }

    const result = await uploadImageToCloudinary(fileBuffer, { filename });

    return NextResponse.json({
      success: true,
      image: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ইমেজ আপলোড ব্যর্থ হয়েছে" },
      { status: 403 }
    );
  }
}

