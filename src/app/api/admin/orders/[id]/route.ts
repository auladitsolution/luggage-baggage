import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { OnlineOrder } from "@/models/OnlineOrder";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("sales.create");
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const order = (store.onlineOrders || []).find(
        (o) => o._id === id || o.orderNumber === id
      );
      if (!order) {
        return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { orderNumber: id };

    const order = await OnlineOrder.findOne(query).lean();
    if (!order) {
      return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "অর্ডার তথ্য লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 500 }
    );
  }
}

