import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { PurchaseInvoice } from "@/models/PurchaseInvoice";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("purchases.read", req);
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const invoice = (store.purchaseInvoices || []).find(
        (p) => p._id === id || p.purchaseInvoiceNumber === id
      );
      if (!invoice) {
        return NextResponse.json({ error: "ক্রয় চালান পাওয়া যায়নি" }, { status: 404 });
      }
      return NextResponse.json({ success: true, invoice });
    }

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { purchaseInvoiceNumber: id };

    const invoice = await PurchaseInvoice.findOne(query).lean();
    if (!invoice) {
      return NextResponse.json({ error: "ক্রয় চালান পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ক্রয় চালান লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 500 }
    );
  }
}

