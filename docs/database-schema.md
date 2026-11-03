# ডাটাবেস স্কিমা ও ইনডেক্সিং স্পেসিফিকেশন (MongoDB Database Schema & Indexes)
## Bengali Luggage & Baggage E-Commerce + POS + Shop Management System

---

## ১. ওভারভিউ ও আর্কিটেকচারাল নিয়মাবলী (Overview & Invariants)

1. **মনিটারি রিপ্রেজেন্টেশন (Monetary Representation):**
   - কোনো ফ্লোটিং-পয়েন্ট ব্যবহার করা যাবে না। সকল আর্থিক মান (টাকা) ইন্টিজার মাইনর ইউনিটে (Poisha) সংরক্ষিত হবে।
   - ফর্মুলা: `৳ 1.00 = 100 Poisha`। উদাহরণস্বরূপ, ৳ ৪,৫০০ টাকা হলে ডাটাবেসে `450000` হিসেবে সেভ হবে।
2. **আইডি ও রেফারেন্স (Identifiability):**
   - অবজেক্ট আইডি হিসেবে MongoDB `ObjectId` ব্যবহার হবে।
   - ইউনিক মানব-পঠনযোগ্য কোড (Human-readable unique IDs): যেমন ইনভয়েসের জন্য `INV-2026-00001`, অর্ডারের জন্য `ORD-2026-00001`, বারকোডের জন্য ১২ বা ১৩ ডিজিট ইউনিক কোড।
3. **টাইমস্ট্যাম্প ও টাইমজোন:**
   - ডেটাবেসে সমস্ত সময় UTC `ISODate` হিসেবে সংরক্ষিত থাকবে।
   - রিপোর্ট ও ব্যবসায়িক দিনের হিসাব `Asia/Dhaka` টাইমজোন অনুযায়ী ফিল্টার ও অ্যাগ্রিগেট হবে।

---

## ২. ইউজার, রোল ও পারমিশন স্কিমা (User & Security Schemas)

### ২.১ `users` কালেকশন
```typescript
interface IUser {
  _id: ObjectId;
  firebaseUid: string;              // ফায়ারবেস ইউআইডি (ইউনিক ইনডেক্স)
  email?: string;
  phone?: string;
  displayName: string;
  photoUrl?: string;
  roleId: ObjectId;                 // রেফারেন্স: roles._id
  isActive: boolean;                // ডিফল্ট: true
  isOwner: boolean;                 // ডিফল্ট: false
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
// ইনডেক্স:
// { firebaseUid: 1 } (Unique)
// { phone: 1 } (Sparse)
// { roleId: 1 }
```

### ২.২ `roles` কালেকশন
```typescript
interface IRole {
  _id: ObjectId;
  name: string;                     // যেমন: 'Store Owner', 'Cashier', 'Customer'
  nameBangla: string;               // যেমন: 'মালিক', 'ক্যাশিয়ার', 'কাস্টমার'
  slug: string;                     // 'owner', 'manager', 'cashier', 'accountant', 'customer'
  permissions: string[];            // যেমন: ['sales.create', 'products.read']
  isSystem: boolean;                // ট্রু হলে সিস্টেম ডিফল্ট রোল ডিলিট করা যাবে না
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
// ইনডেক্স:
// { slug: 1 } (Unique)
```

---

## ৩. প্রোডাক্ট, ভ্যারিয়েন্ট ও ক্যাটালগ স্কিমা (Product & Catalog Schemas)

### ৩.১ `categories` কালেকশন
```typescript
interface ICategory {
  _id: ObjectId;
  nameBangla: string;               // 'ট্রাভেল স্যুটকেস', 'ব্যাকপ্যাক'
  nameEnglish?: string;             // 'Travel Suitcase'
  slug: string;                     // 'travel-suitcase'
  parentId?: ObjectId;              // সাব-ক্যাটাগরির জন্য প্যারেন্ট ক্যাটাগরি আইডি
  image?: {
    publicId: string;
    url: string;
  };
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
// ইনডেক্স: { slug: 1 } (Unique), { parentId: 1 }
```

### ৩.২ `brands` কালেকশন
```typescript
interface IBrand {
  _id: ObjectId;
  name: string;                     // 'President', 'American Tourister', 'Kamiliant'
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
// ইনডেক্স: { slug: 1 } (Unique)
```

