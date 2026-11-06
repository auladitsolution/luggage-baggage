import assert from "assert";

console.log("=== Testing Financial Reports & Profit/Loss Audit Logic ===");

// 1. Test Revenue aggregation formula
const posSales = [
  { grandTotalPoisha: 500000, subTotalPoisha: 500000, orderDiscountPoisha: 0, status: "completed" },
  { grandTotalPoisha: 300000, subTotalPoisha: 350000, orderDiscountPoisha: 50000, status: "completed" },
  { grandTotalPoisha: 200000, subTotalPoisha: 200000, orderDiscountPoisha: 0, status: "cancelled" }, // Should be excluded
];

const validPosSales = posSales.filter(s => s.status !== "cancelled");
const posNet = validPosSales.reduce((sum, s) => sum + s.grandTotalPoisha, 0);
assert.strictEqual(posNet, 800000, "POS net revenue must exclude cancelled sales");

// 2. Test Online Delivered Orders aggregation
const onlineOrders = [
  { grandTotalPoisha: 450000, orderStatus: "delivered" },
  { grandTotalPoisha: 250000, orderStatus: "shipped" }, // Not yet delivered
  { grandTotalPoisha: 150000, orderStatus: "cancelled" }, // Cancelled
];

const validOnlineOrders = onlineOrders.filter(o => o.orderStatus === "delivered");
const onlineNet = validOnlineOrders.reduce((sum, o) => sum + o.grandTotalPoisha, 0);
assert.strictEqual(onlineNet, 450000, "Online revenue must only include delivered orders");

const totalRevenue = posNet + onlineNet;
assert.strictEqual(totalRevenue, 1250000, "Total Net Revenue must be ৳ 12,500");

// 3. Test COGS calculation (historical unit cost)
const saleItems = [
  { quantity: 2, unitCostPoisha: 250000 }, // 2 * 2500 = 5000
  { quantity: 1, unitCostPoisha: 180000 }, // 1 * 1800 = 1800
];
const cogs = saleItems.reduce((sum, i) => sum + i.unitCostPoisha * i.quantity, 0);
assert.strictEqual(cogs, 680000, "COGS must be ৳ 6,800");

const grossProfit = totalRevenue - cogs;
assert.strictEqual(grossProfit, 570000, "Gross profit must be ৳ 5,700");

// 4. Test Operating Expenses & Staff Payroll
const expenses = [
  { amountPoisha: 150000, status: "approved", category: "shop_rent" },
  { amountPoisha: 50000, status: "approved", category: "electricity" },
  { amountPoisha: 30000, status: "rejected", category: "entertainment" }, // Excluded
];
const validExpenses = expenses.filter(e => e.status !== "rejected");
const totalOperatingExpense = validExpenses.reduce((sum, e) => sum + e.amountPoisha, 0);
assert.strictEqual(totalOperatingExpense, 200000, "Operating expense must be ৳ 2,000 (excluding rejected)");

const payroll = [
  { paidAmountPoisha: 120000, monthYear: "2026-10" },
  { paidAmountPoisha: 80000, monthYear: "2026-10" },
];
const staffPayroll = payroll.reduce((sum, p) => sum + p.paidAmountPoisha, 0);
assert.strictEqual(staffPayroll, 200000, "Staff payroll must be ৳ 2,000");

const totalExpenses = totalOperatingExpense + staffPayroll;
assert.strictEqual(totalExpenses, 400000, "Total expenses must be ৳ 4,000");

// 5. Net Profit
const netProfit = grossProfit - totalExpenses;
assert.strictEqual(netProfit, 170000, "Net profit must be ৳ 1,700");

console.log("✓ All Financial Reports & Profit/Loss formulas verified successfully!");

