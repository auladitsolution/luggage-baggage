import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { OnlineOrder } from "@/models/OnlineOrder";
import { ProductVariant } from "@/models/ProductVariant";
import { InventoryBalance } from "@/models/InventoryBalance";
import { Customer } from "@/models/Customer";
import { getNextOrderNumber } from "@/lib/orders/orderSequence";
import { getMockStore } from "@/lib/db/memoryStore";
import { OnlinePaymentStatus } from "@/types/orders";
import { ensureCatalogSeeded } from "@/lib/catalog/seedCatalog";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "মোবাইল নম্বর আবশ্যক" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const orders = (store.onlineOrders || []).filter(
        (o) => o.customerPhone === cleanPhone
      );
      return NextResponse.json({ success: true, orders });
    }

    const orders = await OnlineOrder.find({ customerPhone: cleanPhone })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "অর্ডার তালিকা লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      deliveryZone = "inside_dhaka",
      items,
      paymentMethod = "cod",
      manualPaymentDetails,
      customerNotes,
    } = body;

    // 1. Basic validation
    if (!customerName || !customerPhone || !shippingAddress?.address || !shippingAddress?.district) {
      return NextResponse.json(
        { error: "গ্রাহকের নাম, মোবাইল নম্বর এবং সম্পূর্ণ ডেলিভারি ঠিকানা আবশ্যক" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "কার্টে অন্তত একটি পণ্য থাকতে হবে" },
        { status: 400 }
      );
    }

    // 2. Manual Payment validation
    if (paymentMethod !== "cod") {
      if (!manualPaymentDetails?.transactionId) {
        return NextResponse.json(
          { error: "ম্যানুয়াল পেমেন্টের ক্ষেত্রে ট্রানজেকশন আইডি (TrxID) আবশ্যক" },
          { status: 400 }
        );
      }
    }

    const deliveryFeePoisha = deliveryZone === "outside_dhaka" ? 15000 : 8000; // ৳১৫০ or ৳৮০
    const orderNumber = await getNextOrderNumber();
    const db = await connectToDatabase();

    // 3. Mock In-Memory Mode
    if (!db) {
      const store = getMockStore();
      let subTotalPoisha = 0;
      const orderItems = [];

      // Check stock and calculate subtotal
      for (const item of items) {
        const variant = store.variants.find((v) => v._id === item.variantId);
        if (!variant) {
          return NextResponse.json(
            { error: `পণ্য ভ্যারিয়েন্ট পাওয়া যায়নি (${item.variantId})` },
            { status: 404 }
          );
        }

        const qty = parseInt(item.quantity, 10);
        if (qty <= 0) {
          return NextResponse.json({ error: "পণ্যের পরিমাণ সঠিক নয়" }, { status: 400 });
        }

        const balance = store.inventoryBalances.find((b) => b.variantId === variant._id);
        const currentStock = balance ? balance.currentStock : 0;
        const reservedStock = balance ? balance.reservedStock : 0;
        const availableStock = Math.max(0, currentStock - reservedStock);

        // Concurrency-Safe Stock Reservation Check
        if (qty > availableStock) {
          return NextResponse.json(
            {
              error: `দুঃখিত, '${variant.nameVariant}' পর্যাপ্ত স্টকে নেই। বর্তমান স্টক: ${availableStock} পিস।`,
            },
            { status: 400 }
          );
        }

        // Reserve stock
        if (balance) {
          balance.reservedStock += qty;
          balance.updatedAt = new Date();
        }

        const unitPrice = variant.discountPricePoisha || variant.retailPricePoisha;
        const lineTotal = unitPrice * qty;
        subTotalPoisha += lineTotal;

        orderItems.push({
          variantId: variant._id,
          productId: variant.productId,
          productName: (item.productName || "লাগেজ") as string,
          variantName: variant.nameVariant,
          sku: variant.sku,
          barcode: variant.barcode,
          quantity: qty,
          unitPricePoisha: unitPrice,
          totalAmountPoisha: lineTotal,
          image: item.image,
        });
      }

      const grandTotalPoisha = subTotalPoisha + deliveryFeePoisha;

      // Link or create customer
      let customer = store.customers.find((c) => c.phone === customerPhone.trim());
      if (!customer) {
        customer = {
          _id: `mock-cust-${Date.now()}`,
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail?.trim(),
          address: shippingAddress.address,
          district: shippingAddress.district,
          creditLimitPoisha: 0,
          currentDuePoisha: 0,
          totalPurchasedPoisha: 0,
          totalPaidPoisha: 0,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.customers.push(customer);
      }

      const newOrder = {
        _id: `mock-ord-${Date.now()}`,
        orderNumber,
        customerId: customer._id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail?.trim(),
        shippingAddress: {
          address: shippingAddress.address.trim(),
          district: shippingAddress.district.trim(),
          thanaOrArea: shippingAddress.thanaOrArea?.trim(),
        },
        deliveryZone,
        items: orderItems,
        subTotalPoisha,
        deliveryFeePoisha,
        couponDiscountPoisha: 0,
        grandTotalPoisha,
        paymentMethod,
        paymentStatus: (paymentMethod === "cod" ? "pending" : "pending_verification") as OnlinePaymentStatus,
        manualPaymentDetails:
          paymentMethod !== "cod"
            ? {
                senderNumber: manualPaymentDetails?.senderNumber?.trim(),
                transactionId: manualPaymentDetails?.transactionId?.trim(),
                bankName: manualPaymentDetails?.bankName?.trim(),
              }
            : undefined,
        orderStatus: "pending" as const,
        customerNotes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.onlineOrders.unshift(newOrder);

      return NextResponse.json({
        success: true,
        message: "অর্ডার সফলভাবে গৃহীত হয়েছে",
        order: newOrder,
      });
    }

    // 4. Live MongoDB Atlas Mode
    let subTotalPoisha = 0;
    const orderItems = [];

    for (const item of items) {
      let variant: any = null;
      const isObjectId = typeof item.variantId === "string" && item.variantId.match(/^[0-9a-fA-F]{24}$/);

      if (isObjectId) {
        variant = await ProductVariant.findById(item.variantId);
      }

      // If not found by ObjectId or if variantId is a legacy/sample string (e.g. "var-7")
      if (!variant) {
        await ensureCatalogSeeded();

        // 1. Check if variantId maps to a sample-data variant SKU or barcode
        const sampleVariant = SAMPLE_PRODUCTS.flatMap((p) => p.variants).find(
          (v) => v.id === item.variantId
        );
        if (sampleVariant) {
          variant = await ProductVariant.findOne({
            $or: [{ sku: sampleVariant.sku }, { barcode: sampleVariant.barcode }],
          });
        }
      }

      // 2. Direct SKU or barcode fallback match
      if (!variant && typeof item.variantId === "string") {
        variant = await ProductVariant.findOne({
          $or: [{ sku: item.variantId }, { barcode: item.variantId }],
        });
      }

      if (!variant) {
        return NextResponse.json(
          { error: `পণ্য ভ্যারিয়েন্ট পাওয়া যায়নি (${item.variantId})` },
          { status: 404 }
        );
      }

      const qty = parseInt(item.quantity, 10);
      if (qty <= 0) {
        return NextResponse.json({ error: "পণ্যের পরিমাণ সঠিক নয়" }, { status: 400 });
      }

      const balance = await InventoryBalance.findOne({ variantId: variant._id });
      const currentStock = balance ? balance.currentStock : 0;
      const reservedStock = balance ? balance.reservedStock : 0;
      const availableStock = Math.max(0, currentStock - reservedStock);

      if (qty > availableStock) {
        return NextResponse.json(
          {
            error: `দুঃখিত, '${variant.nameVariant}' পর্যাপ্ত স্টকে নেই। বর্তমান স্টক: ${availableStock} পিস।`,
          },
          { status: 400 }
        );
      }

      // Reserve stock atomically
      if (balance) {
        balance.reservedStock += qty;
        await balance.save();
      }

      const unitPrice = variant.discountPricePoisha || variant.retailPricePoisha;
      const lineTotal = unitPrice * qty;
      subTotalPoisha += lineTotal;

      orderItems.push({
        variantId: variant._id,
        productId: variant.productId,
        productName: item.productName || "লাগেজ",
        variantName: variant.nameVariant,
        sku: variant.sku,
        barcode: variant.barcode,
        quantity: qty,
        unitPricePoisha: unitPrice,
        totalAmountPoisha: lineTotal,
        image: item.image,
      });
    }

    const grandTotalPoisha = subTotalPoisha + deliveryFeePoisha;

    let customer = await Customer.findOne({ phone: customerPhone.trim() });
    if (!customer) {
      customer = await Customer.create({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail?.trim(),
        address: shippingAddress.address,
        district: shippingAddress.district,
        creditLimitPoisha: 0,
      });
    }

    const order = await OnlineOrder.create({
      orderNumber,
      customerId: customer._id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim(),
      shippingAddress: {
        address: shippingAddress.address.trim(),
        district: shippingAddress.district.trim(),
        thanaOrArea: shippingAddress.thanaOrArea?.trim(),
      },
      deliveryZone,
      items: orderItems,
      subTotalPoisha,
      deliveryFeePoisha,
      couponDiscountPoisha: 0,
      grandTotalPoisha,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending_verification",
      manualPaymentDetails:
        paymentMethod !== "cod"
          ? {
              senderNumber: manualPaymentDetails?.senderNumber?.trim(),
              transactionId: manualPaymentDetails?.transactionId?.trim(),
              bankName: manualPaymentDetails?.bankName?.trim(),
            }
          : undefined,
      orderStatus: "pending",
      customerNotes,
    });

    return NextResponse.json({
      success: true,
      message: "অর্ডার সফলভাবে গৃহীত হয়েছে",
      order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

