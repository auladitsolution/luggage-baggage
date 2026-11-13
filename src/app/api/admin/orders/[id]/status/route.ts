import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { OnlineOrder } from "@/models/OnlineOrder";
import { InventoryBalance } from "@/models/InventoryBalance";
import { InventoryMovement } from "@/models/InventoryMovement";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("sales.create", req);
    const { id } = await params;
    const body = await req.json();
    const { orderStatus, courierName, trackingNumber, internalNotes } = body;

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];

    if (!validStatuses.includes(orderStatus)) {
      return NextResponse.json({ error: "অবৈধ অর্ডার স্ট্যাটাস" }, { status: 400 });
    }

    const db = await connectToDatabase();

    // 1. Mock In-Memory Mode
    if (!db) {
      const store = getMockStore();
      const order = (store.onlineOrders || []).find((o) => o._id === id || o.orderNumber === id);
      if (!order) {
        return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
      }

      const prevStatus = order.orderStatus;

      // Handle Stock Lifecycle Transitions:
      // A. Transition to 'delivered': Deduct actual physical inventory & release reservation
      if (orderStatus === "delivered" && prevStatus !== "delivered") {
        for (const item of order.items) {
          const balance = store.inventoryBalances.find((b) => b.variantId === item.variantId);
          if (balance) {
            const before = balance.currentStock;
            balance.currentStock = Math.max(0, balance.currentStock - item.quantity);
            balance.reservedStock = Math.max(0, balance.reservedStock - item.quantity);
            balance.updatedAt = new Date();

            const movement = {
              _id: `mock-mov-${Date.now()}-${Math.random()}`,
              variantId: item.variantId,
              locationId: balance.locationId,
              movementType: "online_sale" as const,
              quantity: -item.quantity,
              balanceBefore: before,
              balanceAfter: balance.currentStock,
              referenceType: "sale_invoice" as const,
              referenceId: order.orderNumber,
              reason: `অনলাইন অর্ডার ডেলিভারি #${order.orderNumber}`,
              actorId: session.userId,
              createdAt: new Date(),
            };
            store.inventoryMovements.unshift(movement);
          }
        }
        if (order.paymentMethod === "cod") {
          order.paymentStatus = "paid";
        }
      }

      // B. Transition to 'cancelled': Release reserved stock
      if (orderStatus === "cancelled" && prevStatus !== "cancelled" && prevStatus !== "delivered") {
        for (const item of order.items) {
          const balance = store.inventoryBalances.find((b) => b.variantId === item.variantId);
          if (balance) {
            balance.reservedStock = Math.max(0, balance.reservedStock - item.quantity);
            balance.updatedAt = new Date();
          }
        }
      }

      // C. Transition to 'returned': If it was previously delivered, restore physical stock
      if (orderStatus === "returned" && prevStatus === "delivered") {
        for (const item of order.items) {
          const balance = store.inventoryBalances.find((b) => b.variantId === item.variantId);
          if (balance) {
            const before = balance.currentStock;
            balance.currentStock += item.quantity;
            balance.updatedAt = new Date();

            const movement = {
              _id: `mock-mov-${Date.now()}-${Math.random()}`,
              variantId: item.variantId,
              locationId: balance.locationId,
              movementType: "customer_return" as const,
              quantity: item.quantity,
              balanceBefore: before,
              balanceAfter: balance.currentStock,
              referenceType: "return_receipt" as const,
              referenceId: order.orderNumber,
              reason: `অনলাইন কুরিয়ার রিটার্ন #${order.orderNumber}`,
              actorId: session.userId,
              createdAt: new Date(),
            };
            store.inventoryMovements.unshift(movement);
          }
        }
      }

      order.orderStatus = orderStatus;
      if (courierName) order.courierName = courierName.trim();
      if (trackingNumber) order.trackingNumber = trackingNumber.trim();
      if (internalNotes) order.internalNotes = internalNotes.trim();
      order.updatedAt = new Date();

      return NextResponse.json({
        success: true,
        message: `অর্ডার স্ট্যাটাস সফলভাবে '${orderStatus}' এ পরিবর্তিত হয়েছে`,
        order,
      });
    }

    // 2. MongoDB Atlas Mode
    const order = await OnlineOrder.findById(id);
    if (!order) {
      return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
    }

    const prevStatus = order.orderStatus;

    if (orderStatus === "delivered" && prevStatus !== "delivered") {
      for (const item of order.items) {
        const balance = await InventoryBalance.findOne({ variantId: item.variantId });
        if (balance) {
          const before = balance.currentStock;
          balance.currentStock = Math.max(0, balance.currentStock - item.quantity);
          balance.reservedStock = Math.max(0, balance.reservedStock - item.quantity);
          await balance.save();

          await InventoryMovement.create({
            variantId: item.variantId,
            locationId: balance.locationId,
            movementType: "online_sale",
            quantity: -item.quantity,
            balanceBefore: before,
            balanceAfter: balance.currentStock,
            referenceType: "sale_invoice",
            referenceId: order.orderNumber,
            reason: `অনলাইন অর্ডার ডেলিভারি #${order.orderNumber}`,
            actorId: session.userId,
          });
        }
      }
      if (order.paymentMethod === "cod") {
        order.paymentStatus = "paid";
      }
    }

    if (orderStatus === "cancelled" && prevStatus !== "cancelled" && prevStatus !== "delivered") {
      for (const item of order.items) {
        const balance = await InventoryBalance.findOne({ variantId: item.variantId });
        if (balance) {
          balance.reservedStock = Math.max(0, balance.reservedStock - item.quantity);
          await balance.save();
        }
      }
    }

    if (orderStatus === "returned" && prevStatus === "delivered") {
      for (const item of order.items) {
        const balance = await InventoryBalance.findOne({ variantId: item.variantId });
        if (balance) {
          const before = balance.currentStock;
          balance.currentStock += item.quantity;
          await balance.save();

          await InventoryMovement.create({
            variantId: item.variantId,
            locationId: balance.locationId,
            movementType: "customer_return",
            quantity: item.quantity,
            balanceBefore: before,
            balanceAfter: balance.currentStock,
            referenceType: "return_receipt",
            referenceId: order.orderNumber,
            reason: `অনলাইন কুরিয়ার রিটার্ন #${order.orderNumber}`,
            actorId: session.userId,
          });
        }
      }
    }

    order.orderStatus = orderStatus;
    if (courierName) order.courierName = courierName.trim();
    if (trackingNumber) order.trackingNumber = trackingNumber.trim();
    if (internalNotes) order.internalNotes = internalNotes.trim();
    await order.save();

    return NextResponse.json({
      success: true,
      message: `অর্ডার স্ট্যাটাস সফলভাবে '${orderStatus}' এ পরিবর্তিত হয়েছে`,
      order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "অর্ডার আপডেট করতে সমস্যা হয়েছে" },
      { status: error.status || 500 }
    );
  }
}

