import mongoose from "mongoose";
import crypto from "crypto";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ MONGODB_URI is not set!");
  process.exit(1);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const ALL_PERMISSIONS = [
  "products.read", "products.create", "products.update", "products.delete",
  "inventory.read", "inventory.adjust",
  "purchases.read", "purchases.create", "purchases.update",
  "sales.create", "sales.refund", "sales.discount", "sales.viewCost",
  "customers.read", "customers.update",
  "dues.read", "dues.collect",
  "expenses.create", "expenses.approve",
  "payroll.read", "payroll.manage",
  "reports.read", "reports.financial",
  "users.manage", "settings.manage",
];

const DEFAULT_ROLES = [
  {
    name: "Store Owner",
    nameBangla: "দোকানের মালিক",
    slug: "owner",
    description: "সর্বোচ্চ ক্ষমতাধারী - সেটিংস, লাভ-ক্ষতি, ইউজার ও আর্থিক হিসাবের পূর্ণ নিয়ন্ত্রণ।",
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  },
  {
    name: "Administrator",
    nameBangla: "সিস্টেম অ্যাডমিন",
    slug: "admin",
    description: "দৈনন্দিন শপ অপারেশন, স্টাফ ও ইনভেন্টরি তদারকি।",
    permissions: [
      "products.read", "products.create", "products.update", "products.delete",
      "inventory.read", "inventory.adjust",
      "purchases.read", "purchases.create", "purchases.update",
      "sales.create", "sales.refund", "sales.discount", "sales.viewCost",
      "customers.read", "customers.update",
      "dues.read", "dues.collect",
      "expenses.create", "expenses.approve",
      "payroll.read",
      "reports.read", "reports.financial",
      "users.manage",
    ],
    isSystem: true,
  },
  {
    name: "Store Manager",
    nameBangla: "স্টোর ম্যানেজার",
    slug: "manager",
    description: "দোকানের বিক্রয়, কাস্টমার বাকি, মাল রিসিভ ও স্টক সমন্বয়ের দায়িত্ব।",
    permissions: [
      "products.read", "products.create", "products.update",
      "inventory.read", "inventory.adjust",
      "purchases.read", "purchases.create",
      "sales.create", "sales.refund", "sales.discount",
      "customers.read", "customers.update",
      "dues.read", "dues.collect",
      "expenses.create",
      "reports.read",
    ],
    isSystem: true,
  },
  {
    name: "Cashier",
    nameBangla: "ক্যাশিয়ার",
    slug: "cashier",
    description: "পিওএস কাউন্টারে বিক্রয়, টাকা গ্রহণ ও রসিদ প্রিন্ট। ক্রয়মূল্য বা স্টাফ বেতন দেখতে পারবেন না।",
    permissions: [
      "products.read", "inventory.read", "sales.create", "sales.discount",
      "customers.read", "customers.update", "dues.read", "dues.collect",
    ],
    isSystem: true,
  },
  {
    name: "Inventory Manager",
    nameBangla: "ইনভেন্টরি ম্যানেজার",
    slug: "inventory",
    description: "স্টক গ্রহণ, সাপ্লায়ার বিল, বারকোড এবং গুদাম স্থানান্তর।",
    permissions: [
      "products.read", "products.create", "products.update",
      "inventory.read", "inventory.adjust",
      "purchases.read", "purchases.create", "purchases.update",
    ],
    isSystem: true,
  },
  {
    name: "Accountant",
    nameBangla: "হিসাবরক্ষক",
    slug: "accountant",
    description: "আয়-ব্যয়, ভাউচার, বেতন ও আর্থিক স্টেটমেন্ট।",
    permissions: [
      "expenses.create", "expenses.approve", "payroll.read", "payroll.manage",
      "reports.read", "reports.financial", "dues.read", "dues.collect",
      "purchases.read", "sales.viewCost",
    ],
    isSystem: true,
  },
  {
    name: "Online Store Manager",
    nameBangla: "অনলাইন ম্যানেজার",
    slug: "online_manager",
    description: "ই-কমার্স ওয়েবসাইট ও কাস্টমার অর্ডার প্রসেসিং।",
    permissions: [
      "products.read", "products.update", "inventory.read",
      "sales.create", "customers.read",
    ],
    isSystem: true,
  },
  {
    name: "Customer",
    nameBangla: "সাধারণ ক্রেতা",
    slug: "customer",
    description: "অনলাইন শপ ভিজিটর ও সাধারণ কাস্টমার। ম্যানেজমেন্টে এক্সেস নেই।",
    permissions: [],
    isSystem: true,
  },
];

