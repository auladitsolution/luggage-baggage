# সিস্টেম আর্কিটেকচার ও টেকনিক্যাল ডিজাইন (System Architecture & Technical Design)
## Bengali Luggage & Baggage E-Commerce + POS + Shop Management System

---

## ১. ভূমিকা ও লক্ষ্য (Introduction & Core Purpose)
এই সিস্টেমটি বাংলাদেশের একটি বাস্তব লাগেজ ও ব্যাগ রিটেল ব্যবসার জন্য তৈরি করা একটি সমন্বিত (Integrated) প্ল্যাটফর্ম। এটি একই সাথে:
1. সাধারণ ক্রেতাদের জন্য আধুনিক, আকর্ষণীয় ও মোবাইল-ফ্রেন্ডলি ই-কমার্স স্টোরফ্রন্ট (E-Commerce Storefront)।
2. দোকানে দ্রুত কাউন্টার বিক্রির জন্য হাই-পারফরম্যান্স পয়েন্ট-অব-সেল (POS) সিস্টেম।
3. কেন্দ্রীভূত ও রিয়েল-টাইম স্টক ব্যবস্থাপনা (Centralized Inventory Management)।
4. কাস্টমার ও সাপ্লায়ারের পূর্ণাঙ্গ বাকির খাতা ও লেজার (Credit / Due Ledger)।
5. দৈনিক ক্যাশ, ব্যাংক ও মোবাইল ফিনান্সিয়াল সার্ভিস (bKash/Nagad) হিসাব এবং ডাবল-এন্ট্রি বুককিপিং।
6. কর্মচারী বেতন (Payroll), দোকান খরচ (Expenses) ও লাভ-ক্ষতির (P&L) রিপোর্ট পরিচালনা করবে।

সিস্টেমটি সম্পূর্ণ বাংলা ভাষাভিত্তিক (Bengali-first), যেখানে **Hind Siliguri** ফন্ট এবং বাংলাদেশী কারেন্সি (৳) ও টাইমজোন (`Asia/Dhaka`) ব্যবহৃত হবে।

---

## ২. সিস্টেম টপোলজি ও হাই-লেভেল আর্কিটেকচার (System Topology)

```
                              +---------------------------------------------------+
                              |                 Clients & Users                   |
                              +---------------------------------------------------+
                                   |                   |                     |
                                   v                   v                     v
                        [Public Storefront]    [Cashier POS / Scanner] [Admin / Management]
                        (Customers & Mobile)    (Desktop / Tablet)     (Owner & Staff)
                                   |                   |                     |
                                   +-------------------+---------------------+
                                                       |
                                                       | HTTPS / Next.js SSR & API
                                                       v
            +-----------------------------------------------------------------------------------+
            |                           Next.js App Router (Vercel)                             |
            |                                                                                   |
            |   [Presentation Layer]                                                            |
            |    - Tailwind CSS + shadcn/ui + Radix UI + Lucide Icons                           |
            |    - Hind Siliguri Typography + Bengali Localization Dictionaries                 |
            |                                                                                   |
            |   [Edge / Middleware Layer]                                                       |
            |    - Next.js Middleware (Session Cookie Validation, Route Guards)                |
            |                                                                                   |
            |   [Application & Domain Service Layer] (Node.js Serverless Functions)             |
            |    - Auth & RBAC Service (Firebase Admin SDK + MongoDB User Mapping)             |
            |    - Product & Catalog Service                                                    |
            |    - Inventory Service (Atomic Allocation, Movement Ledger, Reservation TTL)      |
            |    - POS & Sales Service (Atomic Invoicing, Multi-Payment, Due Posting)           |
            |    - Customer & Credit Ledger Service (Auditable Due Allocation)                  |
            |    - Purchasing & Supplier Service                                                |
            |    - Accounting & Cash Flow Service (Double-Entry Journal & P&L Engine)           |
            |    - Cloudinary Media Service (Signed Uploads & Transformations)                  |
            |    - Reporting & Export Engine (Excel, CSV, PDF Generation)                       |
            +-----------------------------------------------------------------------------------+
                       |                       |                              |
                       v                       v                              v
             +--------------------+  +--------------------+         +--------------------+
             |   MongoDB Atlas    |  |  Firebase Auth     |         |   Cloudinary CDN   |
             |  (Primary Database |  |  (Google Sign-in & |         |  (Optimized Images |
             |  ACID Transactions |  |   Identity Tokens) |         |  WebP/AVIF Format) |
             |  Integer Poisha)   |  +--------------------+         +--------------------+
             +--------------------+
```

---

## ৩. কোর টেকনোলজি স্ট্যাক ও সংস্করণ নির্বাচন (Technology Stack & Versions)

