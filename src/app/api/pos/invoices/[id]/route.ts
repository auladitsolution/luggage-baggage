import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { SalesInvoice } from "@/models/SalesInvoice";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const invoice = store.salesInvoices.find(
        (inv) => inv._id === id || inv.invoiceNumber === id
      );

      if (!invoice) {
        return NextResponse.json({ error: "ইনভয়েস পাওয়া যায়নি" }, { status: 404 });
      }

      return NextResponse.json({ success: true, invoice });
    }

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { invoiceNumber: id };

    const invoice = await SalesInvoice.findOne(query).lean();
    if (!invoice) {
      return NextResponse.json({ error: "ইনভয়েস পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ইনভয়েস লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

