import assert from "node:assert";

console.log("=== Testing Dynamic Shop Settings Synchronization ===");

// Simulate STORE_INFO and update logic
const STORE_INFO = {
  name: "Luggage & Baggage",
  nameBangla: "লাগেজ অ্যান্ড ব্যাগেজ",
  mobile: "01869749988",
  phoneFormatted: "০১৮৬৯-৭৪৯৯৮৮",
  deliveryFeeInsideDhaka: 80,
  deliveryFeeOutsideDhaka: 150,
  receiptFooter: "আমাদের পণ্য পছন্দ করায় ধন্যবাদ। বিক্রিত পণ্য ৭ দিনের মধ্যে মেমোসহ পরিবর্তনযোগ্য।",
};

function toBengaliDigits(str) {
  const enDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.replace(/[0-9]/g, (w) => bnDigits[enDigits.indexOf(w)] || w);
}

function updateStoreInfoInMemory(newSettings) {
  if (newSettings.organizationName) STORE_INFO.name = newSettings.organizationName;
  if (newSettings.organizationNameBangla) STORE_INFO.nameBangla = newSettings.organizationNameBangla;
  if (newSettings.mobile) {
    STORE_INFO.mobile = newSettings.mobile;
    STORE_INFO.phoneFormatted = toBengaliDigits(newSettings.mobile);
  }
  if (typeof newSettings.deliveryFeeInsideDhaka === "number") {
    STORE_INFO.deliveryFeeInsideDhaka = newSettings.deliveryFeeInsideDhaka;
  }
  if (typeof newSettings.deliveryFeeOutsideDhaka === "number") {
    STORE_INFO.deliveryFeeOutsideDhaka = newSettings.deliveryFeeOutsideDhaka;
  }
  if (newSettings.receiptFooter) {
    STORE_INFO.receiptFooter = newSettings.receiptFooter;
  }
}

// Initial state assertion
assert.strictEqual(STORE_INFO.name, "Luggage & Baggage");
assert.strictEqual(STORE_INFO.deliveryFeeInsideDhaka, 80);

// Owner modifies settings
const ownerUpdate = {
  organizationName: "Lumina Luggage Palace",
  organizationNameBangla: "লুমিনা লাগেজ প্যালেস",
  mobile: "01711223344",
  deliveryFeeInsideDhaka: 60,
  deliveryFeeOutsideDhaka: 120,
  receiptFooter: "ধন্যবাদ! বিক্রিত পণ্য ৩ দিনের মধ্যে পরিবর্তনযোগ্য।",
};

updateStoreInfoInMemory(ownerUpdate);

// Assert changes are reflected dynamically
assert.strictEqual(STORE_INFO.name, "Lumina Luggage Palace");
assert.strictEqual(STORE_INFO.nameBangla, "লুমিনা লাগেজ প্যালেস");
assert.strictEqual(STORE_INFO.mobile, "01711223344");
assert.strictEqual(STORE_INFO.phoneFormatted, "০১৭১১২২৩৩৪৪");
assert.strictEqual(STORE_INFO.deliveryFeeInsideDhaka, 60);
assert.strictEqual(STORE_INFO.deliveryFeeOutsideDhaka, 120);
assert.strictEqual(STORE_INFO.receiptFooter, "ধন্যবাদ! বিক্রিত পণ্য ৩ দিনের মধ্যে পরিবর্তনযোগ্য।");

console.log("✓ Dynamic Shop Settings update and propagation verified successfully!");
console.log("=== All Tests Passed! ===");

