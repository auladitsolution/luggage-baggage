import { connectToDatabase } from "@/lib/db/mongodb";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { Product } from "@/models/Product";
import { ProductVariant } from "@/models/ProductVariant";
import { Location } from "@/models/Location";
import { InventoryBalance } from "@/models/InventoryBalance";
import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS } from "@/lib/sample-data";
import { STORE_INFO } from "@/lib/config/storeInfo";

let isSeeding = false;
let isSeeded = false;

export async function ensureCatalogSeeded(force: boolean = false): Promise<void> {
  if (isSeeded && !force) return;

  const db = await connectToDatabase();
  if (!db) return; // In-memory mode uses mockStore

  if (isSeeding) return;

  try {
    isSeeding = true;

    // 1. Ensure Default Showroom Location exists
    let defaultLocation = await Location.findOne({ isDefault: true });
    if (!defaultLocation) {
      defaultLocation = await Location.create({
        name: `${STORE_INFO.name} (${STORE_INFO.shortAddress})`,
        code: "JFP-MAIN",
        address: STORE_INFO.address,
        isDefault: true,
        isActive: true,
      });
    }

    // 2. Ensure Categories exist
    const categoryMap = new Map<string, any>();
    for (const cat of SAMPLE_CATEGORIES) {
      let existingCat = await Category.findOne({ slug: cat.slug });
      if (!existingCat) {
        existingCat = await Category.create({
          nameBangla: cat.name,
          slug: cat.slug,
          isActive: true,
          sortOrder: 1,
        });
      }
      categoryMap.set(cat.slug, existingCat);
      categoryMap.set(cat.name, existingCat);
    }

    // 3. Ensure Brands exist
    const brandMap = new Map<string, any>();
    const brandNames = Array.from(new Set(SAMPLE_PRODUCTS.map((p) => p.brand)));
    for (const bName of brandNames) {
      const slug = bName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      let existingBrand = await Brand.findOne({ slug });
      if (!existingBrand) {
        existingBrand = await Brand.create({
          name: bName,
          slug,
          isActive: true,
        });
      }
      brandMap.set(bName, existingBrand);
    }

    // 4. Products & Variants:
    // In production, products are exclusively managed by the store owner/admin.
    // We do not inject fake or sample products into the live database.

    // 5. Auto-heal: Reconcile any legacy or orphaned inventory balances
    try {
      const allActiveVariants = await ProductVariant.find({}, { _id: 1 }).lean();
      const validVariantIds = new Set(allActiveVariants.map((v) => v._id.toString()));

      const allBalances = await InventoryBalance.find({}).lean();
      for (const b of allBalances) {
        if (!b.variantId || !validVariantIds.has(b.variantId.toString())) {
          if (b.productId) {
            const matchedVar = await ProductVariant.findOne({ productId: b.productId });
            if (matchedVar) {
              await InventoryBalance.updateOne({ _id: b._id }, { $set: { variantId: matchedVar._id } });
              continue;
            }
          }
          await InventoryBalance.deleteOne({ _id: b._id });
        }
      }
    } catch (e) {
      console.warn("Inventory balance reconciliation skipped:", e);
    }

    isSeeded = true;
  } catch (error) {
    console.error("Error during catalog auto-seeding:", error);
  } finally {
    isSeeding = false;
  }
}

