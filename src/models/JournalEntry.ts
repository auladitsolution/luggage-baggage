import mongoose, { Schema, Document, Model } from "mongoose";
import { IJournalEntry } from "@/types/accounting";

export interface IJournalEntryDocument
  extends Omit<IJournalEntry, "_id">,
    Document {}

const JournalLineSchema = new Schema(
  {
    accountId: {
      type: Schema.Types.Mixed,
      required: true,
    },
    accountName: String,
    accountType: {
      type: String,
      enum: ["asset", "liability", "equity", "revenue", "expense"],
      required: true,
    },
    debitPoisha: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    creditPoisha: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    notes: String,
  },
  { _id: false }
);

const JournalEntrySchema = new Schema<IJournalEntryDocument>(
  {
    entryNumber: {
      type: String,
      required: [true, "ভাউচার নম্বর আবশ্যক"],
      unique: true,
      trim: true,
    },
    entryDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    referenceType: {
      type: String,
      enum: [
        "sale",
        "purchase",
        "customer_due_collection",
        "supplier_payment",
        "expense",
        "payroll",
        "transfer",
        "initial_balance",
      ],
      required: true,
    },
    referenceId: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      required: [true, "বিবরণ আবশ্যক"],
      trim: true,
    },
    lines: [JournalLineSchema],
    totalDebitPoisha: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCreditPoisha: {
      type: Number,
      required: true,
      min: 0,
    },
    actorId: {
      type: Schema.Types.Mixed,
    },
    actorName: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable journal
  }
);

JournalEntrySchema.index({ entryDate: -1 });
JournalEntrySchema.index({ referenceType: 1 });
JournalEntrySchema.index({ referenceId: 1 });

export const JournalEntry: Model<IJournalEntryDocument> =
  mongoose.models.JournalEntry ||
  mongoose.model<IJournalEntryDocument>("JournalEntry", JournalEntrySchema);

