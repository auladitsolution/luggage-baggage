import mongoose, { Schema, Document, Model } from "mongoose";
import { ISalesInvoice } from "@/types/sales";

export interface ISalesInvoiceDocument extends Omit<ISalesInvoice, "_id">, Document {}

const InvoiceItemSchema = new Schema(
  {
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productNameBangla: { type: String, required: true },
    variantName: { type: String, required: true },
    sku: { type: String, required: true },
    barcode: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPricePoisha: { type: Number, required: true, min: 0 },
    unitCostPoisha: { type: Number, required: true, min: 0 },
    lineDiscountPoisha: { type: Number, default: 0 },
    totalAmountPoisha: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PaymentRecordSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["cash", "bkash", "nagad", "bank", "card"],
      required: true,
    },
    amountPoisha: { type: Number, required: true, min: 0 },
    transactionReference: String,
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SalesInvoiceSchema = new Schema<ISalesInvoiceDocument>(
  {
    invoiceNumber: {
      type: String,
      required: [true, "ইনভয়েস নম্বর আবশ্যক"],
      unique: true,
      trim: true,
    },
    invoiceType: {
      type: String,
      enum: ["pos", "online"],
      default: "pos",
    },
    posSessionId: {
      type: Schema.Types.ObjectId,
      ref: "POSSession",
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: {
      type: String,
      required: [true, "কাস্টমারের নাম আবশ্যক"],
      default: "সাধারণ কাস্টমার (Walk-in)",
    },
    customerPhone: {
      type: String,
      default: "",
    },
    items: [InvoiceItemSchema],
    subTotalPoisha: { type: Number, required: true, min: 0 },
    orderDiscountPoisha: { type: Number, default: 0 },
    deliveryFeePoisha: { type: Number, default: 0 },
    vatTaxPoisha: { type: Number, default: 0 },
    grandTotalPoisha: { type: Number, required: true, min: 0 },
    paidAmountPoisha: { type: Number, required: true, min: 0 },
    dueAmountPoisha: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "due"],
      required: true,
    },
    payments: [PaymentRecordSchema],
    salesPersonId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    salesPersonName: String,
    status: {
      type: String,
      enum: ["completed", "cancelled", "refunded"],
      default: "completed",
    },
    notes: String,
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

SalesInvoiceSchema.index({ customerId: 1, createdAt: -1 });
SalesInvoiceSchema.index({ customerPhone: 1 });
SalesInvoiceSchema.index({ createdAt: -1 });
SalesInvoiceSchema.index({ paymentStatus: 1 });

export const SalesInvoice: Model<ISalesInvoiceDocument> =
  mongoose.models.SalesInvoice ||
  mongoose.model<ISalesInvoiceDocument>("SalesInvoice", SalesInvoiceSchema);

