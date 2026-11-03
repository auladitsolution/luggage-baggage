import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";

async function runTests() {
  console.log("=================================================");
  console.log("  Testing Store Owner & Staff Management Auth    ");
  console.log("=================================================");

  // 1. Authenticate with Store Owner credentials
  console.log("\n[Test 1] Logging in with Official Store Owner credentials...");
  const ownerRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "luggage.baggage26@gmail.com",
      password: "@24272920",
    }),
  });

  const ownerData = await ownerRes.json();
  assert.equal(ownerRes.status, 200, `Login should succeed: ${JSON.stringify(ownerData)}`);
  assert.equal(ownerData.success, true);
  assert.equal(ownerData.user.isOwner, true, "User should be marked as isOwner: true");
  assert.equal(ownerData.user.roleSlug, "owner", "Role should be owner");
  assert.equal(ownerData.user.displayName, "Md. Sohel Sikder & Md. Alam");
  assert.ok(ownerData.user.permissions.length >= 20, "Owner should have all system permissions");
  console.log("✓ Store Owner authenticated successfully with full permissions!");

  // Extract owner session cookie
  const cookieHeader = ownerRes.headers.get("set-cookie");
  assert.ok(cookieHeader, "Should return session cookie");
  const sessionCookie = cookieHeader.split(";")[0];

  // 2. Reject incorrect password
  console.log("\n[Test 2] Testing incorrect password rejection...");
  const wrongPassRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "luggage.baggage26@gmail.com",
      password: "WrongPassword123!",
    }),
  });
  assert.equal(wrongPassRes.status, 401, "Wrong password must be rejected with 401");
  console.log("✓ Incorrect password properly rejected!");

  // 3. Fetch users and roles with owner session
  console.log("\n[Test 3] Fetching users list as Store Owner...");
  const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: sessionCookie },
  });
  const usersData = await usersRes.json();
  assert.equal(usersRes.status, 200, "Owner should be authorized to read users list");
  assert.ok(Array.isArray(usersData.users), "Should return users array");
  assert.ok(Array.isArray(usersData.roles), "Should return roles array");
  console.log(`✓ Fetched ${usersData.users.length} users and ${usersData.roles.length} roles successfully!`);

  // Find a staff role (e.g., manager or cashier)
  const cashierRole = usersData.roles.find((r) => r.slug === "cashier") || usersData.roles[0];
  assert.ok(cashierRole, "Cashier role should exist");

  // 4. Owner creates new staff with ID & Password
  const testUsername = "cashier_test_" + Date.now().toString().slice(-4);
  console.log(`\n[Test 4] Owner creating new staff: ${testUsername}...`);
  const createRes = await fetch(`${BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      displayName: "মোঃ রাকিব হাসান (ক্যাশিয়ার)",
      username: testUsername,
      password: "CashierPassword#123",
      roleId: cashierRole._id,
      phone: "01711223344",
    }),
  });
  const createData = await createRes.json();
  assert.equal(createRes.status, 200, `Staff creation should succeed: ${JSON.stringify(createData)}`);
  assert.equal(createData.success, true);
  console.log("✓ Owner successfully provisioned staff account with ID and Password!");

  // 5. Staff logs in with username & password
  console.log("\n[Test 5] Staff logging in with username & password...");
  const staffLoginRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: testUsername,
      password: "CashierPassword#123",
    }),
  });
  const staffData = await staffLoginRes.json();
  assert.equal(staffLoginRes.status, 200, `Staff login should succeed: ${JSON.stringify(staffData)}`);
  assert.equal(staffData.success, true);
  assert.equal(staffData.user.isOwner, false, "Staff should not be owner");
  assert.equal(staffData.user.roleSlug, cashierRole.slug);
  console.log("✓ Staff logged in successfully with provisioned credentials!");

  // 6. Test Shop Settings API (GET /api/admin/settings)
  console.log("\n[Test 6] Fetching Shop Settings as Store Owner...");
  const settingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    headers: { Cookie: sessionCookie },
  });
  const settingsData = await settingsRes.json();
  assert.equal(settingsRes.status, 200, `Settings fetch should succeed: ${JSON.stringify(settingsData)}`);
  assert.equal(settingsData.success, true);
  assert.ok(settingsData.settings, "Should return settings object");
  assert.equal(settingsData.settings.organizationName, "Luggage & Baggage");
  assert.equal(settingsData.settings.mobile, "01869749988");
  console.log("✓ Shop settings fetched successfully with correct organization details!");

  // 7. Test Shop Settings Update (PUT /api/admin/settings)
  console.log("\n[Test 7] Updating Shop Settings as Store Owner...");
  const updateSettingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      deliveryFeeInsideDhaka: 80,
      deliveryFeeOutsideDhaka: 150,
      defaultThermalSize: "80mm",
    }),
  });
  const updateSettingsData = await updateSettingsRes.json();
  assert.equal(updateSettingsRes.status, 200, "Settings update should succeed");
  assert.equal(updateSettingsData.success, true);
  console.log("✓ Shop settings updated successfully in database!");

  // 8. Test /admin/settings page render
  console.log("\n[Test 8] Rendering /admin/settings page...");
  const pageRes = await fetch(`${BASE_URL}/admin/settings`, {
    headers: { Cookie: sessionCookie },
  });
  assert.equal(pageRes.status, 200, "/admin/settings page should render with HTTP 200");
  const html = await pageRes.text();
  assert.ok(html.includes("শপ সেটিংস"), "Page HTML should contain Bengali settings header");
  console.log("✓ /admin/settings rendered with HTTP 200 and Bengali UI!");

  // 9. Test Google Sign-in Account Setup
  console.log("\n[Test 9] Signing in via Google...");
  const googleLoginRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      authProvider: "google",
      firebaseUid: "google-shopper-uid-" + Date.now().toString().slice(-4),
      email: "shopper.online@gmail.com",
      displayName: "অনলাইন ক্রেতা (Google)",
    }),
  });
  const googleLoginData = await googleLoginRes.json();
  assert.equal(googleLoginRes.status, 200);
  assert.equal(googleLoginData.user.authMethod, "google", "Auth method must be google");
  assert.equal(googleLoginData.user.roleSlug, "customer", "Google users must strictly have customer role");
  assert.equal(googleLoginData.user.isOwner, false, "Google users must never be owner");

  // Extract Google cookies
  const googleCookies = googleLoginRes.headers.getSetCookie 
    ? googleLoginRes.headers.getSetCookie().map(c => c.split(";")[0]).join("; ")
    : (googleLoginRes.headers.get("set-cookie") || "").split(";")[0];

  console.log("✓ Google user logged in strictly as customer with authMethod=google!");

  // 10. Strict Test: Google User accessing /admin must be blocked
  console.log("\n[Test 10] Testing Google user access to /admin (must be blocked)...");
  const googleAdminRes = await fetch(`${BASE_URL}/admin`, {
    headers: { Cookie: googleCookies },
    redirect: "manual",
  });
  assert.equal(googleAdminRes.status, 307, "Google user attempting to access /admin must receive 307 redirect");
  const adminLocation = googleAdminRes.headers.get("location") || "";
  assert.ok(
    adminLocation.includes("google_management_blocked") || adminLocation.includes("unauthorized"),
    `Google user must be redirected away from admin: ${adminLocation}`
  );
  console.log("✓ Google user strictly blocked from /admin by middleware!");

  // 11. Strict Test: Google User accessing /pos must be blocked
  console.log("\n[Test 11] Testing Google user access to /pos (must be blocked)...");
  const googlePosRes = await fetch(`${BASE_URL}/pos`, {
    headers: { Cookie: googleCookies },
    redirect: "manual",
  });
  assert.equal(googlePosRes.status, 307, "Google user attempting to access /pos must receive 307 redirect");
  const posLocation = googlePosRes.headers.get("location") || "";
  assert.ok(
    posLocation.includes("google_management_blocked") || posLocation.includes("unauthorized"),
    `Google user must be redirected away from pos: ${posLocation}`
  );
  console.log("✓ Google user strictly blocked from /pos counter by middleware!");

  // 12. Strict Test: Google User calling management API
  console.log("\n[Test 12] Testing Google user calling management API (requirePermission)...");
  const googleApiRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    headers: { Cookie: googleCookies },
  });
  assert.equal(googleApiRes.status, 403, "Google user must be denied from management APIs with 403 Forbidden");
  console.log("✓ Google user strictly rejected from management APIs (403 Forbidden)!");

  console.log("\n=================================================");
  console.log("  ALL OWNER, STAFF, SETTINGS & GOOGLE BLOCK TESTS PASSED (12/12) ");
  console.log("=================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
