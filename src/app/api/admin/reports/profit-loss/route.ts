import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { SalesInvoice } from "@/models/SalesInvoice";
import { OnlineOrder } from "@/models/OnlineOrder";
import { Expense } from "@/models/Expense";
import { PayrollRecord } from "@/models/PayrollRecord";
import { ProductVariant } from "@/models/ProductVariant";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("reports.financial");
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

      const posGross = posSales.reduce((sum, s) => sum + (s.subTotalPoisha || s.grandTotalPoisha), 0);
      const posDiscount = posSales.reduce((sum, s) => sum + (s.orderDiscountPoisha || 0), 0);
      const posNet = posSales.reduce((sum, s) => sum + s.grandTotalPoisha, 0);

      const onlineNet = onlineOrders.reduce((sum, o) => sum + o.grandTotalPoisha, 0);
      const netRevenue = posNet + onlineNet;

      let cogs = 0;
      for (const sale of posSales) {
        for (const item of sale.items) {
          const v = store.variants.find((vr) => vr._id === item.variantId);
          const itemCost = item.unitCostPoisha ?? v?.purchaseCostPoisha ?? 0;
          cogs += itemCost * item.quantity;
        }
      }
      for (const order of onlineOrders) {
        for (const item of order.items) {
          const v = store.variants.find((vr) => vr._id === item.variantId);
          const itemCost = (item as any).unitCostPoisha ?? v?.purchaseCostPoisha ?? 0;
          cogs += itemCost * item.quantity;
        }
      }

      const grossProfit = Math.max(0, netRevenue - cogs);

      // Expenses breakdown by category
      const expenseByCategory: Record<string, number> = {};
      for (const exp of expenses) {
        const cat = exp.category || "miscellaneous";
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + exp.amountPoisha;
      }

      const totalOperatingExpense = expenses.reduce((sum, e) => sum + e.amountPoisha, 0);
      const staffPayrollExpense = payroll.reduce((sum, p) => sum + (p.paidAmountPoisha || 0), 0);
      const totalExpenses = totalOperatingExpense + staffPayrollExpense;
      const netProfit = grossProfit - totalExpenses;

      return NextResponse.json({
        success: true,
        statement: {
          revenue: {
            posSalesGrossPoisha: posGross,
            posSalesDiscountPoisha: posDiscount,
            posSalesNetPoisha: posNet,
            onlineSalesNetPoisha: onlineNet,
            totalNetRevenuePoisha: netRevenue,
          },
          costOfGoodsSold: {
            cogsPoisha: cogs,
            grossProfitPoisha: grossProfit,
            grossProfitMarginPercent: netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0,
          },
          operatingExpenses: {
            breakdown: expenseByCategory,
            totalOperatingExpensesPoisha: totalOperatingExpense,
          },
          staffPayroll: {
            totalPaidPayrollPoisha: staffPayrollExpense,
          },
          netProfit: {
            totalExpensesPoisha: totalExpenses,
            netOperatingProfitPoisha: netProfit,
            netProfitMarginPercent: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
          },
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

    // Filter out cancelled sales invoices
    const posSales = await SalesInvoice.find({
      ...dateQuery,
      status: { $ne: "cancelled" },
    }).lean();

    const onlineOrders = await OnlineOrder.find({
      ...dateQuery,
      orderStatus: "delivered",
    }).lean();

    const posGross = posSales.reduce((sum, s: any) => sum + (s.subTotalPoisha || s.grandTotalPoisha), 0);
    const posDiscount = posSales.reduce((sum, s: any) => sum + (s.orderDiscountPoisha || 0), 0);
    const posNet = posSales.reduce((sum, s: any) => sum + s.grandTotalPoisha, 0);
    const onlineNet = onlineOrders.reduce((sum, o: any) => sum + o.grandTotalPoisha, 0);
    const netRevenue = posNet + onlineNet;

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

    let cogs = 0;
    for (const sale of posSales) {
      for (const item of sale.items) {
        const v = item.variantId ? variantMap.get(item.variantId.toString()) : null;
        const itemCost = item.unitCostPoisha ?? v?.purchaseCostPoisha ?? 0;
        cogs += itemCost * item.quantity;
      }
    }
    for (const order of onlineOrders) {
      for (const item of order.items) {
        const v = item.variantId ? variantMap.get(item.variantId.toString()) : null;
        const itemCost = (item as any).unitCostPoisha ?? v?.purchaseCostPoisha ?? 0;
        cogs += itemCost * item.quantity;
      }
    }

    const grossProfit = Math.max(0, netRevenue - cogs);

    const expQuery: any = {
      status: { $ne: "rejected" },
    };
    if (startDate || endDate) {
      expQuery.expenseDate = {};
      if (startDate) expQuery.expenseDate.$gte = new Date(startDate);
      if (endDate) expQuery.expenseDate.$lte = new Date(endDate);
    }
    const expenses = await Expense.find(expQuery).lean();

    const expenseByCategory: Record<string, number> = {};
    for (const exp of expenses) {
      const cat = exp.category || "miscellaneous";
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + exp.amountPoisha;
    }

    const totalOperatingExpense = expenses.reduce((sum, e) => sum + e.amountPoisha, 0);

    const payrollQuery: any = {};
    if (startDate || endDate) {
      payrollQuery.$or = [
        { disbursedDate: { ...(startDate && { $gte: new Date(startDate) }), ...(endDate && { $lte: new Date(endDate) }) } },
        { createdAt: { ...(startDate && { $gte: new Date(startDate) }), ...(endDate && { $lte: new Date(endDate) }) } },
      ];
    }
    const payroll = await PayrollRecord.find(payrollQuery).lean();
    const staffPayrollExpense = payroll.reduce((sum, p) => sum + (p.paidAmountPoisha || 0), 0);
    const totalExpenses = totalOperatingExpense + staffPayrollExpense;
    const netProfit = grossProfit - totalExpenses;

    return NextResponse.json({
      success: true,
      statement: {
        revenue: {
          posSalesGrossPoisha: posGross,
          posSalesDiscountPoisha: posDiscount,
          posSalesNetPoisha: posNet,
          onlineSalesNetPoisha: onlineNet,
          totalNetRevenuePoisha: netRevenue,
        },
        costOfGoodsSold: {
          cogsPoisha: cogs,
          grossProfitPoisha: grossProfit,
          grossProfitMarginPercent: netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0,
        },
        operatingExpenses: {
          breakdown: expenseByCategory,
          totalOperatingExpensesPoisha: totalOperatingExpense,
        },
        staffPayroll: {
          totalPaidPayrollPoisha: staffPayrollExpense,
        },
        netProfit: {
          totalExpensesPoisha: totalExpenses,
          netOperatingProfitPoisha: netProfit,
          netProfitMarginPercent: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "লাভ-ক্ষতির হিসাব তৈরি করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

