import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { InventoryBalance } from "@/models/InventoryBalance";
import { ProductVariant } from "@/models/ProductVariant";
import { Product } from "@/models/Product";
import { Location } from "@/models/Location";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("inventory.read");
    const { searchParams } = new URL(req.url);
    const lowStockOnly = searchParams.get("lowStock") === "true";
    const search = searchParams.get("search") || "";
    const locationId = searchParams.get("locationId");

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let items = store.inventoryBalances.map((bal, idx) => {
        const variant = store.variants.find((v) => v._id === bal.variantId);
        const product = store.products.find((p) => p._id === bal.productId);
        const location = store.locations.find((l) => l._id === bal.locationId);

        const currentStock = bal.currentStock;
        const reservedStock = bal.reservedStock;
        const available = Math.max(0, currentStock - reservedStock);
        const isLowStock = currentStock <= bal.lowStockAlertThreshold;

        const balanceId = bal._id ? String(bal._id) : `bal-${idx}`;
        const variantId = bal.variantId ? String(bal.variantId) : (variant?._id ? String(variant._id) : `var-${balanceId}`);

        return {
          balanceId,
          variantId,
          productId: bal.productId ? String(bal.productId) : "",
          productName: product?.nameBangla || "অজানা পণ্য",
          brand: (product?.brandId as any)?.name || "",
          variantName: variant?.nameVariant || "",
          sku: variant?.sku || "",
          barcode: variant?.barcode || "",
          location: location?.name || "প্রধান শোরুম",
          locationId: bal.locationId,
          currentStock,
          reservedStock,
          available,
          lowStockAlertThreshold: bal.lowStockAlertThreshold,
          isLowStock,
          retailPricePoisha: variant?.retailPricePoisha || 0,
          purchaseCostPoisha: variant?.purchaseCostPoisha || 0,
        };
      });

      if (lowStockOnly) {
        items = items.filter((i) => i.isLowStock);
      }
      if (locationId) {
        items = items.filter((i) => i.locationId === locationId);
      }
      if (search) {
        const s = search.toLowerCase();
        items = items.filter(
          (i) =>
            i.productName.toLowerCase().includes(s) ||
            i.variantName.toLowerCase().includes(s) ||
            i.sku.toLowerCase().includes(s) ||
            i.barcode.includes(s)
        );
      }

      return NextResponse.json({
        success: true,
        items,
        summary: {
          totalSkus: items.length,
          lowStockCount: items.filter((i) => i.isLowStock).length,
          totalStockPieces: items.reduce((acc, i) => acc + i.currentStock, 0),
        },
      });
    }

    const query: any = {};
    if (locationId) query.locationId = locationId;

    const balances = await InventoryBalance.find(query)
      .populate({
        path: "variantId",
        select: "nameVariant sku barcode retailPricePoisha purchaseCostPoisha status",
      })
      .populate({
        path: "productId",
        select: "nameBangla nameEnglish brandId",
        populate: { path: "brandId", select: "name" },
      })
      .populate({ path: "locationId", select: "name code" })
      .lean();

    let items = balances.map((bal: any, idx: number) => {
      const v = bal.variantId;
      const p = bal.productId;
      const loc = bal.locationId;

      const currentStock = bal.currentStock || 0;
      const reservedStock = bal.reservedStock || 0;
      const available = Math.max(0, currentStock - reservedStock);
      const isLowStock = currentStock <= (bal.lowStockAlertThreshold || 3);

      const balanceId = bal._id ? String(bal._id) : `bal-${idx}`;
      const variantId = v?._id ? String(v._id) : (bal.variantId ? String(bal.variantId) : `var-${balanceId}`);

      return {
        balanceId,
        variantId,
        productId: p?._id ? String(p._id) : (bal.productId ? String(bal.productId) : ""),
        productName: p?.nameBangla || "অজানা পণ্য",
        brand: p?.brandId?.name || "",
        variantName: v?.nameVariant || "",
        sku: v?.sku || "",
        barcode: v?.barcode || "",
        location: loc?.name || "প্রধান শোরুম",
        locationId: loc?._id ? String(loc._id) : String(bal.locationId || ""),
        currentStock,
        reservedStock,
        available,
        lowStockAlertThreshold: bal.lowStockAlertThreshold || 3,
        isLowStock,
        retailPricePoisha: v?.retailPricePoisha || 0,
        purchaseCostPoisha: v?.purchaseCostPoisha || 0,
      };
    });

    if (lowStockOnly) {
      items = items.filter((i) => i.isLowStock);
    }
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.productName.toLowerCase().includes(s) ||
          i.variantName.toLowerCase().includes(s) ||
          i.sku.toLowerCase().includes(s) ||
          i.barcode.includes(s)
      );
    }

    return NextResponse.json({
      success: true,
      items,
      summary: {
        totalSkus: items.length,
        lowStockCount: items.filter((i) => i.isLowStock).length,
        totalStockPieces: items.reduce((acc, i) => acc + i.currentStock, 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ইনভেন্টরি লোড করার অনুমতি নেই" },
      { status: 403 }
    );
  }
}

