import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Category } from "@/models/Category";
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
        { error: "ক্যাটাগরি ডিলিট করার অনুমতি আপনার নেই।" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ক্যাটাগরি আইডি আবশ্যক" }, { status: 400 });
    }

    const db = await connectToDatabase();

    // 1. Mock Store Mode
    if (!db) {
      const store = getMockStore();
      const cat = store.categories.find((c) => c._id === id || c.slug === id);
      if (!cat) {
        return NextResponse.json({ error: "ক্যাটাগরি পাওয়া যায়নি" }, { status: 404 });
      }

      // Check subcategories
      const subCount = store.categories.filter(
        (c) => c.parentId === cat._id
      ).length;
      if (subCount > 0) {
        return NextResponse.json(
          {
            error: `এই ক্যাটাগরির অধীনে ${subCount}টি সাব-ক্যাটাগরি রয়েছে। আগে সেগুলো ডিলিট করুন।`,
          },
          { status: 400 }
        );
      }

      // Check linked products
      const linkedCount = store.products.filter((p) => {
        const pCatId = typeof p.categoryId === "object" ? p.categoryId?._id : p.categoryId;
        const pSubCatId = typeof p.subCategoryId === "object" ? p.subCategoryId?._id : p.subCategoryId;
        return pCatId === cat._id || pSubCatId === cat._id;
      }).length;

      if (linkedCount > 0) {
        return NextResponse.json(
          {
            error: `এই ক্যাটাগরিতে ${linkedCount}টি পণ্য নিবন্ধিত রয়েছে। ক্যাটাগরি ডিলিট করতে প্রথমে সংশ্লিষ্ট পণ্যের ক্যাটাগরি পরিবর্তন করুন অথবা পণ্য ডিলিট করুন।`,
          },
          { status: 400 }
        );
      }

      store.categories = store.categories.filter((c) => c._id !== cat._id);
      return NextResponse.json({
        success: true,
        message: `"${cat.nameBangla}" ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে।`,
      });
    }

    // 2. MongoDB Mode
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };

    const cat = await Category.findOne(query);
    if (!cat) {
      return NextResponse.json({ error: "ক্যাটাগরি পাওয়া যায়নি" }, { status: 404 });
    }

    // Check subcategories
    const subCount = await Category.countDocuments({ parentId: cat._id });
    if (subCount > 0) {
      return NextResponse.json(
        {
          error: `এই ক্যাটাগরির অধীনে ${subCount}টি সাব-ক্যাটাগরি রয়েছে। আগে সেগুলো ডিলিট করুন।`,
        },
        { status: 400 }
      );
    }

    // Check linked products
    const linkedCount = await Product.countDocuments({
      $or: [{ categoryId: cat._id }, { subCategoryId: cat._id }],
    });

    if (linkedCount > 0) {
      return NextResponse.json(
        {
          error: `এই ক্যাটাগরিতে ${linkedCount}টি পণ্য নিবন্ধিত রয়েছে। ক্যাটাগরি ডিলিট করতে প্রথমে সংশ্লিষ্ট পণ্যের ক্যাটাগরি পরিবর্তন করুন অথবা পণ্য ডিলিট করুন।`,
        },
        { status: 400 }
      );
    }

    await Category.deleteOne({ _id: cat._id });
    return NextResponse.json({
      success: true,
      message: `"${cat.nameBangla}" ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে।`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ক্যাটাগরি ডিলিট করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