| উপাদান (Component) | প্রযুক্তি (Technology) | ভূমিকা ও যৌক্তিকতা (Role & Rationale) |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ (App Router) | হাইব্রিড রেন্ডারিং (SSR, SSG, ISR), সার্ভার অ্যাকশন এবং অপ্টিমাইজড সার্ভারলেস এক্সিকিউশন। |
| **Language** | TypeScript (Strict Mode) | টাইপ-সেফ বিজনেস লজিক, ইন্টারফেস ও মডেল যা রানটাইম বাগ রোধ করে। |
| **Database** | MongoDB Atlas | ডাইনামিক ভেরিয়েন্ট (সাইজ, কালার), নেস্টেড অবজেক্ট এবং ACID ট্রানজেকশনের জন্য উপযুক্ত। |
| **ODM / Driver** | Mongoose (or native MongoDB) | স্ট্রিক্ট স্কিমা ভ্যালিডেশন, ইনডেক্সিং এবং কানেকশন পুলিং। |
| **UI & Styling** | Tailwind CSS + shadcn/ui | আধুনিক, পরিচ্ছন্ন, অ্যাক্সেসিবল রিটেল ডিজাইন সিস্টেম ও রেস্পন্সিভ কম্পোনেন্ট। |
| **Font** | `next/font/google` (Hind Siliguri) | বাংলায় চমৎকার লেজিটিবিলিটি ও ছোট মোবাইল স্ক্রিনে নিখুঁত রেন্ডারিং। |
| **Authentication** | Firebase Auth (Client) + Firebase Admin SDK (Server) | গুগল ওটিপি/লগইন, সুরক্ষিত `HttpOnly` সেশন কুকিজ এবং সিকিউর আইডি টোকেন ভ্যালিডেশন। |
| **Image Storage** | Cloudinary (Direct Signed Upload) | প্রোডাক্ট ছবির সিকিউর আপলোড, অটোমেটিক WebP/AVIF রূপান্তর এবং ফাস্ট CDN ডেলিভারি। |
| **Barcodes** | `jsbarcode` / `bwip-js` & Scanner Listener | Code-128 বারকোড জেনারেশন, থার্মাল লেবেল প্রিন্ট এবং কিবোর্ড এমুলেশন বারকোড রিডিং। |
| **State & Forms** | React Hook Form + Zod + TanStack Query | ফর্ম ভ্যালিডেশন, সার্ভার স্টেট ক্যাশিং এবং রিঅ্যাক্টিভ POS ডেটা হ্যান্ডলিং। |
| **Financial Engine** | Integer Minor Units (Poisha) | কোনো ফ্লোটিং-পয়েন্ট এরর ছাড়া সঠিক হিসাব (৳১.০০ = ১০০ পয়সা)। |
| **Hosting** | Vercel | দ্রুত গ্লোবাল এজ ডেলিভারি ও স্বয়ংক্রিয় CI/CD ডিপ্লয়মেন্ট। |

---

## ৪. সার্ভারলেস আর্কিটেকচারাল বিবেচ্য বিষয় (Vercel Serverless Architecture)

1. **ডাটাবেস কানেকশন রি-ইউজ (Connection Caching):**
   - সার্ভারলেস ল্যাম্বডা ফাংশনে প্রতি রিকোয়েস্টে নতুন কানেকশন তৈরি রোধে গ্লোবাল ক্যাশড `mongoose.connect()` বা `MongoClient` প্যাটার্ন ব্যবহার করা হবে।
2. **স্টেটলেসনেস (Stateless Architecture):**
   - কোনো লোকাল ফাইল সিস্টেমে স্থায়ী ডেটা রাখা হবে না। আপলোড সরাসরি ক্লাউডিনারি সইযুক্ত (Signed) ইউআরএলে যাবে।
3. **স্টক রিজার্ভেশন ক্লিনআপ (Stock Reservation Expiry Worker):**
   - অনলাইনে কার্টে প্রোডাক্ট থাকলে সর্বোচ্চ ১৫ মিনিটের জন্য স্টক রিজার্ভ থাকবে। Vercel Cron Jobs বা ডেডিকেটেড ব্যাকগ্রাউন্ড শিডিউলার দিয়ে প্রতি ৫ মিনিট পর পর এক্সপায়ার হওয়া রিজার্ভেশন স্বয়ংক্রিয়ভাবে রিলিজ করা হবে।
4. **এজ ভার্সেস নোডজেস রানটাইম (Runtime Isolation):**
   - Firebase Admin SDK এবং MongoDB ড্রাইভার সম্পূর্ণ Node.js রানটাইমে এক্সিকিউট হবে (Edge runtime এ চালানো হবে না)।

---

## ৫. ফোল্ডার স্ট্রাকচার (Repository Directory Structure)

