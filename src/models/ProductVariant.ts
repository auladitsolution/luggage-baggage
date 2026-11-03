import mongoose, { Schema, Document, Model } from "mongoose";
import { IProductVariant } from "@/types/catalog";

export interface IProductVariantDocument extends Omit<IProductVariant, "_id">, Document {}

const ProductVariantSchema = new Schema<IProductVariantDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "প্রোডাক্ট রেফারেন্স আবশ্যক"],
    },
    sku: {
      type: String,
      required: [true, "SKU আবশ্যক"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    barcode: {
      type: String,
      required: [true, "বারকোড আবশ্যক"],
      unique: true,
      trim: true,
    },
    nameVariant: {
      type: String,
      required: [true, "ভ্যারিয়েন্ট নাম আবশ্যক"],
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    weightKg: {
      type: Number,
      default: 0,
    },
    dimensionsCm: {
      length: Number,
      width: Number,
      height: Number,
    },
    purchaseCostPoisha: {
      type: Number,
      required: [true, "ক্রয়মূল্য (পয়সা) আবশ্যক"],
      min: 0,
      default: 0,
    },
    retailPricePoisha: {
      type: Number,
      required: [true, "খুচরা বিক্রয়মূল্য (পয়সা) আবশ্যক"],
      min: 0,
      default: 0,
    },
    discountPricePoisha: {
      type: Number,
      min: 0,
      default: null,
    },
    wholesalePricePoisha: {
      type: Number,
      min: 0,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

ProductVariantSchema.index({ productId: 1 });
ProductVariantSchema.index({ status: 1 });

export const ProductVariant: Model<IProductVariantDocument> =
  mongoose.models.ProductVariant ||
  mongoose.model<IProductVariantDocument>("ProductVariant", ProductVariantSchema);

