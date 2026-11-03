import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { InventoryBalance } from "@/models/InventoryBalance";
import { ProductVariant } from "@/models/ProductVariant";
import { Product } from "@/models/Product";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET() {
  try {
    await requirePermission("reports.read");
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let totalStockPieces = 0;
      let totalValuationPoisha = 0;
      let totalRetailValuePoisha = 0;

      const items = store.inventoryBalances.map((b) => {
        const v = store.variants.find((vr) => vr._id === b.variantId);
        const p = store.products.find((pr) => pr._id === b.productId);
        const cost = v?.purchaseCostPoisha || 0;
        const retail = v?.retailPricePoisha || 0;
        const valuation = cost * b.currentStock;
        const potentialRevenue = retail * b.currentStock;

        totalStockPieces += b.currentStock;
        totalValuationPoisha += valuation;
        totalRetailValuePoisha += potentialRevenue;

        return {
          variantId: b.variantId,
          productName: p?.nameBangla || "লাগেজ",
          variantName: v?.nameVariant || "ভ্যারিয়েন্ট",
          sku: v?.sku || "",
          currentStock: b.currentStock,
          reservedStock: b.reservedStock,
          availableStock: Math.max(0, b.currentStock - b.reservedStock),
          unitPurchaseCostPoisha: cost,
          unitRetailPricePoisha: retail,
          totalValuationPoisha: valuation,
          potentialRevenuePoisha: potentialRevenue,
          potentialProfitPoisha: potentialRevenue - valuation,
        };
      });

      return NextResponse.json({
        success: true,
        summary: {
          totalSkus: items.length,
          totalStockPieces,
          totalValuationPoisha,
          totalRetailValuePoisha,
          potentialGrossProfitPoisha: totalRetailValuePoisha - totalValuationPoisha,
        },
        items,
      });
    }

    const balances = await InventoryBalance.find()
      .populate("variantId")
      .populate("productId")
      .lean();

    let totalStockPieces = 0;
    let totalValuationPoisha = 0;
    let totalRetailValuePoisha = 0;

    const items = balances.map((b: any) => {
      const v = b.variantId;
      const p = b.productId;
      const cost = v?.purchaseCostPoisha || 0;
      const retail = v?.retailPricePoisha || 0;
      const valuation = cost * b.currentStock;
      const potentialRevenue = retail * b.currentStock;

      totalStockPieces += b.currentStock;
      totalValuationPoisha += valuation;
      totalRetailValuePoisha += potentialRevenue;

      return {
        variantId: b.variantId?._id || b.variantId,
        productName: p?.nameBangla || "লাগেজ",
        variantName: v?.nameVariant || "ভ্যারিয়েন্ট",
        sku: v?.sku || "",
        currentStock: b.currentStock,
        reservedStock: b.reservedStock,
        availableStock: Math.max(0, b.currentStock - b.reservedStock),
        unitPurchaseCostPoisha: cost,
        unitRetailPricePoisha: retail,
        totalValuationPoisha: valuation,
        potentialRevenuePoisha: potentialRevenue,
        potentialProfitPoisha: potentialRevenue - valuation,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalSkus: items.length,
        totalStockPieces,
        totalValuationPoisha,
        totalRetailValuePoisha,
        potentialGrossProfitPoisha: totalRetailValuePoisha - totalValuationPoisha,
      },
      items,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ইনভেন্টরি ভ্যালুয়েশন রিপোর্ট লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

