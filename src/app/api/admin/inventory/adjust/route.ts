import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { InventoryBalance } from "@/models/InventoryBalance";
import { InventoryMovement } from "@/models/InventoryMovement";
import { ProductVariant } from "@/models/ProductVariant";
import { Location } from "@/models/Location";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";
import { resolveProductVariant } from "@/lib/catalog/variantUtils";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("inventory.adjust", req);
    const body = await req.json();

    const { variantId, locationId, quantityChange, reason } = body;

    if (!variantId || typeof quantityChange !== "number" || quantityChange === 0) {
      return NextResponse.json(
        { error: "ভ্যারিয়েন্ট আইডি এবং শূন্য-ব্যতীত স্টক পরিবর্তনের পরিমাণ (quantityChange) আবশ্যক" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    // Mock In-Memory Mode
    if (!db) {
      const store = getMockStore();
      const variant = store.variants.find((v) => v._id === variantId);
      if (!variant) {
        return NextResponse.json({ error: "ভ্যারিয়েন্ট পাওয়া যায়নি" }, { status: 404 });
      }

      const locId = locationId || store.locations[0]._id;
      let balance = store.inventoryBalances.find(
        (b) => b.variantId === variantId && b.locationId === locId
      );

      if (!balance) {
        balance = {
          _id: `mock-bal-${Date.now()}`,
          variantId,
          productId: variant.productId as string,
          locationId: locId,
          currentStock: 0,
          reservedStock: 0,
          lowStockAlertThreshold: 3,
          updatedAt: new Date(),
        };
        store.inventoryBalances.push(balance);
      }

      const balanceBefore = balance.currentStock;
      const balanceAfter = balanceBefore + quantityChange;

      if (balanceAfter < 0) {
        return NextResponse.json(
          { error: `পর্যাপ্ত স্টক নেই! বর্তমান স্টক: ${balanceBefore}, কাটার চেষ্টা: ${Math.abs(quantityChange)}` },
          { status: 400 }
        );
      }

      // Concurrency-safe atomic mutation in memory
      balance.currentStock = balanceAfter;
      balance.updatedAt = new Date();

      const movementId = `mock-mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const movement = {
        _id: movementId,
        variantId,
        locationId: locId,
        movementType: (quantityChange < 0 ? "damage_loss" : "manual_adjustment") as any,
        quantity: quantityChange,
        balanceBefore,
        balanceAfter,
        referenceType: "stock_adjustment" as any,
        referenceId: movementId,
        reason: reason || "ম্যানুয়াল স্টক সমন্বয়",
        actorId: session.userId,
        createdAt: new Date(),
      };
      store.inventoryMovements.unshift(movement);

      return NextResponse.json({
        success: true,
        message: "স্টক সফলভাবে সমন্বয় করা হয়েছে।",
        balance: {
          variantId,
          balanceBefore,
          balanceAfter,
          currentStock: balanceAfter,
        },
        movement,
      });
    }

    // Live MongoDB Atlas Concurrency-Safe Atomic Mutation
    const variant = await resolveProductVariant(variantId);
    if (!variant) {
      return NextResponse.json(
        { error: "ভ্যারিয়েন্ট পাওয়া যায়নি। অনুগ্রহ করে সঠিক ভ্যারিয়েন্ট নির্বাচন করুন।" },
        { status: 404 }
      );
    }

    let locId = locationId;
    if (!locId) {
      const defaultLoc = await Location.findOne({ isDefault: true });
      locId = defaultLoc?._id;
    }

    // 1. Fetch current balance before change
    let cleanId = typeof variantId === "string" ? variantId.replace(/^var-/, "").trim() : "";
    let balanceDoc = null;

    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      balanceDoc = await InventoryBalance.findById(cleanId);
    }

    if (!balanceDoc) {
      balanceDoc = await InventoryBalance.findOne({
        variantId: variant._id,
        locationId: locId,
      });
    }

    if (!balanceDoc) {
      balanceDoc = await InventoryBalance.create({
        variantId: variant._id,
        productId: variant.productId,
        locationId: locId,
        currentStock: 0,
        reservedStock: 0,
        lowStockAlertThreshold: 3,
      });
    } else {
      // Auto-heal variantId/productId if broken
      if (!balanceDoc.variantId || !balanceDoc.productId) {
        balanceDoc.variantId = variant._id;
        balanceDoc.productId = variant.productId;
        await balanceDoc.save();
      }
    }

    const balanceBefore = balanceDoc.currentStock;

    // 2. Concurrency-Safe Atomic Query: Ensure currentStock cannot drop below 0
    let updatedBalance;
    if (quantityChange < 0) {
      updatedBalance = await InventoryBalance.findOneAndUpdate(
        {
          _id: balanceDoc._id,
          currentStock: { $gte: Math.abs(quantityChange) }, // Atomic condition check
        },
        {
          $inc: { currentStock: quantityChange },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );

      if (!updatedBalance) {
        return NextResponse.json(
          {
            error: `পর্যাপ্ত স্টক নেই অথবা অন্য কেউ একই সময়ে স্টক পরিবর্তন করেছেন! বর্তমান স্টক: ${balanceBefore}`,
          },
          { status: 400 }
        );
      }
    } else {
      updatedBalance = await InventoryBalance.findByIdAndUpdate(
        balanceDoc._id,
        {
          $inc: { currentStock: quantityChange },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );
    }

    const balanceAfter = updatedBalance!.currentStock;
    const movementRefId = new mongoose.Types.ObjectId();

    // 3. Write Immutable Audit Movement Record
    const movement = await InventoryMovement.create({
      variantId: variant._id,
      locationId: locId,
      movementType: quantityChange < 0 ? "damage_loss" : "manual_adjustment",
      quantity: quantityChange,
      balanceBefore,
      balanceAfter,
      referenceType: "stock_adjustment",
      referenceId: movementRefId,
      reason: reason || "ম্যানুয়াল স্টক সমন্বয়",
      actorId: session.userId,
    });

    return NextResponse.json({
      success: true,
      message: "স্টক সফলভাবে সমন্বয় করা হয়েছে।",
      balance: {
        variantId: variant._id.toString(),
        balanceBefore,
        balanceAfter,
        currentStock: balanceAfter,
      },
      movement,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "স্টক সমন্বয় করার অনুমতি নেই" },
      { status: 403 }
    );
  }
}

