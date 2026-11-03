import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { PayrollRecord } from "@/models/PayrollRecord";
import { Employee } from "@/models/Employee";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("payroll.read");
    const { searchParams } = new URL(req.url);
    const monthYear = searchParams.get("monthYear");
    const employeeId = searchParams.get("employeeId");
    const paymentStatus = searchParams.get("paymentStatus");

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let list = [...(store.payrollRecords || [])];

      if (monthYear) {
        list = list.filter((p) => p.monthYear === monthYear);
      }
      if (employeeId) {
        list = list.filter((p) => String(p.employeeId) === String(employeeId));
      }
      if (paymentStatus && paymentStatus !== "all") {
        list = list.filter((p) => p.paymentStatus === paymentStatus);
      }

      // Populate employee details
      const populated = list.map((p) => {
        const emp = (store.employees || []).find((e) => String(e._id) === String(p.employeeId));
        return {
          ...p,
          employeeName: emp?.name || p.employeeName || "কর্মচারী",
          employeeDesignation: emp?.designation || p.employeeDesignation || "",
          employeePhone: emp?.phone || p.employeePhone || "",
        };
      });

      return NextResponse.json({ success: true, payrollRecords: populated });
    }

    const query: any = {};
    if (monthYear) query.monthYear = monthYear;
    if (employeeId) query.employeeId = employeeId;
    if (paymentStatus && paymentStatus !== "all") query.paymentStatus = paymentStatus;

    const records = await PayrollRecord.find(query)
      .populate("employeeId", "name phone designation basicSalaryPoisha")
      .populate("paidFromAccountId", "accountName accountType")
      .sort({ monthYear: -1, createdAt: -1 })
      .lean();

    const formatted = records.map((r: any) => ({
      ...r,
      employeeName: r.employeeId?.name || "কর্মচারী",
      employeeDesignation: r.employeeId?.designation || "",
      employeePhone: r.employeeId?.phone || "",
    }));

    return NextResponse.json({ success: true, payrollRecords: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "বেতনের রেকর্ড লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("payroll.manage");
    const body = await req.json();

    const {
      employeeId,
      monthYear, // e.g. '2026-10'
      bonusPoisha = 0,
      deductionPoisha = 0,
      advanceAdjustedPoisha = 0,
      notes,
    } = body;

    if (!employeeId || !monthYear) {
      return NextResponse.json(
        { error: "কর্মচারী এবং বেতনের মাস-বছর (monthYear) আবশ্যক" },
        { status: 400 }
      );
    }

    // Format validation: YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(monthYear)) {
      return NextResponse.json(
        { error: "মাস-বছরের ফরম্যাট সঠিক নয় (যেমন: ২০২৬-১০)" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    // 1. Mock In-Memory Mode
    if (!db) {
      const store = getMockStore();
      if (!store.payrollRecords) store.payrollRecords = [];

      const emp = (store.employees || []).find((e) => String(e._id) === String(employeeId));
      if (!emp) {
        return NextResponse.json({ error: "কর্মচারী পাওয়া যায়নি" }, { status: 404 });
      }

      // Check Duplicate Payroll Prevention
      const exists = store.payrollRecords.some(
        (p) => String(p.employeeId) === String(employeeId) && p.monthYear === monthYear
      );

      if (exists) {
        return NextResponse.json(
          {
            error: `এই কর্মচারীর জন্য ${monthYear} মাসের বেতন ইতিমধ্যে প্রস্তুত করা হয়েছে। ডুপ্লিকেট বেতন এন্ট্রি সম্পূর্ণ নিষিদ্ধ।`,
          },
          { status: 400 }
        );
      }

      const basic = emp.basicSalaryPoisha;
      const allowance = emp.allowancePoisha || 0;
      const bonus = Math.max(0, Math.round(bonusPoisha));
      const deduction = Math.max(0, Math.round(deductionPoisha));
      const advance = Math.max(0, Math.round(advanceAdjustedPoisha));

      const netPayable = Math.max(0, basic + allowance + bonus - (deduction + advance));

      const record: any = {
        _id: `mock-pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        employeeId: emp._id,
        employeeName: emp.name,
        employeeDesignation: emp.designation,
        employeePhone: emp.phone,
        monthYear,
        basicSalaryPoisha: basic,
        allowancePoisha: allowance,
        bonusPoisha: bonus,
        deductionPoisha: deduction,
        advanceAdjustedPoisha: advance,
        netPayablePoisha: netPayable,
        paidAmountPoisha: 0,
        dueAmountPoisha: netPayable,
        paymentStatus: "unpaid",
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.payrollRecords.unshift(record);

      return NextResponse.json({
        success: true,
        message: `${emp.name}-এর ${monthYear} মাসের বেতন সফলভাবে প্রস্তুত করা হয়েছে`,
        payrollRecord: record,
      });
    }

    // 2. Production Live Database Mode
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json({ error: "কর্মচারী পাওয়া যায়নি" }, { status: 404 });
    }

    // Check duplicate compound index { employeeId, monthYear }
    const existing = await PayrollRecord.findOne({
      employeeId: employee._id,
      monthYear,
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `এই কর্মচারীর জন্য ${monthYear} মাসের বেতন ইতিমধ্যে প্রস্তুত করা হয়েছে। ডুপ্লিকেট বেতন এন্ট্রি সম্পূর্ণ নিষিদ্ধ।`,
        },
        { status: 400 }
      );
    }

    const basic = employee.basicSalaryPoisha;
    const allowance = employee.allowancePoisha || 0;
    const bonus = Math.max(0, Math.round(bonusPoisha));
    const deduction = Math.max(0, Math.round(deductionPoisha));
    const advance = Math.max(0, Math.round(advanceAdjustedPoisha));

    const netPayable = Math.max(0, basic + allowance + bonus - (deduction + advance));

    const payrollRecord = await PayrollRecord.create({
      employeeId: employee._id,
      monthYear,
      basicSalaryPoisha: basic,
      allowancePoisha: allowance,
      bonusPoisha: bonus,
      deductionPoisha: deduction,
      advanceAdjustedPoisha: advance,
      netPayablePoisha: netPayable,
      paidAmountPoisha: 0,
      dueAmountPoisha: netPayable,
      paymentStatus: "unpaid",
      notes,
    });

    return NextResponse.json({
      success: true,
      message: `${employee.name}-এর ${monthYear} মাসের বেতন সফলভাবে প্রস্তুত করা হয়েছে`,
      payrollRecord: {
        ...payrollRecord.toObject(),
        employeeName: employee.name,
        employeeDesignation: employee.designation,
        employeePhone: employee.phone,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "বেতন প্রস্তুত করতে সমস্যা হয়েছে" },
      { status: error.status || 400 }
    );
  }
}

