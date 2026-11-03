import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { MoneyReceipt } from "@/models/MoneyReceipt";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("dues.read");
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const receipt = store.moneyReceipts.find(
        (r) => r._id === id || r.receiptNumber === id
      );

      if (!receipt) {
        return NextResponse.json({ error: "মানি রিসিট পাওয়া যায়নি" }, { status: 404 });
      }

      return NextResponse.json({ success: true, receipt });
    }

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { receiptNumber: id };

    const receipt = await MoneyReceipt.findOne(query).lean();
    if (!receipt) {
      return NextResponse.json({ error: "মানি রিসিট পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({ success: true, receipt });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "রসিদ লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

