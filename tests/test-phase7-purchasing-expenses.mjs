/**
 * ============================================================================
 * Phase 7: Suppliers, Purchasing, Goods Receipt & Expenses Test Suite
 * ============================================================================
 */

const BASE_URL = "http://127.0.0.1:3001";

async function runTests() {
  console.log("==================================================================");
  console.log("  লুমিনা লাগেজ - ফেজ ৭ সরবরাহকারী, ক্রয় ও দোকান খরচ টেস্ট");
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

  // 1. Authenticate as Store Admin / Owner
  console.log("১. অ্যাডমিন সেশন ভেরিফিকেশন:");
  let adminCookie = "";
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: "owner-real-uid-001",
        email: "alamgir.owner@luminaluggage.com",
        displayName: "আলমগীর কবির (মালিক)",
      }),
    });
    adminCookie = res.headers.get("set-cookie") || "";
    assert(adminCookie.includes("lumina_session"), `অ্যাডমিন সেশন নিশ্চিত হয়েছে`);
  } catch (e) {
    assert(false, `Authentication failed: ${e.message}`);
  }

  // 2. Supplier Registration & Duplicate Check
  console.log("\n২. নতুন সরবরাহকারী নিবন্ধন ও মোবাইল নম্বর ইউনিকনেস যাচাই:");
  const testPhone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
  let testSupplier = null;
  try {
    const createRes = await fetch(`${BASE_URL}/api/admin/suppliers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: "পপুলার ব্যাগ অ্যান্ড ট্রাভেল এক্সেসরিজ",
        contactPerson: "মোঃ মোর্শেদ আলম",
        phone: testPhone,
        email: "popular.bags@example.com",
        address: "দোকান ১৮, চকবাজার পাইকারি মার্কেট, ঢাকা",
        openingBalancePoisha: 1000000, // প্রারম্ভিক দেনা ৳১০,০০০
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 200 && createData.success, `সাপ্লায়ার নিবন্ধিত হয়েছে: ${createData.supplier?.name}`);
    testSupplier = createData.supplier;

    // Test duplicate phone prevention
    const dupRes = await fetch(`${BASE_URL}/api/admin/suppliers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: "ডুপ্লিকেট সাপ্লায়ার",
        phone: testPhone,
      }),
    });
    assert(dupRes.status === 400, `ডুপ্লিকেট মোবাইল নম্বরে সাপ্লায়ার নিবন্ধন রোধ করা হয়েছে (HTTP 400)`);
  } catch (e) {
    assert(false, `Supplier creation failed: ${e.message}`);
  }

  // 3. Verify Supplier in List API
  console.log("\n৩. সরবরাহকারী তালিকা ও ব্যালেন্স হিসাব যাচাই:");
  try {
    const supListRes = await fetch(`${BASE_URL}/api/admin/suppliers`, {
      headers: { Cookie: adminCookie },
    });
    const supListData = await supListRes.json();
    assert(supListRes.status === 200, `সাপ্লায়ার তালিকা সফলভাবে লোড হয়েছে`);

    const found = supListData.suppliers.find((s) => s._id === testSupplier._id);
    assert(found !== undefined, `তালিকায় নতুন সাপ্লায়ার উপস্থিত রয়েছে`);
    assert(found.currentBalancePoisha === 1000000, `প্রারম্ভিক বকেয়া পাওনা ৳১০,০০০ সঠিক রয়েছে`);
  } catch (e) {
    assert(false, `Supplier list verification failed: ${e.message}`);
  }

  // 4. Goods Receipt & Purchasing (Atomic Stock Increase & WAC Recalculation)
  console.log("\n৪. ক্রয় চালান এন্ট্রি, মাল রিসিভ ও স্বয়ংক্রিয় স্টক/WAC আপডেট (Scenario D):");
  let targetVariant = null;
  let initialStock = 0;
  let initialWac = 0;
  let purchaseInvoice = null;

  try {
    // Fetch variant to test
    const invRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
      headers: { Cookie: adminCookie },
    });
    const invData = await invRes.json();
    if (!invData.items || invData.items.length === 0) {
      const prodRes = await fetch(`${BASE_URL}/api/products`);
      const prodData = await prodRes.json();
      if (prodData.products && prodData.products.length > 0) {
        const p = prodData.products[0];
        const v = p.variants[0];
        targetVariant = {
          variantId: v._id || v.id,
          productName: p.nameBangla,
          variantName: v.nameVariant,
          currentStock: v.currentStock || 0,
          purchaseCostPoisha: v.purchaseCostPoisha || 300000,
        };
      }
    } else {
      targetVariant = invData.items[0];
    }
    initialStock = targetVariant.currentStock;
    initialWac = targetVariant.purchaseCostPoisha || 300000;
    console.log(`     -> টেস্ট ভ্যারিয়েন্ট: ${targetVariant.productName} (${targetVariant.variantName})`);
    console.log(`     -> পূর্বের স্টক: ${initialStock} পিস, পূর্বের গড় ক্রয়মূল্য (WAC): ৳${initialWac / 100}`);

    const qtyReceived = 10;
    const unitCostPoisha = 400000; // ৳৪,০০০ একক ক্রয়মূল্য
    const totalCost = qtyReceived * unitCostPoisha; // ৳৪০,০০০
    const paidAmount = 1000000; // অগ্রিম পরিশোধ ৳১০,০০০
    const dueAmount = totalCost - paidAmount; // বকেয়া ৳৩০,০০০

    const purRes = await fetch(`${BASE_URL}/api/admin/purchases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        supplierId: testSupplier._id,
        supplierInvoiceRef: "MEMO-CHOK-8841",
        items: [
          {
            variantId: targetVariant.variantId,
            productName: targetVariant.productName,
            quantityReceived: qtyReceived,
            unitCostPoisha: unitCostPoisha,
          },
        ],
        discountPoisha: 0,
        paidAmountPoisha: paidAmount,
        paymentMethod: "bank",
        notes: "চকবাজার থেকে ১০ পিস লাগেজ ইনওয়ার্ড রিসিভ",
      }),
    });

    const purData = await purRes.json();
    if (!purData.success) {
      console.error("DEBUG purData failed:", purRes.status, purData);
    }
    assert(purRes.status === 200 && purData.success, `ক্রয় চালান সফলভাবে তৈরি ও সংরক্ষিত হয়েছে`);
    purchaseInvoice = purData.invoice;
    assert(
      purchaseInvoice.purchaseInvoiceNumber && purchaseInvoice.purchaseInvoiceNumber.startsWith("PUR-"),
      `চালান নম্বর জেনারেট হয়েছে: ${purchaseInvoice.purchaseInvoiceNumber}`
    );

    // Verify Stock Increase
    const updatedInvRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
      headers: { Cookie: adminCookie },
    });
    const updatedInvData = await updatedInvRes.json();
    const updatedVariant = updatedInvData.items.find((i) => i.variantId === targetVariant.variantId);

    const expectedNewStock = initialStock + qtyReceived;
    assert(
      updatedVariant.currentStock === expectedNewStock,
      `স্টক নিখুঁতভাবে ১০ পিস বেড়েছে (${initialStock} -> ${updatedVariant.currentStock})`
    );

    // Verify Weighted Average Cost (WAC) formula
    const expectedWac = Math.round(
      (initialStock * initialWac + qtyReceived * unitCostPoisha) / expectedNewStock
    );
    assert(
      updatedVariant.purchaseCostPoisha === expectedWac,
      `ওয়েটেড এভারেজ কস্ট (WAC) সূত্র অনুযায়ী আপডেট হয়েছে: ৳${updatedVariant.purchaseCostPoisha / 100} (প্রত্যাশিত ৳${expectedWac / 100})`
    );

    // Verify Supplier Balance Updated
    const supCheckRes = await fetch(`${BASE_URL}/api/admin/suppliers/${testSupplier._id}`, {
      headers: { Cookie: adminCookie },
    });
    const supCheckData = await supCheckRes.json();
    const expectedSupBalance = 1000000 + dueAmount; // 10,000 + 30,000 = 40,000 BDT
    assert(
      supCheckData.supplier.currentBalancePoisha === expectedSupBalance,
      `সাপ্লায়ারের মোট পাওনা সঠিকভাবে সমন্বয় হয়েছে: ৳${supCheckData.supplier.currentBalancePoisha / 100} (প্রত্যাশিত ৳৪০,০০০)`
    );

    // Verify Inventory Movement Audit Record
    const movRes = await fetch(`${BASE_URL}/api/admin/inventory/movements?variantId=${targetVariant.variantId}`, {
      headers: { Cookie: adminCookie },
    });
    const movData = await movRes.json();
    assert(movRes.status === 200 && Array.isArray(movData.movements), `ইনভেন্টরি মুভমেন্ট হিস্ট্রি লোড হয়েছে`);
    const latestMov = movData.movements[0];
    assert(
      latestMov && latestMov.movementType === "purchase_receipt" && latestMov.quantity === 10,
      `মাল গ্রহণের অডিট ট্রেইল রেকর্ড নিশ্চিত হয়েছে (Type: purchase_receipt, Qty: +10)`
    );
  } catch (e) {
    assert(false, `Goods receipt test failed: ${e.message}`);
  }

  // 5. Supplier Payment Disbursement
  console.log("\n৫. সাপ্লায়ারের পাওনা পরিশোধ ও পেমেন্ট ভাউচার জেনারেশন:");
  try {
    const payRes = await fetch(`${BASE_URL}/api/admin/suppliers/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        supplierId: testSupplier._id,
        amountPoisha: 2500000, // ৳২৫,০০০ পরিশোধ
        paymentMethod: "bank",
        transactionReference: "EBL-TRANSFER-99214",
        notes: "ইস্টার্ন ব্যাংক অনলাইন ট্রান্সফারের মাধ্যমে পরিশোধ",
      }),
    });
    const payData = await payRes.json();
    assert(payRes.status === 200 && payData.success, `সাপ্লায়ার পেমেন্ট সফল`);
    assert(
      payData.payment?.paymentNumber && payData.payment.paymentNumber.startsWith("SP-"),
      `পেমেন্ট ভাউচার তৈরি হয়েছে: ${payData.payment?.paymentNumber}`
    );
    assert(
      payData.payment?.balanceBeforePoisha === 4000000 && payData.payment?.balanceAfterPoisha === 1500000,
      `সাপ্লায়ার ব্যালেন্স হিসাব নির্ভুল (পূর্বের ৳৪০,০০০ -> পরিশোধ ৳২৫,০০০ -> অবশিষ্ট ৳১৫,০০০)`
    );
  } catch (e) {
    assert(false, `Supplier payment test failed: ${e.message}`);
  }

  // 6. Shop Expenses (Create, List, Filter & Security)
  console.log("\n৬. দোকান খরচ ভাউচার এন্ট্রি, ক্যাটাগরি ফিল্টার ও নিরাপত্তা পরীক্ষা:");
  try {
    // Unauthorized attempt
    const unauthExpRes = await fetch(`${BASE_URL}/api/admin/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "shop_rent",
        amountPoisha: 3500000,
        description: "দোকান ভাড়া",
      }),
    });
    assert(unauthExpRes.status === 401 || unauthExpRes.status === 403, `লগইন ছাড়া খরচ এন্ট্রি প্রতিহত (HTTP ${unauthExpRes.status})`);

    // Create Expense 1: Shop Rent
    const exp1Res = await fetch(`${BASE_URL}/api/admin/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        category: "shop_rent",
        amountPoisha: 3500000, // ৳৩৫,০০০
        paymentMethod: "bank",
        paidTo: "দোকান মালিক",
        description: "অক্টোবর ২০২৬ মাসের দোকান ভাড়া পরিশোধ",
      }),
    });
    const exp1Data = await exp1Res.json();
    assert(exp1Res.status === 200 && exp1Data.success, `দোকান ভাড়া ভাউচার নিবন্ধিত হয়েছে (#${exp1Data.expense?.voucherNumber})`);
    assert(exp1Data.expense?.status === "approved", `মালিক আইডি হওয়ায় স্বয়ংক্রিয়ভাবে খরচ অনুমোদিত হয়েছে`);

    // Create Expense 2: Staff Refreshment
    const exp2Res = await fetch(`${BASE_URL}/api/admin/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        category: "staff_refreshment",
        amountPoisha: 120000, // ৳১,২০০
        paymentMethod: "cash",
        paidTo: "ক্যাফে রয়েল",
        description: "স্টাফদের বিকালের নাস্তা ও চা বিল",
      }),
    });
    const exp2Data = await exp2Res.json();
    assert(exp2Res.status === 200 && exp2Data.success, `স্টাফ নাস্তা খরচ এন্ট্রি সফল (#${exp2Data.expense?.voucherNumber})`);

    // Filter by Category
    const rentFilterRes = await fetch(`${BASE_URL}/api/admin/expenses?category=shop_rent`, {
      headers: { Cookie: adminCookie },
    });
    const rentFilterData = await rentFilterRes.json();
    assert(rentFilterRes.status === 200, `ক্যাটাগরি ফিল্টার কাজ করছে`);
    const allRent = rentFilterData.expenses.every((e) => e.category === "shop_rent");
    assert(allRent, `শুধুমাত্র দোকান ভাড়ার ভাউচার ফিল্টার হয়েছে`);
  } catch (e) {
    assert(false, `Expense test failed: ${e.message}`);
  }

  // 7. Verify All Phase 7 HTML Admin Pages
  console.log("\n৭. ফেজ ৭ অ্যাডমিন পেজ রেন্ডারিং পরীক্ষা (HTTP 200):");
  try {
    const supPageRes = await fetch(`${BASE_URL}/admin/suppliers`, {
      headers: { Cookie: adminCookie },
    });
    assert(supPageRes.status === 200, `/admin/suppliers পেজ রেন্ডার হয়েছে (HTTP 200)`);

    const purPageRes = await fetch(`${BASE_URL}/admin/purchases`, {
      headers: { Cookie: adminCookie },
    });
    assert(purPageRes.status === 200, `/admin/purchases পেজ রেন্ডার হয়েছে (HTTP 200)`);

    const expPageRes = await fetch(`${BASE_URL}/admin/expenses`, {
      headers: { Cookie: adminCookie },
    });
    assert(expPageRes.status === 200, `/admin/expenses পেজ রেন্ডার হয়েছে (HTTP 200)`);
  } catch (e) {
    assert(false, `HTML pages test failed: ${e.message}`);
  }

  // 8. Summary
  console.log("\n==================================================================");
  console.log(`  মোট টেস্ট সম্পন্ন: ${passed + failed}`);
  console.log(`  উত্তীর্ণ (Passed): ${passed}`);
  console.log(`  ব্যর্থ (Failed): ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

