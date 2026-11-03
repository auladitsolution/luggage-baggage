import mongoose, { Schema, Document, Model } from "mongoose";
import { ISupplierPayment } from "@/types/purchasing";

export interface ISupplierPaymentDocument extends Omit<ISupplierPayment, "_id">, Document {}

const SupplierPaymentSchema = new Schema<ISupplierPaymentDocument>(
  {
    paymentNumber: {
      type: String,
      required: [true, "পেমেন্ট ভাউচার নম্বর আবশ্যক"],
      unique: true,
      trim: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "সাপ্লায়ার আবশ্যক"],
    },
    supplierName: {
      type: String,
      required: true,
    },
    amountPoisha: {
      type: Number,
      required: [true, "পরিশোধিত অর্থ আবশ্যক"],
      min: [1, "অর্থ শূন্যের বেশি হতে হবে"],
    },
    balanceBeforePoisha: {
      type: Number,
      required: true,
    },
    balanceAfterPoisha: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "bkash", "nagad"],
      required: true,
    },
    transactionReference: String,
    paidById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paidByName: String,
    notes: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable record
  }
);

SupplierPaymentSchema.index({ supplierId: 1, createdAt: -1 });

export const SupplierPayment: Model<ISupplierPaymentDocument> =
  mongoose.models.SupplierPayment ||
  mongoose.model<ISupplierPaymentDocument>("SupplierPayment", SupplierPaymentSchema);