```
luggage-shop-management/
├── .github/
│   └── workflows/              # CI/CD পাইপলাইন
├── docs/                       # পূর্ণাঙ্গ টেকনিক্যাল ও বিজনেস ডকুমেন্টেশন
│   ├── architecture.md
│   ├── database-schema.md
│   ├── permissions.md
│   ├── business-rules.md
│   └── implementation-plan.md
├── src/
│   ├── app/                    # Next.js App Router রুটসমূহ
│   │   ├── (storefront)/       # ই-কমার্স পাবলিক রুটস
│   │   │   ├── page.tsx        # হোমপেজ
│   │   │   ├── shop/           # ক্যাটালগ ও ফিল্টার
│   │   │   ├── shop/[slug]/    # প্রোডাক্ট বিস্তারিত
│   │   │   ├── categories/     # ক্যাটাগরি তালিকা
│   │   │   ├── cart/           # কার্ট পেজ
│   │   │   ├── checkout/       # চেকআউট
│   │   │   └── account/        # কাস্টমার একাউন্ট ও অর্ডার হিস্ট্রি
│   │   ├── (auth)/             # লগইন ও সেশন
│   │   │   ├── login/
│   │   │   └── api/auth/
│   │   ├── (management)/       # সুরক্ষিত অ্যাডমিন ড্যাশবোর্ড
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx    # ড্যাশবোর্ড ওভারভিউ ও কেপিআই
│   │   │   │   ├── products/   # প্রোডাক্ট ও ভ্যারিয়েন্ট
│   │   │   │   ├── inventory/  # স্টক ব্যালেন্স ও মুভমেন্ট
│   │   │   │   ├── sales/      # বিক্রয় ও ইনভয়েস
│   │   │   │   ├── orders/     # অনলাইন অর্ডার প্রসেসিং
│   │   │   │   ├── purchases/  # সাপ্লায়ার পারচেজ ও জিআরএন
│   │   │   │   ├── customers/  # কাস্টমার তালিকা ও লেজার
│   │   │   │   ├── dues/       # বকেয়া হিসাব ও কালেকশন
│   │   │   │   ├── suppliers/  # সরবরাহকারী তালিকা ও দেনা
│   │   │   │   ├── expenses/   # দোকান খরচের ভাউচার
│   │   │   │   ├── employees/  # কর্মচারী তালিকা
│   │   │   │   ├── payroll/    # বেতন ও পে-স্লিপ
│   │   │   │   ├── accounts/   # ক্যাশ ও ব্যাংক হিসাব
│   │   │   │   ├── reports/    # অডিট ও আর্থিক রিপোর্ট
│   │   │   │   ├── users/      # ইউজার ও রোল পারমিশন
│   │   │   │   └── settings/   # শপ কনফিগারেশন
│   │   ├── (pos)/              # ফুলস্ক্রিন ফাস্ট ক্যাশিয়ার পিওএস
│   │   │   ├── pos/
│   │   │   │   └── page.tsx
│   │   │   └── print/          # ডেডিকেটেড প্রিন্ট ভিউ (থার্মাল ও A4)
│   │   │       ├── invoice/[id]/
│   │   │       ├── receipt/[id]/
│   │   │       └── barcode/
│   │   └── api/                # সার্ভার রুট হ্যান্ডলারসমূহ
│   │       ├── pos/
│   │       ├── webhook/
│   │       └── cron/
│   ├── components/             # রি-ইউজেবল ইউআই কম্পোনেন্টস
│   │   ├── ui/                 # shadcn/ui কম্পোনেন্টস (Button, Dialog, etc.)
│   │   ├── storefront/         # ই-কমার্স ইউজার ইন্টারফেস কম্পোনেন্টস
│   │   ├── pos/                # বারকোড রিডার, পিওএস কার্ট, পেমেন্ট মডাল
│   │   ├── admin/              # টেবিল, সাইডবার, স্ট্যাট কার্ড, ফিল্টার
│   │   ├── print/              # প্রিন্ট ফ্রেন্ডলি ভাউচার ও রসিদ লেআউট
│   │   └── shared/             # বাংলা কারেন্সি ফরম্যাটার, ডেট পিকার ইত্যাদি
│   ├── lib/                    # লাইব্রেরি ও কোর হেল্পার
│   │   ├── db/                 # MongoDB কানেকশন ও ট্রানজেকশন হেল্পার
│   │   ├── firebase/           # Firebase Client ও Firebase Admin SDK
│   │   ├── cloudinary/         # ক্লাউডিনারি আপলোড ও ট্রান্সফরমেশন
│   │   ├── localization/       # বাংলা অভিধান ও ট্রান্সলেশন কি
│   │   ├── utils/              # কারেন্সি, বারকোড ও ডেট ফরম্যাটিং
│   │   └── rbac/               # রোল ও পারমিশন গার্ড
│   ├── models/                 # Mongoose / MongoDB স্কিমা ও মডেলসমূহ
│   ├── services/               # পিওর বিজনেস লজিক সার্ভিসেস
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── inventory.service.ts
│   │   ├── pos.service.ts
│   │   ├── credit.service.ts
│   │   ├── purchase.service.ts
│   │   ├── accounting.service.ts
│   │   └── report.service.ts
│   └── types/                  # গ্লোবাল টাইপ ডেফিনিশন ও ইন্টারফেস
├── tests/                      # টেস্ট স্যুট
│   ├── unit/                   # সার্ভিস ও ক্যালকুলেশন টেস্ট
│   ├── integration/            # ট্রানজেকশন ও স্কিমা টেস্ট
│   └── e2e/                    # Playwright এন্ড-টু-এন্ড ব্রাউজার টেস্ট
├── public/                     # স্ট্যাটিক অ্যাসেট
└── package.json
```

