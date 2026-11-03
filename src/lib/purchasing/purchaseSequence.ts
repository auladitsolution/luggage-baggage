import { connectToDatabase } from "@/lib/db/mongodb";
import { PurchaseInvoice } from "@/models/PurchaseInvoice";
import { SupplierPayment } from "@/models/SupplierPayment";
import { Expense } from "@/models/Expense";
import { getMockStore } from "@/lib/db/memoryStore";

/**
 * Generate sequential purchase invoice number: PUR-YYYY-00001
 */
export async function getNextPurchaseNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `PUR-${currentYear}-`;

  const db = await connectToDatabase();
  if (!db) {
    const store = getMockStore();
    const count = (store as any).purchaseInvoices ? (store as any).purchaseInvoices.length + 1 : 1;
    return `${prefix}${String(count).padStart(5, "0")}`;
  }

  const last = await PurchaseInvoice.findOne({
    purchaseInvoiceNumber: new RegExp(`^${prefix}`),
  })
    .sort({ purchaseInvoiceNumber: -1 })
    .select("purchaseInvoiceNumber")
    .lean();

  if (!last) return `${prefix}00001`;

  const parts = last.purchaseInvoiceNumber.split("-");
  const lastSeq = parseInt(parts[2], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
}

/**
 * Generate sequential supplier payment number: SP-YYYY-00001
 */
export async function getNextSupplierPaymentNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `SP-${currentYear}-`;

  const db = await connectToDatabase();
  if (!db) {
    const store = getMockStore();
    const count = (store as any).supplierPayments ? (store as any).supplierPayments.length + 1 : 1;
    return `${prefix}${String(count).padStart(5, "0")}`;
  }

  const last = await SupplierPayment.findOne({
    paymentNumber: new RegExp(`^${prefix}`),
  })
    .sort({ paymentNumber: -1 })
    .select("paymentNumber")
    .lean();

  if (!last) return `${prefix}00001`;

  const parts = last.paymentNumber.split("-");
  const lastSeq = parseInt(parts[2], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
}

/**
 * Generate sequential expense voucher number: EXP-YYYY-00001
 */
export async function getNextExpenseVoucherNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `EXP-${currentYear}-`;

  const db = await connectToDatabase();
  if (!db) {
    const store = getMockStore();
    const count = (store as any).expenses ? (store as any).expenses.length + 1 : 1;
    return `${prefix}${String(count).padStart(5, "0")}`;
  }

  const last = await Expense.findOne({
    voucherNumber: new RegExp(`^${prefix}`),
  })
    .sort({ voucherNumber: -1 })
    .select("voucherNumber")
    .lean();

  if (!last) return `${prefix}00001`;

  const parts = last.voucherNumber.split("-");
  const lastSeq = parseInt(parts[2], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
}