### ৩.৩ `products` কালেকশন
```typescript
interface IProduct {
  _id: ObjectId;
  nameBangla: string;               // 'প্রেসিডেন্ট প্রিমিয়াম হার্ডসাইড ট্রলি লাগেজ'
  nameEnglish?: string;
  slug: string;                     // 'president-premium-hardside-trolley'
  brandId: ObjectId;                // রেফারেন্স: brands
  categoryId: ObjectId;             // রেফারেন্স: categories
  subCategoryId?: ObjectId;
  descriptionBangla?: string;
  specifications: Record<string, string>; // { "উপাদান": "পলিকার্বোনেট", "লক": "TSA কম্বিনেশন" }
  images: Array<{
    publicId: string;
    secureUrl: string;
    altText?: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  hasVariants: boolean;             // লাগেজ সাইজ/কালার থাকলে true
  warrantyInfo?: string;            // '৩ বছরের ইন্টারন্যাশনাল ওয়ারেন্টি'
  status: 'active' | 'draft' | 'archived';
  isFeatured: boolean;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
// ইনডেক্স: { slug: 1 } (Unique), { brandId: 1 }, { categoryId: 1 }, { status: 1 }
```

### ৩.৪ `product_variants` কালেকশন
```typescript
interface IProductVariant {
  _id: ObjectId;
  productId: ObjectId;              // রেফারেন্স: products
  sku: string;                      // 'PRES-TRL-BLK-24' (ইউনিক ইনডেক্স)
  barcode: string;                  // '8901234567890' (ইউনিক ইনডেক্স)
  nameVariant: string;              // '24 ইঞ্চি - কালো'
  size?: string;                    // '20 Inch', '24 Inch', '28 Inch'
  color?: string;                   // 'Black', 'Navy Blue', 'Silver'
  weightKg?: number;                // 3.2
  dimensionsCm?: { length: number; width: number; height: number };
  purchaseCostPoisha: number;       // যেমন: ৳ ৩,৫০০ = ৩৫০০০০ পয়সা (Weighted Average Cost)
  retailPricePoisha: number;        // যেমন: ৳ ৫,২০০ = ৫২০০০ পয়সা
  discountPricePoisha?: number;     // অফার প্রাইস থাকলে
  wholesalePricePoisha?: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
// ইনডেক্স: 
// { sku: 1 } (Unique)
// { barcode: 1 } (Unique)
// { productId: 1 }
```

---

## ৪. ইনভেন্টরি ও স্টক মুভমেন্ট স্কিমা (Inventory & Stock Schemas)

### ৪.১ `locations` কালেকশন (দোকান বা গোডাউন)
```typescript
interface ILocation {
  _id: ObjectId;
  name: string;                     // 'প্রধান দোকান (Main Shop)', 'ধানমন্ডি ওয়্যারহাউস'
  code: string;                     // 'LOC-MAIN', 'LOC-WH1'
  address: string;
  isDefault: boolean;
  isActive: boolean;
}
```

### ৪.২ `inventory_balances` কালেকশন
```typescript
interface IInventoryBalance {
  _id: ObjectId;
  variantId: ObjectId;              // রেফারেন্স: product_variants
  productId: ObjectId;              // রেফারেন্স: products
  locationId: ObjectId;             // রেফারেন্স: locations
  currentStock: number;             // ফিজিক্যাল বর্তমান স্টক
  reservedStock: number;            // অনলাইনে কার্ট/পেন্ডিং অর্ডারের জন্য সাময়িক হোল্ড
  // availableToSell = currentStock - reservedStock (ভার্চুয়াল ফিল্ড)
  lowStockAlertThreshold: number;   // যেমন: 3 পিসের নিচে গেলে সতর্কতা
  updatedAt: Date;
}
// যৌগিক ইউনিক ইনডেক্স:
// { variantId: 1, locationId: 1 } (Unique)
```

