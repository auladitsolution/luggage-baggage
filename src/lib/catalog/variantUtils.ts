import mongoose from "mongoose";
import { ProductVariant } from "@/models/ProductVariant";
import { InventoryBalance } from "@/models/InventoryBalance";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data";

/**
 * Resiliently resolve a ProductVariant document by:
 * 1. Clean ObjectId (stripping "var-" prefix if present)
 * 2. InventoryBalance _id (if client passed balanceId or "var-{balanceId}")
 * 3. SKU or Barcode matching
 * 4. Sample data fallback (e.g., "var-1", "var-2", etc.)
 */
export async function resolveProductVariant(variantIdOrInput: string | unknown): Promise<any> {
  if (!variantIdOrInput || typeof variantIdOrInput !== "string") {
    return null;
  }

  const rawInput = variantIdOrInput.trim();
  let cleanId = rawInput;
  if (cleanId.startsWith("var-")) {
    cleanId = cleanId.slice(4);
  }

  // 1. Check if cleanId is a valid 24-character hex MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    try {
      const variant = await ProductVariant.findById(cleanId);
      if (variant) return variant;
    } catch {
      // ignore Mongoose cast error if any
    }
  }

  // 2. Check if cleanId or rawInput is actually an InventoryBalance _id
  if (mongoose.Types.ObjectId.isValid(cleanId) || mongoose.Types.ObjectId.isValid(rawInput)) {
    const targetBalanceId = mongoose.Types.ObjectId.isValid(cleanId) ? cleanId : rawInput;
    try {
      const balance = await InventoryBalance.findById(targetBalanceId);
      if (balance) {
        if (balance.variantId) {
          const variant = await ProductVariant.findById(balance.variantId);
          if (variant) return variant;
        }
        if (balance.productId) {
          const variant = await ProductVariant.findOne({ productId: balance.productId });
          if (variant) return variant;
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Match by SKU or Barcode
  try {
    const variantBySku = await ProductVariant.findOne({
      $or: [
        { sku: rawInput },
        { barcode: rawInput },
        { sku: cleanId },
        { barcode: cleanId },
      ],
    });
    if (variantBySku) return variantBySku;
  } catch {
    // ignore
  }

  // 4. Sample data fallback (for mock/sample data items like "var-1", "var-7", etc.)
  const sampleVariant = SAMPLE_PRODUCTS.flatMap((p) => p.variants).find(
    (v) => v.id === rawInput || v.id === `var-${rawInput}` || v.id === `var-${cleanId}`
  );
  if (sampleVariant) {
    try {
      const variant = await ProductVariant.findOne({
        $or: [{ sku: sampleVariant.sku }, { barcode: sampleVariant.barcode }],
      });
      if (variant) return variant;
    } catch {
      // ignore
    }
  }

  // 5. If cleanId is an integer index (e.g., from "var-1" or "1"), lookup first available variants
  const parsedNum = parseInt(cleanId, 10);
  if (!isNaN(parsedNum) && parsedNum > 0) {
    try {
      const allVariants = await ProductVariant.find().limit(25);
      if (allVariants.length > 0) {
        const idx = Math.min(parsedNum - 1, allVariants.length - 1);
        return allVariants[idx];
      }
    } catch {
      // ignore
    }
  }

  return null;
}

