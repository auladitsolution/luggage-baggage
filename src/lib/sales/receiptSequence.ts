import { connectToDatabase } from "@/lib/db/mongodb";
import { MoneyReceipt } from "@/models/MoneyReceipt";
import { getMockStore } from "@/lib/db/memoryStore";

/**
 * Generate sequential money receipt number
 * Format: MR-YYYY-00001 (e.g. MR-2026-00001)
 */
export async function getNextReceiptNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `MR-${currentYear}-`;

  const db = await connectToDatabase();

  if (!db) {
    const store = getMockStore();
    const count = (store as any).moneyReceipts ? (store as any).moneyReceipts.length + 1 : 1;
    return `${prefix}${String(count).padStart(5, "0")}`;
  }

  const lastReceipt = await MoneyReceipt.findOne({
    receiptNumber: new RegExp(`^${prefix}`),
  })
    .sort({ receiptNumber: -1 })
    .select("receiptNumber")
    .lean();

  if (!lastReceipt) {
    return `${prefix}00001`;
  }

  const parts = lastReceipt.receiptNumber.split("-");
  const lastSeq = parseInt(parts[2], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;

  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
}

