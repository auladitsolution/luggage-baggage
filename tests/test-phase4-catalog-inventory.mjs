/**
 * ============================================================================
 * Phase 4: Product Catalog & Concurrency-Safe Inventory Engine Test Suite
 * ============================================================================
 */

const BASE_URL = "http://127.0.0.1:3001";

async function runTests() {
  console.log("==================================================================");
  console.log("  লুমিনা লাগেজ - ফেজ ৪ ক্যাটালগ ও কনকারেন্সি-সেফ ইনভেন্টরি টেস্ট");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Authenticate as Admin / Store Manager to test protected operations
  console.log("১. অ্যাডমিন / ইনভেন্টরি ম্যানেজারের সেশন নিশ্চিতকরণ:");
  let adminCookie = "";
  let customerCookie = "";

  try {
    // Regular customer session (no products.create permission)
    const custRes = await fetch(`${BASE_URL}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: "regular-customer-uid-101",
        email: "customer101@test.com",
        displayName: "সাধারণ ক্রেতা",
      }),
    });
    customerCookie = custRes.headers.get("set-cookie") || "";
    assert(customerCookie.includes("lumina_session"), `কাস্টমার সেশন কুকি পাওয়া গেছে`);

    // Store Owner session (has all permissions including products.create & inventory.adjust)
    const ownerRes = await fetch(`${BASE_URL}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: "owner-real-uid-001",
        email: "alamgir.owner@luminaluggage.com",
        displayName: "আলমগীর কবির (মালিক)",
      }),
    });
    adminCookie = ownerRes.headers.get("set-cookie") || "";
    assert(adminCookie.includes("lumina_session"), `মালিক / অ্যাডমিন সেশন কুকি পাওয়া গেছে`);
  } catch (e) {
    assert(false, `Authentication setup failed: ${e.message}`);
  }

  // 2. Test Authorization: Ordinary customer cannot create products
  console.log("\n২. পণ্য তৈরিতে ডিনাই-বাই-ডিফল্ট সার্ভার অনুমোদন পরীক্ষা:");
  try {
    const res = await fetch(`${BASE_URL}/api/admin/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        nameBangla: "অননুমোদিত পণ্য",
        brandId: "test",
        categoryId: "test",
      }),
    });
    assert(
      res.status === 403,
      `কাস্টমার পণ্য তৈরি করতে গেলে 403 Forbidden প্রদান করা হয়েছে (Status: ${res.status})`
    );
  } catch (e) {
    assert(false, `Authorization check failed: ${e.message}`);
  }

  // 3. Test Cloudinary Image Upload Endpoint
  console.log("\n৩. ক্লাউডিনারি ইমেজ আপলোড এপিআই পরীক্ষা (/api/upload/cloudinary):");
  let uploadedImageUrl = "";
  try {
    const res = await fetch(`${BASE_URL}/api/upload/cloudinary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      }),
    });

    const data = await res.json();
    assert(res.status === 200 && data.success, `ইমেজ আপলোড সফল হয়েছে (HTTP 200)`);
    assert(data.image && data.image.secureUrl, `ইমেজ secureUrl পাওয়া গেছে`);
    uploadedImageUrl = data.image.secureUrl;
  } catch (e) {
    assert(false, `Image upload failed: ${e.message}`);
  }

  // 4. Test Category and Brand Creation
  console.log("\n৪. ক্যাটাগরি ও ব্র্যান্ড তৈরি পরীক্ষা:");
  let testCatId = "";
  let testBrandId = "";
  try {
    const catRes = await fetch(`${BASE_URL}/api/admin/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        nameBangla: "বিজনেস ট্রাভেলার ট্রলি",
        nameEnglish: "Business Traveler Trolley",
        slug: `business-traveler-${Date.now()}`,
      }),
    });
    const catData = await catRes.json();
    assert(catRes.status === 200 && catData.category, `নতুন ক্যাটাগরি সফলভাবে তৈরি হয়েছে`);
    testCatId = catData.category._id;

    const brandRes = await fetch(`${BASE_URL}/api/admin/brands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: `Lumina Signature ${Date.now().toString().slice(-4)}`,
        slug: `lumina-signature-${Date.now()}`,
      }),
    });
    const brandData = await brandRes.json();
    assert(brandRes.status === 200 && brandData.brand, `নতুন ব্র্যান্ড সফলভাবে তৈরি হয়েছে`);
    testBrandId = brandData.brand._id;
  } catch (e) {
    assert(false, `Category/Brand creation failed: ${e.message}`);
  }

  // 5. Test Product Creation with Multiple Variants & Auto Barcodes
  console.log("\n৫. মাল্টি-ভ্যারিয়েন্ট, SKU ও বারকোডসহ পণ্য তৈরি পরীক্ষা:");
  let createdProductId = "";
  let createdVariantId = "";
  const uniqueTestBarcode = `2026${Date.now().toString().slice(-8)}`;

  try {
    const res = await fetch(`${BASE_URL}/api/admin/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        nameBangla: "লুমিনা সিগনেচার অ্যালুমিনিয়াম ফ্রেম লাগেজ",
        nameEnglish: "Lumina Signature Aluminum Frame Luggage",
        brandId: testBrandId,
        categoryId: testCatId,
        descriptionBangla: "শক্তিশালী অ্যালুমিনিয়াম কর্নার গার্ড এবং ডাবল টিএসএ লক।",
        images: [{ publicId: "test-img-1", secureUrl: uploadedImageUrl, isPrimary: true, sortOrder: 0 }],
        variants: [
          {
            nameVariant: "২৪ ইঞ্চি (মিডিয়াম) - সিলভার",
            size: "24 Inch",
            color: "সিলভার",
            purchaseCostPoisha: 500000, // ৳ 5,000
            retailPricePoisha: 750000,   // ৳ 7,500
            stock: 15, // Initial stock
            barcode: uniqueTestBarcode,
          },
          {
            nameVariant: "২৮ ইঞ্চি (লার্জ) - সিলভার",
            size: "28 Inch",
            color: "সিলভার",
            purchaseCostPoisha: 650000, // ৳ 6,500
            retailPricePoisha: 950000,   // ৳ 9,500
            stock: 2, // Low stock for alert testing!
          },
        ],
      }),
    });

    const data = await res.json();
    if (!data.success) {
      console.error("DEBUG Phase 4 product creation response:", res.status, data);
    }
    assert(res.status === 200 && data.success, `পণ্য ও ভ্যারিয়েন্ট সফলভাবে তৈরি হয়েছে (HTTP 200)`);
    assert(data.product && data.product.variants.length === 2, `২টি ভ্যারিয়েন্ট তৈরি নিশ্চিত হয়েছে`);

    createdProductId = data.product._id;
    createdVariantId = data.product.variants[0]._id;

    assert(
      data.product.variants[0].barcode === uniqueTestBarcode,
      `নির্দিষ্ট বারকোড সঠিকভাবে সংরক্ষিত হয়েছে: ${data.product.variants[0].barcode}`
    );
    assert(
      data.product.variants[1].barcode && data.product.variants[1].barcode.startsWith("2026"),
      `স্বয়ংক্রিয়ভাবে ইউনিক বারকোড জেনারেট হয়েছে: ${data.product.variants[1].barcode}`
    );
    assert(
      data.product.variants[0].sku && data.product.variants[0].sku.length > 5,
      `স্বয়ংক্রিয়ভাবে ইউনিক SKU জেনারেট হয়েছে: ${data.product.variants[0].sku}`
    );
  } catch (e) {
    assert(false, `Product creation failed: ${e.message}`);
  }

  // 6. Test Barcode Uniqueness Enforcement
  console.log("\n৬. বারকোড ইউনিকনেস এনফোর্সমেন্ট পরীক্ষা (Duplicate Barcode Rejection):");
  try {
    const res = await fetch(`${BASE_URL}/api/admin/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        nameBangla: "ডুপ্লিকেট বারকোড পরীক্ষক",
        brandId: testBrandId,
        categoryId: testCatId,
        variants: [
          {
            nameVariant: "ডুপ্লিকেট ভ্যারিয়েন্ট",
            purchaseCostPoisha: 200000,
            retailPricePoisha: 300000,
            barcode: uniqueTestBarcode, // Attempt duplicate barcode!
          },
        ],
      }),
    });

    const data = await res.json();
    assert(
      res.status === 400,
      `একই বারকোড দ্বিতীয়বার দিলে রিজেক্ট হয়েছে (Status: ${res.status})`
    );
    assert(
      data.error && data.error.includes("বারকোড"),
      `বারকোড ডুপ্লিকেট সংক্রান্ত স্পষ্ট বাংলা মেসেজ পাওয়া গেছে: "${data.error}"`
    );
  } catch (e) {
    assert(false, `Barcode uniqueness test failed: ${e.message}`);
  }

  // 7. Test Inventory Balance & Low-Stock Alerts
  console.log("\n৭. সেন্ট্রালাইজড ইনভেন্টরি স্থিতি ও লো-স্টক সতর্কতা পরীক্ষা:");
  try {
    const res = await fetch(`${BASE_URL}/api/admin/inventory`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();

    assert(res.status === 200 && Array.isArray(data.items), `ইনভেন্টরি আইটেম লোড হয়েছে`);

    const createdItem = data.items.find((i) => String(i.variantId) === String(createdVariantId));
    assert(
      createdItem && createdItem.currentStock === 15,
      `তৈরিকৃত ভ্যারিয়েন্টের প্রাথমিক স্টক ১৫ পিস পাওয়া গেছে (Current Stock: ${createdItem?.currentStock})`
    );

    // Verify low stock filter
    const lowStockRes = await fetch(`${BASE_URL}/api/admin/inventory?lowStock=true`, {
      headers: { Cookie: adminCookie },
    });
    const lowStockData = await lowStockRes.json();
    assert(
      Array.isArray(lowStockData.items) && lowStockData.items.every((i) => i.isLowStock),
      `লো-স্টক ফিল্টারে শুধুমাত্র ৩ বা তার কম স্টকের আইটেম প্রদর্শিত হয়েছে`
    );
  } catch (e) {
    assert(false, `Inventory balance test failed: ${e.message}`);
  }

  // 8. Test Concurrency-Safe Atomic Stock Adjustments
  console.log("\n৮. কনকারেন্সি-সেফ অ্যাটমিক স্টক সমন্বয় পরীক্ষা (Increment / Decrement):");
  try {
    // 8a. Add stock (+5)
    const addRes = await fetch(`${BASE_URL}/api/admin/inventory/adjust`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        variantId: createdVariantId,
        quantityChange: 5,
        reason: "গোডাউন থেকে নতুন স্টক আনা হয়েছে",
      }),
    });
    const addData = await addRes.json();
    assert(addRes.status === 200, `স্টক ৫ বৃদ্ধি করার রিকোয়েস্ট সফল (HTTP 200)`);
    assert(
      addData.balance && addData.balance.balanceBefore === 15 && addData.balance.balanceAfter === 20,
      `স্টক ব্যালেন্স ১৫ থেকে বেড়ে ২০ হয়েছে (Balance: ${addData.balance?.balanceBefore} ➔ ${addData.balance?.balanceAfter})`
    );

    // 8b. Deduct stock (-4)
    const subRes = await fetch(`${BASE_URL}/api/admin/inventory/adjust`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        variantId: createdVariantId,
        quantityChange: -4,
        reason: "একটি ক্ষতিগ্রস্ত পণ্য বাতিল",
      }),
    });
    const subData = await subRes.json();
    assert(subRes.status === 200, `স্টক ৪ হ্রাস করার রিকোয়েস্ট সফল (HTTP 200)`);
    assert(
      subData.balance && subData.balance.balanceBefore === 20 && subData.balance.balanceAfter === 16,
      `স্টক ব্যালেন্স ২০ থেকে কমে ১৬ হয়েছে (Balance: ${subData.balance?.balanceBefore} ➔ ${subData.balance?.balanceAfter})`
    );

    // 8c. Negative stock prevention: Attempt to deduct more than current balance (-999)
    const overDeductRes = await fetch(`${BASE_URL}/api/admin/inventory/adjust`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        variantId: createdVariantId,
        quantityChange: -999,
        reason: "অবৈধ স্টক কর্তন",
      }),
    });
    const overDeductData = await overDeductRes.json();
    assert(
      overDeductRes.status === 400,
      `পর্যাপ্ত স্টকের চেয়ে বেশি কাটার চেষ্টা সফলভাবে ব্লক হয়েছে (Status: ${overDeductRes.status})`
    );
    assert(
      overDeductData.error && overDeductData.error.includes("পর্যাপ্ত স্টক নেই"),
      `সতর্কতামূলক বাংলা এরর মেসেজ প্রদর্শিত হয়েছে: "${overDeductData.error}"`
    );
  } catch (e) {
    assert(false, `Stock adjustment test failed: ${e.message}`);
  }

  // 9. Test Immutable Inventory Movement Audit Ledger
  console.log("\n৯. অপরিবর্তনীয় ইনভেন্টরি মুভমেন্ট অডিট লেজার পরীক্ষা:");
  try {
    const res = await fetch(`${BASE_URL}/api/admin/inventory/movements?variantId=${createdVariantId}`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data.movements), `মুভমেন্ট অডিট লেজার পাওয়া গেছে`);
    assert(
      data.movements.length >= 3,
      `উক্ত ভ্যারিয়েন্টের সকল মুভমেন্ট (প্রাথমিক, +৫, -৪) ক্রমানুসারে সংরক্ষিত হয়েছে (মোট মুভমেন্ট: ${data.movements.length})`
    );
    const latest = data.movements[0];
    assert(
      latest.balanceBefore === 20 && latest.balanceAfter === 16 && latest.quantity === -4,
      `সর্বশেষ মুভমেন্টের সঠিক ব্যালেন্স অডিট নিশ্চিত হয়েছে (Quantity: ${latest.quantity}, ${latest.balanceBefore} ➔ ${latest.balanceAfter})`
    );
  } catch (e) {
    assert(false, `Movement ledger test failed: ${e.message}`);
  }

  console.log("\n------------------------------------------------------------------");
  console.log(`  ফেজ ৪ টেস্ট ফলাফল: মোট পাস = ${passed}, ফেল = ${failed}`);
  console.log("------------------------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

