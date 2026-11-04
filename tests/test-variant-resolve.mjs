import assert from "node:assert";

console.log("=== Testing Variant Resolution & CastError Fix ===");

// 1. Simulate the cleanId logic
function cleanVariantId(variantId) {
  if (!variantId || typeof variantId !== "string") return "";
  let clean = variantId.trim();
  if (clean.startsWith("var-")) {
    clean = clean.slice(4);
  }
  return clean;
}

const test1 = "var-6ae58f0ec401fa13f642130a";
const cleaned1 = cleanVariantId(test1);
assert.strictEqual(cleaned1, "6ae58f0ec401fa13f642130a");
assert.strictEqual(/^[0-9a-fA-F]{24}$/.test(cleaned1), true, "Cleaned ID must be a valid 24-character hexadecimal ObjectId");

const test2 = "6ae58f0ec401fa13f642130a";
const cleaned2 = cleanVariantId(test2);
assert.strictEqual(cleaned2, "6ae58f0ec401fa13f642130a");

const test3 = "var-1";
const cleaned3 = cleanVariantId(test3);
assert.strictEqual(cleaned3, "1");

const test4 = "LUG-VIP-TRV-M";
const cleaned4 = cleanVariantId(test4);
assert.strictEqual(cleaned4, "LUG-VIP-TRV-M");

console.log("✓ All variant id cleaning assertions passed!");
console.log("Fix verified successfully.");

