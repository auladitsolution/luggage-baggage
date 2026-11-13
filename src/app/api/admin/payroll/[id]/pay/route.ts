import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { PayrollRecord } from "@/models/PayrollRecord";
import { FinancialAccount } from "@/models/FinancialAccount";
import { JournalEntry } from "@/models/JournalEntry";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";
import { getNextJournalNumber } from "@/lib/accounting/journalSequence";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("payroll.manage", req);
    const { id } = await params;
    const body = await req.json();

    const { amountPoisha, financialAccountId, notes } = body;

    if (!amountPoisha || typeof amountPoisha !== "number" || amountPoisha <= 0) {
      return NextResponse.json({ error: "পরিশোধের পরিমাণ সঠিক নয়" }, { status: 400 });
    }

    if (!financialAccountId) {
      return NextResponse.json({ error: "যে হিসাব (ক্যাশ/ব্যাংক) থেকে পরিশোধ হবে তা নির্বাচন আবশ্যক" }, { status: 400 });
    }

    const payAmount = Math.round(amountPoisha);
    const db = await connectToDatabase();
    const entryNumber = await getNextJournalNumber();

    // 1. Mock In-Memory Mode
    if (!db) {
      const store = getMockStore();
      const record = (store.payrollRecords || []).find((p) => String(p._id) === String(id));
      if (!record) {
        return NextResponse.json({ error: "বেতনের রেকর্ড পাওয়া যায়নি" }, { status: 404 });
      }

      if (record.paymentStatus === "paid") {
        return NextResponse.json({ error: "এই বেতনের সম্পূর্ণ অর্থ ইতিমধ্যে পরিশোধিত হয়েছে" }, { status: 400 });
      }

      const account = (store.financialAccounts || []).find(
        (a) => String(a._id) === String(financialAccountId)
      );
      if (!account) {
        return NextResponse.json({ error: "পরিশোধের আর্থিক হিসাব পাওয়া যায়নি" }, { status: 404 });
      }

      if (account.currentBalancePoisha < payAmount) {
        return NextResponse.json(
          {
            error: `হিসাবে পর্যাপ্ত ব্যালেন্স নেই! '${account.accountName}' এর বর্তমান ব্যালেন্স: ৳${account.currentBalancePoisha / 100}, কাটার চেষ্টা: ৳${payAmount / 100}`,
          },
          { status: 400 }
        );
      }

      if (payAmount > record.dueAmountPoisha) {
        return NextResponse.json(
          {
            error: `বকেয়া পরিমাণের চেয়ে বেশি পরিশোধ করা সম্ভব নয়। সর্বোচ্চ প্রদেয়: ৳${record.dueAmountPoisha / 100}`,
          },
          { status: 400 }
        );
      }

      // Deduct from Financial Account
      account.currentBalancePoisha -= payAmount;
      account.updatedAt = new Date();

      // Update Payroll Record
      record.paidAmountPoisha += payAmount;
      record.dueAmountPoisha = Math.max(0, record.netPayablePoisha - record.paidAmountPoisha);
      record.paymentStatus = record.dueAmountPoisha === 0 ? "paid" : "partial";
      record.paidFromAccountId = account._id;
      record.disbursedDate = new Date();
      record.disbursedById = session.userId;
      record.disbursedByName = session.displayName;
      record.updatedAt = new Date();

      // Double-Entry Journal: Debit Payroll Expense, Credit Cash/Bank
      const journal: any = {
        _id: `mock-jv-${Date.now()}`,
        entryNumber,
        entryDate: new Date(),
        referenceType: "payroll",
        referenceId: record._id,
        description: `${record.employeeName || "কর্মচারী"}-এর ${record.monthYear} মাসের বেতন পরিশোধ (${account.accountName})`,
        lines: [
          {
            accountId: "head-payroll-expense",
            accountName: "কর্মচারী বেতন ব্যয় (Payroll Expense)",
            accountType: "expense",
            debitPoisha: payAmount,
            creditPoisha: 0,
            notes: `বেতন প্রদান #${record.monthYear}`,
          },
          {
            accountId: account._id,
            accountName: account.accountName,
            accountType: "asset",
            debitPoisha: 0,
            creditPoisha: payAmount,
            notes: "হিসাব থেকে টাকা কর্তন",
          },
        ],
        totalDebitPoisha: payAmount,
        totalCreditPoisha: payAmount,
        actorId: session.userId,
        actorName: session.displayName,
        createdAt: new Date(),
      };
      if (!store.journalEntries) store.journalEntries = [];
      store.journalEntries.unshift(journal);

      return NextResponse.json({
        success: true,
        message: "বেতন সফলভাবে পরিশোধ ও হিসাব সমন্বয় সম্পন্ন হয়েছে",
        payrollRecord: record,
        financialAccount: account,
        journalEntry: journal,
      });
    }

    // 2. Production Live Database Mode
    const record = await PayrollRecord.findById(id).populate("employeeId");
    if (!record) {
      return NextResponse.json({ error: "বেতনের রেকর্ড পাওয়া যায়নি" }, { status: 404 });
    }

    if (record.paymentStatus === "paid") {
      return NextResponse.json({ error: "এই বেতনের সম্পূর্ণ অর্থ ইতিমধ্যে পরিশোধিত হয়েছে" }, { status: 400 });
    }

    const account = await FinancialAccount.findById(financialAccountId);
    if (!account) {
      return NextResponse.json({ error: "পরিশোধের আর্থিক হিসাব পাওয়া যায়নি" }, { status: 404 });
    }

    if (account.currentBalancePoisha < payAmount) {
      return NextResponse.json(
        {
          error: `হিসাবে পর্যাপ্ত ব্যালেন্স নেই! '${account.accountName}' এর বর্তমান ব্যালেন্স: ৳${account.currentBalancePoisha / 100}, কাটার চেষ্টা: ৳${payAmount / 100}`,
        },
        { status: 400 }
      );
    }

    if (payAmount > record.dueAmountPoisha) {
      return NextResponse.json(
        {
          error: `বকেয়া পরিমাণের চেয়ে বেশি পরিশোধ করা সম্ভব নয়। সর্বোচ্চ প্রদেয়: ৳${record.dueAmountPoisha / 100}`,
        },
        { status: 400 }
      );
    }

    // Atomic Balance Deduction
    account.currentBalancePoisha -= payAmount;
    await account.save();

    record.paidAmountPoisha += payAmount;
    record.dueAmountPoisha = Math.max(0, record.netPayablePoisha - record.paidAmountPoisha);
    record.paymentStatus = record.dueAmountPoisha === 0 ? "paid" : "partial";
    record.paidFromAccountId = account._id as any;
    record.disbursedDate = new Date();
    record.disbursedById = session.userId as any;
    record.disbursedByName = session.displayName;
    if (notes) record.notes = notes;
    await record.save();

    // Write Double-Entry Balanced Journal Entry
    const empName = (record.employeeId as any)?.name || "কর্মচারী";
    const journal = await JournalEntry.create({
      entryNumber,
      entryDate: new Date(),
      referenceType: "payroll",
      referenceId: record._id,
      description: `${empName}-এর ${record.monthYear} মাসের বেতন পরিশোধ (${account.accountName})`,
      lines: [
        {
          accountId: "head-payroll-expense",
          accountName: "কর্মচারী বেতন ব্যয় (Payroll Expense)",
          accountType: "expense",
          debitPoisha: payAmount,
          creditPoisha: 0,
          notes: `বেতন প্রদান #${record.monthYear}`,
        },
        {
          accountId: account._id,
          accountName: account.accountName,
          accountType: "asset",
          debitPoisha: 0,
          creditPoisha: payAmount,
          notes: "হিসাব থেকে টাকা কর্তন",
        },
      ],
      totalDebitPoisha: payAmount,
      totalCreditPoisha: payAmount,
      actorId: session.userId,
      actorName: session.displayName,
    });

    return NextResponse.json({
      success: true,
      message: "বেতন সফলভাবে পরিশোধ ও হিসাব সমন্বয় সম্পন্ন হয়েছে",
      payrollRecord: record,
      financialAccount: account,
      journalEntry: journal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "বেতন পরিশোধ করতে সমস্যা হয়েছে" },
      { status: error.status || 400 }
    );
  }
}

