import mongoose, { Schema, Document, Model } from "mongoose";
import { IBrand } from "@/types/catalog";

export interface IBrandDocument extends Omit<IBrand, "_id">, Document {}

const BrandSchema = new Schema<IBrandDocument>(
  {
    name: {
      type: String,
      required: [true, "ব্র্যান্ডের নাম আবশ্যক"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "ব্র্যান্ড স্লাগ আবশ্যক"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Brand: Model<IBrandDocument> =
  mongoose.models.Brand || mongoose.model<IBrandDocument>("Brand", BrandSchema);

