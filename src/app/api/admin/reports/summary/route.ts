import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { SalesInvoice } from "@/models/SalesInvoice";
import { OnlineOrder } from "@/models/OnlineOrder";
import { Expense } from "@/models/Expense";
import { PayrollRecord } from "@/models/PayrollRecord";
import { InventoryBalance } from "@/models/InventoryBalance";
import { ProductVariant } from "@/models/ProductVariant";
import { Customer } from "@/models/Customer";
import { Supplier } from "@/models/Supplier";
import { FinancialAccount } from "@/models/FinancialAccount";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("reports.read", req);
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const db = await connectToDatabase();

    // 1. Mock In-Memory Mode
    if (!db) {
      const store = getMockStore();
      let posSales = [...(store.salesInvoices || [])].filter((s) => s.status !== "cancelled");
      let onlineOrders = [...(store.onlineOrders || [])].filter((o) => o.orderStatus === "delivered");
      let expenses = [...(store.expenses || [])].filter((e) => (e as any).status !== "rejected");
      let payroll = [...(store.payrollRecords || [])];

      if (startDate) {
        const sTime = new Date(startDate).getTime();
        posSales = posSales.filter((s) => new Date(s.createdAt).getTime() >= sTime);
        onlineOrders = onlineOrders.filter((o) => new Date(o.createdAt).getTime() >= sTime);
        expenses = expenses.filter((e) => new Date(e.expenseDate || e.createdAt).getTime() >= sTime);
        payroll = payroll.filter((p) => new Date(p.disbursedDate || p.createdAt || Date.now()).getTime() >= sTime);
      }

      if (endDate) {
        const eTime = new Date(endDate).getTime();
        posSales = posSales.filter((s) => new Date(s.createdAt).getTime() <= eTime);
        onlineOrders = onlineOrders.filter((o) => new Date(o.createdAt).getTime() <= eTime);
        expenses = expenses.filter((e) => new Date(e.expenseDate || e.createdAt).getTime() <= eTime);
        payroll = payroll.filter((p) => new Date(p.disbursedDate || p.createdAt || Date.now()).getTime() <= eTime);
      }

      const posRevenue = posSales.reduce((sum, s) => sum + s.grandTotalPoisha, 0);
      const onlineRevenue = onlineOrders.reduce((sum, o) => sum + o.grandTotalPoisha, 0);
      const totalRevenuePoisha = posRevenue + onlineRevenue;

      // Calculate COGS using Invoice recorded cost or Variant Purchase Cost (WAC)
      let cogsPoisha = 0;
      for (const sale of posSales) {
        for (const item of sale.items) {
          const v = store.variants.find((vr) => vr._id === item.variantId);
          const cost = item.unitCostPoisha ?? v?.purchaseCostPoisha ?? 0;
          cogsPoisha += cost * item.quantity;
        }
      }
      for (const order of onlineOrders) {
        for (const item of order.items) {
          const v = store.variants.find((vr) => vr._id === item.variantId);
          const cost = (item as any).unitCostPoisha ?? v?.purchaseCostPoisha ?? 0;
          cogsPoisha += cost * item.quantity;
        }
      }

      const grossProfitPoisha = Math.max(0, totalRevenuePoisha - cogsPoisha);
      const grossProfitMarginPercent =
        totalRevenuePoisha > 0 ? Math.round((grossProfitPoisha / totalRevenuePoisha) * 1000) / 10 : 0;

      const operatingExpensesPoisha = expenses.reduce((sum, e) => sum + e.amountPoisha, 0);
      const staffPayrollPoisha = payroll.reduce((sum, p) => sum + (p.paidAmountPoisha || 0), 0);
      const totalExpensesPoisha = operatingExpensesPoisha + staffPayrollPoisha;

      const netProfitPoisha = grossProfitPoisha - totalExpensesPoisha;
      const netProfitMarginPercent =
        totalRevenuePoisha > 0 ? Math.round((netProfitPoisha / totalRevenuePoisha) * 1000) / 10 : 0;

      // Inventory Valuation
      let inventoryValuationPoisha = 0;
      for (const b of store.inventoryBalances) {
        const v = store.variants.find((vr) => vr._id === b.variantId);
        const cost = v?.purchaseCostPoisha || 0;
        inventoryValuationPoisha += cost * b.currentStock;
      }

      const totalReceivablesPoisha = (store.customers || []).reduce(
        (sum, c) => sum + (c.currentDuePoisha || 0),
        0
      );
      const totalPayablesPoisha = (store.suppliers || []).reduce(
        (sum, s) => sum + (s.currentBalancePoisha || 0),
        0
      );
      const totalLiquidAssetsPoisha = (store.financialAccounts || [])
        .filter((a) => a.isActive)
        .reduce((sum, a) => sum + (a.currentBalancePoisha || 0), 0);

      return NextResponse.json({
        success: true,
        summary: {
          totalRevenuePoisha,
          posRevenuePoisha: posRevenue,
          onlineRevenuePoisha: onlineRevenue,
          costOfGoodsSoldPoisha: cogsPoisha,
          grossProfitPoisha,
          grossProfitMarginPercent,
          operatingExpensesPoisha,
          staffPayrollPoisha,
          totalExpensesPoisha,
          netProfitPoisha,
          netProfitMarginPercent,
          inventoryValuationPoisha,
          totalReceivablesPoisha,
          totalPayablesPoisha,
          totalLiquidAssetsPoisha,
        },
      });
    }

    // 2. Production Live Database Mode
    const dateQuery: any = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const posSales = await SalesInvoice.find({
      ...dateQuery,
      status: { $ne: "cancelled" },
    }).lean();

    const onlineOrders = await OnlineOrder.find({
      ...dateQuery,
      orderStatus: "delivered",
    }).lean();

    const posRevenue = posSales.reduce((sum, s) => sum + s.grandTotalPoisha, 0);
    const onlineRevenue = onlineOrders.reduce((sum, o: any) => sum + o.grandTotalPoisha, 0);
    const totalRevenuePoisha = posRevenue + onlineRevenue;

    // Collect all variant IDs needing cost resolution
    const neededVariantIds = new Set<string>();
    for (const sale of posSales) {
      for (const item of sale.items) {
        if (!item.unitCostPoisha && item.variantId) {
          neededVariantIds.add(item.variantId.toString());
        }
      }
    }
    for (const order of onlineOrders) {
      for (const item of order.items) {
        if (!(item as any).unitCostPoisha && item.variantId) {
          neededVariantIds.add(item.variantId.toString());
        }
      }
    }

    // Batch fetch variants to avoid N+1 queries
    const variantMap = new Map<string, any>();
    if (neededVariantIds.size > 0) {
      const fetchedVariants = await ProductVariant.find({
        _id: { $in: Array.from(neededVariantIds) },
      }).lean();
      for (const v of fetchedVariants) {
        variantMap.set(v._id.toString(), v);
      }
    }

    // Calculate COGS
    let cogsPoisha = 0;
    for (const sale of posSales) {
      for (const item of sale.items) {
        const v = item.variantId ? variantMap.get(item.variantId.toString()) : null;
        const cost = item.unitCostPoisha ?? v?.purchaseCostPoisha ?? 0;
        cogsPoisha += cost * item.quantity;
      }
    }
    for (const order of onlineOrders) {
      for (const item of order.items) {
        const v = item.variantId ? variantMap.get(item.variantId.toString()) : null;
        const cost = (item as any).unitCostPoisha ?? v?.purchaseCostPoisha ?? 0;
        cogsPoisha += cost * item.quantity;
      }
    }

    const grossProfitPoisha = Math.max(0, totalRevenuePoisha - cogsPoisha);
    const grossProfitMarginPercent =
      totalRevenuePoisha > 0 ? Math.round((grossProfitPoisha / totalRevenuePoisha) * 1000) / 10 : 0;

    const expQuery: any = {
      status: { $ne: "rejected" },
    };
    if (startDate || endDate) {
      expQuery.expenseDate = {};
      if (startDate) expQuery.expenseDate.$gte = new Date(startDate);
      if (endDate) expQuery.expenseDate.$lte = new Date(endDate);
    }
    const expenses = await Expense.find(expQuery).lean();
    const operatingExpensesPoisha = expenses.reduce((sum, e) => sum + e.amountPoisha, 0);

    const payrollQuery: any = {};
    if (startDate || endDate) {
      payrollQuery.$or = [
        { disbursedDate: { ...(startDate && { $gte: new Date(startDate) }), ...(endDate && { $lte: new Date(endDate) }) } },
        { createdAt: { ...(startDate && { $gte: new Date(startDate) }), ...(endDate && { $lte: new Date(endDate) }) } },
      ];
    }
    const payroll = await PayrollRecord.find(payrollQuery).lean();
    const staffPayrollPoisha = payroll.reduce((sum, p) => sum + (p.paidAmountPoisha || 0), 0);
    const totalExpensesPoisha = operatingExpensesPoisha + staffPayrollPoisha;

    const netProfitPoisha = grossProfitPoisha - totalExpensesPoisha;
    const netProfitMarginPercent =
      totalRevenuePoisha > 0 ? Math.round((netProfitPoisha / totalRevenuePoisha) * 1000) / 10 : 0;

    // Inventory Valuation
    const balances = await InventoryBalance.find().lean();
    const balVariantIds = balances.map((b) => b.variantId).filter(Boolean);
    const balVariants = await ProductVariant.find({ _id: { $in: balVariantIds } }).lean();
    const balVarMap = new Map<string, any>();
    for (const v of balVariants) {
      balVarMap.set(v._id.toString(), v);
    }

    let inventoryValuationPoisha = 0;
    for (const b of balances) {
      const v = b.variantId ? balVarMap.get(b.variantId.toString()) : null;
      const cost = v?.purchaseCostPoisha || 0;
      inventoryValuationPoisha += cost * b.currentStock;
    }

    const customers = await Customer.find().lean();
    const totalReceivablesPoisha = customers.reduce((sum, c) => sum + (c.currentDuePoisha || 0), 0);

    const suppliers = await Supplier.find().lean();
    const totalPayablesPoisha = suppliers.reduce((sum, s) => sum + (s.currentBalancePoisha || 0), 0);

    const accounts = await FinancialAccount.find({ isActive: true }).lean();
    const totalLiquidAssetsPoisha = accounts.reduce(
      (sum, a) => sum + (a.currentBalancePoisha || 0),
      0
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenuePoisha,
        posRevenuePoisha: posRevenue,
        onlineRevenuePoisha: onlineRevenue,
        costOfGoodsSoldPoisha: cogsPoisha,
        grossProfitPoisha,
        grossProfitMarginPercent,
        operatingExpensesPoisha,
        staffPayrollPoisha,
        totalExpensesPoisha,
        netProfitPoisha,
        netProfitMarginPercent,
        inventoryValuationPoisha,
        totalReceivablesPoisha,
        totalPayablesPoisha,
        totalLiquidAssetsPoisha,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "রিপোর্ট সামারি তৈরি করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

