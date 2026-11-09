import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Brand } from "@/models/Brand";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      return NextResponse.json({ success: true, brands: store.brands });
    }

    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json({ success: true, brands });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ব্র্যান্ড লোড করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("products.create", req);
    const body = await req.json();
    const { name, slug, logoUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "ব্র্যান্ডের নাম আবশ্যক" }, { status: 400 });
    }

    const rawSlug = slug || name;
    const cleanSlug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-") || `brand-${Date.now()}`;

    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      const existing = store.brands.find((b) => b.slug === cleanSlug);
      if (existing) {
        return NextResponse.json({ success: true, brand: existing });
      }

      const newBrand = {
        _id: `mock-brand-${Date.now()}`,
        name,
        slug: cleanSlug,
        logoUrl,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.brands.push(newBrand);
      return NextResponse.json({ success: true, brand: newBrand });
    }

    const existing = await Brand.findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json({ success: true, brand: existing });
    }

    const brand = await Brand.create({
      name,
      slug: cleanSlug,
      logoUrl,
    });

    return NextResponse.json({ success: true, brand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ব্র্যান্ড তৈরিতে সমস্যা হয়েছে" }, { status: 403 });
  }
}

