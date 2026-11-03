import mongoose, { Schema, Document, Model } from "mongoose";
import { IEmployee } from "@/types/payroll";

export interface IEmployeeDocument extends Omit<IEmployee, "_id">, Document {}

const EmployeeSchema = new Schema<IEmployeeDocument>(
  {
    name: {
      type: String,
      required: [true, "কর্মচারীর নাম আবশ্যক"],
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
    designation: {
      type: String,
      required: [true, "পদবী আবশ্যক"],
      trim: true,
    },
    nidNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    basicSalaryPoisha: {
      type: Number,
      required: [true, "মূল বেতন আবশ্যক"],
      min: [0, "বেতন ০ বা তার বেশি হতে হবে"],
    },
    allowancePoisha: {
      type: Number,
      default: 0,
      min: 0,
    },
    bankOrWalletDetails: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "resigned", "terminated"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

EmployeeSchema.index({ status: 1 });

export const Employee: Model<IEmployeeDocument> =
  mongoose.models.Employee ||
  mongoose.model<IEmployeeDocument>("Employee", EmployeeSchema);

