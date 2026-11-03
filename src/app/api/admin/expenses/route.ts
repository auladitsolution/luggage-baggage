import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Expense } from "@/models/Expense";
import { requirePermission } from "@/lib/rbac/guards";
import { getNextExpenseVoucherNumber } from "@/lib/purchasing/purchaseSequence";
import { EXPENSE_CATEGORIES, ExpenseCategory } from "@/types/purchasing";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("expenses.create");
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let list = [...(store.expenses || [])];
      if (category && category !== "all") {
        list = list.filter((e) => e.category === category);
      }

      const totalExpensePoisha = list
        .filter((e) => e.status === "approved")
        .reduce((sum, e) => sum + (e.amountPoisha || 0), 0);

      return NextResponse.json({
        success: true,
        expenses: list,
        summary: {
          totalExpensePoisha,
          count: list.length,
        },
      });
    }

    const query: any = {};
    if (category && category !== "all") {
      query.category = category;
    }

    const expenses = await Expense.find(query).sort({ expenseDate: -1 }).lean();
    const totalExpensePoisha = expenses
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + (e.amountPoisha || 0), 0);

    return NextResponse.json({
      success: true,
      expenses,
      summary: {
        totalExpensePoisha,
        count: expenses.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "খরচের তালিকা লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("expenses.create");
    const body = await req.json();

    const {
      category,
      amountPoisha,
      paymentMethod = "cash",
      paidTo,
      description,
      expenseDate,
      receiptAttachmentUrl,
    } = body;

    if (!category || !amountPoisha || amountPoisha <= 0 || !description) {
      return NextResponse.json(
        { error: "খরচের খাত, পরিমাণ (শূন্যের বেশি) এবং বিবরণ আবশ্যক" },
        { status: 400 }
      );
    }

    const categoryBangla = EXPENSE_CATEGORIES[category as ExpenseCategory] || "বিবিধ খরচ";
    const voucherNumber = await getNextExpenseVoucherNumber();

    // Auto-approve if user is owner/admin with expenses.approve, else pending
    const canAutoApprove = session.permissions.includes("expenses.approve") || session.isOwner;
    const status = canAutoApprove ? "approved" : "pending";

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const newExpense = {
        _id: `mock-exp-${Date.now()}`,
        voucherNumber,
        category: category as ExpenseCategory,
        categoryBangla,
        amountPoisha: Math.round(amountPoisha),
        paymentMethod,
        paidTo: paidTo?.trim(),
        approvedById: session.userId,
        approvedByName: session.displayName,
        status: status as "approved" | "pending",
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        description: description.trim(),
        receiptAttachmentUrl,
        createdAt: new Date(),
      };

      store.expenses.unshift(newExpense);

      return NextResponse.json({
        success: true,
        message:
          status === "approved"
            ? "খরচ সফলভাবে অনুমোদিত ও রেকর্ড হয়েছে"
            : "খরচের ভাউচার তৈরি হয়েছে, ওনারের অনুমোদনের অপেক্ষায়",
        expense: newExpense,
      });
    }

    const expense = await Expense.create({
      voucherNumber,
      category,
      categoryBangla,
      amountPoisha: Math.round(amountPoisha),
      paymentMethod,
      paidTo: paidTo?.trim(),
      approvedById: session.userId,
      approvedByName: session.displayName,
      status,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      description: description.trim(),
      receiptAttachmentUrl,
    });

    return NextResponse.json({
      success: true,
      message:
        status === "approved"
          ? "খরচ সফলভাবে অনুমোদিত ও রেকর্ড হয়েছে"
          : "খরচের ভাউচার তৈরি হয়েছে, ওনারের অনুমোদনের অপেক্ষায়",
      expense,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "খরচ তৈরি করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

