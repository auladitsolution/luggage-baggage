import mongoose, { Schema, Document, Model } from "mongoose";
import { IProduct } from "@/types/catalog";

export interface IProductDocument extends Omit<IProduct, "_id">, Document {}

const ProductImageSchema = new Schema(
  {
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    altText: String,
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProductDocument>(
  {
    nameBangla: {
      type: String,
      required: [true, "পণ্যের বাংলা নাম আবশ্যক"],
      trim: true,
    },
    nameEnglish: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "প্রোডাক্ট স্লাগ আবশ্যক"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "ব্র্যান্ড আবশ্যক"],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "ক্যাটাগরি আবশ্যক"],
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    descriptionBangla: {
      type: String,
      trim: true,
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    images: [ProductImageSchema],
    hasVariants: {
      type: Boolean,
      default: true,
    },
    warrantyInfo: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ brandId: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ createdAt: -1 });

export const Product: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>("Product", ProductSchema);

