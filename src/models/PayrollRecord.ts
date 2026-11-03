import mongoose, { Schema, Document, Model } from "mongoose";
import { IPayrollRecord } from "@/types/payroll";

export interface IPayrollRecordDocument
  extends Omit<IPayrollRecord, "_id">,
    Document {}

const PayrollRecordSchema = new Schema<IPayrollRecordDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "কর্মচারী রেফারেন্স আবশ্যক"],
    },
    monthYear: {
      type: String, // '2026-10'
      required: [true, "বেতনের মাস-বছর আবশ্যক (যেমন: ২০২৬-১০)"],
      trim: true,
    },
    basicSalaryPoisha: {
      type: Number,
      required: true,
      min: 0,
    },
    allowancePoisha: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonusPoisha: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductionPoisha: {
      type: Number,
      default: 0,
      min: 0,
    },
    advanceAdjustedPoisha: {
      type: Number,
      default: 0,
      min: 0,
    },
    netPayablePoisha: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmountPoisha: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmountPoisha: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    paidFromAccountId: {
      type: Schema.Types.ObjectId,
      ref: "FinancialAccount",
    },
    disbursedDate: Date,
    disbursedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    disbursedByName: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Prevent duplicate payroll generation for the same employee in the same month
PayrollRecordSchema.index({ employeeId: 1, monthYear: 1 }, { unique: true });
PayrollRecordSchema.index({ monthYear: 1 });
PayrollRecordSchema.index({ paymentStatus: 1 });

export const PayrollRecord: Model<IPayrollRecordDocument> =
  mongoose.models.PayrollRecord ||
  mongoose.model<IPayrollRecordDocument>("PayrollRecord", PayrollRecordSchema);

