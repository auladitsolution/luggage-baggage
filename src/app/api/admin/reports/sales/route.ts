import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { SalesInvoice } from "@/models/SalesInvoice";
import { OnlineOrder } from "@/models/OnlineOrder";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("reports.read");
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let posSales = [...(store.salesInvoices || [])];
      let onlineSales = [...(store.onlineOrders || [])].filter((o) => o.orderStatus === "delivered");

      if (startDate) {
        const sTime = new Date(startDate).getTime();
        posSales = posSales.filter((s) => new Date(s.createdAt).getTime() >= sTime);
        onlineSales = onlineSales.filter((o) => new Date(o.createdAt).getTime() >= sTime);
      }
      if (endDate) {
        const eTime = new Date(endDate).getTime();
        posSales = posSales.filter((s) => new Date(s.createdAt).getTime() <= eTime);
        onlineSales = onlineSales.filter((o) => new Date(o.createdAt).getTime() <= eTime);
      }

      const totalPosAmount = posSales.reduce((sum, s) => sum + s.grandTotalPoisha, 0);
      const totalOnlineAmount = onlineSales.reduce((sum, o) => sum + o.grandTotalPoisha, 0);

      return NextResponse.json({
        success: true,
        summary: {
          totalPosInvoices: posSales.length,
          totalPosAmountPoisha: totalPosAmount,
          totalOnlineOrders: onlineSales.length,
          totalOnlineAmountPoisha: totalOnlineAmount,
          combinedRevenuePoisha: totalPosAmount + totalOnlineAmount,
        },
        posInvoices: posSales.slice(0, 50),
        onlineOrders: onlineSales.slice(0, 50),
      });
    }

    const dateQuery: any = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const posSales = await SalesInvoice.find(dateQuery).sort({ createdAt: -1 }).lean();
    const onlineSales = await OnlineOrder.find({
      ...dateQuery,
      orderStatus: "delivered",
    }).sort({ createdAt: -1 }).lean();

    const totalPosAmount = posSales.reduce((sum, s) => sum + s.grandTotalPoisha, 0);
    const totalOnlineAmount = onlineSales.reduce((sum, o) => sum + o.grandTotalPoisha, 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalPosInvoices: posSales.length,
        totalPosAmountPoisha: totalPosAmount,
        totalOnlineOrders: onlineSales.length,
        totalOnlineAmountPoisha: totalOnlineAmount,
        combinedRevenuePoisha: totalPosAmount + totalOnlineAmount,
      },
      posInvoices: posSales.slice(0, 50),
      onlineOrders: onlineSales.slice(0, 50),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "বিক্রয় রিপোর্ট লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

