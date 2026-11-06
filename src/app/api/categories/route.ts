import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Category } from "@/models/Category";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      return NextResponse.json({
        success: true,
        categories: store.categories.filter((c) => c.isActive !== false),
      });
    }

    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, nameBangla: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ক্যাটাগরি লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

