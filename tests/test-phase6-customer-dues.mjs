/**
 * ============================================================================
 * Phase 6: Customer Directory, Credit Dues & Money Receipt Test Suite
 * ============================================================================
 */

const BASE_URL = "http://127.0.0.1:3001";

async function runTests() {
  console.log("==================================================================");
  console.log("  লুমিনা লাগেজ - ফেজ ৬ কাস্টমার, বাকি ব্যবস্থাপনা ও মানি রসিদ টেস্ট");
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

  // 1. Authenticate as Cashier / Store Admin
  console.log("১. পিওএস ও ক্যাশিয়ার সেশন ভেরিফিকেশন:");
  let adminCookie = "";
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: "owner-real-uid-001",
        email: "alamgir.owner@luminaluggage.com",
        displayName: "আলমগীর কবির (মালিক ও ক্যাশিয়ার)",
      }),
    });
    adminCookie = res.headers.get("set-cookie") || "";
    assert(adminCookie.includes("lumina_session"), `অ্যাডমিন সেশন নিশ্চিত হয়েছে`);
  } catch (e) {
    assert(false, `Authentication failed: ${e.message}`);
  }

  // 2. Customer Creation & Phone Uniqueness
  console.log("\n২. নতুন কাস্টমার নিবন্ধন ও ইউনিক মোবাইল নম্বর ভ্যালিডেশন:");
  const testPhone = `018${Math.floor(10000000 + Math.random() * 90000000)}`;
  let testCustomer = null;
  try {
    const createRes = await fetch(`${BASE_URL}/api/admin/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: "করিম চৌধুরী",
        phone: testPhone,
        email: "karim.chowdhury@example.com",
        address: "দোকান ১২, নিউ মার্কেট, ঢাকা",
        creditLimitPoisha: 3000000, // ৳30,000
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 200 && createData.success, `নতুন কাস্টমার নিবন্ধিত হয়েছে: ${createData.customer?.name}`);
    testCustomer = createData.customer;

    // Test duplicate phone prevention
    const dupRes = await fetch(`${BASE_URL}/api/admin/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: "ডুপ্লিকেট করিম",
        phone: testPhone,
      }),
    });
    assert(dupRes.status === 400, `ডুপ্লিকেট মোবাইল নম্বরে নিবন্ধন বাধা দেওয়া হয়েছে (HTTP 400)`);
  } catch (e) {
    assert(false, `Customer creation failed: ${e.message}`);
  }

  // 3. Authorization Protection on Dues Collection
  console.log("\n৩. বাকি আদায় এন্ডপয়েন্টে রোল-বেসড পারমিশন ভেরিফিকেশন:");
  try {
    const unauthRes = await fetch(`${BASE_URL}/api/admin/dues/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: testCustomer?._id,
        amountPoisha: 100000,
      }),
    });
    assert(unauthRes.status === 401 || unauthRes.status === 403, `অননুমোদিত রিকোয়েস্টে বাকি আদায় বন্ধ (HTTP ${unauthRes.status})`);
  } catch (e) {
    assert(false, `Permission check failed: ${e.message}`);
  }

  // 4. Create Due Sales for Customer via POS Checkout
  console.log("\n৪. কাস্টমারের নামে দুইটি বাকি বিক্রয় (Due Sales) তৈরি:");
  let invoice1 = null;
  let invoice2 = null;

  try {
    // Fetch available inventory items
    const invRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
      headers: { Cookie: adminCookie },
    });
    const invData = await invRes.json();
    const availableVariant = invData.items[0];

    // Sale 1: Due amount ৳4,000 (400,000 poisha)
    const sale1Res = await fetch(`${BASE_URL}/api/pos/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        idempotencyKey: `p6-due-sale-1-${Date.now()}`,
        customerId: testCustomer._id,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [
          {
            variantId: availableVariant.variantId,
            productId: availableVariant.productId,
            productName: availableVariant.productName,
            variantName: availableVariant.variantName,
            sku: availableVariant.sku,
            barcode: availableVariant.barcode,
            unitPricePoisha: 500000, // ৳5,000
            quantity: 1,
            subtotalPoisha: 500000,
          },
        ],
        subtotalPoisha: 500000,
        discountType: "fixed",
        discountValue: 0,
        discountPoisha: 0,
        netPayablePoisha: 500000,
        paidAmountPoisha: 100000, // Paid ৳1,000
        dueAmountPoisha: 400000, // Due ৳4,000
        payments: [{ method: "cash", amountPoisha: 100000 }],
      }),
    });
    const sale1Data = await sale1Res.json();
    assert(sale1Res.status === 200 && sale1Data.success, `বিক্রয় ১ সফল (ইনভয়েস #${sale1Data.invoice?.invoiceNumber}, বাকি ৳৪,০০০)`);
    invoice1 = sale1Data.invoice;

    // Small delay to ensure createdAt timestamp differs
    await new Promise((r) => setTimeout(r, 200));

    // Sale 2: Due amount ৳5,000 (500,000 poisha)
    const sale2Res = await fetch(`${BASE_URL}/api/pos/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        idempotencyKey: `p6-due-sale-2-${Date.now()}`,
        customerId: testCustomer._id,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [
          {
            variantId: availableVariant.variantId,
            productId: availableVariant.productId,
            productName: availableVariant.productName,
            variantName: availableVariant.variantName,
            sku: availableVariant.sku,
            barcode: availableVariant.barcode,
            unitPricePoisha: 500000, // ৳5,000
            quantity: 1,
            subtotalPoisha: 500000,
          },
        ],
        subtotalPoisha: 500000,
        discountType: "fixed",
        discountValue: 0,
        discountPoisha: 0,
        netPayablePoisha: 500000,
        paidAmountPoisha: 0, // Paid ৳0
        dueAmountPoisha: 500000, // Due ৳5,000
        payments: [],
      }),
    });
    const sale2Data = await sale2Res.json();
    assert(sale2Res.status === 200 && sale2Data.success, `বিক্রয় ২ সফল (ইনভয়েস #${sale2Data.invoice?.invoiceNumber}, বাকি ৳৫,০০০)`);
    invoice2 = sale2Data.invoice;
  } catch (e) {
    assert(false, `Due sales creation failed: ${e.message}`);
  }

  // 5. Verify Customer Dues in Dues List
  console.log("\n৫. কাস্টমার বকেয়া লিস্ট ও মোট হিসাব যাচাই:");
  try {
    const duesRes = await fetch(`${BASE_URL}/api/admin/dues`, {
      headers: { Cookie: adminCookie },
    });
    const duesData = await duesRes.json();
    assert(duesRes.status === 200, `বকেয়া গ্রাহকদের তালিকা লোড হয়েছে`);

    const customerInDues = duesData.customers.find((c) => c._id === testCustomer._id);
    assert(customerInDues !== undefined, `তালিকায় কাস্টমার উপস্থিত রয়েছে`);
    assert(
      customerInDues.currentDuePoisha === 900000,
      `কাস্টমারের মোট বাকি সঠিক: ৳${customerInDues.currentDuePoisha / 100} (প্রত্যাশিত ৳৯,০০০)`
    );
  } catch (e) {
    assert(false, `Dues verification failed: ${e.message}`);
  }

  // 6. Test FIFO Payment Collection (Partial Payment: ৳5,500)
  console.log("\n৬. ফিফো (FIFO) নিয়মে আংশিক বাকি আদায় (৳৫,৫০০):");
  let firstReceipt = null;
  try {
    const collectRes = await fetch(`${BASE_URL}/api/admin/dues/collect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        customerId: testCustomer._id,
        amountPoisha: 550000, // ৳5,500
        paymentMethod: "cash",
        notes: "নগদে আংশিক বাকি আদায়",
      }),
    });
    const collectData = await collectRes.json();
    assert(collectRes.status === 200 && collectData.success, `বাকি টাকা গ্রহণ সফল`);
    firstReceipt = collectData.receipt;
    assert(
      firstReceipt.receiptNumber && firstReceipt.receiptNumber.startsWith("MR-"),
      `মানি রসিদ নম্বর তৈরি হয়েছে: ${firstReceipt.receiptNumber}`
    );
    assert(
      firstReceipt.balanceBeforePoisha === 900000 && firstReceipt.balanceAfterPoisha === 350000,
      `ব্যালেন্স হিসাব নিখুঁত: পূর্বের বাকি ৳৯,০০০ -> আদায় ৳৫,৫০০ -> অবশিষ্ট ৳৩,৫০০`
    );

    // Verify FIFO allocation details
    assert(firstReceipt.allocatedInvoices.length === 2, `২টি ইনভয়েসে ফিফো বণ্টন হয়েছে`);
    const alloc1 = firstReceipt.allocatedInvoices[0];
    const alloc2 = firstReceipt.allocatedInvoices[1];
    assert(
      alloc1.invoiceNumber === invoice1.invoiceNumber &&
        alloc1.allocatedAmountPoisha === 400000 &&
        alloc1.remainingDuePoisha === 0,
      `ইনভয়েস ১ (পুরনো) সম্পূর্ণ পরিশোধ হয়েছে (৳৪,০০০ আদায়, বাকি ৳০)`
    );
    assert(
      alloc2.invoiceNumber === invoice2.invoiceNumber &&
        alloc2.allocatedAmountPoisha === 150000 &&
        alloc2.remainingDuePoisha === 350000,
      `ইনভয়েস ২ (নতুন) আংশিক পরিশোধ হয়েছে (৳১,৫০০ আদায়, বাকি ৳৩,৫০০)`
    );
  } catch (e) {
    assert(false, `FIFO collection failed: ${e.message}`);
  }

  // 7. Verify Customer Ledger Statement API & Layout Routes
  console.log("\n৭. কাস্টমার লেজার স্টেটমেন্ট ও মানি রসিদ ভিউ রাউট পরীক্ষা:");
  try {
    // Statement API
    const stmtRes = await fetch(`${BASE_URL}/api/admin/customers/${testCustomer._id}`, {
      headers: { Cookie: adminCookie },
    });
    const stmtData = await stmtRes.json();
    assert(stmtRes.status === 200 && stmtData.success, `লেজার স্টেটমেন্ট ডেটা লোড হয়েছে`);
    assert(stmtData.customer.currentDuePoisha === 350000, `স্টেটমেন্টে বর্তমান বকেয়া ৳৩,৫০০`);
    assert(stmtData.transactions.length >= 1, `লেজার ট্রানজ্যাকশন রেকর্ড লিপিবদ্ধ হয়েছে`);

    // Receipt API
    const rcptApiRes = await fetch(`${BASE_URL}/api/admin/dues/receipt/${firstReceipt._id}`, {
      headers: { Cookie: adminCookie },
    });
    const rcptApiData = await rcptApiRes.json();
    assert(rcptApiRes.status === 200 && rcptApiData.success, `মানি রসিদ API লোড হয়েছে`);
    assert(
      rcptApiData.receipt && rcptApiData.receipt.receiptNumber.startsWith("MR-"),
      `মানি রসিদ ডাটা ও রসিদ কোড প্রাপ্তি নিশ্চিত (${rcptApiData.receipt?.receiptNumber})`
    );

    // Receipt HTML Print Page
    const rcptHtmlRes = await fetch(`${BASE_URL}/admin/dues/receipt/${firstReceipt._id}`, {
      headers: { Cookie: adminCookie },
    });
    assert(rcptHtmlRes.status === 200, `মানি রসিদ প্রিন্ট পেজ রেন্ডার হয়েছে (HTTP 200)`);

    // Statement HTML Print Page
    const stmtHtmlRes = await fetch(`${BASE_URL}/admin/customers/${testCustomer._id}/statement`, {
      headers: { Cookie: adminCookie },
    });
    assert(stmtHtmlRes.status === 200, `কাস্টমার স্টেটমেন্ট প্রিন্ট পেজ রেন্ডার হয়েছে (HTTP 200)`);
  } catch (e) {
    assert(false, `Statement and receipt routes failed: ${e.message}`);
  }

  // 8. Test Second Payment (Clear Full Remaining Due ৳3,500)
  console.log("\n৮. অবশিষ্ট বাকি সম্পূর্ণ পরিশোধ ও শূন্য বকেয়ায় আদায় রোধ:");
  try {
    const finalCollectRes = await fetch(`${BASE_URL}/api/admin/dues/collect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        customerId: testCustomer._id,
        amountPoisha: 350000, // ৳3,500
        paymentMethod: "bkash",
        transactionReference: "TRX998877",
        notes: "বিকাশে সম্পূর্ণ বকেয়া পরিশোধ",
      }),
    });
    const finalData = await finalCollectRes.json();
    assert(finalCollectRes.status === 200 && finalData.success, `অবশিষ্ট ৳৩,৫০০ আদায় সফল`);
    assert(finalData.receipt.balanceAfterPoisha === 0, `কাস্টমারের অবশিষ্ট বাকি শূন্য (৳০) হয়েছে`);

    // Try collecting again when balance is 0
    const zeroRes = await fetch(`${BASE_URL}/api/admin/dues/collect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        customerId: testCustomer._id,
        amountPoisha: 100000,
        paymentMethod: "cash",
      }),
    });
    assert(zeroRes.status === 400, `বকেয়া শূন্য অবস্থায় পুনরায় টাকা সংগ্রহ প্রতিরোধ (HTTP 400)`);
  } catch (e) {
    assert(false, `Final collection test failed: ${e.message}`);
  }

  // 9. Summary
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

