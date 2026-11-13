import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Supplier } from "@/models/Supplier";
import { PurchaseInvoice } from "@/models/PurchaseInvoice";
import { SupplierPayment } from "@/models/SupplierPayment";
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
      const supplier = (store.suppliers || []).find((s) => s._id === id);
      if (!supplier) {
        return NextResponse.json({ error: "সাপ্লায়ার পাওয়া যায়নি" }, { status: 404 });
      }

      const purchases = (store.purchaseInvoices || [])
        .filter((p) => p.supplierId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const payments = (store.supplierPayments || [])
        .filter((sp) => sp.supplierId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json({
        success: true,
        supplier,
        purchases,
        payments,
      });
    }

    const supplier = await Supplier.findById(id).lean();
    if (!supplier) {
      return NextResponse.json({ error: "সাপ্লায়ার পাওয়া যায়নি" }, { status: 404 });
    }

    const purchases = await PurchaseInvoice.find({ supplierId: id })
      .sort({ createdAt: -1 })
      .lean();

    const payments = await SupplierPayment.find({ supplierId: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      supplier,
      purchases,
      payments,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "সাপ্লায়ার তথ্য লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("purchases.update", req);
    const { id } = await params;
    const body = await req.json();

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const supplier = (store.suppliers || []).find((s) => s._id === id);
      if (!supplier) {
        return NextResponse.json({ error: "সাপ্লায়ার পাওয়া যায়নি" }, { status: 404 });
      }

      Object.assign(supplier, body);
      supplier.updatedAt = new Date();

      return NextResponse.json({
        success: true,
        message: "সাপ্লায়ার তথ্য আপডেট হয়েছে",
        supplier,
      });
    }

    const supplier = await Supplier.findByIdAndUpdate(id, body, { new: true });
    if (!supplier) {
      return NextResponse.json({ error: "সাপ্লায়ার পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "সাপ্লায়ার তথ্য আপডেট হয়েছে",
      supplier,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "সাপ্লায়ার আপডেট করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

