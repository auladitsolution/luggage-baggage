import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Product } from "@/models/Product";
import { ProductVariant } from "@/models/ProductVariant";
import { InventoryBalance } from "@/models/InventoryBalance";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { getMockStore } from "@/lib/db/memoryStore";
import { ensureCatalogSeeded } from "@/lib/catalog/seedCatalog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const product = store.products.find(
        (p) => p.slug === slug || p._id === slug
      );

      if (!product) {
        return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
      }

      const variants = store.variants
        .filter((v) => v.productId === product._id && v.status === "active")
        .map((v) => {
          const balance = store.inventoryBalances.find((b) => b.variantId === v._id);
          const currentStock = balance ? balance.currentStock : 0;
          const reservedStock = balance ? balance.reservedStock : 0;
          const availableStock = Math.max(0, currentStock - reservedStock);
          return {
            ...v,
            currentStock,
            reservedStock,
            availableStock,
          };
        });

      const category = store.categories.find((c) => c._id === product.categoryId);
      const brand = store.brands.find((b) => b._id === product.brandId);

      return NextResponse.json({
        success: true,
        product: {
          ...product,
          variants,
          categoryName: category?.nameBangla || "লাগেজ",
          brandName: brand?.name || "ব্র্যান্ড",
        },
      });
    }

    const isObjectId = slug.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: slug } : { slug };

    let product = await Product.findOne(query)
      .populate("categoryId", "nameBangla slug")
      .populate("brandId", "name slug")
      .lean();

    if (!product) {
      // Auto-seed catalog if looking for initial/sample products like arctic-hunter
      await ensureCatalogSeeded();
      product = await Product.findOne(query)
        .populate("categoryId", "nameBangla slug")
        .populate("brandId", "name slug")
        .lean();
    }

    if (!product) {
      return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
    }

    const variants = await ProductVariant.find({
      productId: product._id,
      status: { $ne: "archived" },
    }).lean();

    const variantsWithStock = await Promise.all(
      variants.map(async (v: any) => {
        const balance = await InventoryBalance.findOne({ variantId: v._id });
        const currentStock = balance ? balance.currentStock : 0;
        const reservedStock = balance ? balance.reservedStock : 0;
        const availableStock = Math.max(0, currentStock - reservedStock);
        return {
          ...v,
          currentStock,
          reservedStock,
          availableStock,
        };
      })
    );

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        variants: variantsWithStock,
        categoryName: (product.categoryId as any)?.nameBangla || "লাগেজ",
        brandName: (product.brandId as any)?.name || "ব্র্যান্ড",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "পণ্য তথ্য লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

