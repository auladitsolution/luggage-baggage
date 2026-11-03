export interface IEmployee {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  designation: string; // 'ম্যানেজার', 'বিক্রয় কর্মী', 'ক্যাশিয়ার', 'নিরাপত্তা কর্মী'
  nidNumber?: string;
  address?: string;
  joiningDate: string | Date;
  basicSalaryPoisha: number; // মাসিক মূল বেতন (পয়সা)
  allowancePoisha: number; // বাড়িভাড়া ও অন্যান্য ভাতা (পয়সা)
  bankOrWalletDetails?: string; // ব্যাংক একাউন্ট বা বিকাশ নম্বর
  status: "active" | "resigned" | "terminated";
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type PayrollPaymentStatus = "unpaid" | "partial" | "paid";

export interface IPayrollRecord {
  _id: string;
  employeeId: string | any;
  employeeName?: string;
  employeeDesignation?: string;
  employeePhone?: string;
  monthYear: string; // 'YYYY-MM' e.g. '2026-10'
  basicSalaryPoisha: number;
  allowancePoisha: number;
  bonusPoisha: number; // উৎসব বোনাস বা পারফরম্যান্স বোনাস
  deductionPoisha: number; // অনুপস্থিতি বা জরিমানা কর্তন
  advanceAdjustedPoisha: number; // অগ্রিম বেতন সমন্বয়
  netPayablePoisha: number; // (Basic + Allowance + Bonus) - (Deduction + Advance)
  paidAmountPoisha: number; // এ পর্যন্ত পরিশোধিত টাকা
  dueAmountPoisha: number; // বকেয়া বেতন
  paymentStatus: PayrollPaymentStatus;
  paidFromAccountId?: string; // যে ক্যাশ/ব্যাংক থেকে প্রদান করা হয়েছে
  disbursedDate?: string | Date;
  disbursedById?: string;
  disbursedByName?: string;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