### ৪.৩ `inventory_movements` কালেকশন (অপরিবর্তনীয় অডিট লেজার)
```typescript
interface IInventoryMovement {
  _id: ObjectId;
  variantId: ObjectId;
  locationId: ObjectId;
  movementType: 
    | 'purchase_receipt'      // সাপ্লায়ার থেকে মাল রিসিভ (+)
    | 'pos_sale'              // দোকানে বিক্রি (-)
    | 'online_sale'           // অনলাইন ডেলিভারি (-)
    | 'customer_return'       // কাস্টমার ফেরত (+)
    | 'supplier_return'       // সাপ্লায়ারে ফেরত (-)
    | 'damage_loss'           // নষ্ট বা হারিয়ে যাওয়া (-)
    | 'manual_adjustment';    // শারীরিক গণনা পরবর্তী সমন্বয় (+/-)
  quantity: number;           // পজিটিভ অথবা নেগেটিভ পরিবর্তন
  balanceBefore: number;
  balanceAfter: number;
  referenceType: 'sale_invoice' | 'purchase_invoice' | 'stock_adjustment' | 'return_receipt';
  referenceId: ObjectId;
  reason?: string;
  actorId: ObjectId;          // কোন স্টাফ পরিবর্তন করেছেন
  createdAt: Date;
}
// ইনডেক্স:
// { variantId: 1, createdAt: -1 }
// { referenceId: 1 }
// { movementType: 1 }
```

### ৪.৪ `stock_reservations` কালেকশন (অনলাইন কার্ট রিজার্ভেশন)
```typescript
interface IStockReservation {
  _id: ObjectId;
  reservationToken: string;         // সেশন বা কার্ট টোকেন
  variantId: ObjectId;
  locationId: ObjectId;
  quantity: number;
  status: 'active' | 'converted' | 'expired';
  expiresAt: Date;                  // কার্টে যোগ করার পর ১৫ মিনিট মেয়াদ
  createdAt: Date;
}
// টিটিএল ইনডেক্স:
// { expiresAt: 1 }, expireAfterSeconds: 0
```

---

## ৫. পিওএস ও বিক্রয় ইনভয়েস স্কিমা (POS & Sales Invoices)

### ৫.১ `pos_sessions` কালেকশন (ক্যাশিয়ার শিফট ট্র্যাকিং)
```typescript
interface IPOSSession {
  _id: ObjectId;
  cashierId: ObjectId;              // ক্যাশিয়ার ইউজার আইডি
  locationId: ObjectId;
  shiftNumber: string;              // 'SHIFT-20261031-01'
  openedAt: Date;
  closedAt?: Date;
  openingCashPoisha: number;        // ক্যাশ বাক্সে শুরুতে থাকা টাকা
  closingCashExpectedPoisha?: number;
  closingCashActualPoisha?: number; // ক্যাশিয়ারের গুনে পাওয়া টাকা
  cashDiscrepancyPoisha?: number;   // অমিল (Difference)
  status: 'open' | 'closed';
  notes?: string;
}
// ইনডেক্স: { cashierId: 1, status: 1 }
```

### ৫.২ `sales_invoices` কালেকশন
```typescript
interface ISalesInvoice {
  _id: ObjectId;
  invoiceNumber: string;            // 'INV-2026-00001' (ইউনিক ইনডেক্স)
  invoiceType: 'pos' | 'online';
  posSessionId?: ObjectId;          // পিওএস বিক্রয় হলে শিফট আইডি
  customerId?: ObjectId;            // কাস্টমার আইডি (ওয়াক-ইন হলে অপশনাল)
  customerName: string;             // ওয়াক-ইন বা রেজিস্টার্ড কাস্টমারের নাম
  customerPhone: string;            // বাকির ক্ষেত্রে মোবাইল নাম্বার বাধ্যতামূলক
  items: Array<{
    variantId: ObjectId;
    productId: ObjectId;
    productNameBangla: string;
    variantName: string;
    sku: string;
    barcode: string;
    quantity: number;
    unitPricePoisha: number;
    unitCostPoisha: number;         // বিক্রয়ের সময় ভ্যারিয়েন্টের WAC ক্রয়মূল্য
    lineDiscountPoisha: number;
    totalAmountPoisha: number;
  }>;
  subTotalPoisha: number;
  orderDiscountPoisha: number;
  deliveryFeePoisha: number;
  vatTaxPoisha: number;
  grandTotalPoisha: number;
  paidAmountPoisha: number;
  dueAmountPoisha: number;          // grandTotal - paidAmount
  paymentStatus: 'paid' | 'partial' | 'due';
  payments: Array<{
    paymentId: ObjectId;
    method: 'cash' | 'bkash' | 'nagad' | 'bank' | 'card';
    accountId: ObjectId;            // ফিনান্সিয়াল একাউন্ট রেফারেন্স
    amountPoisha: number;
    transactionReference?: string;
    recordedAt: Date;
  }>;
  salesPersonId: ObjectId;          // কোন স্টাফ বিক্রয় করেছেন
  status: 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  idempotencyKey?: string;          // ডাবল সেল রোধের জন্য ক্লায়েন্ট কি
  createdAt: Date;
  updatedAt: Date;
}
// ইনডেক্স:
// { invoiceNumber: 1 } (Unique)
// { customerId: 1, createdAt: -1 }
// { customerPhone: 1 }
// { createdAt: -1 }
// { paymentStatus: 1 }
// { idempotencyKey: 1 } (Unique, Sparse)
```

