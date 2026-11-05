import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Product } from "@/models/Product";
import { ProductVariant } from "@/models/ProductVariant";
import { InventoryBalance } from "@/models/InventoryBalance";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { getMockStore } from "@/lib/db/memoryStore";
import { ensureCatalogSeeded } from "@/lib/catalog/seedCatalog";
import { normalizeCategorySlug } from "@/lib/catalog/categoryUtils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const size = searchParams.get("size");
    const sort = searchParams.get("sort") || "featured";
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
    const inStockOnly = searchParams.get("inStockOnly") === "true" || searchParams.get("inStock") === "true";

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let list = store.products.filter((p) => p.status === "active");

      // Category filter
      if (category && category !== "all") {
        const norm = normalizeCategorySlug(category);
        const catObj = store.categories.find(
          (c) =>
            c.slug === category ||
            c.slug === norm ||
            c._id === category ||
            normalizeCategorySlug(c.slug) === norm
        );
        if (catObj) {
          list = list.filter((p) => p.categoryId === catObj._id);
        } else {
          // If no matching category found in mock store, filter by name or return empty
          list = list.filter((p) => (p as any).categoryName?.includes(category));
        }
      }

      // Brand filter
      if (brand && brand !== "all") {
        const brandObj = store.brands.find((b) => b.slug === brand || b._id === brand);
        if (brandObj) {
          list = list.filter((p) => p.brandId === brandObj._id);
        }
      }

      // Search filter
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          (p) =>
            p.nameBangla.toLowerCase().includes(s) ||
            (p.nameEnglish && p.nameEnglish.toLowerCase().includes(s))
        );
      }

      // Populate variants and stock
      const populated = list.map((p) => {
        const productVariants = store.variants
          .filter((v) => v.productId === p._id && v.status === "active")
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

        const categoryObj = store.categories.find((c) => c._id === p.categoryId);
        const brandObj = store.brands.find((b) => b._id === p.brandId);

        // Calculate min and max price
        const prices = productVariants.map((v) => v.retailPricePoisha);
        const minPricePoisha = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPricePoisha = prices.length > 0 ? Math.max(...prices) : 0;
        const totalAvailableStock = productVariants.reduce((sum, v) => sum + v.availableStock, 0);

        return {
          ...p,
          variants: productVariants,
          categoryName: categoryObj?.nameBangla || "লাগেজ",
          categorySlug: categoryObj?.slug || "luggage",
          brandName: brandObj?.name || "প্রেসিডেন্ট",
          minPricePoisha,
          maxPricePoisha,
          totalAvailableStock,
          inStock: totalAvailableStock > 0,
        };
      });

      // Filter by size if specified
      let finalProducts = populated;
      if (size && size !== "all") {
        finalProducts = finalProducts.filter((p) =>
          p.variants.some((v) => v.size?.includes(size) || v.nameVariant?.includes(size))
        );
      }

      // Filter by price range
      if (minPrice !== null && !isNaN(minPrice)) {
        finalProducts = finalProducts.filter((p) => p.maxPricePoisha >= minPrice * 100);
      }
      if (maxPrice !== null && !isNaN(maxPrice)) {
        finalProducts = finalProducts.filter((p) => p.minPricePoisha <= maxPrice * 100);
      }

      // Filter by in-stock
      if (inStockOnly) {
        finalProducts = finalProducts.filter((p) => p.inStock);
      }

      // Sort
      if (sort === "price-low") {
        finalProducts.sort((a, b) => a.minPricePoisha - b.minPricePoisha);
      } else if (sort === "price-high") {
        finalProducts.sort((a, b) => b.minPricePoisha - a.minPricePoisha);
      } else if (sort === "newest") {
        finalProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      const categoriesWithCounts = store.categories.map((c) => ({
        ...c,
        productCount: populated.filter((p) => p.categoryId === c._id).length,
      }));

      const brandsWithCounts = store.brands.map((b) => ({
        ...b,
        productCount: populated.filter((p) => p.brandId === b._id).length,
      }));

      return NextResponse.json({
        success: true,
        products: finalProducts,
        total: finalProducts.length,
        categories: categoriesWithCounts,
        brands: brandsWithCounts,
      });
    }

    // MongoDB Mode
    await ensureCatalogSeeded();

    const query: any = { status: "active" };

    if (category && category !== "all") {
      const norm = normalizeCategorySlug(category);
      const cat = await Category.findOne({
        $or: [
          { slug: category },
          { slug: norm },
          { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null },
          { slug: { $regex: category.replace(/-/g, ".*"), $options: "i" } },
        ],
      });
      if (cat) {
        query.categoryId = cat._id;
      } else {
        // If no category document matches, ensure empty list rather than unconstrained
        query.categoryId = null;
      }
    }

    if (brand && brand !== "all") {
      const b = await Brand.findOne({ $or: [{ slug: brand }, { _id: brand.match(/^[0-9a-fA-F]{24}$/) ? brand : null }] });
      if (b) query.brandId = b._id;
    }

    if (search) {
      query.$or = [
        { nameBangla: { $regex: search, $options: "i" } },
        { nameEnglish: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query)
      .populate("categoryId", "nameBangla slug")
      .populate("brandId", "name slug")
      .lean();

    const productIds = products.map((p: any) => p._id);

    // Optimized batch fetch: fetch all variants and inventory in single queries instead of N+1
    const allVariants = await ProductVariant.find({
      productId: { $in: productIds },
      status: { $ne: "archived" },
    }).lean();

    const variantIds = allVariants.map((v: any) => v._id);
    const allBalances = await InventoryBalance.find({
      variantId: { $in: variantIds },
    }).lean();

    const balanceMap = new Map<string, any>();
    for (const b of allBalances) {
      if (b.variantId) {
        balanceMap.set(b.variantId.toString(), b);
      }
    }

    const variantsByProductId = new Map<string, any[]>();
    for (const v of allVariants) {
      const pId = v.productId?.toString();
      if (!pId) continue;
      const balance = balanceMap.get(v._id.toString());
      const currentStock = balance ? balance.currentStock : 0;
      const reservedStock = balance ? balance.reservedStock : 0;
      const availableStock = Math.max(0, currentStock - reservedStock);

      const variantWithStock = {
        ...v,
        currentStock,
        reservedStock,
        availableStock,
      };

      const list = variantsByProductId.get(pId) || [];
      list.push(variantWithStock);
      variantsByProductId.set(pId, list);
    }

    const populated = products.map((p: any) => {
      const variantsWithStock = variantsByProductId.get(p._id.toString()) || [];
      const prices = variantsWithStock.map((v: any) => v.retailPricePoisha);
      const minPricePoisha = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPricePoisha = prices.length > 0 ? Math.max(...prices) : 0;
      const totalAvailableStock = variantsWithStock.reduce((sum: number, v: any) => sum + v.availableStock, 0);

      return {
        ...p,
        variants: variantsWithStock,
        categoryName: p.categoryId?.nameBangla || "লাগেজ",
        categorySlug: p.categoryId?.slug || "luggage",
        brandName: p.brandId?.name || "ব্র্যান্ড",
        minPricePoisha,
        maxPricePoisha,
        totalAvailableStock,
        inStock: totalAvailableStock > 0,
      };
    });

    let finalProducts = populated;
    if (size && size !== "all") {
      finalProducts = finalProducts.filter((p) =>
        p.variants.some((v: any) => v.size?.includes(size) || v.nameVariant?.includes(size))
      );
    }

    // Filter by price range
    if (minPrice !== null && !isNaN(minPrice)) {
      finalProducts = finalProducts.filter((p) => p.maxPricePoisha >= minPrice * 100);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      finalProducts = finalProducts.filter((p) => p.minPricePoisha <= maxPrice * 100);
    }

    // Filter by in-stock
    if (inStockOnly) {
      finalProducts = finalProducts.filter((p) => p.inStock);
    }

    if (sort === "price-low") {
      finalProducts.sort((a, b) => a.minPricePoisha - b.minPricePoisha);
    } else if (sort === "price-high") {
      finalProducts.sort((a, b) => b.minPricePoisha - a.minPricePoisha);
    } else if (sort === "newest") {
      finalProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Exclude test artifacts from storefront
    finalProducts = finalProducts.filter(
      (p) => !p.slug.match(/-\d{6,}$/) && p.nameBangla !== "ডুপ্লিকেট বারকোড পরীক্ষক" && p.slug !== "-"
    );

    const [categories, brands] = await Promise.all([
      Category.find({ isActive: true }).sort({ sortOrder: 1, nameBangla: 1 }).lean(),
      Brand.find({ isActive: true }).sort({ name: 1 }).lean(),
    ]);

    // Deduplicate categories and filter out temporary test categories
    const uniqueCategoryMap = new Map<string, any>();
    for (const c of categories) {
      const normalized = (c.nameBangla || (c as any).name || "").trim();
      if (!c.slug.match(/-\d{10,}$/) && !uniqueCategoryMap.has(normalized)) {
        uniqueCategoryMap.set(normalized, c);
      }
    }
    const filteredCategories = Array.from(uniqueCategoryMap.values());

    const categoriesWithCounts = filteredCategories.map((c: any) => ({
      ...c,
      productCount: finalProducts.filter(
        (p: any) =>
          p.categoryId?._id?.toString() === c._id.toString() ||
          p.categoryId?.toString() === c._id.toString() ||
          p.categorySlug === c.slug ||
          p.categoryName === c.nameBangla
      ).length,
    }));

    // Deduplicate brands and filter out temporary test brands
    const uniqueBrandMap = new Map<string, any>();
    for (const b of brands) {
      const normalized = (b.name || "").trim();
      if (!b.slug.match(/-\d{10,}$/) && !b.name.match(/\d{4}$/) && !uniqueBrandMap.has(normalized)) {
        uniqueBrandMap.set(normalized, b);
      }
    }
    const filteredBrands = Array.from(uniqueBrandMap.values());

    const brandsWithCounts = filteredBrands.map((b: any) => ({
      ...b,
      productCount: finalProducts.filter(
        (p: any) =>
          p.brandId?._id?.toString() === b._id.toString() ||
          p.brandId?.toString() === b._id.toString() ||
          p.brandName?.toLowerCase() === b.name?.toLowerCase()
      ).length,
    }));

    return NextResponse.json({
      success: true,
      products: finalProducts,
      total: finalProducts.length,
      categories: categoriesWithCounts,
      brands: brandsWithCounts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "পণ্য লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

