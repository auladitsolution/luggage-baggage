import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Category } from "@/models/Category";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      return NextResponse.json({ success: true, categories: store.categories });
    }

    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, nameBangla: 1 });
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ক্যাটাগরি লোড করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("products.create");
    const body = await req.json();
    const { nameBangla, nameEnglish, slug, parentId, image, sortOrder } = body;

    if (!nameBangla) {
      return NextResponse.json({ error: "ক্যাটাগরির বাংলা নাম আবশ্যক" }, { status: 400 });
    }

    const rawSlug = slug || nameEnglish || nameBangla;
    const cleanSlug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-") || `cat-${Date.now()}`;

    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      const existing = store.categories.find((c) => c.slug === cleanSlug);
      if (existing) {
        return NextResponse.json({ success: true, category: existing });
      }

      const newCat = {
        _id: `mock-cat-${Date.now()}`,
        nameBangla,
        nameEnglish,
        slug: cleanSlug,
        parentId: parentId || null,
        image,
        isActive: true,
        sortOrder: sortOrder || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.categories.push(newCat);
      return NextResponse.json({ success: true, category: newCat });
    }

    const existing = await Category.findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json({ success: true, category: existing });
    }

    const category = await Category.create({
      nameBangla,
      nameEnglish,
      slug: cleanSlug,
      parentId: parentId || null,
      image,
      sortOrder: sortOrder || 0,
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ক্যাটাগরি তৈরিতে সমস্যা হয়েছে" }, { status: 403 });
  }
}

