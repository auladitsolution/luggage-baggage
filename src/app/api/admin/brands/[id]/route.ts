import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Brand } from "@/models/Brand";
import { Product } from "@/models/Product";
import { getSession, hasPermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";
import mongoose from "mongoose";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
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

      // Check linked products
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

    // Check linked products
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

