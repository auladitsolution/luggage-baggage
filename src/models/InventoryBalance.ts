import mongoose, { Schema, Document, Model } from "mongoose";
import { IInventoryBalance } from "@/types/inventory";

export interface IInventoryBalanceDocument extends Omit<IInventoryBalance, "_id">, Document {}

const InventoryBalanceSchema = new Schema<IInventoryBalanceDocument>(
  {
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: [true, "ভ্যারিয়েন্ট আইডি আবশ্যক"],
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "প্রোডাক্ট আইডি আবশ্যক"],
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "লোকেশন আইডি আবশ্যক"],
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, "স্টক ঋণাত্মক হতে পারে না"],
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: [0, "রিজার্ভ স্টক ঋণাত্মক হতে পারে না"],
    },
    lowStockAlertThreshold: {
      type: Number,
      default: 3,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: One balance record per variant per location
InventoryBalanceSchema.index({ variantId: 1, locationId: 1 }, { unique: true });
InventoryBalanceSchema.index({ productId: 1 });
InventoryBalanceSchema.index({ currentStock: 1 });

export const InventoryBalance: Model<IInventoryBalanceDocument> =
  mongoose.models.InventoryBalance ||
  mongoose.model<IInventoryBalanceDocument>("InventoryBalance", InventoryBalanceSchema);