---

## ৬. কাস্টমার ও বাকি লেজার স্কিমা (Customer & Credit Dues)

### ৬.১ `customers` কালেকশন
```typescript
interface ICustomer {
  _id: ObjectId;
  name: string;
  phone: string;                    // ইউনিক ইনডেক্স
  email?: string;
  address?: string;
  district?: string;
  creditLimitPoisha: number;        // সর্বোচ্চ অনুমোদিত বাকি সীমা
  currentDuePoisha: number;         // বর্তমান বকেয়া টাকার পরিমাণ (Poisha)
  totalPurchasedPoisha: number;     // আজ পর্যন্ত মোট কেনাকাটা
  totalPaidPoisha: number;
  status: 'active' | 'blocked';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
// ইনডেক্স: { phone: 1 } (Unique), { currentDuePoisha: -1 }
```

### ৬.২ `customer_credit_transactions` কালেকশন (বকেয়া লেজার)
```typescript
interface ICustomerCreditTransaction {
  _id: ObjectId;
  customerId: ObjectId;
  transactionType: 
    | 'due_sale'                    // নতুন বাকি বিক্রি (+)
    | 'payment_received'            // বকেয়া আদায় (-)
    | 'due_adjustment'              // ডিসকাউন্ট বা ওয়েভার (-)
    | 'return_credit';              // মাল ফেরত দিয়ে বাকি কমানো (-)
  amountPoisha: number;
  balanceBeforePoisha: number;
  balanceAfterPoisha: number;
  salesInvoiceId?: ObjectId;        // কোন চালানের বিপরীতে
  paymentMethod?: 'cash' | 'bkash' | 'nagad' | 'bank';
  financialAccountId?: ObjectId;
  collectedById: ObjectId;          // কোন স্টাফ টাকা গ্রহণ করলেন
  receiptNumber?: string;           // পেমেন্ট মানি রিসিট নম্বর
  notes?: string;
  createdAt: Date;
}
// ইনডেক্স:
// { customerId: 1, createdAt: -1 }
// { salesInvoiceId: 1 }
```

---

## ৭. সরবরাহকারী ও ক্রয় স্কিমা (Suppliers & Purchasing)

### ৭.১ `suppliers` কালেকশন
```typescript
interface ISupplier {
  _id: ObjectId;
  name: string;                     // 'ঢাকা ব্যাগ ম্যানুফ্যাকচারার'
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  currentBalancePoisha: number;     // সাপ্লায়ারের পাওনা (আমাদের দেনা)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
// ইনডেক্স: { phone: 1 }
```

### ৭.২ `purchase_invoices` কালেকশন (সাপ্লায়ার বিল ও মাল গ্রহণ)
```typescript
interface IPurchaseInvoice {
  _id: ObjectId;
  purchaseInvoiceNumber: string;    // 'PUR-2026-0001'
  supplierInvoiceRef?: string;      // সাপ্লায়ারের চালানের আসল মেমো নম্বর
  supplierId: ObjectId;
  locationId: ObjectId;             // কোন দোকানে মাল ঢুকলো
  items: Array<{
    variantId: ObjectId;
    quantityReceived: number;
    unitCostPoisha: number;
    lineTotalPoisha: number;
  }>;
  totalCostPoisha: number;
  discountPoisha: number;
  grandTotalPoisha: number;
  paidAmountPoisha: number;
  dueAmountPoisha: number;          // সাপ্লায়ারের বকেয়া
  status: 'received' | 'partially_received' | 'cancelled';
  receivedById: ObjectId;
  receivedDate: Date;
  notes?: string;
  createdAt: Date;
}
// ইনডেক্স: { purchaseInvoiceNumber: 1 } (Unique), { supplierId: 1 }
```

