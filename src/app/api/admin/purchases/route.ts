import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { PurchaseInvoice } from "@/models/PurchaseInvoice";
import { Supplier } from "@/models/Supplier";
import { ProductVariant } from "@/models/ProductVariant";
import { InventoryBalance } from "@/models/InventoryBalance";
import { InventoryMovement } from "@/models/InventoryMovement";
import { Location } from "@/models/Location";
import { requirePermission } from "@/lib/rbac/guards";
import { getNextPurchaseNumber } from "@/lib/purchasing/purchaseSequence";
import { getMockStore } from "@/lib/db/memoryStore";
import { resolveProductVariant } from "@/lib/catalog/variantUtils";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("purchases.read");
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let list = [...(store.purchaseInvoices || [])];
      if (supplierId) {
        list = list.filter((p) => p.supplierId === supplierId);
      }
      return NextResponse.json({ success: true, purchases: list });
    }

    const query: any = {};
    if (supplierId) {
      query.supplierId = supplierId;
    }

    const purchases = await PurchaseInvoice.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, purchases });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ক্রয় তালিকা লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("purchases.create");
    const body = await req.json();

    const {
      supplierId,
      supplierInvoiceRef,
      locationId: reqLocationId,
      items,
      discountPoisha = 0,
      paidAmountPoisha = 0,
      paymentMethod = "bank",
      notes,
    } = body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "সাপ্লায়ার এবং পণ্যের তালিকা আবশ্যক" },
        { status: 400 }
      );
    }

    const purchaseInvoiceNumber = await getNextPurchaseNumber();
    const db = await connectToDatabase();

    // 1. Mock Mode (In-Memory)
    if (!db) {
      const store = getMockStore();
      const supplier = (store.suppliers || []).find((s) => s._id === supplierId);
      if (!supplier) {
        return NextResponse.json({ error: "সাপ্লায়ার পাওয়া যায়নি" }, { status: 404 });
      }

      const location = reqLocationId
        ? store.locations.find((l) => l._id === reqLocationId)
        : store.locations[0];
      const locId = location ? location._id : "mock-loc-main";

      let totalCostPoisha = 0;
      const invoiceItems = [];

      for (const item of items) {
        const variant = store.variants.find((v) => v._id === item.variantId);
        if (!variant) {
          return NextResponse.json(
            { error: `ভ্যারিয়েন্ট পাওয়া যায়নি (${item.variantId})` },
            { status: 404 }
          );
        }

        const qty = parseInt(item.quantityReceived, 10);
        const cost = Math.round(item.unitCostPoisha);
        if (qty <= 0 || cost < 0) {
          return NextResponse.json(
            { error: "পণ্যের পরিমাণ এবং ক্রয়মূল্য সঠিক নয়" },
            { status: 400 }
          );
        }

        const lineTotal = qty * cost;
        totalCostPoisha += lineTotal;

        // Find or create inventory balance
        let balance = store.inventoryBalances.find(
          (b) => b.variantId === variant._id && b.locationId === locId
        );
        if (!balance) {
          balance = {
            _id: `mock-bal-${Date.now()}-${Math.random()}`,
            variantId: variant._id,
            productId: variant.productId,
            locationId: locId,
            currentStock: 0,
            reservedStock: 0,
            lowStockAlertThreshold: 3,
            updatedAt: new Date(),
          };
          store.inventoryBalances.push(balance);
        }

        const currentStockBefore = balance.currentStock;
        const currentWac = variant.purchaseCostPoisha || cost;
        const newStock = currentStockBefore + qty;

        // WAC formula: ((OldStock * OldWAC) + (NewQty * NewCost)) / NewStock
        const newWac =
          newStock > 0
            ? Math.round((currentStockBefore * currentWac + qty * cost) / newStock)
            : cost;

        // Update variant purchaseCostPoisha
        variant.purchaseCostPoisha = newWac;
        variant.updatedAt = new Date();

        // Update inventory balance
        balance.currentStock = newStock;
        balance.updatedAt = new Date();

        // Record Inventory Movement (purchase_receipt)
        const movement = {
          _id: `mock-mov-${Date.now()}-${Math.random()}`,
          variantId: variant._id,
          locationId: locId,
          movementType: "purchase_receipt" as const,
          quantity: qty,
          balanceBefore: currentStockBefore,
          balanceAfter: newStock,
          referenceType: "purchase_invoice" as const,
          referenceId: purchaseInvoiceNumber,
          reason: `ক্রয় চালান #${purchaseInvoiceNumber}`,
          actorId: session.userId,
          createdAt: new Date(),
        };
        store.inventoryMovements.unshift(movement);

        invoiceItems.push({
          variantId: variant._id,
          productId: variant.productId,
          productName: (item.productName || "লাগেজ") as string,
          variantName: variant.nameVariant,
          sku: variant.sku,
          barcode: variant.barcode,
          quantityReceived: qty,
          unitCostPoisha: cost,
          lineTotalPoisha: lineTotal,
        });
      }

      const grandTotalPoisha = Math.max(0, totalCostPoisha - (discountPoisha || 0));
      const actualPaid = Math.min(paidAmountPoisha || 0, grandTotalPoisha);
      const dueAmountPoisha = grandTotalPoisha - actualPaid;

      // Update supplier balance
      supplier.totalPurchasedPoisha = (supplier.totalPurchasedPoisha || 0) + grandTotalPoisha;
      supplier.totalPaidPoisha = (supplier.totalPaidPoisha || 0) + actualPaid;
      supplier.currentBalancePoisha = (supplier.currentBalancePoisha || 0) + dueAmountPoisha;
      supplier.updatedAt = new Date();

      const newInvoice = {
        _id: `mock-pur-${Date.now()}`,
        purchaseInvoiceNumber,
        supplierInvoiceRef,
        supplierId: supplier._id,
        supplierName: supplier.name,
        locationId: locId,
        items: invoiceItems,
        totalCostPoisha,
        discountPoisha,
        grandTotalPoisha,
        paidAmountPoisha: actualPaid,
        dueAmountPoisha,
        paymentMethod: actualPaid > 0 ? paymentMethod : undefined,
        status: "received" as const,
        receivedById: session.userId,
        receivedByName: session.displayName,
        receivedDate: new Date(),
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.purchaseInvoices.unshift(newInvoice);

      return NextResponse.json({
        success: true,
        message: "মাল সফলভাবে রিসিভ এবং স্টকে যুক্ত হয়েছে",
        invoice: newInvoice,
      });
    }

    // 2. Production Database Mode (MongoDB Atlas)
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return NextResponse.json({ error: "সাপ্লায়ার পাওয়া যায়নি" }, { status: 404 });
    }

    let defaultLoc = null;
    if (reqLocationId) {
      defaultLoc = await Location.findById(reqLocationId);
    }
    if (!defaultLoc) {
      defaultLoc = await Location.findOne({ isActive: true });
    }
    if (!defaultLoc) {
      defaultLoc = await Location.create({
        name: "প্রধান শোরুম (Main Showroom)",
        code: "LOC-MAIN",
        address: "দোকান নং ৪২, বসুন্ধরা সিটি",
        isDefault: true,
        isActive: true,
      });
    }
    const locId = defaultLoc._id;

    let totalCostPoisha = 0;
    const invoiceItems = [];

    for (const item of items) {
      const variant = await resolveProductVariant(item.variantId);
      if (!variant) {
        return NextResponse.json(
          { error: `ভ্যারিয়েন্ট পাওয়া যায়নি (${item.variantId})` },
          { status: 404 }
        );
      }

      const qty = parseInt(item.quantityReceived, 10);
      const cost = Math.round(item.unitCostPoisha);
      if (qty <= 0 || cost < 0) {
        return NextResponse.json(
          { error: "পণ্যের পরিমাণ এবং ক্রয়মূল্য সঠিক নয়" },
          { status: 400 }
        );
      }

      const lineTotal = qty * cost;
      totalCostPoisha += lineTotal;

      let balance = await InventoryBalance.findOne({
        variantId: variant._id,
        locationId: locId,
      });

      if (!balance) {
        balance = await InventoryBalance.create({
          variantId: variant._id,
          productId: variant.productId,
          locationId: locId,
          currentStock: 0,
          reservedStock: 0,
          lowStockAlertThreshold: 3,
        });
      }

      const currentStockBefore = balance.currentStock;
      const currentWac = variant.purchaseCostPoisha || cost;
      const newStock = currentStockBefore + qty;

      const newWac =
        newStock > 0
          ? Math.round((currentStockBefore * currentWac + qty * cost) / newStock)
          : cost;

      variant.purchaseCostPoisha = newWac;
      await variant.save();

      balance.currentStock = newStock;
      await balance.save();

      await InventoryMovement.create({
        variantId: variant._id,
        locationId: locId,
        movementType: "purchase_receipt",
        quantity: qty,
        balanceBefore: currentStockBefore,
        balanceAfter: newStock,
        referenceType: "purchase_invoice",
        referenceId: purchaseInvoiceNumber,
        reason: `ক্রয় চালান #${purchaseInvoiceNumber}`,
        actorId: session.userId,
      });

      invoiceItems.push({
        variantId: variant._id,
        productId: variant.productId,
        productName: item.productName || "লাগেজ",
        variantName: variant.nameVariant,
        sku: variant.sku,
        barcode: variant.barcode,
        quantityReceived: qty,
        unitCostPoisha: cost,
        lineTotalPoisha: lineTotal,
      });
    }

    const grandTotalPoisha = Math.max(0, totalCostPoisha - (discountPoisha || 0));
    const actualPaid = Math.min(paidAmountPoisha || 0, grandTotalPoisha);
    const dueAmountPoisha = grandTotalPoisha - actualPaid;

    supplier.totalPurchasedPoisha = (supplier.totalPurchasedPoisha || 0) + grandTotalPoisha;
    supplier.totalPaidPoisha = (supplier.totalPaidPoisha || 0) + actualPaid;
    supplier.currentBalancePoisha = (supplier.currentBalancePoisha || 0) + dueAmountPoisha;
    await supplier.save();

    const invoice = await PurchaseInvoice.create({
      purchaseInvoiceNumber,
      supplierInvoiceRef,
      supplierId: supplier._id,
      supplierName: supplier.name,
      locationId: locId,
      items: invoiceItems,
      totalCostPoisha,
      discountPoisha,
      grandTotalPoisha,
      paidAmountPoisha: actualPaid,
      dueAmountPoisha,
      paymentMethod: actualPaid > 0 ? paymentMethod : undefined,
      status: "received",
      receivedById: session.userId,
      receivedByName: session.displayName,
      receivedDate: new Date(),
      notes,
    });

    return NextResponse.json({
      success: true,
      message: "মাল সফলভাবে রিসিভ এবং স্টকে যুক্ত হয়েছে",
      invoice,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ক্রয় সম্পন্ন করতে সমস্যা হয়েছে" },
      { status: error.status || 500 }
    );
  }
}

