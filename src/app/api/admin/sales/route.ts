import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { SalesInvoice } from "@/models/SalesInvoice";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("sales.create", req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const paymentStatus = searchParams.get("paymentStatus");

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let list = [...store.salesInvoices];

      if (paymentStatus) {
        list = list.filter((i) => i.paymentStatus === paymentStatus);
      }
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          (i) =>
            i.invoiceNumber.toLowerCase().includes(s) ||
            i.customerName.toLowerCase().includes(s) ||
            i.customerPhone.includes(s)
        );
      }

      return NextResponse.json({ success: true, invoices: list });
    }

    const query: any = {};
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await SalesInvoice.find(query).sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({ success: true, invoices });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "বিক্রয় তালিকা লোড করতে সমস্যা হয়েছে" },
      { status: 403 }
    );
  }
}

