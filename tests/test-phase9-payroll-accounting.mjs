/**
 * ============================================================================
 * Phase 9: Employees, Payroll, Double-Entry Accounting & Financial Reports Test
 * ============================================================================
 */

const BASE_URL = "http://127.0.0.1:3001";

async function runTests() {
  console.log("==================================================================");
  console.log("  লুমিনা লাগেজ - ফেজ ৯ কর্মচারী, পেরোল, ডাবল-এন্ট্রি ও আর্থিক রিপোর্ট টেস্ট");
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

  // 1. Authenticate Sessions
  console.log("১. অ্যাডমিন ও সাধারণ কাস্টমার সেশন ভেরিফিকেশন:");
  let adminCookie = "";
  let customerCookie = "";
  try {
    const custRes = await fetch(`${BASE_URL}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: "customer-uid-p9",
        email: "regular.buyer@test.com",
        displayName: "সাধারণ ক্রেতা",
      }),
    });
    customerCookie = custRes.headers.get("set-cookie") || "";
    assert(customerCookie.includes("lumina_session"), `কাস্টমার সেশন নিশ্চিত হয়েছে`);

    const adminRes = await fetch(`${BASE_URL}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: "owner-real-uid-001",
        email: "alamgir.owner@luminaluggage.com",
        displayName: "আলমগীর কবির (মালিক)",
      }),
    });
    adminCookie = adminRes.headers.get("set-cookie") || "";
    assert(adminCookie.includes("lumina_session"), `অ্যাডমিন / মালিক সেশন নিশ্চিত হয়েছে`);
  } catch (e) {
    assert(false, `Authentication failed: ${e.message}`);
  }

  // 2. Financial Permissions Enforcement (Deny-by-Default)
  console.log("\n২. আর্থিক ও পেরোল অনুমতি নিয়ন্ত্রণ (Permission Restrictions):");
  try {
    const unauthEmp = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        name: "অননুমোদিত কর্মচারী",
        phone: "01700112233",
        designation: "কর্মী",
        basicSalaryPoisha: 2000000,
      }),
    });
    assert(unauthEmp.status === 403, `কাস্টমার কর্মচারী তৈরি করতে গেলে 403 Forbidden পেয়েছে (HTTP ${unauthEmp.status})`);

    const unauthReport = await fetch(`${BASE_URL}/api/admin/reports/profit-loss`, {
      headers: { Cookie: customerCookie },
    });
    assert(unauthReport.status === 403, `কাস্টমার লাভ-ক্ষতি রিপোর্ট দেখতে গেলে 403 Forbidden পেয়েছে (HTTP ${unauthReport.status})`);
  } catch (e) {
    assert(false, `Permission check failed: ${e.message}`);
  }

  // 3. Employee Registration & Phone Uniqueness
  console.log("\n৩. কর্মচারী নিবন্ধন ও বেতন কাঠামো যাচাই:");
  const testPhone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
  let testEmployee = null;
  try {
    const createRes = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: "তানভীর আহমেদ",
        phone: testPhone,
        email: "tanvir.sales@example.com",
        designation: "সিনিয়র বিক্রয় কর্মী",
        basicSalaryPoisha: 1500000, // ৳১৫,০০০ মূল বেতন
        allowancePoisha: 300000, // ৳৩,০০০ বাড়িভাড়া ও যাতায়াত ভাতা
        bankOrWalletDetails: "বিকাশ: " + testPhone,
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 200 && createData.success, `কর্মচারী সফলভাবে নিবন্ধিত হয়েছে: ${createData.employee?.name}`);
    testEmployee = createData.employee;

    // Duplicate Phone check
    const dupRes = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: "ডুপ্লিকেট তানভীর",
        phone: testPhone,
        designation: "বিক্রয় কর্মী",
        basicSalaryPoisha: 2000000,
      }),
    });
    assert(dupRes.status === 400, `একই মোবাইল নম্বরে দ্বিতীয়বার কর্মী নিবন্ধন রোধ হয়েছে (HTTP 400)`);
  } catch (e) {
    assert(false, `Employee registration failed: ${e.message}`);
  }

  // 4. Payroll Generation & Formula Verification
  console.log("\n৪. মাসিক পেরোল প্রস্তুত ও বেতন হিসাব সূত্র যাচাই:");
  const testMonth = "2026-10";
  let testPayrollRecord = null;
  try {
    const bonus = 200000; // ৳২,০০০ উৎসব বোনাস
    const deduction = 100000; // ৳১,০০০ অনুপস্থিতি কর্তন
    const advance = 100000; // ৳১,০০০ অগ্রিম সমন্বয়

    const genRes = await fetch(`${BASE_URL}/api/admin/payroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        employeeId: testEmployee._id,
        monthYear: testMonth,
        bonusPoisha: bonus,
        deductionPoisha: deduction,
        advanceAdjustedPoisha: advance,
        notes: "অক্টোবর মাসের নিয়মিত বেতন",
      }),
    });
    const genData = await genRes.json();
    assert(genRes.status === 200 && genData.success, `${testMonth} মাসের বেতন সফলভাবে প্রস্তুত হয়েছে`);
    testPayrollRecord = genData.payrollRecord;

    // Formula: (Basic 15000 + Allowance 3000 + Bonus 2000) - (Deduction 1000 + Advance 1000) = 18000
    const expectedNet = (1500000 + 300000 + bonus) - (deduction + advance);
    assert(
      testPayrollRecord.netPayablePoisha === expectedNet,
      `নিট প্রদেয় বেতনের নিখুঁত হিসাব: ৳${expectedNet / 100} (Basic + Allowance + Bonus - Deduction - Advance)`
    );
    assert(testPayrollRecord.paymentStatus === "unpaid", `প্রাথমিক অবস্থা 'unpaid'`);
    assert(testPayrollRecord.dueAmountPoisha === expectedNet, `বকেয়া বেতন সঠিক রয়েছে`);
  } catch (e) {
    assert(false, `Payroll generation failed: ${e.message}`);
  }

  // 5. Prevent Duplicate Payroll Generation
  console.log("\n৫. একই মাসে দ্বৈত বেতন তৈরি প্রতিরোধ (Zero Duplicate Payroll Rule):");
  try {
    const dupPayRes = await fetch(`${BASE_URL}/api/admin/payroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        employeeId: testEmployee._id,
        monthYear: testMonth, // Same month!
      }),
    });
    const dupPayData = await dupPayRes.json();
    assert(dupPayRes.status === 400, `একই কর্মচারীর একই মাসে পুনরায় বেতন তৈরি ব্লক হয়েছে (HTTP 400)`);
    assert(
      dupPayData.error && dupPayData.error.includes("ইতিমধ্যে প্রস্তুত করা হয়েছে"),
      `বাংলা এরর মেসেজ প্রদর্শিত হয়েছে: "${dupPayData.error}"`
    );
  } catch (e) {
    assert(false, `Duplicate payroll test failed: ${e.message}`);
  }

  // 6. Salary Disbursement & Double-Entry Accounting Integration
  console.log("\n৬. বেতন বিতরণ, আর্থিক হিসাব কর্তন ও স্বয়ংক্রিয় দ্বৈত দাখিলা (Disbursement & Journal):");
  let testAccount = null;
  try {
    // Fetch financial accounts
    const accRes = await fetch(`${BASE_URL}/api/admin/accounts`, {
      headers: { Cookie: adminCookie },
    });
    const accData = await accRes.json();
    assert(accRes.status === 200 && Array.isArray(accData.accounts), `আর্থিক হিসাব তালিকা লোড হয়েছে`);

    testAccount = accData.accounts.find((a) => a.currentBalancePoisha >= testPayrollRecord.netPayablePoisha) || accData.accounts[0];
    const initialAccBalance = testAccount.currentBalancePoisha;

    // Disburse Full Salary
    const payRes = await fetch(`${BASE_URL}/api/admin/payroll/${testPayrollRecord._id}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        amountPoisha: testPayrollRecord.netPayablePoisha,
        financialAccountId: testAccount._id,
        notes: "ব্যাংক স্থানান্তরের মাধ্যমে বেতন পরিশোধ",
      }),
    });
    const payData = await payRes.json();
    assert(payRes.status === 200 && payData.success, `বেতন সফলভাবে পরিশোধ হয়েছে`);
    assert(payData.payrollRecord.paymentStatus === "paid", `বেতনের স্ট্যাটাস 'paid' হয়েছে`);
    assert(payData.payrollRecord.dueAmountPoisha === 0, `বকেয়া ০ নিশ্চিত হয়েছে`);

    // Verify Financial Account Balance Deduction
    const updatedAccRes = await fetch(`${BASE_URL}/api/admin/accounts`, {
      headers: { Cookie: adminCookie },
    });
    const updatedAccData = await updatedAccRes.json();
    const updatedAcc = updatedAccData.accounts.find((a) => String(a._id) === String(testAccount._id));
    assert(
      updatedAcc.currentBalancePoisha === initialAccBalance - testPayrollRecord.netPayablePoisha,
      `আর্থিক হিসাব থেকে নিখুঁতভাবে বেতন কর্তন হয়েছে (${initialAccBalance / 100} -> ${updatedAcc.currentBalancePoisha / 100} ৳)`
    );

    // Verify Double-Entry Journal Entry
    assert(payData.journalEntry !== undefined, `স্বয়ংক্রিয় জার্নাল এন্ট্রি তৈরি হয়েছে`);
    assert(
      payData.journalEntry.totalDebitPoisha === payData.journalEntry.totalCreditPoisha,
      `ডাবল-এন্ট্রি সমতা নিশ্চিত: Debit ৳${payData.journalEntry.totalDebitPoisha / 100} === Credit ৳${payData.journalEntry.totalCreditPoisha / 100}`
    );
  } catch (e) {
    assert(false, `Salary disbursement failed: ${e.message}`);
  }

  // 7. Fund Transfer Between Accounts (Cash Drawer -> Bank)
  console.log("\n৭. আর্থিক হিসাবের মধ্যে তহবিল স্থানান্তর ও ডাবল-এন্ট্রি ব্যালেন্সিং:");
  try {
    const accListRes = await fetch(`${BASE_URL}/api/admin/accounts`, {
      headers: { Cookie: adminCookie },
    });
    const accListData = await accListRes.json();
    const fromAcc = accListData.accounts.find((a) => a.currentBalancePoisha >= 100000) || accListData.accounts[0];
    const toAcc = accListData.accounts.find((a) => String(a._id) !== String(fromAcc._id)) || accListData.accounts[1];

    const transferAmount = Math.min(500000, Math.max(10000, Math.floor(fromAcc.currentBalancePoisha / 2)));
    const fromBefore = fromAcc.currentBalancePoisha;
    const toBefore = toAcc.currentBalancePoisha;

    const trfRes = await fetch(`${BASE_URL}/api/admin/accounts/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fromAccountId: fromAcc._id,
        toAccountId: toAcc._id,
        amountPoisha: transferAmount,
        notes: `তহবিল স্থানান্তর: ${fromAcc.accountName} থেকে ${toAcc.accountName}`,
      }),
    });
    const trfData = await trfRes.json();
    if (!trfData.success) {
      console.log("    -> Transfer response error:", JSON.stringify(trfData));
    }
    assert(trfRes.status === 200 && trfData.success, `তহবিল স্থানান্তর সফল হয়েছে`);
    assert(
      trfData.fromAccount && trfData.fromAccount.currentBalancePoisha === fromBefore - transferAmount,
      `উৎস হিসাব (${fromAcc.accountName}) থেকে ৳${transferAmount / 100} হ্রাস পেয়েছে`
    );
    assert(
      trfData.toAccount && trfData.toAccount.currentBalancePoisha === toBefore + transferAmount,
      `গন্তব্য হিসাবে (${toAcc.accountName}) ৳${transferAmount / 100} বৃদ্ধি পেয়েছে`
    );
    assert(
      trfData.journalEntry && trfData.journalEntry.totalDebitPoisha === trfData.journalEntry.totalCreditPoisha,
      `স্থানান্তরের ডাবল-এন্ট্রি সমতা নিশ্চিত (Debit ৳৫০ = Credit ৳৫০)`
    );
  } catch (e) {
    assert(false, `Fund transfer failed: ${e.message}`);
  }

  // 8. Unbalanced Double-Entry Rejection
  console.log("\n৮. অসামঞ্জস্যপূর্ণ জার্নাল এন্ট্রি প্রতিরোধ (Debit != Credit Rejection):");
  try {
    const unbalRes = await fetch(`${BASE_URL}/api/admin/journal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        description: "অবৈধ অসামঞ্জস্যপূর্ণ এন্ট্রি",
        lines: [
          { accountId: "acc-1", accountType: "expense", debitPoisha: 10000, creditPoisha: 0 },
          { accountId: "acc-2", accountType: "asset", debitPoisha: 0, creditPoisha: 8000 }, // Credit 80 != Debit 100
        ],
      }),
    });
    const unbalData = await unbalRes.json();
    assert(unbalRes.status === 400, `অসামঞ্জস্যপূর্ণ জার্নাল এন্ট্রি সফলভাবে প্রত্যাখ্যাত হয়েছে (HTTP 400)`);
    assert(
      unbalData.error && unbalData.error.includes("দ্বৈত দাখিলা নীতির লঙ্ঘন"),
      `বাংলা একাউন্টিং সতর্কবার্তা প্রদর্শিত হয়েছে: "${unbalData.error}"`
    );
  } catch (e) {
    assert(false, `Unbalanced journal test failed: ${e.message}`);
  }

  // 9. Financial Summary & Profit-Loss Reconciliation
  console.log("\n৯. আর্থিক প্রতিবেদন, প্রফিট ও একাউন্টিং রিকনসিলিয়েশন:");
  try {
    const sumRes = await fetch(`${BASE_URL}/api/admin/reports/summary`, {
      headers: { Cookie: adminCookie },
    });
    const sumData = await sumRes.json();
    assert(sumRes.status === 200 && sumData.summary, `আর্থিক সামারি রিপোর্ট লোড হয়েছে`);

    const s = sumData.summary;
    console.log(`     -> মোট বিক্রয় রাজস্ব: ৳${s.totalRevenuePoisha / 100}`);
    console.log(`     -> বিক্রিত পণ্যের খরচ (COGS): ৳${s.costOfGoodsSoldPoisha / 100}`);
    console.log(`     -> গ্রস প্রফিট: ৳${s.grossProfitPoisha / 100} (মার্জিন: ${s.grossProfitMarginPercent}%)`);
    console.log(`     -> দোকান পরিচালন খরচ: ৳${s.operatingExpensesPoisha / 100}`);
    console.log(`     -> পরিশোধিত কর্মচারী বেতন: ৳${s.staffPayrollPoisha / 100}`);
    console.log(`     -> নিট পরিচালন মুনাফা (Net Profit): ৳${s.netProfitPoisha / 100}`);

    assert(
      s.grossProfitPoisha === Math.max(0, s.totalRevenuePoisha - s.costOfGoodsSoldPoisha),
      `গ্রস প্রফিট সূত্র নিখুঁত: Revenue - COGS`
    );
    assert(
      s.netProfitPoisha === s.grossProfitPoisha - s.totalExpensesPoisha,
      `নেট প্রফিট সূত্র নিখুঁত: Gross Profit - (Expenses + Payroll)`
    );
    assert(s.inventoryValuationPoisha >= 0, `ইনভেন্টরি মূল্যায়ন (WAC) বিদ্যমান: ৳${s.inventoryValuationPoisha / 100}`);
    assert(s.totalReceivablesPoisha >= 0, `কাস্টমার বকেয়া (Receivables) হিসাব বিদ্যমান: ৳${s.totalReceivablesPoisha / 100}`);

    // Profit & Loss Detailed Statement
    const pnlRes = await fetch(`${BASE_URL}/api/admin/reports/profit-loss`, {
      headers: { Cookie: adminCookie },
    });
    const pnlData = await pnlRes.json();
    assert(pnlRes.status === 200 && pnlData.statement, `পূর্ণাঙ্গ লাভ-ক্ষতি বিবরণী (P&L) সফলভাবে লোড হয়েছে`);
    assert(
      pnlData.statement.netProfit.netOperatingProfitPoisha === s.netProfitPoisha,
      `সামারি ও পিঅ্যান্ডএল বিবরণীর নিট মুনাফা হুবহু মিলেছে`
    );
  } catch (e) {
    assert(false, `Reports reconciliation failed: ${e.message}`);
  }

  // 10. Render Management Pages (HTTP 200)
  console.log("\n১০. ফেজ ৯ ম্যানেজমেন্ট পেজসমূহ রেন্ডারিং পরীক্ষা (HTTP 200):");
  try {
    const pages = [
      { path: "/admin/employees", label: "কর্মচারী ডিরেক্টরি পেজ (/admin/employees)" },
      { path: "/admin/payroll", label: "পেরোল ও বেতন পেজ (/admin/payroll)" },
      { path: "/admin/accounts", label: "ক্যাশ ও ব্যাংক হিসাব পেজ (/admin/accounts)" },
      { path: "/admin/reports", label: "আর্থিক প্রতিবেদন ও লাভ পেজ (/admin/reports)" },
    ];

    for (const p of pages) {
      const res = await fetch(`${BASE_URL}${p.path}`, {
        headers: { Cookie: adminCookie },
      });
      assert(res.status === 200, `${p.label} সফলভাবে রেন্ডার হয়েছে (HTTP 200)`);
    }
  } catch (e) {
    assert(false, `Page rendering test failed: ${e.message}`);
  }

  // 11. Summary
  console.log("\n==================================================================");
  console.log(`  মোট টেস্ট সম্পন্ন: ${passed + failed}`);
  console.log(`  উত্তীর্ণ (Passed): ${passed}`);
  console.log(`  ব্যর্থ (Failed): ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

