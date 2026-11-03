# লুমিনা লাগেজ - ভার্সেল (Vercel) ও ক্লাউড প্রোডাকশন ডিপ্লয়মেন্ট নির্দেশিকা
## Lumina Luggage & Baggage Management System — Production Deployment Guide

এই নির্দেশিকাটি লুমিনা লাগেজ ই-কমার্স, পিওএস ও শপ ম্যানেজমেন্ট সিস্টেমটি ভার্সেল (Vercel), মঙ্গোডিবি অ্যাটলাস (MongoDB Atlas), ফায়ারবেস (Firebase) এবং ক্লাউডিনারি (Cloudinary) ক্লাউডে নিরাপদে প্রোডাকশনে চালু করার জন্য প্রস্তুত করা হয়েছে।

---

### ১. মঙ্গোডিবি অ্যাটলাস ক্লাস্টার কনফিগারেশন (MongoDB Atlas Setup)

১. **ডাটাবেস ক্লাস্টার তৈরি**:
   - [MongoDB Atlas](https://cloud.mongodb.com)-এ লগইন করে একটি M0 (ফ্রি) অথবা ডেডিকেটেড ক্লাস্টার তৈরি করুন।
   - ডাটাবেসের নাম দিন: `lumina_luggage`।

২. **ডাটাবেস ইউজার তৈরি**:
   - `Database Access` ট্যাবে গিয়ে `Add New Database User` সিলেক্ট করুন।
   - একটি নিরাপদ ইউজারনেম এবং জটিল পাসওয়ার্ড তৈরি করুন (পাসওয়ার্ডে বিশেষ ক্যারেক্টার যেমন `@` বা `#` থাকলে URL Encode করে নিন)।
   - রোল নির্ধারণ করুন: `Read and write to any database`।

৩. **নেটওয়ার্ক এক্সেস (IP Whitelist - অত্যন্ত গুরুত্বপূর্ণ)**:
   - `Network Access` ট্যাবে যান।
   - `Add IP Address` বাটনে ক্লিক করে `Allow Access from Anywhere` (`0.0.0.0/0`) যুক্ত করুন।
   - *কারণ*: ভার্সেলের সার্ভারলেস ফাংশন ডায়নামিক আইপি থেকে পরিচালিত হয়, তাই এটি ছাড়া সার্ভারলেস ফাংশন ডাটাবেসের সাথে সংযোগ স্থাপন করতে পারবে না।

৪. **কানেকশন স্ট্রিং সংগ্রহ**:
   - ক্লাস্টারে `Connect` -> `Drivers` (Node.js) সিলেক্ট করুন।
   - কানেকশন স্ট্রিংটি কপি করুন:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/lumina_luggage?retryWrites=true&w=majority
     ```

---

### ২. ফায়ারবেস অথেন্টিকেশন ও অনুমোদিত ডোমেইন (Firebase Auth & Domains)

১. **গুগল সাইন-ইন সচল করা**:
   - [Firebase Console](https://console.firebase.google.com)-এ যান।
   - `Authentication` -> `Sign-in method` ট্যাবে গিয়ে `Google` এনাবল (Enable) করুন।

২. **অনুমোদিত ডোমেইন যোগ করা (Authorized Domains)**:
   - `Authentication` -> `Settings` -> `Authorized domains`-এ যান।
   - `Add domain` বাটনে ক্লিক করে আপনার ভার্সেলের ডোমেইনগুলো যুক্ত করুন:
     - `your-app.vercel.app` (আপনার ভার্সেল প্রজেক্টের সাবডোমেইন)
     - আপনার নিজস্ব কাস্টম ডোমেইন (যেমন: `luminaluggage.com`), যদি থাকে।
   - *গুরুত্ব*: এটি যুক্ত না করলে ব্যবহারকারী ও কর্মচারীরা গুগল দিয়ে লগইন করার সময় `auth/unauthorized-domain` এরর পাবেন।

৩. **ফায়ারবেস অ্যাডমিন সার্ভিস অ্যাকাউন্ট কি (Service Account Key)**:
   - `Project Settings` (গিয়ার আইকন) -> `Service accounts` ট্যাবে যান।
   - `Firebase Admin SDK` সিলেক্ট থাকা অবস্থায় `Generate new private key` বাটনে ক্লিক করে JSON ফাইলটি ডাউনলোড করুন।
   - JSON ফাইল থেকে নিচের মানগুলো সংগ্রহ করুন:
     - `project_id`
     - `client_email`
     - `private_key`

---

### ৩. ক্লাউডিনারি ক্লাউড স্টোরেজ (Cloudinary Image Hosting)

১. [Cloudinary Dashboard](https://cloudinary.com)-এ লগইন করুন।
২. ড্যাশবোর্ড থেকে নিচের ৩টি ক্রেডেনশিয়াল সংগ্রহ করুন:
   - `Cloud Name`
   - `API Key`
   - `API Secret`
৩. পণ্যের ছবি ও ব্যানার স্বয়ংক্রিয়ভাবে ক্লাউডিনারিতে আপলোড হবে এবং সেখান থেকে স্বয়ংক্রিয়ভাবে অপ্টিমাইজড ওয়েবপি (WebP) ফরম্যাটে দ্রুতগতির সিডিএন (CDN) এর মাধ্যমে প্রদর্শিত হবে।

---

### ৪. ভার্সেল (Vercel) ডিপ্লয়মেন্ট প্রক্রিয়া

১. **GitHub রিপোজিটরি সংযোগ**:
   - আপনার কোডটি GitHub প্রাইভেট রিপোজিটরিতে পুশ করুন।
   - [Vercel Dashboard](https://vercel.com)-এ যান এবং `Add New...` -> `Project` সিলেক্ট করুন।
   - GitHub থেকে `luggage-shop-management` রিপোজিটরিটি `Import` করুন।

২. **প্রজেক্ট সেটিংস**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./` (অথবা ডিফল্ট)
   - **Build Command**: `next build`
   - **Output Directory**: `.next`

৩. **পরিবেশ ভ্যারিয়েবল (Environment Variables) কনফিগারেশন**:
   Vercel ড্যাশবোর্ডের `Environment Variables` সেকশনে নিচের ভ্যারিয়েবলগুলো যোগ করুন:

   | ভ্যারিয়েবলের নাম | বিবরণ / উৎস |
   |-------------------|-------------|
   | `MONGODB_URI` | MongoDB Atlas কানেকশন স্ট্রিং |
   | `FIREBASE_PROJECT_ID` | ফায়ারবেস প্রজেক্ট আইডি |
   | `FIREBASE_CLIENT_EMAIL` | ফায়ারবেস সার্ভিস অ্যাকাউন্ট ক্লায়েন্ট ইমেইল |
   | `FIREBASE_PRIVATE_KEY` | সার্ভিস অ্যাকাউন্ট প্রাইভেট কি (লাইনব্রেক `\n` সহ) |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | ফায়ারবেস পাবলিক এপিআই কি |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ফায়ারবেস অথ ডোমেইন |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ফায়ারবেস প্রজেক্ট আইডি |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| ফায়ারবেস স্টোরেজ বাকেট |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ফায়ারবেস সেন্ডার আইডি |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | ফায়ারবেস অ্যাপ আইডি |
   | `INITIAL_OWNER_SETUP_TOKEN` | একটি অতি গোপনীয় শক্তিশালী টোকেন (মালিক প্রোভিশনের জন্য) |
   | `SESSION_COOKIE_NAME` | `lumina_session` |
   | `SESSION_COOKIE_MAX_AGE` | `432000000` (৫ দিন) |
   | `NEXT_PUBLIC_APP_URL` | আপনার আসল ভার্সেল ইউআরএল (যেমন `https://lumina-luggage.vercel.app`) |
   | `CLOUDINARY_CLOUD_NAME` | ক্লাউডিনারি ক্লাউড নেম |
   | `CLOUDINARY_API_KEY` | ক্লাউডিনারি এপিআই কি |
   | `CLOUDINARY_API_SECRET` | ক্লাউডিনারি এপিআই সিক্রেট |

৪. **Deploy বাটনে ক্লিক করুন**:
   - `Deploy` বাটনে চাপলে ভার্সেল স্বয়ংক্রিয়ভাবে বিল্ড করবে এবং অ্যাপটি লাইভ করে দেবে।

---

### ৫. প্রথমবার স্টোর ওনার (মালিক) অ্যাকাউন্ট সক্রিয়করণ (One-Time Owner Provisioning)

নিরাপত্তা আর্কিটেকচার অনুযায়ী কোনো গুগল অ্যাকাউন্টকে স্বয়ংক্রিয়ভাবে অ্যাডমিন বা ওনার রোল দেওয়া হয় না। লাইভ সাইটে প্রথমবার মালিক অ্যাকাউন্ট সক্রিয় করার নিয়ম:

১. লাইভ সাইটের `/login` পেজে গিয়ে আপনার গুগল অ্যাকাউন্ট দিয়ে লগইন করুন (প্রাথমিকভাবে এটি একটি সাধারণ গ্রাহক অ্যাকাউন্ট হিসেবে যুক্ত হবে)।
২. আপনার টার্মিনাল বা Postman/cURL দিয়ে একটি নিরাপদ `POST` রিকোয়েস্ট পাঠান:
   ```bash
   curl -X POST https://your-app.vercel.app/api/admin/seed-owner \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your-owner-email@gmail.com",
       "setupToken": "your_secure_initial_owner_setup_token"
     }'
   ```
৩. সফল হলে রেসপন্স আসবে `status: 200` এবং আপনার অ্যাকাউন্টটি সর্বোচ্চ ক্ষমতাসম্পন্ন `owner` রোলে আপগ্রেড হবে।
৪. এরপর আপনি ব্রাউজার রিলোড করলেই সম্পূর্ণ `/admin` ও `/pos` ড্যাশবোর্ড ব্যবহারের অনুমতি পাবেন।
৫. ভবিষ্যতে সুরক্ষার জন্য Vercel Settings থেকে `INITIAL_OWNER_SETUP_TOKEN` ভ্যারিয়েবলটি মুছে দিতে পারেন।

---

### ৬. পোস্ট-ডিপ্লয়মেন্ট ভেরিফিকেশন চেকলিস্ট (Post-Deployment Verification)

- [ ] পাবলিক স্টোরফ্রন্ট (`/` ও `/shop`) সঠিকভাবে লোড হচ্ছে এবং বাংলা ফন্ট ঠিক আছে কিনা।
- [ ] গুগল লগইন ও সেশন কুকি সফলভাবে তৈরি হচ্ছে কিনা।
- [ ] পিওএস ইন্টারফেস (`/pos`) লোড হচ্ছে এবং পণ্য কার্টে যুক্ত করা যাচ্ছে কিনা।
- [ ] ইনভয়েস প্রিন্ট প্রিভিউ (`/print/receipt/[id]`) সঠিকভাবে খুলছে কিনা।
- [ ] অ্যাডমিন প্যানেলে পণ্যের ছবি ক্লাউডিনারিতে আপলোড হচ্ছে কিনা।
- [ ] ডাটাবেসে নতুন পণ্য ও অর্ডার মঙ্গোডিবি অ্যাটলাসে সংরক্ষিত হচ্ছে কিনা।

