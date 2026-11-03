import mongoose, { Schema, Document, Model } from "mongoose";
import { ILocation } from "@/types/inventory";

export interface ILocationDocument extends Omit<ILocation, "_id">, Document {}

const LocationSchema = new Schema<ILocationDocument>(
  {
    name: {
      type: String,
      required: [true, "শাখা বা গোডাউনের নাম আবশ্যক"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "লোকেশন কোড আবশ্যক"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "ঠিকানা আবশ্যক"],
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Location: Model<ILocationDocument> =
  mongoose.models.Location || mongoose.model<ILocationDocument>("Location", LocationSchema);

