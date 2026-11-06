import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Brand } from "@/models/Brand";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      return NextResponse.json({
        success: true,
        brands: store.brands.filter((b) => b.isActive !== false),
      });
    }

    const brands = await Brand.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      brands,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ব্র্যান্ড লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

