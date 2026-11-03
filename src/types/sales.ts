export type PaymentMethod = "cash" | "bkash" | "nagad" | "bank" | "card";

export interface IInvoiceItem {
  variantId: any;
  productId: any;
  productNameBangla: string;
  variantName: string;
  sku: string;
  barcode: string;
  quantity: number;
  unitPricePoisha: number;
  unitCostPoisha: number;
  lineDiscountPoisha: number;
  totalAmountPoisha: number;
}

export interface IPaymentRecord {
  method: PaymentMethod;
  amountPoisha: number;
  transactionReference?: string;
  recordedAt: Date;
}

export interface ISalesInvoice {
  _id: string;
  invoiceNumber: string;
  invoiceType: "pos" | "online";
  posSessionId?: any;
  customerId?: any;
  customerName: string;
  customerPhone: string;
  items: IInvoiceItem[];
  subTotalPoisha: number;
  orderDiscountPoisha: number;
  deliveryFeePoisha: number;
  vatTaxPoisha: number;
  grandTotalPoisha: number;
  paidAmountPoisha: number;
  dueAmountPoisha: number;
  paymentStatus: "paid" | "partial" | "due";
  payments: IPaymentRecord[];
  salesPersonId: any;
  salesPersonName?: string;
  status: "completed" | "cancelled" | "refunded";
  notes?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPOSSession {
  _id: string;
  cashierId: any;
  locationId: any;
  shiftNumber: string;
  openedAt: Date;
  closedAt?: Date;
  openingCashPoisha: number;
  closingCashExpectedPoisha?: number;
  closingCashActualPoisha?: number;
  cashDiscrepancyPoisha?: number;
  status: "open" | "closed";
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICustomer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  district?: string;
  creditLimitPoisha: number;
  currentDuePoisha: number;
  totalPurchasedPoisha: number;
  totalPaidPoisha: number;
  status: "active" | "blocked";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerCreditTransaction {
  _id: string;
  customerId: any;
  transactionType: "due_sale" | "payment_received" | "due_adjustment" | "return_credit";
  amountPoisha: number;
  balanceBeforePoisha: number;
  balanceAfterPoisha: number;
  salesInvoiceId?: any;
  paymentMethod?: PaymentMethod;
  collectedById: any;
  receiptNumber?: string;
  notes?: string;
  createdAt: Date;
}

export interface IMoneyReceipt {
  _id: string;
  receiptNumber: string;
  customerId: any;
  customerName: string;
  customerPhone: string;
  amountPoisha: number;
  balanceBeforePoisha: number;
  balanceAfterPoisha: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  allocatedInvoices: Array<{
    invoiceId: string;
    invoiceNumber: string;
    allocatedAmountPoisha: number;
    remainingDuePoisha: number;
  }>;
  collectedById: any;
  collectedByName?: string;
  notes?: string;
  createdAt: Date;
}

