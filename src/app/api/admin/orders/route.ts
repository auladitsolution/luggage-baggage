import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { OnlineOrder } from "@/models/OnlineOrder";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("sales.create", req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let list = [...(store.onlineOrders || [])];

      if (status && status !== "all") {
        list = list.filter((o) => o.orderStatus === status);
      }

      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(s) ||
            o.customerName.toLowerCase().includes(s) ||
            o.customerPhone.includes(s) ||
            (o.trackingNumber && o.trackingNumber.toLowerCase().includes(s))
        );
      }

      const summary = {
        totalOrders: (store.onlineOrders || []).length,
        pendingOrders: (store.onlineOrders || []).filter((o) => o.orderStatus === "pending").length,
        pendingPayments: (store.onlineOrders || []).filter(
          (o) => o.paymentStatus === "pending_verification"
        ).length,
      };

      return NextResponse.json({ success: true, orders: list, summary });
    }

    const query: any = {};
    if (status && status !== "all") {
      query.orderStatus = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { trackingNumber: { $regex: search, $options: "i" } },
      ];
    }

    const orders = await OnlineOrder.find(query).sort({ createdAt: -1 }).lean();

    const [totalOrders, pendingOrders, pendingPayments] = await Promise.all([
      OnlineOrder.countDocuments(),
      OnlineOrder.countDocuments({ orderStatus: "pending" }),
      OnlineOrder.countDocuments({ paymentStatus: "pending_verification" }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      summary: { totalOrders, pendingOrders, pendingPayments },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "অনলাইন অর্ডার লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

