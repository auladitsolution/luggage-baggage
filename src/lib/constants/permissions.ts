import { ALL_PERMISSIONS, Permission, RoleSlug } from "@/types/auth";

export interface DefaultRoleConfig {
  name: string;
  nameBangla: string;
  slug: RoleSlug;
  description: string;
  permissions: Permission[];
}

export const DEFAULT_ROLES: Record<RoleSlug, DefaultRoleConfig> = {
  owner: {
    name: "Store Owner",
    nameBangla: "দোকানের মালিক",
    slug: "owner",
    description: "সর্বোচ্চ ক্ষমতাধারী - সেটিংস, লাভ-ক্ষতি, ইউজার ও আর্থিক হিসাবের পূর্ণ নিয়ন্ত্রণ।",
    permissions: [...ALL_PERMISSIONS],
  },
  admin: {
    name: "Administrator",
    nameBangla: "সিস্টেম অ্যাডমিন",
    slug: "admin",
    description: "দৈনন্দিন শপ অপারেশন, স্টাফ ও ইনভেন্টরি তদারকি।",
    permissions: [
      "products.read", "products.create", "products.update", "products.delete",
      "inventory.read", "inventory.adjust",
      "purchases.read", "purchases.create", "purchases.update",
      "sales.create", "sales.refund", "sales.discount", "sales.viewCost",
      "customers.read", "customers.update",
      "dues.read", "dues.collect",
      "expenses.create", "expenses.approve",
      "payroll.read",
      "reports.read", "reports.financial",
      "users.manage",
    ],
  },
  manager: {
    name: "Store Manager",
    nameBangla: "স্টোর ম্যানেজার",
    slug: "manager",
    description: "দোকানের বিক্রয়, কাস্টমার বাকি, মাল রিসিভ ও স্টক সমন্বয়ের দায়িত্ব।",
    permissions: [
      "products.read", "products.create", "products.update",
      "inventory.read", "inventory.adjust",
      "purchases.read", "purchases.create",
      "sales.create", "sales.refund", "sales.discount",
      "customers.read", "customers.update",
      "dues.read", "dues.collect",
      "expenses.create",
      "reports.read",
    ],
  },
  cashier: {
    name: "Cashier",
    nameBangla: "ক্যাশিয়ার",
    slug: "cashier",
    description: "পিওএস কাউন্টারে বিক্রয়, টাকা গ্রহণ ও রসিদ প্রিন্ট। ক্রয়মূল্য বা স্টাফ বেতন দেখতে পারবেন না।",
    permissions: [
      "products.read",
      "inventory.read",
      "sales.create", "sales.discount",
      "customers.read", "customers.update",
      "dues.read", "dues.collect",
    ],
  },
  inventory: {
    name: "Inventory Staff",
    nameBangla: "স্টক ইনচার্জ",
    slug: "inventory",
    description: "নতুন মাল গ্রহণ, বারকোড ও স্টক ট্র্যাকিং।",
    permissions: [
      "products.read",
      "inventory.read",
      "purchases.read", "purchases.create",
    ],
  },
  accountant: {
    name: "Accountant",
    nameBangla: "হিসাবরক্ষক",
    slug: "accountant",
    description: "খরচ, বেতন, ব্যাংকিং হিসাব ও ব্যালেন্স শীট তদারকি।",
    permissions: [
      "products.read",
      "inventory.read",
      "purchases.read",
      "sales.viewCost",
      "customers.read",
      "dues.read", "dues.collect",
      "expenses.create",
      "payroll.read",
      "reports.read", "reports.financial",
    ],
  },
  online_manager: {
    name: "Online Order Manager",
    nameBangla: "অনলাইন ম্যানেজার",
    slug: "online_manager",
    description: "ই-কমার্স অর্ডার ভেরিফিকেশন, প্যাকিং ও কুরিয়ার ট্র্যাকিং।",
    permissions: [
      "products.read",
      "inventory.read",
      "sales.create",
      "customers.read", "customers.update",
      "reports.read",
    ],
  },
  customer: {
    name: "Customer",
    nameBangla: "সাধারণ ক্রেতা",
    slug: "customer",
    description: "পাবলিক ই-কমার্স স্টোরে কেনাকাটা ও নিজস্ব অর্ডার ভিউ। ডিফল্ট সাইন-আপ রোল।",
    permissions: ["products.read"],
  },
};

