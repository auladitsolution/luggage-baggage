import mongoose, { Schema, Document, Model } from "mongoose";
import { IMoneyReceipt } from "@/types/sales";

export interface IMoneyReceiptDocument extends Omit<IMoneyReceipt, "_id">, Document {}

const AllocatedInvoiceSchema = new Schema(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "SalesInvoice",
      required: true,
    },
    invoiceNumber: { type: String, required: true },
    allocatedAmountPoisha: { type: Number, required: true },
    remainingDuePoisha: { type: Number, required: true },
  },
  { _id: false }
);

const MoneyReceiptSchema = new Schema<IMoneyReceiptDocument>(
  {
    receiptNumber: {
      type: String,
      required: [true, "মানি রিসিট নম্বর আবশ্যক"],
      unique: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "কাস্টমার আইডি আবশ্যক"],
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    amountPoisha: {
      type: Number,
      required: [true, "আদায়কৃত অর্থ আবশ্যক"],
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
      enum: ["cash", "bkash", "nagad", "bank"],
      required: true,
    },
    transactionReference: String,
    allocatedInvoices: [AllocatedInvoiceSchema],
    collectedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collectedByName: String,
    notes: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable record
  }
);

MoneyReceiptSchema.index({ customerId: 1, createdAt: -1 });

export const MoneyReceipt: Model<IMoneyReceiptDocument> =
  mongoose.models.MoneyReceipt ||
  mongoose.model<IMoneyReceiptDocument>("MoneyReceipt", MoneyReceiptSchema);

