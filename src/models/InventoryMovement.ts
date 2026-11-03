import mongoose, { Schema, Document, Model } from "mongoose";
import { IInventoryMovement } from "@/types/inventory";

export interface IInventoryMovementDocument extends Omit<IInventoryMovement, "_id">, Document {}

const InventoryMovementSchema = new Schema<IInventoryMovementDocument>(
  {
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: [true, "ভ্যারিয়েন্ট আইডি আবশ্যক"],
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "লোকেশন আইডি আবশ্যক"],
    },
    movementType: {
      type: String,
      enum: [
        "purchase_receipt",
        "pos_sale",
        "online_sale",
        "customer_return",
        "supplier_return",
        "damage_loss",
        "manual_adjustment",
      ],
      required: [true, "মুভমেন্টের ধরন আবশ্যক"],
    },
    quantity: {
      type: Number,
      required: [true, "পরিমাণ আবশ্যক"],
    },
    balanceBefore: {
      type: Number,
      required: [true, "পূর্ববর্তী ব্যালেন্স আবশ্যক"],
    },
    balanceAfter: {
      type: Number,
      required: [true, "পরবর্তী ব্যালেন্স আবশ্যক"],
    },
    referenceType: {
      type: String,
      enum: [
        "sale_invoice",
        "purchase_invoice",
        "stock_adjustment",
        "return_receipt",
        "initial_setup",
      ],
      required: [true, "রেফারেন্স টাইপ আবশ্যক"],
    },
    referenceId: {
      type: Schema.Types.Mixed,
      required: [true, "রেফারেন্স আইডি আবশ্যক"],
    },
    reason: {
      type: String,
      trim: true,
    },
    actorId: {
      type: Schema.Types.Mixed,
      required: [true, "অ্যাক্টর বা স্টাফ আইডি আবশ্যক"],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable ledger, no updates allowed
  }
);

InventoryMovementSchema.index({ variantId: 1, createdAt: -1 });
InventoryMovementSchema.index({ locationId: 1 });
InventoryMovementSchema.index({ referenceId: 1 });
InventoryMovementSchema.index({ movementType: 1 });

export const InventoryMovement: Model<IInventoryMovementDocument> =
  mongoose.models.InventoryMovement ||
  mongoose.model<IInventoryMovementDocument>("InventoryMovement", InventoryMovementSchema);

