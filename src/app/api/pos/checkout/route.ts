import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { SalesInvoice } from "@/models/SalesInvoice";
import { InventoryBalance } from "@/models/InventoryBalance";
import { InventoryMovement } from "@/models/InventoryMovement";
import { ProductVariant } from "@/models/ProductVariant";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { CustomerCreditTransaction } from "@/models/CustomerCreditTransaction";
import { Location } from "@/models/Location";
import { requirePermission } from "@/lib/rbac/guards";
import { getNextInvoiceNumber } from "@/lib/sales/invoiceSequence";
import { getMockStore } from "@/lib/db/memoryStore";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("sales.create");
    const body = await req.json();

    const {
      idempotencyKey,
      posSessionId,
      customerId,
      customerName = "সাধারণ কাস্টমার (Walk-in)",
      customerPhone = "",
      items = [],
      orderDiscountPoisha = 0,
      deliveryFeePoisha = 0,
      vatTaxPoisha = 0,
      payments = [],
      notes,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "কার্টে কোনো পণ্য নেই" }, { status: 400 });
    }

    const db = await connectToDatabase();

    // 1. Check Idempotency Key (Double submit prevention)
    if (idempotencyKey) {
      if (!db) {
        const store = getMockStore();
        const existing = store.salesInvoices.find((inv) => inv.idempotencyKey === idempotencyKey);
        if (existing) {
          return NextResponse.json({
            success: true,
            message: "ইতিমধ্যে প্রসেসকৃত ইনভয়েস (Idempotent response)",
            invoice: existing,
          });
        }
      } else {
        const existing = await SalesInvoice.findOne({ idempotencyKey }).lean();
        if (existing) {
          return NextResponse.json({
            success: true,
            message: "ইতিমধ্যে প্রসেসকৃত ইনভয়েস (Idempotent response)",
            invoice: existing,
          });
        }
      }
    }

    // Mock In-Memory Flow
    if (!db) {
      const store = getMockStore();
      const invoiceNumber = await getNextInvoiceNumber();

      // Verify stock for all items
      const compiledItems = [];
      let subTotalPoisha = 0;

      for (const item of items) {
        const variant = store.variants.find((v) => v._id === item.variantId);
        if (!variant) {
          return NextResponse.json({ error: `ভ্যারিয়েন্ট পাওয়া যায়নি (${item.variantId})` }, { status: 400 });
        }

        const product = store.products.find((p) => p._id === variant.productId);
        const balance = store.inventoryBalances.find((b) => b.variantId === variant._id);
        const currentStock = balance ? balance.currentStock : 0;
        const qty = item.quantity || 1;

        if (currentStock < qty) {
          return NextResponse.json(
            {
              error: `পর্যাপ্ত স্টক নেই! '${variant.nameVariant}' এর বর্তমান স্টক: ${currentStock} পিস, বিক্রির চেষ্টা: ${qty} পিস`,
            },
            { status: 400 }
          );
        }

        const unitPricePoisha = item.unitPricePoisha ?? variant.retailPricePoisha;
        const lineDiscountPoisha = item.lineDiscountPoisha || 0;
        const totalAmountPoisha = Math.max(0, unitPricePoisha * qty - lineDiscountPoisha);

        subTotalPoisha += totalAmountPoisha;

        compiledItems.push({
          variantId: variant._id,
          productId: variant.productId as string,
          productNameBangla: product?.nameBangla || "লাগেজ পণ্য",
          variantName: variant.nameVariant,
          sku: variant.sku,
          barcode: variant.barcode,
          quantity: qty,
          unitPricePoisha,
          unitCostPoisha: variant.purchaseCostPoisha,
          lineDiscountPoisha,
          totalAmountPoisha,
        });
      }

      const grandTotalPoisha = Math.max(0, subTotalPoisha - orderDiscountPoisha + deliveryFeePoisha + vatTaxPoisha);
      const paidAmountPoisha = payments.reduce((acc: number, p: any) => acc + (p.amountPoisha || 0), 0);
      const dueAmountPoisha = Math.max(0, grandTotalPoisha - paidAmountPoisha);
      const paymentStatus = dueAmountPoisha === 0 ? "paid" : paidAmountPoisha > 0 ? "partial" : "due";

      let finalCustomerId = customerId;
      // Handle customer due
      if (dueAmountPoisha > 0) {
        if (!customerPhone) {
          return NextResponse.json(
            { error: "বাকি বিক্রির ক্ষেত্রে কাস্টমারের মোবাইল নম্বর প্রদান করা আবশ্যক।" },
            { status: 400 }
          );
        }

        let customer = store.customers.find((c) => c.phone === customerPhone);
        if (!customer) {
          customer = {
            _id: `mock-cust-${Date.now()}`,
            name: customerName,
            phone: customerPhone,
            creditLimitPoisha: 5000000,
            currentDuePoisha: 0,
            totalPurchasedPoisha: 0,
            totalPaidPoisha: 0,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          store.customers.push(customer);
        }

        finalCustomerId = customer._id;
        const balanceBefore = customer.currentDuePoisha;
        customer.currentDuePoisha += dueAmountPoisha;
        customer.totalPurchasedPoisha += grandTotalPoisha;
        customer.totalPaidPoisha += paidAmountPoisha;

        store.creditTransactions.push({
          _id: `mock-cctx-${Date.now()}`,
          customerId: customer._id,
          transactionType: "due_sale",
          amountPoisha: dueAmountPoisha,
          balanceBeforePoisha: balanceBefore,
          balanceAfterPoisha: customer.currentDuePoisha,
          collectedById: session.userId,
          notes: `চালান #${invoiceNumber} এ বকেয়া`,
          createdAt: new Date(),
        });
      }

      // Deduct stock and record movements
      const newInvoiceId = `mock-inv-${Date.now()}`;
      for (const item of compiledItems) {
        const balance = store.inventoryBalances.find((b) => b.variantId === item.variantId);
        if (balance) {
          const before = balance.currentStock;
          balance.currentStock = before - item.quantity;
          balance.updatedAt = new Date();

          store.inventoryMovements.push({
            _id: `mock-mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            variantId: item.variantId,
            locationId: balance.locationId,
            movementType: "pos_sale",
            quantity: -item.quantity,
            balanceBefore: before,
            balanceAfter: balance.currentStock,
            referenceType: "sale_invoice",
            referenceId: newInvoiceId,
            reason: `পিওএস বিক্রয় #${invoiceNumber}`,
            actorId: session.userId,
            createdAt: new Date(),
          });
        }
      }

      const newInvoice: any = {
        _id: newInvoiceId,
        invoiceNumber,
        invoiceType: "pos",
        posSessionId,
        customerId: finalCustomerId,
        customerName,
        customerPhone,
        items: compiledItems,
        subTotalPoisha,
        orderDiscountPoisha,
        deliveryFeePoisha,
        vatTaxPoisha,
        grandTotalPoisha,
        paidAmountPoisha,
        dueAmountPoisha,
        paymentStatus,
        payments: payments.map((p: any) => ({
          method: p.method,
          amountPoisha: p.amountPoisha,
          transactionReference: p.transactionReference,
          recordedAt: new Date(),
        })),
        salesPersonId: session.userId,
        salesPersonName: session.displayName,
        status: "completed",
        notes,
        idempotencyKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.salesInvoices.unshift(newInvoice);

      return NextResponse.json({
        success: true,
        message: "বিক্রয় চালান সফলভাবে তৈরি হয়েছে।",
        invoice: newInvoice,
      });
    }

    // Live MongoDB Atlas Flow (11-Step Concurrency-Safe Mutation)
    const invoiceNumber = await getNextInvoiceNumber();

    const compiledItems = [];
    let subTotalPoisha = 0;

    // 1. Verify all items and current stock
    for (const item of items) {
      const variant = await ProductVariant.findById(item.variantId);
      if (!variant) {
        return NextResponse.json({ error: `ভ্যারিয়েন্ট পাওয়া যায়নি (${item.variantId})` }, { status: 400 });
      }

      const product = await Product.findById(variant.productId);
      const balance = await InventoryBalance.findOne({ variantId: variant._id });
      const currentStock = balance ? balance.currentStock : 0;
      const qty = item.quantity || 1;

      if (currentStock < qty) {
        return NextResponse.json(
          {
            error: `পর্যাপ্ত স্টক নেই! '${variant.nameVariant}' এর বর্তমান স্টক: ${currentStock} পিস, বিক্রির চেষ্টা: ${qty} পিস`,
          },
          { status: 400 }
        );
      }

      const unitPricePoisha = item.unitPricePoisha ?? variant.retailPricePoisha;
      const lineDiscountPoisha = item.lineDiscountPoisha || 0;
      const totalAmountPoisha = Math.max(0, unitPricePoisha * qty - lineDiscountPoisha);

      subTotalPoisha += totalAmountPoisha;

      compiledItems.push({
        variantId: variant._id,
        productId: variant.productId,
        productNameBangla: product?.nameBangla || "লাগেজ পণ্য",
        variantName: variant.nameVariant,
        sku: variant.sku,
        barcode: variant.barcode,
        quantity: qty,
        unitPricePoisha,
        unitCostPoisha: variant.purchaseCostPoisha,
        lineDiscountPoisha,
        totalAmountPoisha,
      });
    }

    const grandTotalPoisha = Math.max(0, subTotalPoisha - orderDiscountPoisha + deliveryFeePoisha + vatTaxPoisha);
    const paidAmountPoisha = payments.reduce((acc: number, p: any) => acc + (p.amountPoisha || 0), 0);
    const dueAmountPoisha = Math.max(0, grandTotalPoisha - paidAmountPoisha);
    const paymentStatus = dueAmountPoisha === 0 ? "paid" : paidAmountPoisha > 0 ? "partial" : "due";

    let finalCustomerId = customerId;

    // 2. Handle Due / Partial credit ledger
    if (dueAmountPoisha > 0) {
      if (!customerPhone) {
        return NextResponse.json(
          { error: "বাকি বিক্রির ক্ষেত্রে কাস্টমারের মোবাইল নম্বর প্রদান করা আবশ্যক।" },
          { status: 400 }
        );
      }

      let customer = await Customer.findOne({ phone: customerPhone });
      if (!customer) {
        customer = await Customer.create({
          name: customerName,
          phone: customerPhone,
          creditLimitPoisha: 5000000,
          currentDuePoisha: 0,
        });
      }

      finalCustomerId = customer._id;
      const balanceBefore = customer.currentDuePoisha;

      customer.currentDuePoisha += dueAmountPoisha;
      customer.totalPurchasedPoisha += grandTotalPoisha;
      customer.totalPaidPoisha += paidAmountPoisha;
      await customer.save();

      await CustomerCreditTransaction.create({
        customerId: customer._id,
        transactionType: "due_sale",
        amountPoisha: dueAmountPoisha,
        balanceBeforePoisha: balanceBefore,
        balanceAfterPoisha: customer.currentDuePoisha,
        collectedById: session.userId,
        notes: `চালান #${invoiceNumber} এ বকেয়া`,
      });
    }

    // 3. Create Sales Invoice
    const invoice = await SalesInvoice.create({
      invoiceNumber,
      invoiceType: "pos",
      posSessionId: posSessionId || null,
      customerId: finalCustomerId || null,
      customerName,
      customerPhone,
      items: compiledItems,
      subTotalPoisha,
      orderDiscountPoisha,
      deliveryFeePoisha,
      vatTaxPoisha,
      grandTotalPoisha,
      paidAmountPoisha,
      dueAmountPoisha,
      paymentStatus,
      payments: payments.map((p: any) => ({
        method: p.method,
        amountPoisha: p.amountPoisha,
        transactionReference: p.transactionReference,
        recordedAt: new Date(),
      })),
      salesPersonId: session.userId,
      salesPersonName: session.displayName,
      status: "completed",
      notes,
      idempotencyKey,
    });

    // 4. Concurrency-Safe Stock Deduction & Movement Record
    for (const item of compiledItems) {
      const updatedBalance = await InventoryBalance.findOneAndUpdate(
        {
          variantId: item.variantId,
          currentStock: { $gte: item.quantity },
        },
        {
          $inc: { currentStock: -item.quantity },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );

      if (updatedBalance) {
        await InventoryMovement.create({
          variantId: item.variantId,
          locationId: updatedBalance.locationId,
          movementType: "pos_sale",
          quantity: -item.quantity,
          balanceBefore: updatedBalance.currentStock + item.quantity,
          balanceAfter: updatedBalance.currentStock,
          referenceType: "sale_invoice",
          referenceId: invoice._id,
          reason: `পিওএস বিক্রয় #${invoiceNumber}`,
          actorId: session.userId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "বিক্রয় চালান সফলভাবে তৈরি হয়েছে।",
      invoice: invoice.toObject(),
    });
  } catch (error: any) {
    console.error("POS Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "বিক্রয় সম্পন্ন করতে সমস্যা হয়েছে" },
      { status: 403 }
    );
  }
}

