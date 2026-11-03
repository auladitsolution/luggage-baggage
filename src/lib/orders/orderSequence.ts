import { connectToDatabase } from "@/lib/db/mongodb";
import { OnlineOrder } from "@/models/OnlineOrder";
import { getMockStore } from "@/lib/db/memoryStore";

/**
 * Generate sequential online order number: ORD-YYYY-00001
 */
export async function getNextOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `ORD-${currentYear}-`;

  const db = await connectToDatabase();
  if (!db) {
    const store = getMockStore();
    const count = (store as any).onlineOrders ? (store as any).onlineOrders.length + 1 : 1;
    return `${prefix}${String(count).padStart(5, "0")}`;
  }

  const last = await OnlineOrder.findOne({
    orderNumber: new RegExp(`^${prefix}`),
  })
    .sort({ orderNumber: -1 })
    .select("orderNumber")
    .lean();

  if (!last) return `${prefix}00001`;

  const parts = last.orderNumber.split("-");
  const lastSeq = parseInt(parts[2], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
}

