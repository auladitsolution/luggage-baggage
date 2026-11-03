export type FinancialAccountType = "cash" | "bank" | "bkash" | "nagad";

export interface IFinancialAccount {
  _id: string;
  accountName: string; // 'দোকান ক্যাশ ড্রয়ার', 'ব্র্যাক ব্যাংক চলতি হিসাব', 'বিকাশ মার্চেন্ট'
  accountType: FinancialAccountType;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  currentBalancePoisha: number; // ব্যালেন্স (পয়সা)
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type JournalReferenceType =
  | "sale"
  | "purchase"
  | "customer_due_collection"
  | "supplier_payment"
  | "expense"
  | "payroll"
  | "transfer"
  | "initial_balance";

export interface IJournalLine {
  accountId: string | any;
  accountName?: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
  debitPoisha: number;
  creditPoisha: number;
  notes?: string;
}

export interface IJournalEntry {
  _id: string;
  entryNumber: string; // 'JV-2026-00001'
  entryDate: string | Date;
  referenceType: JournalReferenceType;
  referenceId: string; // ইনভয়েস নম্বর, বিল নম্বর বা ট্রান্সফার আইডি
  description: string;
  lines: IJournalLine[];
  totalDebitPoisha: number;
  totalCreditPoisha: number; // সর্বদা totalDebitPoisha === totalCreditPoisha হতে হবে
  actorId?: string;
  actorName?: string;
  createdAt?: string | Date;
}

export interface IFinancialSummary {
  totalRevenuePoisha: number;
  posRevenuePoisha?: number;
  onlineRevenuePoisha?: number;
  costOfGoodsSoldPoisha: number;
  grossProfitPoisha: number;
  grossProfitMarginPercent: number;
  operatingExpensesPoisha: number;
  staffPayrollPoisha: number;
  totalExpensesPoisha: number;
  netProfitPoisha: number;
  netProfitMarginPercent: number;
  inventoryValuationPoisha: number;
  totalReceivablesPoisha: number; // কাস্টমারদের বকেয়া
  totalPayablesPoisha: number; // সাপ্লায়ারদের পাওনা
  totalLiquidAssetsPoisha: number; // ক্যাশ + ব্যাংক + ওয়ালেট
}

