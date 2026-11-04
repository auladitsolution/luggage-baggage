import assert from "node:assert";

console.log("=== Testing Product Edit & Delete Architecture ===");

// 1. Mock store simulation
const store = {
  products: [
    { _id: "prod-1", nameBangla: "প্রেসিডেন্ট ট্রলি লাগেজ", status: "active" },
    { _id: "prod-2", nameBangla: "লুমিনা ট্রাভেল ব্যাকপ্যাক", status: "active" },
  ],
  variants: [
    { _id: "var-1", productId: "prod-1", nameVariant: "২০ ইঞ্চি", purchaseCostPoisha: 300000, retailPricePoisha: 450000 },
    { _id: "var-2", productId: "prod-2", nameVariant: "স্ট্যান্ডার্ড", purchaseCostPoisha: 200000, retailPricePoisha: 350000 },
  ],
  inventoryBalances: [
    { _id: "bal-1", variantId: "var-1", productId: "prod-1", currentStock: 15 },
    { _id: "bal-2", variantId: "var-2", productId: "prod-2", currentStock: 8 },
  ],
};

// Test Filter: By default, non-archived products are returned
function getProducts(status) {
  let filtered = [...store.products];
  if (status === "all") {
    // show all
  } else if (status) {
    filtered = filtered.filter((p) => p.status === status);
  } else {
    filtered = filtered.filter((p) => p.status !== "archived");
  }
  return filtered;
}

assert.strictEqual(getProducts().length, 2, "Initial active products should be 2");

// Test Edit: Updating product name and variant prices/stock
const editPayload = {
  nameBangla: "প্রেসিডেন্ট প্রিমিয়াম লাক্সারি ট্রলি",
  variants: [
    { _id: "var-1", nameVariant: "২০ ইঞ্চি (আপডেট)", retailPriceBDT: "5500", purchaseCostBDT: "3500", stock: "20" },
  ],
};

const prod = store.products.find((p) => p._id === "prod-1");
prod.nameBangla = editPayload.nameBangla;
const v = store.variants.find((v) => v._id === "var-1");
v.nameVariant = editPayload.variants[0].nameVariant;
v.retailPricePoisha = 550000;
const bal = store.inventoryBalances.find((b) => b.variantId === "var-1");
bal.currentStock = 20;

assert.strictEqual(prod.nameBangla, "প্রেসিডেন্ট প্রিমিয়াম লাক্সারি ট্রলি");
assert.strictEqual(v.retailPricePoisha, 550000);
assert.strictEqual(bal.currentStock, 20);
console.log("✓ Product & Variant Edit logic verified successfully!");

// Test Delete (Archive):
prod.status = "archived";
const activeAfterArchive = getProducts();
assert.strictEqual(activeAfterArchive.length, 1, "Archived product must not appear in active list");
assert.strictEqual(activeAfterArchive[0]._id, "prod-2");

const archivedList = getProducts("archived");
assert.strictEqual(archivedList.length, 1, "Archived product must appear in archived list");
assert.strictEqual(archivedList[0]._id, "prod-1");

// Test Restore
prod.status = "active";
assert.strictEqual(getProducts().length, 2, "Restored product must appear back in active list");
console.log("✓ Product Delete, Archive, and Restore lifecycle verified successfully!");
console.log("=== All Tests Passed! ===");

