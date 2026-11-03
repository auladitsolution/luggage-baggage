import mongoose, { Schema, Document, Model } from "mongoose";
import { IPOSSession } from "@/types/sales";

export interface IPOSSessionDocument extends Omit<IPOSSession, "_id">, Document {}

const POSSessionSchema = new Schema<IPOSSessionDocument>(
  {
    cashierId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ক্যাশিয়ার আইডি আবশ্যক"],
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "লোকেশন আবশ্যক"],
    },
    shiftNumber: {
      type: String,
      required: [true, "শিফট নম্বর আবশ্যক"],
      unique: true,
      trim: true,
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: Date,
    openingCashPoisha: {
      type: Number,
      default: 0,
    },
    closingCashExpectedPoisha: Number,
    closingCashActualPoisha: Number,
    cashDiscrepancyPoisha: Number,
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

POSSessionSchema.index({ cashierId: 1, status: 1 });

export const POSSession: Model<IPOSSessionDocument> =
  mongoose.models.POSSession ||
  mongoose.model<IPOSSessionDocument>("POSSession", POSSessionSchema);

