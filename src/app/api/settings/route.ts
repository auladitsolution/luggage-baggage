import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ShopSetting } from "@/models/ShopSetting";
import { STORE_INFO, updateStoreInfoInMemory } from "@/lib/config/storeInfo";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET() {
  try {
    const db = await connectToDatabase();

    if (!db) {
      const store: any = getMockStore();
      const settings = store.settings || {};
      return NextResponse.json({
        success: true,
        settings: {
          ...STORE_INFO,
          ...settings,
          name: settings.organizationName || STORE_INFO.name,
          nameBangla: settings.organizationNameBangla || STORE_INFO.nameBangla,
          fullName: `${settings.organizationName || STORE_INFO.name} (${settings.organizationNameBangla || STORE_INFO.nameBangla})`,
          address: settings.address || STORE_INFO.address,
          addressBangla: settings.addressBangla || STORE_INFO.addressBangla,
          owners: settings.owners || STORE_INFO.owners,
          ownersBangla: settings.ownersBangla || STORE_INFO.ownersBangla,
          mobile: settings.mobile || STORE_INFO.mobile,
          whatsapp: settings.whatsapp || STORE_INFO.whatsapp,
          email: settings.email || STORE_INFO.email,
          facebookPageLink: settings.facebookPageLink || STORE_INFO.facebookPageLink,
          bin: settings.bin || STORE_INFO.bin,
          mushak: settings.mushak || STORE_INFO.mushak,
          receiptFooter: settings.receiptFooter || STORE_INFO.receiptFooter,
          bkashNumber: settings.bkashNumber || STORE_INFO.bkashNumber,
          nagadNumber: settings.nagadNumber || STORE_INFO.nagadNumber,
          deliveryFeeInsideDhaka: settings.deliveryFeeInsideDhaka ?? STORE_INFO.deliveryFeeInsideDhaka,
          deliveryFeeOutsideDhaka: settings.deliveryFeeOutsideDhaka ?? STORE_INFO.deliveryFeeOutsideDhaka,
        },
      });
    }

    let settingsDoc = await ShopSetting.findOne({}).lean();

    if (!settingsDoc) {
      return NextResponse.json({
        success: true,
        settings: STORE_INFO,
      });
    }

    updateStoreInfoInMemory(settingsDoc);

    return NextResponse.json({
      success: true,
      settings: {
        ...STORE_INFO,
        ...settingsDoc,
        name: settingsDoc.organizationName || STORE_INFO.name,
        nameBangla: settingsDoc.organizationNameBangla || STORE_INFO.nameBangla,
        fullName: `${settingsDoc.organizationName || STORE_INFO.name} (${settingsDoc.organizationNameBangla || STORE_INFO.nameBangla})`,
        address: settingsDoc.address || STORE_INFO.address,
        addressBangla: settingsDoc.addressBangla || STORE_INFO.addressBangla,
        owners: settingsDoc.owners || STORE_INFO.owners,
        ownersBangla: settingsDoc.ownersBangla || STORE_INFO.ownersBangla,
        mobile: settingsDoc.mobile || STORE_INFO.mobile,
        whatsapp: settingsDoc.whatsapp || STORE_INFO.whatsapp,
        email: settingsDoc.email || STORE_INFO.email,
        facebookPageLink: settingsDoc.facebookPageLink || STORE_INFO.facebookPageLink,
        bin: settingsDoc.bin || STORE_INFO.bin,
        mushak: settingsDoc.mushak || STORE_INFO.mushak,
        receiptFooter: settingsDoc.receiptFooter || STORE_INFO.receiptFooter,
        bkashNumber: settingsDoc.bkashNumber || STORE_INFO.bkashNumber,
        nagadNumber: settingsDoc.nagadNumber || STORE_INFO.nagadNumber,
        deliveryFeeInsideDhaka: settingsDoc.deliveryFeeInsideDhaka ?? STORE_INFO.deliveryFeeInsideDhaka,
        deliveryFeeOutsideDhaka: settingsDoc.deliveryFeeOutsideDhaka ?? STORE_INFO.deliveryFeeOutsideDhaka,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      settings: STORE_INFO,
    });
  }
}

