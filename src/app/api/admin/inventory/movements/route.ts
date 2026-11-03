import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { InventoryMovement } from "@/models/InventoryMovement";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("inventory.read");
    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get("variantId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let movements = [...store.inventoryMovements];
      if (variantId) {
        movements = movements.filter((m) => m.variantId === variantId);
      }
      return NextResponse.json({ success: true, movements: movements.slice(0, limit) });
    }

    const query: any = {};
    if (variantId) query.variantId = variantId;

    const movements = await InventoryMovement.find(query)
      .populate({
        path: "variantId",
        select: "nameVariant sku barcode",
      })
      .populate({
        path: "locationId",
        select: "name code",
      })
      .populate({
        path: "actorId",
        select: "displayName email",
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, movements });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "মুভমেন্ট হিস্ট্রি দেখার অনুমতি নেই" },
      { status: 403 }
    );
  }
}

