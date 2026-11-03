/**
 * ============================================================================
 * Phase 3 Authentication, RBAC & Protection Test Suite
 * ============================================================================
 */
import http from "http";

const BASE_URL = "http://127.0.0.1:3001";
const SETUP_TOKEN = "lumina_secure_owner_setup_token_change_in_production_2026";

async function runTests() {
  console.log("==================================================================");
  console.log("  লুমিনা লাগেজ - ফেজ ৩ অথেন্টিকেশন ও আরব্যাক সিকিউরিটি টেস্ট স্যুট");
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

  // 1. Test Protected Route Redirection (Unauthenticated)
  console.log("১. সুরক্ষিত রুট ও মিডলওয়্যার রিডাইরেক্ট পরীক্ষা (Unauthenticated Access):");
  try {
    const res = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
    assert(
      res.status === 307 || res.status === 302,
      `লগইন ছাড়া /admin এ গেলে রিডাইরেক্ট হচ্ছে (Status: ${res.status})`
    );
    const location = res.headers.get("location");
    assert(
      location && location.includes("/login"),
      `/login পেজে রিডাইরেক্ট পাথ পাওয়া গেছে (Location: ${location})`
    );
  } catch (e) {
    assert(false, `Protected route error: ${e.message}`);
  }

  try {
    const res = await fetch(`${BASE_URL}/pos`, { redirect: "manual" });
    assert(
      res.status === 307 || res.status === 302,
      `লগইন ছাড়া /pos এ গেলে রিডাইরেক্ট হচ্ছে (Status: ${res.status})`
    );
  } catch (e) {
    assert(false, `POS route error: ${e.message}`);
  }

  // 2. Test Public Route Access
  console.log("\n২. উন্মুক্ত পাবলিক পেজ এক্সেস পরীক্ষা:");
  try {
    const res = await fetch(`${BASE_URL}/login`);
    assert(res.status === 200, `/login পেজ সফলভাবে রেন্ডার হয়েছে (HTTP 200)`);
  } catch (e) {
    assert(false, `/login error: ${e.message}`);
  }

  // 3. Test New Google User Sign-in -> Must strictly receive 'customer' role
  console.log("\n৩. গুগল সাইন-ইন সিকিউরিটি টেস্ট (Never grant admin to Google account):");
  let customerCookie = "";
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: "google-test-customer-uid-999",
        email: "customer.test@gmail.com",
        displayName: "কাস্টমার পরীক্ষক",
      }),
    });

    const data = await res.json();
    assert(res.status === 200, `নতুন গুগল অ্যাকাউন্টে সেশন তৈরি হয়েছে (HTTP 200)`);
    assert(
      data.user && data.user.roleSlug === "customer",
      `গুগল ইউজারকে কঠোরভাবে কেবল 'customer' রোল দেওয়া হয়েছে (Role: ${data.user?.roleSlug})`
    );
    assert(
      data.user && data.user.isOwner === false,
      `গুগল ইউজারের ওনার স্ট্যাটাস false রয়েছে (isOwner: false)`
    );

    customerCookie = res.headers.get("set-cookie") || "";
    assert(customerCookie.includes("lumina_session"), `HttpOnly সেশন কুকি প্রদান করা হয়েছে`);
  } catch (e) {
    assert(false, `Google user test error: ${e.message}`);
  }

  // 4. Test Customer Privilege Escalation Rejection (Deny-by-default)
  console.log("\n৪. সাধারণ কাস্টমার দিয়ে অ্যাডমিন এপিআই কল (Deny-by-Default Rejection):");
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: customerCookie },
    });
    const data = await res.json();
    assert(
      res.status === 403,
      `কাস্টমার অ্যাডমিন রুট এক্সেস করতে গেলে 403 Forbidden পেয়েছে (Status: ${res.status})`
    );
    assert(
      data.error && (data.error.includes("অনুমতি আপনার নেই") || data.error.includes("অনুমতি")),
      `বাংলা এরর মেসেজ প্রদর্শিত হয়েছে: "${data.error}"`
    );
  } catch (e) {
    assert(false, `Customer authorization test error: ${e.message}`);
  }

  // 5. Test Owner Provisioning Security
  console.log("\n৫. স্টোর ওনার (মালিক) বুটস্ট্র্যাপ নিরাপত্তা পরীক্ষা:");
  try {
    // Attempt with invalid token
    const fakeRes = await fetch(`${BASE_URL}/api/admin/seed-owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setupToken: "wrong_fake_token_123",
        email: "hacker@test.com",
        displayName: "অবৈধ ওনার",
        firebaseUid: "fake-uid",
      }),
    });
    assert(fakeRes.status === 403, `ভুল টোকেনে ওনার তৈরি ব্লক করা হয়েছে (HTTP 403)`);

    // Attempt with valid setup token
    const validRes = await fetch(`${BASE_URL}/api/admin/seed-owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setupToken: SETUP_TOKEN,
        email: "alamgir.owner@luminaluggage.com",
        displayName: "আলমগীর কবির (মালিক)",
        firebaseUid: "owner-real-uid-001",
      }),
    });
    const validData = await validRes.json();
    assert(validRes.status === 200, `সঠিক টোকেন দিয়ে ওনার সফলভাবে প্রোভিশন হয়েছে (HTTP 200)`);
    assert(validData.user && validData.user.isOwner === true, `ওনার ফ্ল্যাগ সত্য রয়েছে`);
  } catch (e) {
    assert(false, `Owner provisioning test error: ${e.message}`);
  }

  // 6. Test Owner Login & Full Access
  console.log("\n৬. স্টোর ওনারের লগইন ও ম্যানেজমেন্ট এক্সেস পরীক্ষা:");
  let ownerCookie = "";
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: "owner-real-uid-001",
        email: "alamgir.owner@luminaluggage.com",
        displayName: "আলমগীর কবির (মালিক)",
      }),
    });

    const data = await res.json();
    assert(res.status === 200, `ওনার সেশন সফলভাবে তৈরি হয়েছে`);
    assert(data.user && data.user.roleSlug === "owner", `ওনার রোল নিশ্চিত হয়েছে (Role: owner)`);
    assert(data.user && data.user.isOwner === true, `isOwner === true নিশ্চিত হয়েছে`);
    ownerCookie = res.headers.get("set-cookie") || "";

    // Test access to users management
    const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: ownerCookie },
    });
    const usersData = await usersRes.json();
    assert(usersRes.status === 200, `ওনার হিসেবে /api/admin/users এক্সেস সফল (HTTP 200)`);
    assert(Array.isArray(usersData.users), `ডাটাবেস থেকে ইউজার তালিকা লোড হয়েছে`);
    assert(Array.isArray(usersData.roles), `ডাটাবেস থেকে রোল তালিকা লোড হয়েছে`);
  } catch (e) {
    assert(false, `Owner access test error: ${e.message}`);
  }

  // 7. Test Logout
  console.log("\n৭. লগআউট ও সেশন বিলোপ পরীক্ষা:");
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, { method: "DELETE" });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, `লগআউট সফল হয়েছে`);
    const cookie = res.headers.get("set-cookie") || "";
    assert(cookie.includes("Max-Age=0"), `সেশন কুকি শূন্য করে বিলোপ করা হয়েছে`);
  } catch (e) {
    assert(false, `Logout test error: ${e.message}`);
  }

  console.log("\n------------------------------------------------------------------");
  console.log(`  টেস্ট ফলাফল: মোট পাস = ${passed}, ফেল = ${failed}`);
  console.log("------------------------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

