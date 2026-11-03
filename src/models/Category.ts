import mongoose, { Schema, Document, Model } from "mongoose";
import { ICategory } from "@/types/catalog";

export interface ICategoryDocument extends Omit<ICategory, "_id">, Document {}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    nameBangla: {
      type: String,
      required: [true, "ক্যাটাগরির বাংলা নাম আবশ্যক"],
      trim: true,
    },
    nameEnglish: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "ক্যাটাগরি স্লাগ আবশ্যক"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    image: {
      publicId: String,
      url: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({ parentId: 1 });
CategorySchema.index({ sortOrder: 1 });

export const Category: Model<ICategoryDocument> =
  mongoose.models.Category || mongoose.model<ICategoryDocument>("Category", CategorySchema);

