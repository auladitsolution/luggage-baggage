import mongoose, { Schema, Document, Model } from "mongoose";
import { ISupplier } from "@/types/purchasing";

export interface ISupplierDocument extends Omit<ISupplier, "_id">, Document {}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    name: {
      type: String,
      required: [true, "সরবরাহকারী / কোম্পানির নাম আবশ্যক"],
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "মোবাইল নম্বর আবশ্যক"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    currentBalancePoisha: {
      type: Number,
      default: 0, // দোকান থেকে সাপ্লায়ারের মোট পাওনা
    },
    totalPurchasedPoisha: {
      type: Number,
      default: 0,
    },
    totalPaidPoisha: {
      type: Number,
      default: 0,
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

SupplierSchema.index({ currentBalancePoisha: -1 });

export const Supplier: Model<ISupplierDocument> =
  mongoose.models.Supplier ||
  mongoose.model<ISupplierDocument>("Supplier", SupplierSchema);

