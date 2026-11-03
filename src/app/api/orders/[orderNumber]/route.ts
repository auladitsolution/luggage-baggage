import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { OnlineOrder } from "@/models/OnlineOrder";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const order = (store.onlineOrders || []).find(
        (o) => o.orderNumber === orderNumber || o._id === orderNumber
      );
      if (!order) {
        return NextResponse.json({ error: "অর্ডারটি পাওয়া যায়নি" }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    const order = await OnlineOrder.findOne({
      $or: [{ orderNumber }, { _id: orderNumber.match(/^[0-9a-fA-F]{24}$/) ? orderNumber : null }],
    }).lean();

    if (!order) {
      return NextResponse.json({ error: "অর্ডারটি পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "অর্ডার তথ্য লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

