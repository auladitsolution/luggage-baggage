import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { OnlineOrder } from "@/models/OnlineOrder";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("sales.create");
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const order = (store.onlineOrders || []).find((o) => o._id === id || o.orderNumber === id);
      if (!order) {
        return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
      }

      if (order.paymentStatus === "paid") {
        return NextResponse.json({ error: "এই অর্ডারের পেমেন্ট ইতিমধ্যে ভেরিফাইড" }, { status: 400 });
      }

      order.paymentStatus = "paid";
      if (!order.manualPaymentDetails) {
        order.manualPaymentDetails = {};
      }
      order.manualPaymentDetails.verifiedAt = new Date();
      order.manualPaymentDetails.verifiedById = session.userId;
      order.manualPaymentDetails.verifiedByName = session.displayName;
      order.updatedAt = new Date();

      return NextResponse.json({
        success: true,
        message: "ম্যানুয়াল পেমেন্ট সফলভাবে ভেরিফাই ও নিশ্চিত করা হয়েছে",
        order,
      });
    }

    const order = await OnlineOrder.findById(id);
    if (!order) {
      return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "এই অর্ডারের পেমেন্ট ইতিমধ্যে ভেরিফাইড" }, { status: 400 });
    }

    order.paymentStatus = "paid";
    if (!order.manualPaymentDetails) {
      order.manualPaymentDetails = {};
    }
    order.manualPaymentDetails.verifiedAt = new Date();
    order.manualPaymentDetails.verifiedById = session.userId;
    order.manualPaymentDetails.verifiedByName = session.displayName;
    await order.save();

    return NextResponse.json({
      success: true,
      message: "ম্যানুয়াল পেমেন্ট সফলভাবে ভেরিফাই ও নিশ্চিত করা হয়েছে",
      order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "পেমেন্ট ভেরিফাই করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

