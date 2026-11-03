import { Permission } from "./auth";

export interface ICategory {
  _id: string;
  nameBangla: string;
  nameEnglish?: string;
  slug: string;
  parentId?: string;
  image?: {
    publicId: string;
    url: string;
  };
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBrand {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductImage {
  publicId: string;
  secureUrl: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface IProduct {
  _id: string;
  nameBangla: string;
  nameEnglish?: string;
  slug: string;
  brandId: string | IBrand;
  categoryId: string | ICategory;
  subCategoryId?: string | ICategory;
  descriptionBangla?: string;
  specifications: Record<string, string>;
  images: IProductImage[];
  hasVariants: boolean;
  warrantyInfo?: string;
  status: "active" | "draft" | "archived";
  isFeatured: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariant {
  _id: string;
  productId: string | IProduct;
  sku: string;
  barcode: string;
  nameVariant: string;
  size?: string;
  color?: string;
  weightKg?: number;
  dimensionsCm?: { length: number; width: number; height: number };
  purchaseCostPoisha: number;
  retailPricePoisha: number;
  discountPricePoisha?: number;
  wholesalePricePoisha?: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

