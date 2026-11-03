import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "@/types/auth";

export interface IUserDocument extends Omit<IUser, "_id">, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    displayName: {
      type: String,
      required: [true, "ব্যবহারকারীর নাম আবশ্যক"],
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isOwner: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Secondary indexes (firebaseUid and email indexes are automatically created from field options)
UserSchema.index({ roleId: 1 });
UserSchema.index({ isActive: 1 });

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
