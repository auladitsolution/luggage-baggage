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

export async function ensureCatalogSeeded(): Promise<void> {
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

    // 4. Ensure Products & Variants exist
    for (const p of SAMPLE_PRODUCTS) {
      let product = await Product.findOne({ slug: p.slug });
      const category = categoryMap.get(p.category) || Array.from(categoryMap.values())[0];
      const brand = brandMap.get(p.brand) || Array.from(brandMap.values())[0];

      if (!product) {
        product = await Product.create({
          nameBangla: p.nameBangla,
          nameEnglish: p.nameEnglish,
          slug: p.slug,
          brandId: brand._id,
          categoryId: category._id,
          descriptionBangla: p.description,
          specifications: p.specifications || {},
          images: p.images.map((img, idx) => ({
            publicId: `sample-${p.slug}-${idx}`,
            secureUrl: img,
            altText: p.nameBangla,
            isPrimary: idx === 0,
            sortOrder: idx,
          })),
          hasVariants: true,
          status: "active",
        });
      }

      // Ensure Variants for this product
      for (const v of p.variants) {
        let variant = await ProductVariant.findOne({
          $or: [{ sku: v.sku }, { barcode: v.barcode }],
        });

        if (!variant) {
          variant = await ProductVariant.create({
            productId: product._id,
            sku: v.sku,
            barcode: v.barcode,
            nameVariant: `${v.size || ""} - ${v.color || ""}`.trim() || v.name,
            size: v.size,
            color: v.color,
            weightKg: 2.5,
            purchaseCostPoisha: Math.round((v.pricePoisha || p.basePricePoisha) * 0.65),
            retailPricePoisha: v.pricePoisha || p.basePricePoisha,
            discountPricePoisha: v.discountPricePoisha || 0,
            status: "active",
          });
        }

        // Ensure Inventory Balance
        let balance = await InventoryBalance.findOne({
          variantId: variant._id,
          locationId: defaultLocation._id,
        });

        if (!balance) {
          await InventoryBalance.create({
            variantId: variant._id,
            productId: product._id,
            locationId: defaultLocation._id,
            currentStock: Math.max(15, v.stock || 15),
            reservedStock: 0,
            lowStockAlertThreshold: 3,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error during catalog auto-seeding:", error);
  } finally {
    isSeeding = false;
  }
}

