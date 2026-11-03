import mongoose, { Schema, Document, Model } from "mongoose";
import { IExpense } from "@/types/purchasing";

export interface IExpenseDocument extends Omit<IExpense, "_id">, Document {}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    voucherNumber: {
      type: String,
      required: [true, "ভাউচার নম্বর আবশ্যক"],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "shop_rent",
        "electricity",
        "internet",
        "staff_refreshment",
        "transport",
        "packaging",
        "maintenance",
        "advertising",
        "miscellaneous",
      ],
      required: [true, "খরচের খাত আবশ্যক"],
    },
    categoryBangla: {
      type: String,
      required: true,
    },
    amountPoisha: {
      type: Number,
      required: [true, "খরচের পরিমাণ আবশ্যক"],
      min: [1, "পরিমাণ শূন্যের বেশি হতে হবে"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "bkash", "nagad"],
      default: "cash",
    },
    paidTo: {
      type: String,
      trim: true,
    },
    approvedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedByName: String,
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      required: [true, "খরচের বিবরণ আবশ্যক"],
      trim: true,
    },
    receiptAttachmentUrl: String,
  },
  {
    timestamps: true,
  }
);

ExpenseSchema.index({ expenseDate: -1 });
ExpenseSchema.index({ category: 1, expenseDate: -1 });

export const Expense: Model<IExpenseDocument> =
  mongoose.models.Expense ||
  mongoose.model<IExpenseDocument>("Expense", ExpenseSchema);

