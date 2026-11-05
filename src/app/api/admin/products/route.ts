import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Product } from "@/models/Product";
import { ProductVariant } from "@/models/ProductVariant";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { Location } from "@/models/Location";
import { InventoryBalance } from "@/models/InventoryBalance";
import { InventoryMovement } from "@/models/InventoryMovement";
import { requirePermission } from "@/lib/rbac/guards";
import { generateSKU, generateUniqueBarcode } from "@/lib/barcode/code128";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categorySlug = searchParams.get("category");
    const brandSlug = searchParams.get("brand");
    const status = searchParams.get("status");

    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      let filtered = [...store.products];

      // Default: exclude archived products unless status is explicitly requested
      if (status === "all") {
        // show all
      } else if (status) {
        filtered = filtered.filter((p) => p.status === status);
      } else {
        filtered = filtered.filter((p) => p.status !== "archived");
      }

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.nameBangla.toLowerCase().includes(s) ||
            p.nameEnglish?.toLowerCase().includes(s) ||
            (p.brandId as any)?.name?.toLowerCase().includes(s) ||
            (p.categoryId as any)?.nameBangla?.toLowerCase().includes(s)
        );
      }

      // Populate variants and stocks
      const productsWithDetails = filtered.map((prod) => {
        const variants = store.variants.filter((v) => v.productId === prod._id);
        const variantsWithStock = variants.map((v) => {
          const bal = store.inventoryBalances.find((b) => b.variantId === v._id);
          return {
            ...v,
            stock: bal ? bal.currentStock : 0,
            reserved: bal ? bal.reservedStock : 0,
            available: bal ? bal.currentStock - bal.reservedStock : 0,
            isLowStock: bal ? bal.currentStock <= bal.lowStockAlertThreshold : false,
          };
        });

        const totalStock = variantsWithStock.reduce((acc, v) => acc + v.stock, 0);

        return {
          ...prod,
          brand: prod.brandId,
          category: prod.categoryId,
          variants: variantsWithStock,
          totalStock,
        };
      });

      return NextResponse.json({ success: true, products: productsWithDetails });
    }

    const query: any = {};
    if (status === "all") {
      // show all including archived
    } else if (status) {
      query.status = status;
    } else {
      query.status = { $ne: "archived" };
    }
    if (search) {
      query.$or = [
        { nameBangla: { $regex: search, $options: "i" } },
        { nameEnglish: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query)
      .populate("brandId")
      .populate("categoryId")
      .sort({ createdAt: -1 })
      .lean();

    const productIds = products.map((p: any) => p._id);

    // Optimized batch fetch: avoid N+1 queries across variants & balances
    const allVariants = await ProductVariant.find({ productId: { $in: productIds } }).lean();
    const variantIds = allVariants.map((v: any) => v._id);
    const allBalances = await InventoryBalance.find({ variantId: { $in: variantIds } }).lean();

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
      const currentStock = balance?.currentStock || 0;
      const reservedStock = balance?.reservedStock || 0;
      const threshold = balance?.lowStockAlertThreshold || 3;

      const variantWithStock = {
        ...v,
        stock: currentStock,
        reserved: reservedStock,
        available: Math.max(0, currentStock - reservedStock),
        isLowStock: currentStock <= threshold,
      };

      const list = variantsByProductId.get(pId) || [];
      list.push(variantWithStock);
      variantsByProductId.set(pId, list);
    }

    const productsWithDetails = products.map((prod: any) => {
      const variantsWithStock = variantsByProductId.get(prod._id.toString()) || [];
      const totalStock = variantsWithStock.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);

      return {
        ...prod,
        brand: prod.brandId,
        category: prod.categoryId,
        variants: variantsWithStock,
        totalStock,
      };
    });

    return NextResponse.json({ success: true, products: productsWithDetails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "পণ্য লোড করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("products.create");
    const body = await req.json();

    const {
      nameBangla,
      nameEnglish,
      slug,
      brandId,
      categoryId,
      subCategoryId,
      descriptionBangla,
      specifications,
      images,
      hasVariants = true,
      warrantyInfo,
      variants = [],
      initialStock = 0,
      locationId,
    } = body;

    if (!nameBangla || !brandId || !categoryId) {
      return NextResponse.json({ error: "পণ্যের বাংলা নাম, ব্র্যান্ড এবং ক্যাটাগরি আবশ্যক" }, { status: 400 });
    }

    const cleanSlug = (slug || nameEnglish || nameBangla)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-") || `prod-${Date.now()}`;

    const db = await connectToDatabase();

    // Mock In-Memory Mode
    if (!db) {
      const store = getMockStore();
      const brand = store.brands.find((b) => b._id === brandId || b.slug === brandId) || store.brands[0];
      const category = store.categories.find((c) => c._id === categoryId || c.slug === categoryId) || store.categories[0];
      const defaultLoc = store.locations[0];

      // Validate unique barcodes among requested variants
      for (const v of variants) {
        const barcodeToCheck = v.barcode?.trim();
        if (barcodeToCheck && store.variants.some((existing) => existing.barcode === barcodeToCheck)) {
          return NextResponse.json(
            { error: `বারকোড '${barcodeToCheck}' ইতিমধ্যে অন্য পণ্যে ব্যবহৃত হয়েছে। বারকোড অবশ্যই ইউনিক হতে হবে।` },
            { status: 400 }
          );
        }
      }

      const newProduct: any = {
        _id: `mock-prod-${Date.now()}`,
        nameBangla,
        nameEnglish,
        slug: cleanSlug,
        brandId: brand,
        categoryId: category,
        subCategoryId: subCategoryId || null,
        descriptionBangla,
        specifications: specifications || {},
        images: images && images.length > 0 ? images : [
          {
            publicId: "default-luggage",
            secureUrl: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=800",
            isPrimary: true,
            sortOrder: 0,
          },
        ],
        hasVariants: !!hasVariants,
        warrantyInfo,
        status: "active",
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.products.unshift(newProduct);

      // Create variants
      const createdVariants: any[] = [];
      const varList = variants.length > 0 ? variants : [
        {
          nameVariant: "স্ট্যান্ডার্ড ভ্যারিয়েন্ট",
          size: "24 Inch",
          color: "কালো",
          purchaseCostPoisha: 300000,
          retailPricePoisha: 450000,
          stock: initialStock || 10,
        },
      ];

      for (const v of varList) {
        const sku = v.sku || generateSKU({
          brandSlug: brand?.slug || "LUM",
          categorySlug: category?.slug || "LUG",
          color: v.color,
          size: v.size,
        });
        const barcode = v.barcode || generateUniqueBarcode();

        const newVariant: any = {
          _id: `mock-var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: newProduct._id,
          sku,
          barcode,
          nameVariant: v.nameVariant || `${v.size || ""} ${v.color || ""}`.trim() || "ডিফল্ট",
          size: v.size,
          color: v.color,
          weightKg: v.weightKg || 0,
          purchaseCostPoisha: Number(v.purchaseCostPoisha) || 0,
          retailPricePoisha: Number(v.retailPricePoisha) || 0,
          discountPricePoisha: v.discountPricePoisha ? Number(v.discountPricePoisha) : null,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.variants.push(newVariant);
        createdVariants.push(newVariant);

        const currentStock = Number(v.stock ?? initialStock) || 0;

        const newBalance: any = {
          _id: `mock-bal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          variantId: newVariant._id,
          productId: newProduct._id,
          locationId: locationId || defaultLoc._id,
          currentStock,
          reservedStock: 0,
          lowStockAlertThreshold: 3,
          updatedAt: new Date(),
        };
        store.inventoryBalances.push(newBalance);

        if (currentStock > 0) {
          store.inventoryMovements.push({
            _id: `mock-mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            variantId: newVariant._id,
            locationId: locationId || defaultLoc._id,
            movementType: "manual_adjustment",
            quantity: currentStock,
            balanceBefore: 0,
            balanceAfter: currentStock,
            referenceType: "initial_setup",
            referenceId: newProduct._id,
            reason: "প্রাথমিক স্টক এন্ট্রি",
            actorId: session.userId,
            createdAt: new Date(),
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "পণ্য ও ভ্যারিয়েন্ট সফলভাবে তৈরি করা হয়েছে।",
        product: {
          ...newProduct,
          variants: createdVariants,
        },
      });
    }

    // Live MongoDB Atlas Mode
    const brand = await Brand.findById(brandId);
    if (!brand) return NextResponse.json({ error: "ব্র্যান্ড পাওয়া যায়নি" }, { status: 400 });

    const category = await Category.findById(categoryId);
    if (!category) return NextResponse.json({ error: "ক্যাটাগরি পাওয়া যায়নি" }, { status: 400 });

    let loc = locationId ? await Location.findById(locationId) : await Location.findOne({ isDefault: true });
    if (!loc) {
      loc = await Location.create({
        name: "প্রধান শোরুম (Main Showroom)",
        code: "LOC-MAIN",
        address: "দোকান নং ৪২, বসুন্ধরা সিটি",
        isDefault: true,
      });
    }

    // Ensure unique product slug
    let finalSlug = cleanSlug;
    const existingSlug = await Product.findOne({ slug: finalSlug });
    if (existingSlug) {
      finalSlug = `${cleanSlug}-${Date.now().toString().slice(-6)}`;
    }

    // Check Barcode Uniqueness before starting insert
    for (const v of variants) {
      if (v.barcode) {
        const existingBarcode = await ProductVariant.findOne({ barcode: v.barcode.trim() });
        if (existingBarcode) {
          return NextResponse.json(
            { error: `বারকোড '${v.barcode}' ইতিমধ্যে ডাটাবেসে অন্য পণ্যে বিদ্যমান। প্রতিটি ভ্যারিয়েন্টের বারকোড ইউনিক হতে হবে।` },
            { status: 400 }
          );
        }
      }
    }

    const product = await Product.create({
      nameBangla,
      nameEnglish,
      slug: finalSlug,
      brandId: brand._id,
      categoryId: category._id,
      subCategoryId: subCategoryId || null,
      descriptionBangla,
      specifications: specifications || {},
      images: images || [],
      hasVariants: !!hasVariants,
      warrantyInfo,
      status: "active",
    });

    const createdVariants = [];
    const varList = variants.length > 0 ? variants : [
      {
        nameVariant: "স্ট্যান্ডার্ড ভ্যারিয়েন্ট",
        size: "24 Inch",
        color: "কালো",
        purchaseCostPoisha: 300000,
        retailPricePoisha: 450000,
        stock: initialStock || 10,
      },
    ];

    for (const v of varList) {
      let sku = v.sku || generateSKU({
        brandSlug: brand.slug,
        categorySlug: category.slug,
        color: v.color,
        size: v.size,
      });

      const existingSku = await ProductVariant.findOne({ sku });
      if (existingSku) {
        sku = `${sku}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const barcode = v.barcode || generateUniqueBarcode();

      const variantDoc = await ProductVariant.create({
        productId: product._id,
        sku,
        barcode,
        nameVariant: v.nameVariant || `${v.size || ""} ${v.color || ""}`.trim() || "ডিফল্ট",
        size: v.size,
        color: v.color,
        weightKg: v.weightKg || 0,
        purchaseCostPoisha: Number(v.purchaseCostPoisha) || 0,
        retailPricePoisha: Number(v.retailPricePoisha) || 0,
        discountPricePoisha: v.discountPricePoisha ? Number(v.discountPricePoisha) : null,
      });

      createdVariants.push(variantDoc);
      const stockQty = Number(v.stock ?? initialStock) || 0;

      await InventoryBalance.create({
        variantId: variantDoc._id,
        productId: product._id,
        locationId: loc._id,
        currentStock: stockQty,
        reservedStock: 0,
        lowStockAlertThreshold: 3,
      });

      if (stockQty > 0) {
        await InventoryMovement.create({
          variantId: variantDoc._id,
          locationId: loc._id,
          movementType: "manual_adjustment",
          quantity: stockQty,
          balanceBefore: 0,
          balanceAfter: stockQty,
          referenceType: "initial_setup",
          referenceId: product._id,
          reason: "প্রাথমিক স্টক এন্ট্রি",
          actorId: session.userId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "পণ্য ও ভ্যারিয়েন্ট সফলভাবে তৈরি করা হয়েছে।",
      product: {
        ...product.toObject(),
        variants: createdVariants,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "পণ্য তৈরিতে সমস্যা হয়েছে" }, { status: 403 });
  }
}

