import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Location } from "@/models/Location";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      return NextResponse.json({ success: true, locations: store.locations });
    }

    let locations = await Location.find({ isActive: true }).sort({ isDefault: -1, name: 1 });
    if (locations.length === 0) {
      const defaultLoc = await Location.create({
        name: "প্রধান শোরুম (Main Showroom)",
        code: "LOC-MAIN",
        address: "দোকান নং ৪২, লেভেল ২, বসুন্ধরা সিটি, পান্থপথ, ঢাকা",
        isDefault: true,
        isActive: true,
      });
      locations = [defaultLoc];
    }

    return NextResponse.json({ success: true, locations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "লোকেশন লোড করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("settings.manage");
    const body = await req.json();
    const { name, code, address, isDefault } = body;

    if (!name || !code || !address) {
      return NextResponse.json({ error: "নাম, কোড এবং ঠিকানা আবশ্যক" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      const newLoc = {
        _id: `mock-loc-${Date.now()}`,
        name,
        code: cleanCode,
        address,
        isDefault: !!isDefault,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.locations.push(newLoc);
      return NextResponse.json({ success: true, location: newLoc });
    }

    const location = await Location.create({
      name,
      code: cleanCode,
      address,
      isDefault: !!isDefault,
    });

    return NextResponse.json({ success: true, location });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "লোকেশন তৈরিতে সমস্যা হয়েছে" }, { status: 403 });
  }
}