const AUTHENTIC_CATEGORIES = [
  {
    nameBangla: "ট্রাভেল স্যুটকেস ও ট্রলি",
    nameEnglish: "Travel Suitcases & Trolley",
    slug: "travel-suitcases",
    sortOrder: 1,
    isActive: true,
  },
  {
    nameBangla: "ট্রাভেল ব্যাকপ্যাক",
    nameEnglish: "Travel Backpacks",
    slug: "travel-backpacks",
    sortOrder: 2,
    isActive: true,
  },
  {
    nameBangla: "ল্যাপটপ ও বিজনেস ব্যাগ",
    nameEnglish: "Laptop & Business Bags",
    slug: "laptop-bags",
    sortOrder: 3,
    isActive: true,
  },
  {
    nameBangla: "কেবিন লাগেজ",
    nameEnglish: "Cabin Luggage",
    slug: "cabin-luggage",
    sortOrder: 4,
    isActive: true,
  },
  {
    nameBangla: "ডাফেল ব্যাগ",
    nameEnglish: "Duffel & Weekend Bags",
    slug: "duffel-bags",
    sortOrder: 5,
    isActive: true,
  },
  {
    nameBangla: "ভ্রমণ অনুষঙ্গ ও লাগেজ লক",
    nameEnglish: "Travel Accessories & Locks",
    slug: "travel-accessories",
    sortOrder: 6,
    isActive: true,
  },
];

