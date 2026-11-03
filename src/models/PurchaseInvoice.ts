import mongoose, { Schema, Document, Model } from "mongoose";
import { IPurchaseInvoice } from "@/types/purchasing";

export interface IPurchaseInvoiceDocument extends Omit<IPurchaseInvoice, "_id">, Document {}

const PurchaseInvoiceItemSchema = new Schema(
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
    productName: { type: String, required: true },
    variantName: { type: String, required: true },
    sku: { type: String, required: true },
    barcode: { type: String, required: true },
    quantityReceived: {
      type: Number,
      required: true,
      min: [1, "পরিমাণ কমপক্ষে ১ হতে হবে"],
    },
    unitCostPoisha: {
      type: Number,
      required: true,
      min: [0, "একক ক্রয়মূল্য ০ বা তার বেশি হতে হবে"],
    },
    lineTotalPoisha: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const PurchaseInvoiceSchema = new Schema<IPurchaseInvoiceDocument>(
  {
    purchaseInvoiceNumber: {
      type: String,
      required: [true, "ক্রয় চালান নম্বর আবশ্যক"],
      unique: true,
      trim: true,
    },
    supplierInvoiceRef: {
      type: String,
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
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    items: [PurchaseInvoiceItemSchema],
    totalCostPoisha: {
      type: Number,
      required: true,
    },
    discountPoisha: {
      type: Number,
      default: 0,
    },
    grandTotalPoisha: {
      type: Number,
      required: true,
    },
    paidAmountPoisha: {
      type: Number,
      default: 0,
    },
    dueAmountPoisha: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "bkash", "nagad"],
    },
    status: {
      type: String,
      enum: ["received", "partially_received", "cancelled"],
      default: "received",
    },
    receivedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receivedByName: String,
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

PurchaseInvoiceSchema.index({ supplierId: 1, createdAt: -1 });
PurchaseInvoiceSchema.index({ createdAt: -1 });

export const PurchaseInvoice: Model<IPurchaseInvoiceDocument> =
  mongoose.models.PurchaseInvoice ||
  mongoose.model<IPurchaseInvoiceDocument>("PurchaseInvoice", PurchaseInvoiceSchema);

