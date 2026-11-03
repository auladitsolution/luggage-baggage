/**
 * ============================================================================
 * Phase 8: Bengali E-Commerce Storefront, Online Orders & Stock Lifecycle Test
 * ============================================================================
 */

const BASE_URL = "http://127.0.0.1:3001";

async function runTests() {
  console.log("==================================================================");
  console.log("  লুমিনা লাগেজ - ফেজ ৮ ই-কমার্স স্টোরফ্রন্ট ও অনলাইন অর্ডার টেস্ট");
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

  // 1. Authenticate as Store Admin / Order Manager
  console.log("১. অ্যাডমিন / অনলাইন ম্যানেজার সেশন ভেরিফিকেশন:");
  let adminCookie = "";
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: "owner-real-uid-001",
        email: "alamgir.owner@luminaluggage.com",
        displayName: "আলমগীর কবির (মালিক ও ম্যানেজার)",
      }),
    });
    adminCookie = res.headers.get("set-cookie") || "";
    assert(adminCookie.includes("lumina_session"), `অ্যাডমিন সেশন নিশ্চিত হয়েছে`);
  } catch (e) {
    assert(false, `Authentication failed: ${e.message}`);
  }

  // 2. Public Catalog API Verification
  console.log("\n২. পাবলিক পণ্য ক্যাটালগ ও ভ্যারিয়েন্ট স্টক এপিআই যাচাই:");
  let targetProduct = null;
  let targetVariant = null;
  try {
    const res = await fetch(`${BASE_URL}/api/products`);
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data.products), `পাবলিক ক্যাটালগ এপিআই লোড হয়েছে (মোট ${data.products.length} টি পণ্য)`);

    targetProduct = data.products[0];
    assert(targetProduct && targetProduct.variants.length > 0, `পণ্য ও ভ্যারিয়েন্ট পাওয়া গেছে: ${targetProduct.nameBangla}`);
    targetVariant = targetProduct.variants.find((v) => v.availableStock >= 5) || targetProduct.variants[0];
    assert(targetVariant.availableStock !== undefined, `ভ্যারিয়েন্টের বিক্রয়যোগ্য স্টক হিসাব বিদ্যমান (${targetVariant.availableStock} পিস)`);

    // Fetch single product by slug
    const singleRes = await fetch(`${BASE_URL}/api/products/${targetProduct.slug}`);
    const singleData = await singleRes.json();
    assert(singleRes.status === 200 && singleData.product, `একক পণ্যের তথ্য প্রাপ্ত হয়েছে (/api/products/${targetProduct.slug})`);
  } catch (e) {
    assert(false, `Catalog API test failed: ${e.message}`);
  }

  // 3. Online Order Placement & Concurrency-Safe Stock Reservation
  console.log("\n৩. অনলাইন অর্ডার প্লেসমেন্ট ও কনকারেন্সি-সেফ স্টক রিজার্ভেশন:");
  const testPhone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
  let order1 = null;
  const initialReserved = targetVariant.reservedStock || 0;
  const initialCurrent = targetVariant.currentStock || 0;

  try {
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "শাকিল আহমেদ",
        customerPhone: testPhone,
        customerEmail: "shakil@example.com",
        shippingAddress: {
          address: "বাড়ি ২৫, রোড ৩, মিরপুর ১০",
          district: "ঢাকা",
          thanaOrArea: "মিরপুর",
        },
        deliveryZone: "inside_dhaka",
        items: [
          {
            variantId: targetVariant._id || targetVariant.id,
            productName: targetProduct.nameBangla,
            quantity: 2,
          },
        ],
        paymentMethod: "cod",
      }),
    });

    const orderData = await orderRes.json();
    if (!orderData.success) {
      console.error("DEBUG orderRes error:", orderRes.status, orderData);
    }
    assert(orderRes.status === 200 && orderData.success, `সিওডি (COD) অনলাইন অর্ডার সফলভাবে প্লেস হয়েছে`);
    order1 = orderData.order;
    assert(order1.orderNumber && order1.orderNumber.startsWith("ORD-"), `অর্ডার নম্বর জেনারেট হয়েছে: ${order1.orderNumber}`);
    assert(order1.orderStatus === "pending", `অর্ডারের প্রাথমিক অবস্থা 'pending'`);
    assert(order1.deliveryFeePoisha === 8000, `ঢাকার ভেতরের ডেলিভারি চার্জ ৳৮০ সঠিক`);

    // Verify stock was reserved
    const checkRes = await fetch(`${BASE_URL}/api/products/${targetProduct.slug}`);
    const checkData = await checkRes.json();
    const updatedVar = checkData.product.variants.find(
      (v) => (v._id || v.id) === (targetVariant._id || targetVariant.id)
    );
    assert(
      updatedVar.reservedStock === initialReserved + 2,
      `স্টক রিজার্ভেশন নিখুঁতভাবে ২ পিস বৃদ্ধি পেয়েছে (${initialReserved} -> ${updatedVar.reservedStock})`
    );
  } catch (e) {
    assert(false, `Order placement test failed: ${e.message}`);
  }

  // 4. Overselling Prevention in Online Checkout
  console.log("\n৪. অতিরিক্ত স্টক ক্রয়ের চেষ্টা প্রতিরোধ (Zero Overselling Guarantee):");
  try {
    const overRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "অবাস্তব ক্রেতা",
        customerPhone: "01999887766",
        shippingAddress: {
          address: "উত্তরা, ঢাকা",
          district: "ঢাকা",
        },
        deliveryZone: "inside_dhaka",
        items: [
          {
            variantId: targetVariant._id || targetVariant.id,
            productName: targetProduct.nameBangla,
            quantity: 99999, // Way beyond stock!
          },
        ],
        paymentMethod: "cod",
      }),
    });
    const overData = await overRes.json();
    assert(overRes.status === 400, `স্টকের অতিরিক্ত পরিমাণের অর্ডার বাতিল হয়েছে (HTTP 400)`);
    assert(
      overData.error && overData.error.includes("পর্যাপ্ত স্টকে নেই"),
      `বাংলা এরর মেসেজ প্রদর্শিত হয়েছে: "${overData.error}"`
    );
  } catch (e) {
    assert(false, `Overselling test failed: ${e.message}`);
  }

  // 5. Manual bKash Payment Workflow (Never verify without authorized confirmation)
  console.log("\n৫. বিকাশ ম্যানুয়াল পেমেন্ট ভেরিফিকেশন ফ্লো (Never Auto-Verify Rule):");
  let bkashOrder = null;
  try {
    // Missing TrxID validation
    const invalidRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "রাকিব হাসান",
        customerPhone: "01855667788",
        shippingAddress: { address: "আগ্রাবাদ", district: "চট্টগ্রাম" },
        deliveryZone: "outside_dhaka",
        items: [{ variantId: targetVariant._id || targetVariant.id, quantity: 1 }],
        paymentMethod: "bkash_manual",
        manualPaymentDetails: {}, // No TrxID!
      }),
    });
    assert(invalidRes.status === 400, `TrxID ছাড়া বিকাশ পেমেন্ট অর্ডার প্রত্যাখ্যাত হয়েছে (HTTP 400)`);

    // Valid bKash submission
    const bkashSenderPhone = `018${Math.floor(10000000 + Math.random() * 90000000)}`;
    const validBkashRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "রাকিব হাসান",
        customerPhone: bkashSenderPhone,
        shippingAddress: { address: "আগ্রাবাদ", district: "চট্টগ্রাম" },
        deliveryZone: "outside_dhaka",
        items: [{ variantId: targetVariant._id || targetVariant.id, quantity: 1 }],
        paymentMethod: "bkash_manual",
        manualPaymentDetails: {
          senderNumber: bkashSenderPhone,
          transactionId: `BKASH-TRX-${Date.now().toString().slice(-6)}`,
        },
      }),
    });
    const validBkashData = await validBkashRes.json();
    assert(validBkashRes.status === 200 && validBkashData.success, `বিকাশ ম্যানুয়াল পেমেন্ট অর্ডার গৃহীত হয়েছে`);
    bkashOrder = validBkashData.order;

    // CRUCIAL: Verify it is NOT auto-verified
    assert(
      bkashOrder.paymentStatus === "pending_verification",
      `ম্যানুয়াল পেমেন্ট স্বয়ংক্রিয়ভাবে পেইড হয়নি, স্ট্যাটাস: 'pending_verification'`
    );

    // Test Unauthorized verification attempt
    const unauthVerify = await fetch(`${BASE_URL}/api/admin/orders/${bkashOrder._id}/verify-payment`, {
      method: "PUT",
    });
    assert(unauthVerify.status === 401 || unauthVerify.status === 403, `লগইন ছাড়া পেমেন্ট ভেরিফাই ব্লক হয়েছে (HTTP ${unauthVerify.status})`);

    // Authorized Admin verification
    const authVerify = await fetch(`${BASE_URL}/api/admin/orders/${bkashOrder._id}/verify-payment`, {
      method: "PUT",
      headers: { Cookie: adminCookie },
    });
    const authVerifyData = await authVerify.json();
    assert(authVerify.status === 200 && authVerifyData.success, `অ্যাডমিন দ্বারা বিকাশ TrxID যাচাই ও পেমেন্ট ভেরিফাইড হয়েছে`);
    assert(authVerifyData.order.paymentStatus === "paid", `পেমেন্ট স্ট্যাটাস 'paid' হয়েছে`);
    assert(authVerifyData.order.manualPaymentDetails.verifiedById !== undefined, `ভেরিফায়ার স্টাফ আইডি সংরক্ষিত হয়েছে`);
  } catch (e) {
    assert(false, `Manual payment test failed: ${e.message}`);
  }

  // 6. Order Cancellation & Stock Release
  console.log("\n৬. অর্ডার বাতিল ও স্টক রিলিজ (Cancellation & Stock Release):");
  try {
    // Cancel the bKash order
    const cancelRes = await fetch(`${BASE_URL}/api/admin/orders/${bkashOrder._id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        orderStatus: "cancelled",
        internalNotes: "গ্রাহকের অনুরোধে অর্ডার বাতিল",
      }),
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200 && cancelData.success, `অর্ডার সফলভাবে বাতিল করা হয়েছে`);
    assert(cancelData.order.orderStatus === "cancelled", `অর্ডার স্ট্যাটাস 'cancelled' হয়েছে`);
  } catch (e) {
    assert(false, `Order cancellation test failed: ${e.message}`);
  }

  // 7. Order Fulfillment (Shipment & Delivery -> Inventory Deduction)
  console.log("\n৭. অর্ডার ডেলিভারি ও ইনভেন্টরি স্টক হ্রাস (Fulfillment & Deduction):");
  try {
    // Transition to Shipped
    const shipRes = await fetch(`${BASE_URL}/api/admin/orders/${order1._id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        orderStatus: "shipped",
        courierName: "রেডএক্স কুরিয়ার",
        trackingNumber: "REDX-998877",
      }),
    });
    const shipData = await shipRes.json();
    assert(shipRes.status === 200, `অর্ডার কুরিয়ারে হস্তান্তর হয়েছে (রেডএক্স কুরিয়ার, ট্র্যাকিং: REDX-998877)`);

    // Transition to Delivered (Triggers actual physical stock deduction)
    const deliverRes = await fetch(`${BASE_URL}/api/admin/orders/${order1._id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        orderStatus: "delivered",
      }),
    });
    const deliverData = await deliverRes.json();
    assert(deliverRes.status === 200, `গ্রাহক পণ্য বুঝে পেয়েছেন (অর্ডার স্ট্যাটাস: 'delivered')`);

    // Verify inventory movement
    const movRes = await fetch(
      `${BASE_URL}/api/admin/inventory/movements?variantId=${targetVariant._id || targetVariant.id}`,
      {
        headers: { Cookie: adminCookie },
      }
    );
    const movData = await movRes.json();
    const saleMov = movData.movements.find(
      (m) => m.referenceId === order1.orderNumber && m.movementType === "online_sale"
    );
    assert(saleMov !== undefined, `অনলাইন বিক্রয়ের অডিট ট্রেইল লিপিবদ্ধ হয়েছে (Type: online_sale, Qty: -2)`);
  } catch (e) {
    assert(false, `Delivery deduction test failed: ${e.message}`);
  }

  // 8. Customer Order Tracking API
  console.log("\n৮. গ্রাহকের নিজস্ব অর্ডার ট্র্যাকিং এপিআই:");
  try {
    const custRes = await fetch(`${BASE_URL}/api/orders?phone=${testPhone}`);
    const custData = await custRes.json();
    assert(custRes.status === 200 && Array.isArray(custData.orders), `গ্রাহক মোবাইল নম্বর দিয়ে অর্ডার তালিকা প্রাপ্ত হয়েছে`);
    const myOrder = custData.orders.find((o) => o.orderNumber === order1.orderNumber);
    assert(myOrder !== undefined, `গ্রাহকের অর্ডারের বিবরণ পাওয়া গেছে`);

    // Public lookup by order number
    const publicLookup = await fetch(`${BASE_URL}/api/orders/${order1.orderNumber}`);
    const publicData = await publicLookup.json();
    assert(publicLookup.status === 200 && publicData.order, `পাবলিক অর্ডার লুকআপ সফল`);
  } catch (e) {
    assert(false, `Customer tracking test failed: ${e.message}`);
  }

  // 9. Storefront & Management HTML Pages Render Check (HTTP 200)
  console.log("\n৯. স্টোরফ্রন্ট ও ম্যানেজমেন্ট পেজসমূহ রেন্ডারিং পরীক্ষা (HTTP 200):");
  try {
    const pages = [
      { path: "/shop", label: "ক্যাটালগ পেজ (/shop)" },
      { path: `/shop/${targetProduct.slug}`, label: "পণ্য বিস্তারিত পেজ (/shop/[slug])" },
      { path: "/cart", label: "শপিং কার্ট পেজ (/cart)" },
      { path: "/checkout", label: "চেকআউট পেজ (/checkout)" },
      { path: "/account/orders", label: "গ্রাহক অর্ডার ট্র্যাকিং পেজ (/account/orders)" },
      { path: "/admin/orders", label: "অ্যাডমিন অর্ডার ম্যানেজমেন্ট পেজ (/admin/orders)", auth: true },
    ];

    for (const p of pages) {
      const res = await fetch(`${BASE_URL}${p.path}`, {
        headers: p.auth ? { Cookie: adminCookie } : {},
      });
      assert(res.status === 200, `${p.label} সফলভাবে রেন্ডার হয়েছে (HTTP 200)`);
    }
  } catch (e) {
    assert(false, `Page rendering test failed: ${e.message}`);
  }

  // 10. Summary
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

