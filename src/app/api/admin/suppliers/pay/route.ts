import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Supplier } from "@/models/Supplier";
import { SupplierPayment } from "@/models/SupplierPayment";
import { requirePermission } from "@/lib/rbac/guards";
import { getNextSupplierPaymentNumber } from "@/lib/purchasing/purchaseSequence";
import { getMockStore } from "@/lib/db/memoryStore";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("purchases.update");
    const body = await req.json();
    const {
      supplierId,
      amountPoisha,
      paymentMethod = "bank",
      transactionReference,
      notes,
    } = body;

    if (!supplierId || !amountPoisha || amountPoisha <= 0) {
      return NextResponse.json(
        { error: "সাপ্লায়ার আইডি এবং পরিশোধের পরিমাণ (শূন্যের বেশি) আবশ্যক" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const paymentNumber = await getNextSupplierPaymentNumber();

    if (!db) {
      const store = getMockStore();
      const supplier = (store.suppliers || []).find((s) => s._id === supplierId);
      if (!supplier) {
        return NextResponse.json({ error: "সাপ্লায়ার পাওয়া যায়নি" }, { status: 404 });
      }

      if (supplier.currentBalancePoisha <= 0) {
        return NextResponse.json(
          { error: "এই সরবরাহকারীর কোনো বকেয়া পাওনা নেই" },
          { status: 400 }
        );
      }

      const balanceBefore = supplier.currentBalancePoisha;
      const actualPaymentPoisha = Math.min(amountPoisha, balanceBefore);
      const balanceAfter = balanceBefore - actualPaymentPoisha;

      supplier.currentBalancePoisha = balanceAfter;
      supplier.totalPaidPoisha = (supplier.totalPaidPoisha || 0) + actualPaymentPoisha;
      supplier.updatedAt = new Date();

      const paymentRecord = {
        _id: `mock-sp-${Date.now()}`,
        paymentNumber,
        supplierId: supplier._id,
        supplierName: supplier.name,
        amountPoisha: actualPaymentPoisha,
        balanceBeforePoisha: balanceBefore,
        balanceAfterPoisha: balanceAfter,
        paymentMethod,
        transactionReference,
        paidById: session.userId,
        paidByName: session.displayName,
        notes: notes || `সাপ্লায়ার পাওনা পরিশোধ - ভাউচার #${paymentNumber}`,
        createdAt: new Date(),
      };

      store.supplierPayments.unshift(paymentRecord);

      return NextResponse.json({
        success: true,
        message: "সাপ্লায়ারের পাওনা সফলভাবে পরিশোধ হয়েছে",
        payment: paymentRecord,
      });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return NextResponse.json({ error: "সাপ্লায়ার পাওয়া যায়নি" }, { status: 404 });
    }

    if (supplier.currentBalancePoisha <= 0) {
      return NextResponse.json(
        { error: "এই সরবরাহকারীর কোনো বকেয়া পাওনা নেই" },
        { status: 400 }
      );
    }

    const balanceBefore = supplier.currentBalancePoisha;
    const actualPaymentPoisha = Math.min(amountPoisha, balanceBefore);
    const balanceAfter = balanceBefore - actualPaymentPoisha;

    supplier.currentBalancePoisha = balanceAfter;
    supplier.totalPaidPoisha = (supplier.totalPaidPoisha || 0) + actualPaymentPoisha;
    await supplier.save();

    const payment = await SupplierPayment.create({
      paymentNumber,
      supplierId: supplier._id,
      supplierName: supplier.name,
      amountPoisha: actualPaymentPoisha,
      balanceBeforePoisha: balanceBefore,
      balanceAfterPoisha: balanceAfter,
      paymentMethod,
      transactionReference,
      paidById: session.userId,
      paidByName: session.displayName,
      notes: notes || `সাপ্লায়ার পাওনা পরিশোধ - ভাউচার #${paymentNumber}`,
    });

    return NextResponse.json({
      success: true,
      message: "সাপ্লায়ারের পাওনা সফলভাবে পরিশোধ হয়েছে",
      payment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "পেমেন্ট সম্পন্ন করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

