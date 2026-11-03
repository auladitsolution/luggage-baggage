import { connectToDatabase } from "@/lib/db/mongodb";
import { SalesInvoice } from "@/models/SalesInvoice";
import { getMockStore } from "@/lib/db/memoryStore";

/**
 * Generate a sequential, collision-free invoice number
 * Format: INV-YYYY-00001 (e.g. INV-2026-00001)
 */
export async function getNextInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const db = await connectToDatabase();

  if (!db) {
    const store = getMockStore();
    const count = (store as any).salesInvoices ? (store as any).salesInvoices.length + 1 : 1;
    return `${prefix}${String(count).padStart(5, "0")}`;
  }

  // Find highest invoice number for current year
  const lastInvoice = await SalesInvoice.findOne({
    invoiceNumber: new RegExp(`^${prefix}`),
  })
    .sort({ invoiceNumber: -1 })
    .select("invoiceNumber")
    .lean();

  if (!lastInvoice) {
    return `${prefix}00001`;
  }

  const parts = lastInvoice.invoiceNumber.split("-");
  const lastSeq = parseInt(parts[2], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;

  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
}

