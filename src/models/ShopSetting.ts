import mongoose, { Schema, Document, Model } from "mongoose";

export interface IShopSetting {
  organizationName: string;
  organizationNameBangla: string;
  owners: string;
  ownersBangla: string;
  address: string;
  addressBangla: string;
  mobile: string;
  whatsapp: string;
  email: string;
  facebookPageLink: string;
  bin: string;
  mushak: string;
  receiptFooter: string;
  defaultThermalSize: "58mm" | "80mm";
  deliveryFeeInsideDhaka: number;
  deliveryFeeOutsideDhaka: number;
  isCodEnabled: boolean;
  bkashNumber: string;
  nagadNumber: string;
  businessHours: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IShopSettingDocument extends IShopSetting, Document {}

const ShopSettingSchema = new Schema<IShopSettingDocument>(
  {
    organizationName: {
      type: String,
      default: "Luggage & Baggage",
      trim: true,
    },
    organizationNameBangla: {
      type: String,
      default: "লাগেজ অ্যান্ড ব্যাগেজ",
      trim: true,
    },
    owners: {
      type: String,
      default: "Md. Sohel Sikder & Md. Alam",
      trim: true,
    },
    ownersBangla: {
      type: String,
      default: "মোঃ সোহেল শিকদার এবং মোঃ আলম",
      trim: true,
    },
    address: {
      type: String,
      default: "3A-022B, Jamuna Future Park, Kuril, Progoti Shoroni, Dhaka-1229.",
      trim: true,
    },
    addressBangla: {
      type: String,
      default: "দোকান নং ৩এ-০২২বি, যমুনা ফিউচার পার্ক, কুড়িল, প্রগতি সরণি, ঢাকা-১২২৯।",
      trim: true,
    },
    mobile: {
      type: String,
      default: "01869749988",
      trim: true,
    },
    whatsapp: {
      type: String,
      default: "01869749988",
      trim: true,
    },
    email: {
      type: String,
      default: "luggage.baggage26@gmail.com",
      trim: true,
    },
    facebookPageLink: {
      type: String,
      default: "https://www.facebook.com/profile.php?id=61596263631676",
      trim: true,
    },
    bin: {
      type: String,
      default: "003456789-0101",
      trim: true,
    },
    mushak: {
      type: String,
      default: "মূসক-৬.৩",
      trim: true,
    },
    receiptFooter: {
      type: String,
      default: "আমাদের পণ্য পছন্দ করায় ধন্যবাদ। বিক্রিত পণ্য ৭ দিনের মধ্যে মেমোসহ পরিবর্তনযোগ্য।",
      trim: true,
    },
    defaultThermalSize: {
      type: String,
      enum: ["58mm", "80mm"],
      default: "80mm",
    },
    deliveryFeeInsideDhaka: {
      type: Number,
      default: 80,
    },
    deliveryFeeOutsideDhaka: {
      type: Number,
      default: 150,
    },
    isCodEnabled: {
      type: Boolean,
      default: true,
    },
    bkashNumber: {
      type: String,
      default: "01869749988",
      trim: true,
    },
    nagadNumber: {
      type: String,
      default: "01869749988",
      trim: true,
    },
    businessHours: {
      type: String,
      default: "প্রতিদিন সকাল ১০:০০ টা - রাত ৯:০০ টা (বুধবার সাপ্তাহিক বন্ধ)",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ShopSetting: Model<IShopSettingDocument> =
  mongoose.models.ShopSetting ||
  mongoose.model<IShopSettingDocument>("ShopSetting", ShopSettingSchema);

