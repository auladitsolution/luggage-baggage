import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Customer } from "@/models/Customer";
import { SalesInvoice } from "@/models/SalesInvoice";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("dues.read", req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let dueCustomers = store.customers.filter((c) => c.currentDuePoisha > 0);

      if (search) {
        const s = search.toLowerCase();
        dueCustomers = dueCustomers.filter(
          (c) => c.name.toLowerCase().includes(s) || c.phone.includes(s)
        );
      }

      const totalDuePoisha = dueCustomers.reduce((acc, c) => acc + c.currentDuePoisha, 0);

      // Attach latest invoice info if present
      const customersWithDetails = dueCustomers.map((c) => {
        const custInvoices = store.salesInvoices
          .filter((inv) => inv.customerId === c._id && inv.dueAmountPoisha > 0)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const lastInvoice = custInvoices[0];

        return {
          _id: c._id,
          name: c.name,
          phone: c.phone,
          address: c.address || "—",
          creditLimitPoisha: c.creditLimitPoisha,
          currentDuePoisha: c.currentDuePoisha,
          lastInvoiceNumber: lastInvoice?.invoiceNumber || "—",
          lastInvoiceDate: lastInvoice ? lastInvoice.createdAt : c.updatedAt,
          unpaidInvoicesCount: custInvoices.length,
        };
      });

      return NextResponse.json({
        success: true,
        customers: customersWithDetails,
        summary: {
          totalDueCustomers: dueCustomers.length,
          totalDuePoisha,
        },
      });
    }

    const query: any = { currentDuePoisha: { $gt: 0 } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const dueCustomers = await Customer.find(query)
      .sort({ currentDuePoisha: -1 })
      .lean();

    const totalDuePoisha = dueCustomers.reduce((acc, c) => acc + c.currentDuePoisha, 0);

    const customersWithDetails = await Promise.all(
      dueCustomers.map(async (c) => {
        const lastInvoice = await SalesInvoice.findOne({
          customerId: c._id,
          dueAmountPoisha: { $gt: 0 },
        })
          .sort({ createdAt: -1 })
          .select("invoiceNumber createdAt")
          .lean();

        const count = await SalesInvoice.countDocuments({
          customerId: c._id,
          dueAmountPoisha: { $gt: 0 },
        });

        return {
          _id: c._id,
          name: c.name,
          phone: c.phone,
          address: c.address || "—",
          creditLimitPoisha: c.creditLimitPoisha,
          currentDuePoisha: c.currentDuePoisha,
          lastInvoiceNumber: lastInvoice?.invoiceNumber || "—",
          lastInvoiceDate: lastInvoice ? lastInvoice.createdAt : c.updatedAt,
          unpaidInvoicesCount: count,
        };
      })
    );

    return NextResponse.json({
      success: true,
      customers: customersWithDetails,
      summary: {
        totalDueCustomers: dueCustomers.length,
        totalDuePoisha,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "বকেয়া তথ্য লোড করার অনুমতি নেই" },
      { status: 403 }
    );
  }
}

