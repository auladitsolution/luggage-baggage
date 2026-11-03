import mongoose, { Schema, Document, Model } from "mongoose";
import { IRole, RoleSlug, ALL_PERMISSIONS } from "@/types/auth";

export interface IRoleDocument extends Omit<IRole, "_id">, Document {}

const RoleSchema = new Schema<IRoleDocument>(
  {
    name: {
      type: String,
      required: [true, "রোলের নাম দেওয়া আবশ্যক"],
      trim: true,
    },
    nameBangla: {
      type: String,
      required: [true, "রোলের বাংলা নাম দেওয়া আবশ্যক"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    permissions: {
      type: [String],
      enum: ALL_PERMISSIONS,
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index is automatically created by unique: true on slug field

export const Role: Model<IRoleDocument> =
  mongoose.models.Role || mongoose.model<IRoleDocument>("Role", RoleSchema);
