import assert from "assert";

const BASE_URL = "http://127.0.0.1:3001";

async function testFix() {
  console.log("=== Testing Fix for Product 404 & Order var-7 CastError ===");

  // 1. Test GET product detail for arctic-hunter
  console.log("\n1. Testing GET /api/products/arctic-hunter-waterproof-smart-travel-backpack...");
  const prodRes = await fetch(`${BASE_URL}/api/products/arctic-hunter-waterproof-smart-travel-backpack`);
  const prodData = await prodRes.json();
  console.log("Product fetch status:", prodRes.status);
  assert.strictEqual(prodRes.status, 200, "Should return HTTP 200 for arctic-hunter");
  assert.ok(prodData.product, "Should return product object");
  console.log("Product Name:", prodData.product.nameBangla);
  console.log("Product Variants count:", prodData.product.variants.length);
  const realVariant = prodData.product.variants[0];
  console.log("Real Variant ID (MongoDB ObjectId):", realVariant._id);
  assert.ok(realVariant._id.match(/^[0-9a-fA-F]{24}$/), "Variant _id must be valid MongoDB ObjectId");

  // 2. Test Order Placement with legacy variantId: "var-7"
  console.log("\n2. Testing POST /api/orders with legacy variantId: 'var-7'...");
  const orderWithVar7Res = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "পরীক্ষামূলক ক্রেতা",
      customerPhone: "01869749988",
      shippingAddress: {
        address: "3A-022B, Jamuna Future Park",
        district: "Dhaka",
      },
      deliveryZone: "inside_dhaka",
      paymentMethod: "cod",
      items: [
        {
          variantId: "var-7",
          productName: "আর্কটিক হান্টার ওয়াটারপ্রুফ স্মার্ট ট্রাভেল ব্যাকপ্যাক",
          quantity: 1,
        },
      ],
    }),
  });

  const orderWithVar7Data = await orderWithVar7Res.json();
  console.log("Order with var-7 status:", orderWithVar7Res.status);
  console.log("Order response:", JSON.stringify(orderWithVar7Data, null, 2));
  assert.strictEqual(orderWithVar7Res.status, 200, "Order with var-7 should succeed with HTTP 200");
  assert.ok(orderWithVar7Data.success, "Order should be marked success: true");
  assert.ok(orderWithVar7Data.order.orderNumber.startsWith("ORD-"), "Should have valid orderNumber");

  // 3. Test Order Placement with real ObjectId variant
  console.log("\n3. Testing POST /api/orders with real ObjectId variant...");
  const orderWithObjectIdRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "সরাসরি ক্রেতা",
      customerPhone: "01869749988",
      shippingAddress: {
        address: "3A-022B, Jamuna Future Park",
        district: "Dhaka",
      },
      deliveryZone: "inside_dhaka",
      paymentMethod: "cod",
      items: [
        {
          variantId: realVariant._id,
          productName: prodData.product.nameBangla,
          quantity: 1,
        },
      ],
    }),
  });

  const orderWithObjectIdData = await orderWithObjectIdRes.json();
  console.log("Order with ObjectId status:", orderWithObjectIdRes.status);
  assert.strictEqual(orderWithObjectIdRes.status, 200, "Order with ObjectId should succeed with HTTP 200");
  assert.ok(orderWithObjectIdData.success, "Order should be marked success: true");

  console.log("\n✓ ALL TESTS PASSED! Fix is 100% verified.");
}

testFix().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

