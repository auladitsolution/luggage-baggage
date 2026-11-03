/**
 * ============================================================================
 * Phase 5: Retail POS System, Atomic Sales & Printing Test Suite
 * ============================================================================
 */

const BASE_URL = "http://127.0.0.1:3001";

async function runTests() {
  console.log("==================================================================");
  console.log("  লুমিনা লাগেজ - ফেজ ৫ পিওএস সেলস, ইনভয়েস ও থার্মাল প্রিন্ট টেস্ট");
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
  console.log("১. পিওএস ক্যাশিয়ার সেশন ভেরিফিকেশন:");
  let cashierCookie = "";
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
    cashierCookie = res.headers.get("set-cookie") || "";
    assert(cashierCookie.includes("lumina_session"), `ক্যাশিয়ার সেশন কুকি নিশ্চিত হয়েছে`);
  } catch (e) {
    assert(false, `Authentication failed: ${e.message}`);
  }

  // 2. Fetch available products and select variant for sale
  console.log("\n২. পিওএস বারকোড ও স্টক ডাটা সংগ্রহ:");
  let targetVariant = null;
  let initialStock = 0;
  try {
    const res = await fetch(`${BASE_URL}/api/admin/inventory`, {
      headers: { Cookie: cashierCookie },
    });
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data.items), `ইনভেন্টরি ব্যালেন্স লোড হয়েছে`);

    // Pick a variant with available stock
    targetVariant = data.items.find((i) => i.currentStock >= 5);
    assert(targetVariant !== undefined, `পর্যাপ্ত স্টকযুক্ত ভ্যারিয়েন্ট পাওয়া গেছে (${targetVariant?.productName} - ${targetVariant?.variantName})`);
    initialStock = targetVariant.currentStock;
    console.log(`     -> নির্বাচিত ভ্যারিয়েন্ট বারকোড: ${targetVariant.barcode}, বর্তমান স্টক: ${initialStock} পিস`);
  } catch (e) {
    assert(false, `Product fetch failed: ${e.message}`);
  }

  // 3. Test Full Cash Sale Finalization & Atomic Stock Deduction
  console.log("\n৩. পূর্ণ নগদ বিক্রয় ও অ্যাটমিক স্টক হ্রাস পরীক্ষা:");
  let firstInvoiceId = "";
  let firstInvoiceNo = "";
  const idempotencyKey1 = `pos-test-sale-1-${Date.now()}`;

  try {
    const qtyToBuy = 2;
    const checkoutRes = await fetch(`${BASE_URL}/api/pos/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cashierCookie,
      },
      body: JSON.stringify({
        idempotencyKey: idempotencyKey1,
        customerName: "আব্দুর রহিম",
        customerPhone: "01700112233",
        items: [
          {
            variantId: targetVariant.variantId,
            quantity: qtyToBuy,
            unitPricePoisha: targetVariant.retailPricePoisha,
          },
        ],
        orderDiscountPoisha: 20000, // ৳ 200 discount
        payments: [
          {
            method: "cash",
            amountPoisha: targetVariant.retailPricePoisha * qtyToBuy - 20000,
          },
        ],
      }),
    });

    const data = await checkoutRes.json();
    assert(checkoutRes.status === 200 && data.success, `পিওএস বিক্রয় সফল হয়েছে (HTTP 200)`);
    assert(data.invoice && data.invoice.invoiceNumber.startsWith("INV-"), `ইউনিক ইনভয়েস নম্বর জেনারেট হয়েছে: ${data.invoice?.invoiceNumber}`);
    assert(data.invoice.paymentStatus === "paid", `পেমেন্ট স্ট্যাটাস 'paid' হয়েছে`);
    assert(data.invoice.dueAmountPoisha === 0, `বকেয়া ০ নিশ্চিত হয়েছে`);

    firstInvoiceId = data.invoice._id;
    firstInvoiceNo = data.invoice.invoiceNumber;

    // Verify stock in inventory decreased by exactly qtyToBuy
    const invRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
      headers: { Cookie: cashierCookie },
    });
    const invData = await invRes.json();
    const updatedItem = invData.items.find((i) => i.variantId === targetVariant.variantId);
    assert(
      updatedItem && updatedItem.currentStock === initialStock - qtyToBuy,
      `স্টক তাৎক্ষণিকভাবে ${initialStock} থেকে কমে ${initialStock - qtyToBuy} হয়েছে (অ্যাটমিক কর্তন সফল)`
    );
  } catch (e) {
    assert(false, `Cash sale test failed: ${e.message}`);
  }

  // 4. Test Idempotency & Double Submit Prevention
  console.log("\n৪. আইডেমপোটেন্সি ও ডাবল-সাবমিট প্রতিরোধ পরীক্ষা (Idempotency Key):");
  try {
    // Send exact same request with same idempotencyKey1
    const dupRes = await fetch(`${BASE_URL}/api/pos/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cashierCookie,
      },
      body: JSON.stringify({
        idempotencyKey: idempotencyKey1,
        customerName: "আব্দুর রহিম",
        items: [
          {
            variantId: targetVariant.variantId,
            quantity: 2,
          },
        ],
      }),
    });

    const dupData = await dupRes.json();
    assert(dupRes.status === 200, `পুনরায় একই কী পাঠালে সফল হ্যান্ডলিং হয়েছে (HTTP 200)`);
    assert(
      dupData.invoice && dupData.invoice.invoiceNumber === firstInvoiceNo,
      `পূর্বে তৈরি হওয়া ইনভয়েস রিটার্ন করেছে (নতুন ডুপ্লিকেট ইনভয়েস তৈরি হয়নি)`
    );

    // Verify stock was NOT deducted a second time
    const invRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
      headers: { Cookie: cashierCookie },
    });
    const invData = await invRes.json();
    const itemAfterDup = invData.items.find((i) => i.variantId === targetVariant.variantId);
    assert(
      itemAfterDup && itemAfterDup.currentStock === initialStock - 2,
      `স্টক দ্বিতীয়বার কাটা হয়নি (Zero Overselling Guarantee অক্ষত)`
    );
  } catch (e) {
    assert(false, `Idempotency test failed: ${e.message}`);
  }

  // 5. Test Split Payments (Cash + bKash)
  console.log("\n৫. স্প্লিট পেমেন্ট পরীক্ষা (নগদ + বিকাশ):");
  try {
    const qty = 1;
    const itemTotal = targetVariant.retailPricePoisha * qty;
    const cashPart = Math.floor(itemTotal / 2);
    const bkashPart = itemTotal - cashPart;

    const splitRes = await fetch(`${BASE_URL}/api/pos/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cashierCookie,
      },
      body: JSON.stringify({
        customerName: "সুলতান মাহমুদ",
        customerPhone: "01822334455",
        items: [
          {
            variantId: targetVariant.variantId,
            quantity: qty,
            unitPricePoisha: targetVariant.retailPricePoisha,
          },
        ],
        payments: [
          { method: "cash", amountPoisha: cashPart },
          { method: "bkash", amountPoisha: bkashPart, transactionReference: "BKASH987654" },
        ],
      }),
    });

    const splitData = await splitRes.json();
    assert(splitRes.status === 200 && splitData.success, `স্প্লিট পেমেন্ট সফল হয়েছে (HTTP 200)`);
    assert(splitData.invoice.payments.length === 2, `২টি পেমেন্ট মেথড (Cash ও bKash) সংরক্ষিত হয়েছে`);
    assert(
      splitData.invoice.paidAmountPoisha === itemTotal && splitData.invoice.dueAmountPoisha === 0,
      `সম্পূর্ণ অর্থ যথাযথভাবে পরিশোধিত হয়েছে`
    );
  } catch (e) {
    assert(false, `Split payment test failed: ${e.message}`);
  }

  // 6. Test Partial / Due Sale & Customer Credit Ledger
  console.log("\n৬. বাকি/আংশিক বিক্রয় ও কাস্টমার ক্রেডিট লেজার পরীক্ষা:");
  try {
    const testCustPhone = `019${Math.floor(10000000 + Math.random() * 90000000)}`;
    const itemTotal = targetVariant.retailPricePoisha;
    const paidPart = Math.floor(itemTotal * 0.4); // 40% paid
    const expectedDue = itemTotal - paidPart;      // 60% due

    const dueRes = await fetch(`${BASE_URL}/api/pos/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cashierCookie,
      },
      body: JSON.stringify({
        customerName: "মাহবুব আলম (বাকি ক্রেতা)",
        customerPhone: testCustPhone,
        items: [
          {
            variantId: targetVariant.variantId,
            quantity: 1,
            unitPricePoisha: targetVariant.retailPricePoisha,
          },
        ],
        payments: [{ method: "cash", amountPoisha: paidPart }],
      }),
    });

    const dueData = await dueRes.json();
    assert(dueRes.status === 200, `বাকি বিক্রয় সফল হয়েছে (HTTP 200)`);
    assert(dueData.invoice.paymentStatus === "partial", `পেমেন্ট স্ট্যাটাস 'partial' হয়েছে`);
    assert(
      dueData.invoice.dueAmountPoisha === expectedDue,
      `বকেয়া পরিমাণ সঠিকভাবে গণনাকৃত হয়েছে (${expectedDue / 100} ৳)`
    );

    // Verify Customer record updated with current due
    const custRes = await fetch(`${BASE_URL}/api/admin/customers?search=${testCustPhone}`, {
      headers: { Cookie: cashierCookie },
    });
    const custData = await custRes.json();
    const customer = custData.customers?.find((c) => c.phone === testCustPhone);
    assert(
      customer && customer.currentDuePoisha === expectedDue,
      `কাস্টমারের বকেয়া খাতায় পাওনা যোগ হয়েছে (Current Due: ${customer?.currentDuePoisha / 100} ৳)`
    );
  } catch (e) {
    assert(false, `Due sale test failed: ${e.message}`);
  }

  // 7. Test Over-Selling Prevention (Insufficient stock rejection)
  console.log("\n৭. অতিরিক্ত বিক্রি প্রতিরোধ ও ওভার-সিলিং ব্লকিং (Zero Overselling Guarantee):");
  try {
    const res = await fetch(`${BASE_URL}/api/pos/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cashierCookie,
      },
      body: JSON.stringify({
        customerName: "অবৈধ ক্রেতা",
        items: [
          {
            variantId: targetVariant.variantId,
            quantity: 9999, // Way more than physical stock!
          },
        ],
      }),
    });

    const data = await res.json();
    assert(res.status === 400, `স্টকের বেশি বিক্রির চেষ্টা ব্লক হয়েছে (Status: ${res.status})`);
    assert(
      data.error && data.error.includes("পর্যাপ্ত স্টক নেই"),
      `বাংলা এরর মেসেজ প্রদর্শিত হয়েছে: "${data.error}"`
    );
  } catch (e) {
    assert(false, `Overselling prevention test failed: ${e.message}`);
  }

  // 8. Test Thermal Receipt and Invoice Retrieval for Printing
  console.log("\n৮. থার্মাল রসিদ (58mm/80mm) ও A4 ইনভয়েস ডাটা পরীক্ষা:");
  try {
    const res = await fetch(`${BASE_URL}/api/pos/invoices/${firstInvoiceId}`);
    const data = await res.json();
    assert(res.status === 200 && data.invoice, `ইনভয়েস ডাটা সফলভাবে প্রাপ্ত হয়েছে (HTTP 200)`);
    assert(data.invoice.items.length > 0, `আইটেম তালিকা পাওয়া গেছে`);
    assert(data.invoice.invoiceNumber === firstInvoiceNo, `ইনভয়েস নম্বর মিলেছে`);

    // Verify receipt view renders HTTP 200
    const viewRes = await fetch(`${BASE_URL}/print/receipt/${firstInvoiceId}?format=80mm`);
    assert(viewRes.status === 200, `৮০মিমি রসিদ প্রিভিউ পেজ সফলভাবে রেন্ডার হয়েছে (HTTP 200)`);

    const view58Res = await fetch(`${BASE_URL}/print/receipt/${firstInvoiceId}?format=58mm`);
    assert(view58Res.status === 200, `৫৮মিমি রসিদ প্রিভিউ পেজ সফলভাবে রেন্ডার হয়েছে (HTTP 200)`);

    const viewA4Res = await fetch(`${BASE_URL}/print/receipt/${firstInvoiceId}?format=a4`);
    assert(viewA4Res.status === 200, `A4 পূর্ণাঙ্গ চালান প্রিভিউ পেজ সফলভাবে রেন্ডার হয়েছে (HTTP 200)`);
  } catch (e) {
    assert(false, `Receipt view test failed: ${e.message}`);
  }

  console.log("\n------------------------------------------------------------------");
  console.log(`  ফেজ ৫ টেস্ট ফলাফল: মোট পাস = ${passed}, ফেল = ${failed}`);
  console.log("------------------------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

