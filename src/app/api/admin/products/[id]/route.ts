import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Product } from "@/models/Product";
import { ProductVariant } from "@/models/ProductVariant";
import { InventoryBalance } from "@/models/InventoryBalance";
import { Location } from "@/models/Location";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";
import { generateSKU, generateUniqueBarcode } from "@/lib/barcode/code128";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const product = store.products.find((p) => p._id === id || p.slug === id);
      if (!product) {
        return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
      }

      const variants = store.variants
        .filter((v) => v.productId === product._id)
        .map((v) => {
          const bal = store.inventoryBalances.find((b) => b.variantId === v._id);
          return {
            ...v,
            stock: bal ? bal.currentStock : 0,
            reserved: bal ? bal.reservedStock : 0,
            available: bal ? bal.currentStock - bal.reservedStock : 0,
          };
        });

      return NextResponse.json({
        success: true,
        product: { ...product, variants },
      });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };

    const product = await Product.findOne(query)
      .populate("brandId")
      .populate("categoryId")
      .lean();

    if (!product) {
      return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
    }

    const variants = await ProductVariant.find({ productId: product._id }).lean();
    const variantsWithStock = await Promise.all(
      variants.map(async (v) => {
        const bal = await InventoryBalance.findOne({ variantId: v._id }).lean();
        return {
          ...v,
          stock: bal?.currentStock || 0,
          reserved: bal?.reservedStock || 0,
          available: Math.max(0, (bal?.currentStock || 0) - (bal?.reservedStock || 0)),
        };
      })
    );

    return NextResponse.json({
      success: true,
      product: { ...product, variants: variantsWithStock },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "পণ্য লোড করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("products.update", req);
    const { id } = await params;
    const body = await req.json();

    const {
      nameBangla,
      nameEnglish,
      brandId,
      categoryId,
      subCategoryId,
      descriptionBangla,
      specifications,
      images,
      status = "active",
      variants = [],
    } = body;

    const db = await connectToDatabase();

    // 1. Mock In-Memory Mode
    if (!db) {
      const store = getMockStore();
      const product = store.products.find((p) => p._id === id || p.slug === id);
      if (!product) {
        return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
      }

      const brand = store.brands.find((b) => b._id === brandId || b.slug === brandId) || product.brandId;
      const category = store.categories.find((c) => c._id === categoryId || c.slug === categoryId) || product.categoryId;
      const defaultLoc = store.locations[0];

      if (nameBangla) product.nameBangla = nameBangla;
      if (nameEnglish !== undefined) product.nameEnglish = nameEnglish;
      if (brand) product.brandId = brand;
      if (category) product.categoryId = category;
      if (subCategoryId !== undefined) product.subCategoryId = subCategoryId;
      if (descriptionBangla !== undefined) product.descriptionBangla = descriptionBangla;
      if (specifications !== undefined) product.specifications = specifications;
      if (images !== undefined && Array.isArray(images)) product.images = images;
      if (status) product.status = status;
      product.updatedAt = new Date();

      // Update / Sync variants in mock store
      const updatedMockVariants: any[] = [];
      for (const v of variants) {
        let existing = store.variants.find(
          (ev) => (v._id && ev._id === v._id) || (v.sku && ev.sku === v.sku)
        );

        const purchaseCostPoisha = v.purchaseCostPoisha ?? Math.round((parseFloat(v.purchaseCostBDT) || 0) * 100);
        const retailPricePoisha = v.retailPricePoisha ?? Math.round((parseFloat(v.retailPriceBDT) || 0) * 100);
        const stockQty = typeof v.stock === "number" ? v.stock : (parseInt(v.stock, 10) || 0);

        if (existing) {
          existing.nameVariant = v.nameVariant || existing.nameVariant;
          existing.size = v.size || existing.size;
          existing.color = v.color || existing.color;
          existing.purchaseCostPoisha = purchaseCostPoisha;
          existing.retailPricePoisha = retailPricePoisha;
          if (v.barcode) existing.barcode = v.barcode.trim();
          if (v.sku) existing.sku = v.sku.trim();
          existing.status = v.status || "active";
          existing.updatedAt = new Date();
          updatedMockVariants.push(existing);

          // Update stock balance
          let bal = store.inventoryBalances.find((b) => b.variantId === existing!._id);
          if (bal) {
            bal.currentStock = stockQty;
            bal.updatedAt = new Date();
          } else {
            store.inventoryBalances.push({
              _id: `mock-bal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              variantId: existing._id,
              productId: product._id,
              locationId: defaultLoc?._id || "loc-main",
              currentStock: stockQty,
              reservedStock: 0,
              lowStockAlertThreshold: 3,
              updatedAt: new Date(),
            });
          }
        } else {
          // New variant added in edit form
          const newVarId = `mock-var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const sku = v.sku || generateSKU({
            brandSlug: (brand as any)?.slug || "LUM",
            categorySlug: (category as any)?.slug || "LUG",
            color: v.color,
            size: v.size,
          });
          const barcode = v.barcode || generateUniqueBarcode();

          const newVariant = {
            _id: newVarId,
            productId: product._id,
            sku,
            barcode,
            nameVariant: v.nameVariant || "ভ্যারিয়েন্ট",
            size: v.size || "24 Inch",
            color: v.color || "কালো",
            weightKg: 2.5,
            purchaseCostPoisha,
            retailPricePoisha,
            discountPricePoisha: 0,
            status: "active" as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          store.variants.push(newVariant);
          updatedMockVariants.push(newVariant);

          store.inventoryBalances.push({
            _id: `mock-bal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            variantId: newVarId,
            productId: product._id,
            locationId: defaultLoc?._id || "loc-main",
            currentStock: stockQty,
            reservedStock: 0,
            lowStockAlertThreshold: 3,
            updatedAt: new Date(),
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "পণ্য ও ভ্যারিয়েন্ট সফলভাবে আপডেট করা হয়েছে।",
        product: {
          ...product,
          variants: updatedMockVariants,
        },
      });
    }

    // 2. Live MongoDB Atlas Mode
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };

    let product = await Product.findOne(query);
    if (!product) {
      return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
    }

    // Update product fields
    if (nameBangla) product.nameBangla = nameBangla.trim();
    if (nameEnglish !== undefined) product.nameEnglish = nameEnglish.trim();
    if (brandId && mongoose.Types.ObjectId.isValid(brandId)) product.brandId = brandId;
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) product.categoryId = categoryId;
    if (subCategoryId) product.subCategoryId = subCategoryId;
    if (descriptionBangla !== undefined) product.descriptionBangla = descriptionBangla;
    if (specifications !== undefined) product.specifications = specifications;
    if (images !== undefined && Array.isArray(images)) product.images = images;
    if (status) product.status = status;

    await product.save();

    // Default location for inventory balance
    let defaultLoc = await Location.findOne({ isDefault: true });
    if (!defaultLoc) {
      defaultLoc = await Location.findOne({ isActive: true });
    }

    // Process & Sync Variants
    const updatedVariants: any[] = [];
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        const purchaseCostPoisha = v.purchaseCostPoisha ?? Math.round((parseFloat(v.purchaseCostBDT) || 0) * 100);
        const retailPricePoisha = v.retailPricePoisha ?? Math.round((parseFloat(v.retailPriceBDT) || 0) * 100);
        const stockQty = typeof v.stock === "number" ? v.stock : (parseInt(v.stock, 10) || 0);

        let variantDoc = null;
        if (v._id && mongoose.Types.ObjectId.isValid(v._id)) {
          variantDoc = await ProductVariant.findById(v._id);
        } else if (v.sku) {
          variantDoc = await ProductVariant.findOne({ sku: v.sku.trim() });
        } else if (v.barcode) {
          variantDoc = await ProductVariant.findOne({ barcode: v.barcode.trim() });
        }

        if (variantDoc) {
          // Update existing variant
          if (v.nameVariant) variantDoc.nameVariant = v.nameVariant.trim();
          if (v.size !== undefined) variantDoc.size = v.size.trim();
          if (v.color !== undefined) variantDoc.color = v.color.trim();
          variantDoc.purchaseCostPoisha = purchaseCostPoisha;
          variantDoc.retailPricePoisha = retailPricePoisha;
          if (v.barcode) variantDoc.barcode = v.barcode.trim();
          if (v.sku) variantDoc.sku = v.sku.trim();
          if (v.status) variantDoc.status = v.status;
          await variantDoc.save();
          updatedVariants.push(variantDoc);

          // Update / Upsert inventory balance
          if (defaultLoc) {
            let bal = await InventoryBalance.findOne({
              variantId: variantDoc._id,
              locationId: defaultLoc._id,
            });
            if (bal) {
              bal.currentStock = stockQty;
              await bal.save();
            } else {
              await InventoryBalance.create({
                variantId: variantDoc._id,
                productId: product._id,
                locationId: defaultLoc._id,
                currentStock: stockQty,
                reservedStock: 0,
                lowStockAlertThreshold: 3,
              });
            }
          }
        } else {
          // Create new variant
          const sku = v.sku?.trim() || generateSKU({
            brandSlug: "LUM",
            categorySlug: "LUG",
            color: v.color,
            size: v.size,
          });
          const barcode = v.barcode?.trim() || generateUniqueBarcode();

          const newVariant = await ProductVariant.create({
            productId: product._id,
            sku,
            barcode,
            nameVariant: v.nameVariant || `${v.size || ""} ${v.color || ""}`.trim() || "ভ্যারিয়েন্ট",
            size: v.size || "24 Inch",
            color: v.color || "কালো",
            weightKg: 2.5,
            purchaseCostPoisha,
            retailPricePoisha,
            discountPricePoisha: 0,
            status: "active",
          });
          updatedVariants.push(newVariant);

          if (defaultLoc) {
            await InventoryBalance.create({
              variantId: newVariant._id,
              productId: product._id,
              locationId: defaultLoc._id,
              currentStock: stockQty,
              reservedStock: 0,
              lowStockAlertThreshold: 3,
            });
          }
        }
      }
    }

    const populatedProduct = await Product.findById(product._id)
      .populate("brandId")
      .populate("categoryId")
      .lean();

    return NextResponse.json({
      success: true,
      message: "পণ্য ও ভ্যারিয়েন্ট সফলভাবে আপডেট করা হয়েছে।",
      product: {
        ...populatedProduct,
        variants: updatedVariants,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "পণ্য আপডেট করতে সমস্যা হয়েছে" }, { status: 403 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("products.delete", req);
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get("permanent") === "true";

    const db = await connectToDatabase();

    // 1. Mock Mode
    if (!db) {
      const store = getMockStore();
      const product = store.products.find((p) => p._id === id || p.slug === id);
      if (!product) {
        return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
      }

      if (permanent) {
        store.products = store.products.filter((p) => p._id !== product._id);
        store.variants = store.variants.filter((v) => v.productId !== product._id);
        store.inventoryBalances = store.inventoryBalances.filter((b) => b.productId !== product._id);
        return NextResponse.json({ success: true, message: "পণ্য স্থায়ীভাবে মুছে ফেলা হয়েছে।" });
      } else {
        product.status = "archived";
        return NextResponse.json({ success: true, message: "পণ্য সফলভাবে আর্কাইভ করা হয়েছে।" });
      }
    }

    // 2. MongoDB Atlas Mode
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };

    const product = await Product.findOne(query);
    if (!product) {
      return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
    }

    if (permanent) {
      // Check for sales/orders integrity
      let hasSales = false;
      try {
        const { SalesInvoice } = await import("@/models/SalesInvoice");
        const saleDoc = await SalesInvoice.findOne({ "items.productId": product._id }).lean();
        if (saleDoc) hasSales = true;
      } catch {
        // ignore
      }

      if (hasSales) {
        // Safe fallback: Archive instead of breaking audit history
        await Product.updateOne({ _id: product._id }, { $set: { status: "archived" } });
        await ProductVariant.updateMany({ productId: product._id }, { $set: { status: "inactive" } });
        return NextResponse.json({
          success: true,
          message: "পণ্যটির পূর্বের বিক্রয় রেকর্ড থাকায় অডিট সুরক্ষার্থে এটিকে নিরাপদে আর্কাইভ করা হয়েছে।",
        });
      }

      // Hard delete product, variants, and inventory balances
      await ProductVariant.deleteMany({ productId: product._id });
      await InventoryBalance.deleteMany({ productId: product._id });
      await Product.deleteOne({ _id: product._id });

      return NextResponse.json({
        success: true,
        message: "পণ্য এবং এর সকল ভ্যারিয়েন্ট ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।",
      });
    }

    // Soft delete (Archive)
    await Product.updateOne({ _id: product._id }, { $set: { status: "archived" } });
    await ProductVariant.updateMany({ productId: product._id }, { $set: { status: "inactive" } });

    return NextResponse.json({
      success: true,
      message: "পণ্য সফলভাবে আর্কাইভ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "পণ্য ডিলিট করার অনুমতি নেই" }, { status: 403 });
  }
}
