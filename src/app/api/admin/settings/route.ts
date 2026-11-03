import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ShopSetting } from "@/models/ShopSetting";
import { requirePermission } from "@/lib/rbac/guards";
import { STORE_INFO } from "@/lib/config/storeInfo";
import { getMockStore } from "@/lib/db/memoryStore";

const DEFAULT_SETTINGS_PAYLOAD = {
  organizationName: STORE_INFO.name,
  organizationNameBangla: STORE_INFO.nameBangla,
  owners: STORE_INFO.owners,
  ownersBangla: STORE_INFO.ownersBangla,
  address: STORE_INFO.address,
  addressBangla: STORE_INFO.addressBangla,
  mobile: STORE_INFO.mobile,
  whatsapp: STORE_INFO.whatsapp,
  email: STORE_INFO.email,
  facebookPageLink: STORE_INFO.facebookPageLink,
  bin: STORE_INFO.bin,
  mushak: STORE_INFO.mushak,
  receiptFooter: "আমাদের পণ্য পছন্দ করায় ধন্যবাদ। বিক্রিত পণ্য ৭ দিনের মধ্যে মেমোসহ পরিবর্তনযোগ্য।",
  defaultThermalSize: "80mm" as const,
  deliveryFeeInsideDhaka: 80,
  deliveryFeeOutsideDhaka: 150,
  isCodEnabled: true,
  bkashNumber: STORE_INFO.mobile,
  nagadNumber: STORE_INFO.mobile,
  businessHours: STORE_INFO.businessHoursBangla,
};

export async function GET() {
  try {
    await requirePermission("settings.manage");
    const db = await connectToDatabase();

    if (!db) {
      const store: any = getMockStore();
      if (!store.settings) {
        store.settings = { ...DEFAULT_SETTINGS_PAYLOAD, _id: "mock-settings-001" };
      }
      return NextResponse.json({
        success: true,
        settings: store.settings,
      });
    }

    let settings = await ShopSetting.findOne({});
    if (!settings) {
      settings = await ShopSetting.create(DEFAULT_SETTINGS_PAYLOAD);
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "সেটিংস দেখার অনুমতি আপনার নেই।" },
      { status: 403 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requirePermission("settings.manage");
    const body = await req.json();

    const db = await connectToDatabase();

    if (!db) {
      const store: any = getMockStore();
      store.settings = {
        ...(store.settings || DEFAULT_SETTINGS_PAYLOAD),
        ...body,
        updatedAt: new Date(),
      };
      return NextResponse.json({
        success: true,
        message: "শপ সেটিংস সফলভাবে আপডেট করা হয়েছে।",
        settings: store.settings,
      });
    }

    const updated = await ShopSetting.findOneAndUpdate(
      {},
      { $set: body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "শপ সেটিংস সফলভাবে ডাটাবেসে সংরক্ষণ করা হয়েছে।",
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "সেটিংস আপডেট করার অনুমতি আপনার নেই।" },
      { status: 403 }
    );
  }
}

