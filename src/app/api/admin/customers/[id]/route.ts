import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Customer } from "@/models/Customer";
import { CustomerCreditTransaction } from "@/models/CustomerCreditTransaction";
import { SalesInvoice } from "@/models/SalesInvoice";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("customers.read");
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const customer = store.customers.find((c) => c._id === id || c.phone === id);
      if (!customer) {
        return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি" }, { status: 404 });
      }

      const transactions = store.creditTransactions
        .filter((tx) => tx.customerId === customer._id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const invoices = store.salesInvoices
        .filter((inv) => inv.customerId === customer._id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json({
        success: true,
        customer,
        transactions,
        invoices,
      });
    }

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { phone: id };

    const customer = await Customer.findOne(query).lean();
    if (!customer) {
      return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি" }, { status: 404 });
    }

    const transactions = await CustomerCreditTransaction.find({ customerId: customer._id })
      .populate("collectedById", "displayName email")
      .sort({ createdAt: -1 })
      .lean();

    const invoices = await SalesInvoice.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      customer,
      transactions,
      invoices,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "কাস্টমার স্টেটমেন্ট লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("customers.update");
    const { id } = await params;
    const body = await req.json();

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const customer = store.customers.find((c) => c._id === id);
      if (!customer) {
        return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি" }, { status: 404 });
      }

      Object.assign(customer, body);
      customer.updatedAt = new Date();

      return NextResponse.json({
        success: true,
        message: "কাস্টমার তথ্য সফলভাবে আপডেট হয়েছে।",
        customer,
      });
    }

    const customer = await Customer.findByIdAndUpdate(id, body, { new: true });
    if (!customer) {
      return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "কাস্টমার তথ্য সফলভাবে আপডেট হয়েছে।",
      customer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "কাস্টমার আপডেট করতে সমস্যা হয়েছে" },
      { status: 403 }
    );
  }
}

