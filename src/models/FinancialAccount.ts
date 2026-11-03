import mongoose, { Schema, Document, Model } from "mongoose";
import { IFinancialAccount } from "@/types/accounting";

export interface IFinancialAccountDocument
  extends Omit<IFinancialAccount, "_id">,
    Document {}

const FinancialAccountSchema = new Schema<IFinancialAccountDocument>(
  {
    accountName: {
      type: String,
      required: [true, "হিসাবের নাম আবশ্যক"],
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["cash", "bank", "bkash", "nagad"],
      required: [true, "হিসাবের ধরণ আবশ্যক"],
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    branchName: {
      type: String,
      trim: true,
    },
    currentBalancePoisha: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

FinancialAccountSchema.index({ accountType: 1 });
FinancialAccountSchema.index({ isActive: 1 });

export const FinancialAccount: Model<IFinancialAccountDocument> =
  mongoose.models.FinancialAccount ||
  mongoose.model<IFinancialAccountDocument>(
    "FinancialAccount",
    FinancialAccountSchema
  );

