import mongoose, { Schema, Document, Model } from "mongoose";
import { ICustomerCreditTransaction } from "@/types/sales";

export interface ICustomerCreditTransactionDocument
  extends Omit<ICustomerCreditTransaction, "_id">,
    Document {}

const CustomerCreditTransactionSchema =
  new Schema<ICustomerCreditTransactionDocument>(
    {
      customerId: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "কাস্টমার আইডি আবশ্যক"],
      },
      transactionType: {
        type: String,
        enum: ["due_sale", "payment_received", "due_adjustment", "return_credit"],
        required: true,
      },
      amountPoisha: {
        type: Number,
        required: true,
      },
      balanceBeforePoisha: {
        type: Number,
        required: true,
      },
      balanceAfterPoisha: {
        type: Number,
        required: true,
      },
      salesInvoiceId: {
        type: Schema.Types.ObjectId,
        ref: "SalesInvoice",
      },
      paymentMethod: {
        type: String,
        enum: ["cash", "bkash", "nagad", "bank"],
      },
      collectedById: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      receiptNumber: String,
      notes: String,
    },
    {
      timestamps: { createdAt: true, updatedAt: false },
    }
  );

CustomerCreditTransactionSchema.index({ customerId: 1, createdAt: -1 });
CustomerCreditTransactionSchema.index({ salesInvoiceId: 1 });

export const CustomerCreditTransaction: Model<ICustomerCreditTransactionDocument> =
  mongoose.models.CustomerCreditTransaction ||
  mongoose.model<ICustomerCreditTransactionDocument>(
    "CustomerCreditTransaction",
    CustomerCreditTransactionSchema
  );

