# ইউজার রোল ও পারমিশন ম্যাট্রিক্স (RBAC & Permissions Matrix)
## Bengali Luggage & Baggage E-Commerce + POS + Shop Management System

---

## ১. অথোরাইজেশন আর্কিটেকচার নীতি (Authorization Principles)

1. **ডিনাই-বাই-ডিফল্ট (Deny-by-Default):**
   - কোনো ইউজারের কাছে কোনো অপারেশনের স্পষ্ট অনুমতি (Explicit Permission) না থাকলে সার্ভার সরাসরি অ্যাক্সেস ব্লক (HTTP 403 Forbidden) করবে।
2. **সার্ভার-সাইড এনফোর্সমেন্ট (Server-side Enforcement):**
   - ইউজার ইন্টারফেসে বাটন বা মেনু লুকানো নিরাপত্তার মূল ভিত্তি নয়। প্রতিটি Next.js Server Action এবং Route Handler এ পারমিশন গার্ড রান করবে।
3. **আইসোলেশন ও সেফ সাইন-আপ:**
   - কোনো নতুন ব্যক্তি গুগল দিয়ে লগইন করলে তাকে ডিফল্টভাবে কেবল **কাস্টমার (Customer)** রোল দেওয়া হবে।
   - দোকানের কোনো স্টাফ বা ম্যানেজারকে অ্যাক্সেস দিতে হলে স্টোর ওনার বা অ্যাডমিনকে সিস্টেমে পূর্বেই উক্ত ইমেইল/ইউজারের রোল সেট করতে হবে।
4. **ওনার বুটস্ট্র্যাপিং (Owner Bootstrapping):**
   - কোনো স্থায়ী পাবলিক "admin setup" রুট থাকবে না। প্রথম ওনার প্রোভিশন করার জন্য একটি সিকিউর CLI স্ক্রিপ্ট (`pnpm run seed:admin`) বা ওয়ান-টাইম সিকিউরিটি টোকেন এনভায়রনমেন্ট ভেরিয়েবল (`INITIAL_OWNER_SETUP_TOKEN`) ব্যবহার করা হবে।

---

## ২. ইউজার রোলসমূহের সংজ্ঞা (User Roles Definition)

| রোলের নাম (Role Name) | বাংলা নাম (Bangla Name) | বিবরণ ও দায়িত্ব (Description & Scope) |
| :--- | :--- | :--- |
| **Store Owner** | দোকানের মালিক | সিস্টেমের সর্বোচ্চ ক্ষমতাধারী। সেটিংস, আর্থিক রিপোর্ট, প্রফিট ও ইউজার ব্যবস্থাপনার পূর্ণ অ্যাক্সেস। |
| **Administrator** | সিস্টেম অ্যাডমিন | প্রতিদিনের ব্যবসা পরিচালনা, কর্মী নিয়ন্ত্রণ, প্রোডাক্ট ও ইনভেন্টরি তদারকি। |
| **Store Manager** | স্টোর ম্যানেজার | দোকানের ফিজিক্যাল বিক্রয়, স্টক সমন্বয়, রিটার্ন অনুমোদন ও কাস্টমার বাকির তদারকি। |
| **Cashier** | ক্যাশিয়ার | পিওএস কাউন্টারে সেলস ইনভয়েস তৈরি, টাকা গ্রহণ, বারকোড স্ক্যান ও স্লিপ প্রিন্ট। ক্রয়মূল্য দেখতে পারবে না। |
| **Inventory Staff** | স্টক ইনচার্জ | ওয়্যারহাউস বা দোকানে নতুন মাল রিসিভ, বারকোড লেবেল তৈরি ও ফিজিক্যাল স্টক গণনা। |
| **Accountant** | হিসাবরক্ষক | ক্যাশ/ব্যাংক ট্রানজেকশন, দোকান খরচ ভাউচার এন্ট্রি, বেতন ও লাভ-ক্ষতির অডিট। |
| **Online Order Manager**| অনলাইন ম্যানেজার | ই-কমার্স অর্ডারের ফোন ভেরিফিকেশন, প্যাকিং, কুরিয়ার স্ট্যাটাস আপডেট ও ম্যানুয়াল পেমেন্ট চেক। |
| **Customer** | সাধারণ ক্রেতা | ই-কমার্স স্টোরে পণ্য দেখা, কার্ট, অর্ডার প্লেস এবং নিজস্ব অর্ডার ট্র্যাক করা। |

---

## ৩. গ্র্যানুলার পারমিশন তালিকা (Granular Permissions List)

```typescript
export const ALL_PERMISSIONS = [
  // প্রোডাক্ট ও ক্যাটালগ
  'products.read',
  'products.create',
  'products.update',
  'products.delete',

  // ইনভেন্টরি ও স্টক
  'inventory.read',
  'inventory.adjust',

  // ক্রয় ও সাপ্লায়ার
  'purchases.read',
  'purchases.create',
  'purchases.update',

  // বিক্রয় ও পিওএস
  'sales.create',
  'sales.refund',
  'sales.discount',
  'sales.viewCost', // পণ্যের ক্রয়মূল্য বা প্রফিট মার্জিন দেখার ক্ষমতা

  // কাস্টমার ও বকেয়া
  'customers.read',
  'customers.update',
  'dues.read',
  'dues.collect',

  // ব্যয় ও ভাউচার
  'expenses.create',
  'expenses.approve',

  // বেতন ও কর্মী
  'payroll.read',
  'payroll.manage',

  // রিপোর্ট ও এনালিটিক্স
  'reports.read',
  'reports.financial', // P&L, ব্যালেন্স শীট দেখার ক্ষমতা

  // সিস্টেম
  'users.manage',
  'settings.manage',
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];
```

---

## ৪. পূর্ণাঙ্গ রোল-পারমিশন ম্যাট্রিক্স (Role-Permission Matrix)

| পারমিশন (Permission) | Owner | Admin | Manager | Cashier | Inventory | Accountant | Online Mgr | Customer |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `products.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `products.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `products.update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `products.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `inventory.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `inventory.adjust` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `purchases.read` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `purchases.create` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `purchases.update` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `sales.create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `sales.refund` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `sales.discount` | ✅ | ✅ | ✅ | ⚠️ (সীমিত) | ❌ | ❌ | ❌ | ❌ |
| `sales.viewCost` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `customers.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| `customers.update` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `dues.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `dues.collect` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `expenses.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `expenses.approve`| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `payroll.read` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `payroll.manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `reports.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `reports.financial`| ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `users.manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `settings.manage`| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## ৫. সেশন ভ্যালিডেশন ও সার্ভার গার্ড ফ্লো (Session & Guard Flow)

```
[Incoming Request / Server Action]
               |
               v
   [Read 'session' HttpOnly Cookie]
               |
               v
   [Firebase Admin SDK: verifySessionCookie()]
               |
        +------+------+
        |             | (Invalid / Expired)
     (Valid)          v
        |        [Redirect / Return 401 Unauthorized]
        v
   [Fetch User Record from MongoDB by firebaseUid]
        |
        +-- If isActive === false -> Return 403 Account Disabled
        |
        v
   [Fetch User Role and Permissions]
        |
        +-- Check if required permission is in role.permissions
        |
        +---> If Yes: Proceed with Business Service
        |
        +---> If No: Return 403 Forbidden with Bengali error: 
              "এই কাজটি করার জন্য আপনার অনুমতি নেই।"
```