---

## ৬. লোকলাইজেশন ও ইউজার এক্সপেরিয়েন্স আর্কিটেকচার (Localization Architecture)

1. **ফন্ট স্ট্র্যাটেজি:**
   - Google Font `Hind Siliguri` (লোকাল ক্যাশড উইথ `next/font/google`) সম্পূর্ণ অ্যাপ্লিকেশনে ডিফল্ট হিসেবে লোড হবে।
   - কোড এবং বারকোড ডিসপ্লেতে মনোপেস ফন্ট ফলব্যাক থাকবে।
2. **সেন্ট্রালাইজড বাংলা ডিকশনারি (`src/lib/localization/bn.ts`):**
   - প্রতিটি ন্যাভিগেশন, বাটন, কলাম টাইটেল, অ্যালার্ট এবং ইনভয়েস টেক্সট সেন্ট্রালাইজড ডিকশনারি থেকে পরিবেশিত হবে।
   - প্রাকৃতিক বাংলা পরিভাষা ব্যবহার করা হবে (যেমন: "Add to Cart" -> "কার্টে যোগ করুন", "Out of Stock" -> "স্টক শেষ", "Due Balance" -> "বকেয়া ব্যালেন্স")।
3. **কারেন্সি ও সংখ্যা হ্যান্ডলিং:**
   - ডাটাবেসে টাকা পয়সা সবসময় পূর্ণসংখ্যায় (Integer Minor Units - Poisha) সংরক্ষিত থাকবে (যেমন: ৳১,৫০০ = ১৫০০০০ পয়সা)।
   - ডিসপ্লে করার জন্য সেন্ট্রালাইজড `formatBDT(poisha)` ফাংশন বাংলা বা ইংরেজি সংখ্যায় রূপান্তর করবে এবং ৳ প্রতীক যুক্ত করবে।
   - ফিনান্সিয়াল ইনপুট ফিল্ডে ব্যবহারকারী যাতে ইংরেজি ডিজিট সহজে লিখতে পারেন তা নিশ্চিত করা হবে।

---

## ৭. ডেটা ইন্টিগ্রিটি ও সিকিউরিটি নীতি (Security Architecture)

1. **জিরো ট্রাস্ট ও ডিনাই বাই ডিফল্ট (Deny by Default):**
   - প্রতিটি সার্ভার অ্যাকশন এবং রুট হ্যান্ডলারে সেশন আইডি যাচাইয়ের পাশাপাশি ইউজারের সুনির্দিষ্ট পারমিশন (যেমন: `sales.create`, `payroll.read`) সার্ভার-সাইডে চেক করা হবে।
2. **আইসোলেটেড ক্রেডেনশিয়ালস:**
   - Firebase Private Key, MongoDB Connection String, Cloudinary Secret শুধুমাত্র সার্ভার এনভায়রনমেন্ট ভেরিয়েবলে থাকবে। কোনো ক্লায়েন্ট বান্ডেলে এক্সপোজ হবে না।
3. **অডিট ট্রেইল (Immutable Audit Logging):**
   - স্টক পরিবর্তন, বকেয়া সমন্বয়, ইনভয়েস বাতিল, প্রোডাক্টের ক্রয়মূল্য বা বিক্রয়মূল্য পরিবর্তন প্রতিটি কাজের জন্য স্বয়ংক্রিয়ভাবে অডিট লগ তৈরি হবে।
4. **আইডেমপোটেন্সি (Idempotency Key):**
   - পিওএস বিক্রয় বা অনলাইনে অর্ডার কনফার্ম করার সময় ক্লায়েন্ট থেকে জেনারেট হওয়া `idempotencyKey` সার্ভার রেকর্ড করবে, যাতে নেটওয়ার্ক রিট্রাই বা ডাবল ক্লিকের কারণে একই সেল দুবার না হয়।