---

## ৮. একাউন্টিং ও ডাবল-এন্ট্রি লেজার স্কিমা (Accounting & Cash Flow)

### ৮.১ `financial_accounts` কালেকশন (ক্যাশ, ব্যাংক ও ওয়ালেট)
```typescript
interface IFinancialAccount {
  _id: ObjectId;
  accountName: string;              // 'দোকান ক্যাশ ড্রয়ার', 'ব্র্যাক ব্যাংক চলতি হিসাব', 'বিকাশ মার্চেন্ট'
  accountType: 'cash' | 'bank' | 'bkash' | 'nagad';
  accountNumber?: string;
  currentBalancePoisha: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ৮.২ `journal_entries` ও `ledger_lines` কালেকশন (দ্বৈত দাখিলা এন্ট্রি)
```typescript
interface IJournalEntry {
  _id: ObjectId;
  entryNumber: string;              // 'JV-2026-00001'
  entryDate: Date;
  referenceType: 'sale' | 'purchase' | 'customer_due_collection' | 'supplier_payment' | 'expense' | 'payroll' | 'transfer';
  referenceId: ObjectId;
  description: string;
  lines: Array<{
    accountId: ObjectId;            // financial_accounts বা ভার্চুয়াল হেড (Sales, AR, AP, Inventory)
    accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    debitPoisha: number;
    creditPoisha: number;
  }>;
  totalDebitPoisha: number;
  totalCreditPoisha: number;         // সর্বদা totalDebit === totalCredit হবে
  actorId: ObjectId;
  createdAt: Date;
}
// ইনডেক্স: { entryDate: -1 }, { referenceId: 1 }
```

### ৮.৩ `expenses` কালেকশন
```typescript
interface IExpense {
  _id: ObjectId;
  voucherNumber: string;            // 'EXP-2026-0001'
  category: 
    | 'shop_rent'                   // দোকান ভাড়া
    | 'electricity'                 // বিদ্যুৎ বিল
    | 'internet'                    // ইন্টারনেট
    | 'staff_refreshment'           // নাস্তা ও খাবার
    | 'transport'                   // পরিবহন খরচ
    | 'packaging'                   // প্যাকেট ও পলিথিন
    | 'maintenance'                 // দোকান মেরামত
    | 'advertising'                 // প্রচার ও বিজ্ঞাপন
    | 'miscellaneous';              // বিবিধ
  amountPoisha: number;
  paidFromAccountId: ObjectId;      // কোন ক্যাশ/ব্যাংক থেকে পরিশোধ
  paidTo?: string;                  // কাকে দেওয়া হলো
  approvedById: ObjectId;
  expenseDate: Date;
  description: string;
  receiptAttachmentUrl?: string;
  createdAt: Date;
}
// ইনডেক্স: { expenseDate: -1 }, { category: 1 }
```

---

## ৯. কর্মচারী ও বেতন ব্যবস্থাপনা স্কিমা (Employees & Payroll)

### ৯.১ `employees` কালেকশন
```typescript
interface IEmployee {
  _id: ObjectId;
  name: string;
  phone: string;
  designation: string;              // 'ম্যানেজার', 'বিক্রয় কর্মী', 'নিরাপত্তা প্রহরী'
  joiningDate: Date;
  basicSalaryPoisha: number;
  allowancePoisha: number;
  status: 'active' | 'resigned' | 'terminated';
  bankOrWalletDetails?: string;
  createdAt: Date;
}
```

### ৯.২ `payroll_records` কালেকশন
```typescript
interface IPayrollRecord {
  _id: ObjectId;
  employeeId: ObjectId;
  monthYear: string;                // '2026-10' (ইউনিক কম্পাউন্ড ইনডেক্স উইথ employeeId)
  basicSalaryPoisha: number;
  bonusPoisha: number;
  deductionPoisha: number;
  advanceAdjustedPoisha: number;
  netPayablePoisha: number;
  paidAmountPoisha: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paidFromAccountId?: ObjectId;
  disbursedDate?: Date;
  disbursedById?: ObjectId;
  notes?: string;
  createdAt: Date;
}
// যৌগিক ইউনিক ইনডেক্স:
// { employeeId: 1, monthYear: 1 } (Unique)
```

---

## ১০. অনলাইন অর্ডার ও চেকআউট স্কিমা (Online Orders)

### ১০.১ `online_orders` কালেকশন
```typescript
interface IOnlineOrder {
  _id: ObjectId;
  orderNumber: string;              // 'ORD-2026-0001' (ইউনিক ইনডেক্স)
  customerId?: ObjectId;
  customerName: string;
  customerPhone: string;
  shippingAddress: {
    address: string;
    district: string;
    thanaOrArea?: string;
  };
  items: Array<{
    variantId: ObjectId;
    productId: ObjectId;
    productName: string;
    variantName: string;
    quantity: number;
    unitPricePoisha: number;
    totalAmountPoisha: number;
  }>;
  subTotalPoisha: number;
  deliveryFeePoisha: number;
  couponDiscountPoisha: number;
  grandTotalPoisha: number;
  paymentMethod: 'cod' | 'bkash_manual' | 'nagad_manual' | 'bank_manual';
  paymentStatus: 'pending_verification' | 'paid' | 'failed' | 'refunded';
  manualPaymentDetails?: {
    senderNumber: string;
    transactionId: string;
    verifiedAt?: Date;
    verifiedById?: ObjectId;
  };
  orderStatus: 
    | 'pending'                     // নতুন অর্ডার
    | 'confirmed'                   // ফোন দিয়ে কনফার্ম
    | 'processing'                  // প্যাকিং চলছে
    | 'shipped'                     // কুরিয়ারে দেওয়া হয়েছে
    | 'delivered'                   // গ্রাহক মাল বুঝে পেয়েছেন
    | 'cancelled'                   // অর্ডার বাতিল
    | 'returned';                   // কুরিয়ার রিটার্ন
  trackingNumber?: string;
  courierName?: string;
  stockReservedUntil?: Date;
  salesInvoiceId?: ObjectId;        // ডেলিভার্ড হওয়ার পর স্বয়ংক্রিয় সেলস ইনভয়েস তৈরি
  customerNotes?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
// ইনডেক্স:
// { orderNumber: 1 } (Unique)
// { customerPhone: 1 }
// { orderStatus: 1 }
// { createdAt: -1 }
```

---

## ১১. শপ সেটিংস, অডিট ও আইডেমপোটেন্সি (Settings & Audits)

### ১১.১ `store_settings` কালেকশন
```typescript
interface IStoreSettings {
  _id: ObjectId;
  shopName: string;                 // 'লুমিনা লাগেজ অ্যান্ড ট্রাভেল শপ'
  shopAddress: string;
  shopPhone: string;
  shopEmail?: string;
  vatRegistrationNumber?: string;
  invoicePrefix: string;            // 'INV'
  invoiceFooterNoteBangla: string;  // 'আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ। পণ্য ক্রয়ের ৭ দিনের মধ্যে মেমোসহ পরিবর্তনযোগ্য।'
  thermalReceiptWidth: '58mm' | '80mm';
  deliveryFeeInsideDhakaPoisha: number;
  deliveryFeeOutsideDhakaPoisha: number;
  defaultCreditLimitPoisha: number;
  lowStockGlobalThreshold: number;
  socialLinks?: {
    facebook?: string;
    whatsapp?: string;
  };
  updatedAt: Date;
}
```

### ১১.২ `audit_logs` কালেকশন (অপরিবর্তনীয় লগ)
```typescript
interface IAuditLog {
  _id: ObjectId;
  actorId: ObjectId;                // কোন ইউজার করেছেন
  actorName: string;
  action: string;                   // 'PRODUCT_PRICE_UPDATED', 'INVOICE_CANCELLED', 'DUE_WAIVED'
  entity: string;                   // 'ProductVariant', 'SalesInvoice', 'Customer'
  entityId: ObjectId;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
// ইনডেক্স: { entityId: 1 }, { createdAt: -1 }
```

