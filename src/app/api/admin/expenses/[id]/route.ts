import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Expense } from "@/models/Expense";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("expenses.approve", req);
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "অবৈধ স্ট্যাটাস। শুধুমাত্র approved বা rejected অনুমোদিত।" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const expense = (store.expenses || []).find((e) => e._id === id);
      if (!expense) {
        return NextResponse.json({ error: "খরচের ভাউচার পাওয়া যায়নি" }, { status: 404 });
      }

      expense.status = status;
      expense.approvedById = session.userId;
      expense.approvedByName = session.displayName;

      return NextResponse.json({
        success: true,
        message: status === "approved" ? "খরচ অনুমোদিত হয়েছে" : "খরচ প্রত্যাখ্যান করা হয়েছে",
        expense,
      });
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        status,
        approvedById: session.userId,
        approvedByName: session.displayName,
      },
      { new: true }
    );

    if (!expense) {
      return NextResponse.json({ error: "খরচের ভাউচার পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: status === "approved" ? "খরচ অনুমোদিত হয়েছে" : "খরচ প্রত্যাখ্যান করা হয়েছে",
      expense,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "খরচ অনুমোদন করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

