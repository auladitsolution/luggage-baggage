import mongoose, { Schema, Document, Model } from "mongoose";
import { IOnlineOrder } from "@/types/orders";

export interface IOnlineOrderDocument extends Omit<IOnlineOrder, "_id">, Document {}

const OrderItemSchema = new Schema(
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
    quantity: { type: Number, required: true, min: 1 },
    unitPricePoisha: { type: Number, required: true },
    totalAmountPoisha: { type: Number, required: true },
    image: String,
  },
  { _id: false }
);

const OnlineOrderSchema = new Schema<IOnlineOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: [true, "অর্ডার নম্বর আবশ্যক"],
      unique: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: {
      type: String,
      required: [true, "গ্রাহকের নাম আবশ্যক"],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, "মোবাইল নম্বর আবশ্যক"],
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    shippingAddress: {
      address: { type: String, required: true },
      district: { type: String, required: true },
      thanaOrArea: String,
    },
    deliveryZone: {
      type: String,
      enum: ["inside_dhaka", "outside_dhaka"],
      default: "inside_dhaka",
    },
    items: [OrderItemSchema],
    subTotalPoisha: { type: Number, required: true },
    deliveryFeePoisha: { type: Number, required: true },
    couponDiscountPoisha: { type: Number, default: 0 },
    grandTotalPoisha: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cod", "bkash_manual", "nagad_manual", "bank_manual"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "pending_verification", "paid", "failed", "refunded"],
      default: "pending",
    },
    manualPaymentDetails: {
      senderNumber: String,
      transactionId: String,
      bankName: String,
      verifiedAt: Date,
      verifiedById: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      verifiedByName: String,
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    courierName: String,
    trackingNumber: String,
    salesInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: "SalesInvoice",
    },
    customerNotes: String,
    internalNotes: String,
  },
  {
    timestamps: true,
  }
);

OnlineOrderSchema.index({ customerPhone: 1, createdAt: -1 });
OnlineOrderSchema.index({ orderStatus: 1, createdAt: -1 });

export const OnlineOrder: Model<IOnlineOrderDocument> =
  mongoose.models.OnlineOrder ||
  mongoose.model<IOnlineOrderDocument>("OnlineOrder", OnlineOrderSchema);

