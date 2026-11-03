export const ALL_PERMISSIONS = [
  // প্রোডাক্ট ও ক্যাটালগ
  "products.read",
  "products.create",
  "products.update",
  "products.delete",

  // ইনভেন্টরি ও স্টক
  "inventory.read",
  "inventory.adjust",

  // ক্রয় ও সাপ্লায়ার
  "purchases.read",
  "purchases.create",
  "purchases.update",

  // বিক্রয় ও পিওএস
  "sales.create",
  "sales.refund",
  "sales.discount",
  "sales.viewCost",

  // কাস্টমার ও বকেয়া
  "customers.read",
  "customers.update",
  "dues.read",
  "dues.collect",

  // ব্যয় ও ভাউচার
  "expenses.create",
  "expenses.approve",

  // বেতন ও কর্মী
  "payroll.read",
  "payroll.manage",

  // রিপোর্ট ও এনালিটিক্স
  "reports.read",
  "reports.financial",

  // সিস্টেম
  "users.manage",
  "settings.manage",
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

export type RoleSlug = 
  | "owner" 
  | "admin" 
  | "manager" 
  | "cashier" 
  | "inventory" 
  | "accountant" 
  | "online_manager" 
  | "customer";

export interface IRole {
  _id: string;
  name: string;
  nameBangla: string;
  slug: RoleSlug;
  permissions: Permission[];
  isSystem: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  _id: string;
  firebaseUid?: string;
  email?: string;
  username?: string;
  phone?: string;
  displayName: string;
  passwordHash?: string;
  photoUrl?: string;
  roleId: string | IRole;
  isActive: boolean;
  isOwner: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserSession {
  userId: string;
  firebaseUid: string;
  email?: string;
  displayName: string;
  photoUrl?: string;
  roleSlug: RoleSlug;
  roleNameBangla: string;
  isOwner: boolean;
  permissions: Permission[];
  authMethod?: "credentials" | "google";
}

