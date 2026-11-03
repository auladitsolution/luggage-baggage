export interface ISupplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  currentBalancePoisha: number; // দোকান থেকে সাপ্লায়ারের মোট পাওনা (দোকানের বকেয়া দেনা)
  totalPurchasedPoisha: number;
  totalPaidPoisha: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseInvoiceItem {
  variantId: any;
  productId: any;
  productName: string;
  variantName: string;
  sku: string;
  barcode: string;
  quantityReceived: number;
  unitCostPoisha: number;
  lineTotalPoisha: number;
}

export interface IPurchaseInvoice {
  _id: string;
  purchaseInvoiceNumber: string; // 'PUR-2026-00001'
  supplierInvoiceRef?: string; // সাপ্লায়ারের মেমো নম্বর
  supplierId: any;
  supplierName: string;
  locationId: any;
  items: IPurchaseInvoiceItem[];
  totalCostPoisha: number;
  discountPoisha: number;
  grandTotalPoisha: number;
  paidAmountPoisha: number;
  dueAmountPoisha: number;
  paymentMethod?: "cash" | "bank" | "bkash" | "nagad";
  status: "received" | "partially_received" | "cancelled";
  receivedById: any;
  receivedByName?: string;
  receivedDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupplierPayment {
  _id: string;
  paymentNumber: string; // 'SP-2026-00001'
  supplierId: any;
  supplierName: string;
  amountPoisha: number;
  balanceBeforePoisha: number;
  balanceAfterPoisha: number;
  paymentMethod: "cash" | "bank" | "bkash" | "nagad";
  transactionReference?: string;
  paidById: any;
  paidByName?: string;
  notes?: string;
  createdAt: Date;
}

export type ExpenseCategory =
  | "shop_rent"
  | "electricity"
  | "internet"
  | "staff_refreshment"
  | "transport"
  | "packaging"
  | "maintenance"
  | "advertising"
  | "miscellaneous";

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  shop_rent: "দোকান ভাড়া",
  electricity: "বিদ্যুৎ বিল",
  internet: "ইন্টারনেট বিল",
  staff_refreshment: "স্টাফ নাস্তা ও আপ্যায়ন",
  transport: "পরিবহন ও মালামাল খালাস",
  packaging: "প্যাকেজিং ও শপিং ব্যাগ",
  maintenance: "দোকান মেরামত ও রক্ষণাবেক্ষণ",
  advertising: "বিজ্ঞাপন ও প্রচারণা",
  miscellaneous: "বিবিধ আনুষঙ্গিক খরচ",
};

export interface IExpense {
  _id: string;
  voucherNumber: string; // 'EXP-2026-00001'
  category: ExpenseCategory;
  categoryBangla: string;
  amountPoisha: number;
  paymentMethod: "cash" | "bank" | "bkash" | "nagad";
  paidTo?: string;
  approvedById: any;
  approvedByName?: string;
  status: "approved" | "pending" | "rejected";
  expenseDate: Date;
  description: string;
  receiptAttachmentUrl?: string;
  createdAt: Date;
}