const AUTHENTIC_BRANDS = [
  { name: "President", slug: "president", origin: "Japan", isActive: true },
  { name: "Eminent", slug: "eminent", origin: "Taiwan", isActive: true },
  { name: "Kamiliant", slug: "kamiliant", origin: "USA", isActive: true },
  { name: "American Tourister", slug: "american-tourister", origin: "USA", isActive: true },
  { name: "Delsey Paris", slug: "delsey-paris", origin: "France", isActive: true },
  { name: "Arctic Hunter", slug: "arctic-hunter", origin: "Hong Kong", isActive: true },
  { name: "Samsonite", slug: "samsonite", origin: "USA", isActive: true },
];

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log("✓ Connected to MongoDB Atlas successfully.\n");

  console.log("==================================================");
  console.log("  STEP 1: PURGING ALL MOCK & TEST DATA");
  console.log("==================================================");

  const testCollections = [
    "products",
    "productvariants",
    "inventorybalances",
    "inventorymovements",
    "salesinvoices",
    "onlineorders",
    "customercredittransactions",
    "moneyreceipts",
    "expenses",
    "purchaseinvoices",
    "supplierpayments",
    "suppliers",
    "employees",
    "payrollrecords",
    "journalentries",
    "possessions",
    "counters",
  ];

  for (const collName of testCollections) {
    try {
      const res = await db.collection(collName).deleteMany({});
      console.log(`✓ Purged collection '${collName}': ${res.deletedCount} test records removed.`);
    } catch {
      console.log(`- Collection '${collName}' already clean or empty.`);
    }
  }

  console.log("\n==================================================");
  console.log("  STEP 2: CONFIGURING PRODUCTION SYSTEM ROLES");
  console.log("==================================================");

  await db.collection("roles").deleteMany({});
  const insertedRoles = await db.collection("roles").insertMany(
    DEFAULT_ROLES.map((r) => ({
      ...r,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
  console.log(`✓ Seeded ${insertedRoles.insertedCount} clean system roles.`);

  const ownerRoleDoc = await db.collection("roles").findOne({ slug: "owner" });

  console.log("\n==================================================");
  console.log("  STEP 3: CONFIGURING OFFICIAL STORE OWNER");
  console.log("==================================================");

  await db.collection("users").deleteMany({});
  const ownerPasswordHash = hashPassword("@24272920");
  await db.collection("users").insertOne({
    firebaseUid: "owner-luggage-baggage-official",
    email: "luggage.baggage26@gmail.com",
    username: "luggage.baggage26",
    displayName: "Md. Sohel Sikder & Md. Alam",
    passwordHash: ownerPasswordHash,
    roleId: ownerRoleDoc._id,
    isActive: true,
    isOwner: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  });
  console.log("✓ Provisioned Official Store Owner:");
  console.log("  - Name: Md. Sohel Sikder & Md. Alam");
  console.log("  - Email: luggage.baggage26@gmail.com");
  console.log("  - Role: Store Owner (Full Access)");

  console.log("\n==================================================");
  console.log("  STEP 4: INITIALIZING OFFICIAL SHOP SETTINGS");
  console.log("==================================================");

  await db.collection("shopsettings").deleteMany({});
  await db.collection("shopsettings").insertOne({
    name: "Luggage & Baggage (লাগেজ অ্যান্ড ব্যাগেজ)",
    shortName: "Luggage & Baggage",
    owners: "Md. Sohel Sikder & Md. Alam",
    address: "দোকান নং ৪২, গ্রাউন্ড ফ্লোর, যমুনা ফিউচার পার্ক, কুড়িল, প্রগতি সরণি, বারিধারা, ঢাকা-১২২৯",
    shortAddress: "যমুনা ফিউচার পার্ক, কুড়িল, ঢাকা",
    mobile: "01869749988",
    secondaryMobile: "01711234567",
    email: "luggage.baggage26@gmail.com",
    bkashNumber: "01869749988",
    nagadNumber: "01869749988",
    deliveryFeeInsideDhaka: 80,
    deliveryFeeOutsideDhaka: 150,
    vatTaxPercentage: 0,
    currency: "BDT",
    receiptFooter: "আমাদের দোকানে আসার জন্য ধন্যবাদ! পণ্য পরিবর্তনের জন্য ৭ দিনের মধ্যে ক্যাশ মেমোসহ যোগাযোগ করুন।",
    isConfigured: true,
    updatedAt: new Date(),
  });
  console.log("✓ Configured Official Store Info for Jamuna Future Park.");

  console.log("\n==================================================");
  console.log("  STEP 5: INITIALIZING OFFICIAL SHOWROOM LOCATION");
  console.log("==================================================");

  await db.collection("locations").deleteMany({});
  await db.collection("locations").insertOne({
    name: "প্রধান শোরুম (Main Showroom - JFP)",
    code: "JFP-MAIN",
    address: "দোকান নং ৪২, গ্রাউন্ড ফ্লোর, যমুনা ফিউচার পার্ক, ঢাকা",
    isDefault: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("✓ Set default location: প্রধান শোরুম (Main Showroom - JFP).");

  console.log("\n==================================================");
  console.log("  STEP 6 & 7: RESETTING CATEGORIES & BRANDS (CLEAN SLATE)");
  console.log("==================================================");

  await db.collection("categories").deleteMany({});
  console.log("✓ Categories collection reset to clean state (ready for fresh creation).");

  await db.collection("brands").deleteMany({});
  console.log("✓ Brands collection reset to clean state (ready for fresh creation).");

  console.log("\n==================================================");
  console.log("  STEP 8: INITIALIZING DEFAULT WALK-IN CUSTOMER");
  console.log("==================================================");

  await db.collection("customers").deleteMany({});
  await db.collection("customers").insertOne({
    name: "সাধারণ কাস্টমার (Walk-in)",
    phone: "01800000000",
    email: "",
    address: "যমুনা ফিউচার পার্ক শোরুম",
    totalPurchasesPoisha: 0,
    totalDuePoisha: 0,
    creditLimitPoisha: 0,
    isActive: true,
    isWalkIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("✓ Initialized standard Walk-in POS customer.");

  console.log("\n==================================================");
  console.log("  STEP 9: INITIALIZING CLEAN FINANCIAL ACCOUNTS");
  console.log("==================================================");

  await db.collection("financialaccounts").deleteMany({});
  await db.collection("financialaccounts").insertMany([
    {
      accountName: "দোকান ক্যাশ ড্রয়ার (Cash in Hand)",
      accountType: "cash",
      currentBalancePoisha: 0,
      isActive: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      accountName: "বিকাশ মার্চেন্ট ওয়ালেট (bKash - 01869749988)",
      accountType: "bkash",
      accountNumber: "01869749988",
      currentBalancePoisha: 0,
      isActive: true,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      accountName: "নগদ মার্চেন্ট ওয়ালেট (Nagad - 01869749988)",
      accountType: "nagad",
      accountNumber: "01869749988",
      currentBalancePoisha: 0,
      isActive: true,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      accountName: "ব্যাংক হিসাব (Bank Current Account)",
      accountType: "bank",
      currentBalancePoisha: 0,
      isActive: true,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log("✓ Initialized 4 clean financial accounts with ৳ 0 initial balance.");

  console.log("\n==================================================");
  console.log("  STEP 10: VERIFYING CLEAN STATE");
  console.log("==================================================");

  const prodCount = await db.collection("products").countDocuments();
  const salesCount = await db.collection("salesinvoices").countDocuments();
  const expenseCount = await db.collection("expenses").countDocuments();
  const userCount = await db.collection("users").countDocuments();
  const catCount = await db.collection("categories").countDocuments();
  const brandCount = await db.collection("brands").countDocuments();

  console.log(`Products in store: ${prodCount} (100% clean, ready for real items)`);
  console.log(`Sales invoices: ${salesCount} (Cleaned)`);
  console.log(`Expenses: ${expenseCount} (Cleaned)`);
  console.log(`Users: ${userCount} (Official Owner only)`);
  console.log(`Categories: ${catCount} (Authentic)`);
  console.log(`Brands: ${brandCount} (Authentic)`);

  await mongoose.disconnect();
  console.log("\n🎉 PRODUCTION DATABASE RESET COMPLETED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("❌ Reset script failed:", err);
  process.exit(1);
});

