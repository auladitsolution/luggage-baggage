import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Brand } from "@/models/Brand";
import { Product } from "@/models/Product";
import { requirePermission, getSession, hasPermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";
import mongoose from "mongoose";

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

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে প্রথমে লগইন করুন।" },
        { status: 401 }
      );
    }

    if (!hasPermission(session, "products.delete") && !hasPermission(session, "products.create")) {
      return NextResponse.json(
        { error: "ব্র্যান্ড ডিলিট করার অনুমতি আপনার নেই।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ error: "ব্র্যান্ড আইডি আবশ্যক" }, { status: 400 });
    }

    const db = await connectToDatabase();

    // 1. Mock Store Mode
    if (!db) {
      const store = getMockStore();
      const brand = store.brands.find((b) => b._id === id || b.slug === id);
      if (!brand) {
        return NextResponse.json({ error: "ব্র্যান্ড পাওয়া যায়নি" }, { status: 404 });
      }

      const linkedCount = store.products.filter((p) => {
        const pBrandId = typeof p.brandId === "object" ? p.brandId?._id : p.brandId;
        return pBrandId === brand._id;
      }).length;

      if (linkedCount > 0) {
        return NextResponse.json(
          {
            error: `এই ব্র্যান্ডের অধীনে ${linkedCount}টি পণ্য নিবন্ধিত রয়েছে। ব্র্যান্ডটি ডিলিট করতে প্রথমে সংশ্লিষ্ট পণ্যের ব্র্যান্ড পরিবর্তন করুন অথবা পণ্য ডিলিট করুন।`,
          },
          { status: 400 }
        );
      }

      store.brands = store.brands.filter((b) => b._id !== brand._id);
      return NextResponse.json({
        success: true,
        message: `"${brand.name}" ব্র্যান্ড সফলভাবে মুছে ফেলা হয়েছে।`,
      });
    }

    // 2. MongoDB Mode
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };

    const brand = await Brand.findOne(query);
    if (!brand) {
      return NextResponse.json({ error: "ব্র্যান্ড পাওয়া যায়নি" }, { status: 404 });
    }

    const linkedCount = await Product.countDocuments({ brandId: brand._id });

    if (linkedCount > 0) {
      return NextResponse.json(
        {
          error: `এই ব্র্যান্ডের অধীনে ${linkedCount}টি পণ্য নিবন্ধিত রয়েছে। ব্র্যান্ডটি ডিলিট করতে প্রথমে সংশ্লিষ্ট পণ্যের ব্র্যান্ড পরিবর্তন করুন অথবা পণ্য ডিলিট করুন।`,
        },
        { status: 400 }
      );
    }

    await Brand.deleteOne({ _id: brand._id });
    return NextResponse.json({
      success: true,
      message: `"${brand.name}" ব্র্যান্ড সফলভাবে মুছে ফেলা হয়েছে।`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ব্র্যান্ড ডিলিট করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
