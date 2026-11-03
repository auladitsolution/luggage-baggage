import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Customer } from "@/models/Customer";
import { SalesInvoice } from "@/models/SalesInvoice";
import { CustomerCreditTransaction } from "@/models/CustomerCreditTransaction";
import { MoneyReceipt } from "@/models/MoneyReceipt";
import { requirePermission } from "@/lib/rbac/guards";
import { getNextReceiptNumber } from "@/lib/sales/receiptSequence";
import { getMockStore } from "@/lib/db/memoryStore";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("dues.collect");
    const body = await req.json();

    const {
      customerId,
      amountPoisha,
      paymentMethod = "cash",
      transactionReference,
      notes,
    } = body;

    if (!customerId || !amountPoisha || amountPoisha <= 0) {
      return NextResponse.json(
        { error: "কাস্টমার আইডি এবং আদায়কৃত অর্থ (শূন্যের বেশি) আবশ্যক।" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const receiptNumber = await getNextReceiptNumber();

    // Mock In-Memory Mode
    if (!db) {
      const store = getMockStore();
      const customer = store.customers.find((c) => c._id === customerId);
      if (!customer) {
        return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি" }, { status: 404 });
      }

      if (customer.currentDuePoisha <= 0) {
        return NextResponse.json(
          { error: "এই কাস্টমারের কোনো বকেয়া নেই।" },
          { status: 400 }
        );
      }

      const balanceBefore = customer.currentDuePoisha;
      const actualCollectedPoisha = Math.min(amountPoisha, balanceBefore);
      const balanceAfter = balanceBefore - actualCollectedPoisha;

      // Update customer balance
      customer.currentDuePoisha = balanceAfter;
      customer.totalPaidPoisha = (customer.totalPaidPoisha || 0) + actualCollectedPoisha;
      customer.updatedAt = new Date();

      // FIFO Allocation over customer's unpaid invoices
      let remainingToAllocate = actualCollectedPoisha;
      const allocatedInvoices = [];

      const unpaidInvoices = store.salesInvoices
        .filter((inv) => inv.customerId === customer._id && inv.dueAmountPoisha > 0)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // FIFO (oldest first)

      for (const inv of unpaidInvoices) {
        if (remainingToAllocate <= 0) break;

        const alloc = Math.min(remainingToAllocate, inv.dueAmountPoisha);
        inv.dueAmountPoisha -= alloc;
        inv.paidAmountPoisha += alloc;
        if (inv.dueAmountPoisha === 0) {
          inv.paymentStatus = "paid";
        }

        inv.payments.push({
          method: paymentMethod,
          amountPoisha: alloc,
          transactionReference,
          recordedAt: new Date(),
        });

        allocatedInvoices.push({
          invoiceId: inv._id,
          invoiceNumber: inv.invoiceNumber,
          allocatedAmountPoisha: alloc,
          remainingDuePoisha: inv.dueAmountPoisha,
        });

        remainingToAllocate -= alloc;
      }

      // Record Customer Credit Ledger Transaction
      const creditTx = {
        _id: `mock-cctx-${Date.now()}`,
        customerId: customer._id,
        transactionType: "payment_received" as const,
        amountPoisha: actualCollectedPoisha,
        balanceBeforePoisha: balanceBefore,
        balanceAfterPoisha: balanceAfter,
        paymentMethod,
        collectedById: session.userId,
        receiptNumber,
        notes: notes || `বকেয়া আদায় - রসিদ #${receiptNumber}`,
        createdAt: new Date(),
      };
      store.creditTransactions.unshift(creditTx);

      // Create Money Receipt Record
      const receipt: any = {
        _id: `mock-mr-${Date.now()}`,
        receiptNumber,
        customerId: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone,
        amountPoisha: actualCollectedPoisha,
        balanceBeforePoisha: balanceBefore,
        balanceAfterPoisha: balanceAfter,
        paymentMethod,
        transactionReference,
        allocatedInvoices,
        collectedById: session.userId,
        collectedByName: session.displayName,
        notes,
        createdAt: new Date(),
      };
      store.moneyReceipts.unshift(receipt);

      return NextResponse.json({
        success: true,
        message: "বকেয়া টাকা সফলভাবে জমা হয়েছে।",
        receipt,
      });
    }

    // Live MongoDB Atlas Mode with FIFO allocation
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি" }, { status: 404 });
    }

    if (customer.currentDuePoisha <= 0) {
      return NextResponse.json(
        { error: "এই কাস্টমারের কোনো বকেয়া নেই।" },
        { status: 400 }
      );
    }

    const balanceBefore = customer.currentDuePoisha;
    const actualCollectedPoisha = Math.min(amountPoisha, balanceBefore);
    const balanceAfter = balanceBefore - actualCollectedPoisha;

    customer.currentDuePoisha = balanceAfter;
    customer.totalPaidPoisha = (customer.totalPaidPoisha || 0) + actualCollectedPoisha;
    await customer.save();

    // FIFO Allocation over unpaid invoices
    let remainingToAllocate = actualCollectedPoisha;
    const allocatedInvoices = [];

    const unpaidInvoices = await SalesInvoice.find({
      customerId: customer._id,
      dueAmountPoisha: { $gt: 0 },
    }).sort({ createdAt: 1 }); // FIFO: oldest first

    for (const inv of unpaidInvoices) {
      if (remainingToAllocate <= 0) break;

      const alloc = Math.min(remainingToAllocate, inv.dueAmountPoisha);
      inv.dueAmountPoisha -= alloc;
      inv.paidAmountPoisha += alloc;
      if (inv.dueAmountPoisha === 0) {
        inv.paymentStatus = "paid";
      }

      inv.payments.push({
        method: paymentMethod,
        amountPoisha: alloc,
        transactionReference,
        recordedAt: new Date(),
      });

      await inv.save();

      allocatedInvoices.push({
        invoiceId: inv._id,
        invoiceNumber: inv.invoiceNumber,
        allocatedAmountPoisha: alloc,
        remainingDuePoisha: inv.dueAmountPoisha,
      });

      remainingToAllocate -= alloc;
    }

    await CustomerCreditTransaction.create({
      customerId: customer._id,
      transactionType: "payment_received",
      amountPoisha: actualCollectedPoisha,
      balanceBeforePoisha: balanceBefore,
      balanceAfterPoisha: balanceAfter,
      paymentMethod,
      collectedById: session.userId,
      receiptNumber,
      notes: notes || `বকেয়া আদায় - রসিদ #${receiptNumber}`,
    });

    const receipt = await MoneyReceipt.create({
      receiptNumber,
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      amountPoisha: actualCollectedPoisha,
      balanceBeforePoisha: balanceBefore,
      balanceAfterPoisha: balanceAfter,
      paymentMethod,
      transactionReference,
      allocatedInvoices,
      collectedById: session.userId,
      collectedByName: session.displayName,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: "বকেয়া টাকা সফলভাবে জমা হয়েছে।",
      receipt: receipt.toObject(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "বকেয়া আদায় করতে সমস্যা হয়েছে" },
      { status: 403 }
    );
  }
}

