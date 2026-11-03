import mongoose, { Schema, Document, Model } from "mongoose";
import { ICustomer } from "@/types/sales";

export interface ICustomerDocument extends Omit<ICustomer, "_id">, Document {}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    name: {
      type: String,
      required: [true, "কাস্টমারের নাম আবশ্যক"],
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
    address: String,
    district: String,
    creditLimitPoisha: {
      type: Number,
      default: 5000000, // ৳ 50,000 default credit limit
    },
    currentDuePoisha: {
      type: Number,
      default: 0,
    },
    totalPurchasedPoisha: {
      type: Number,
      default: 0,
    },
    totalPaidPoisha: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

CustomerSchema.index({ currentDuePoisha: -1 });

export const Customer: Model<ICustomerDocument> =
  mongoose.models.Customer ||
  mongoose.model<ICustomerDocument>("Customer", CustomerSchema);

