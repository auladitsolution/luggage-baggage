import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Product } from "@/models/Product";
import { ProductVariant } from "@/models/ProductVariant";
import { InventoryBalance } from "@/models/InventoryBalance";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

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

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { slug: id };

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
    await requirePermission("products.update");
    const { id } = await params;
    const body = await req.json();

    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      const product = store.products.find((p) => p._id === id || p.slug === id);
      if (!product) {
        return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
      }

      Object.assign(product, body);
      product.updatedAt = new Date();

      return NextResponse.json({
        success: true,
        message: "পণ্য সফলভাবে আপডেট করা হয়েছে।",
        product,
      });
    }

    const product = await Product.findByIdAndUpdate(id, body, { new: true })
      .populate("brandId")
      .populate("categoryId");

    if (!product) {
      return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "পণ্য সফলভাবে আপডেট করা হয়েছে।",
      product,
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
    await requirePermission("products.delete");
    const { id } = await params;

    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      const product = store.products.find((p) => p._id === id);
      if (product) {
        product.status = "archived";
      }
      return NextResponse.json({ success: true, message: "পণ্য সফলভাবে আর্কাইভ করা হয়েছে।" });
    }

    await Product.findByIdAndUpdate(id, { status: "archived" });
    return NextResponse.json({ success: true, message: "পণ্য সফলভাবে আর্কাইভ করা হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "পণ্য ডিলিট করার অনুমতি নেই" }, { status: 403 });
  }
}

