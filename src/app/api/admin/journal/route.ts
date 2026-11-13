import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { JournalEntry } from "@/models/JournalEntry";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";
import { getNextJournalNumber } from "@/lib/accounting/journalSequence";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("reports.read", req);
    const { searchParams } = new URL(req.url);
    const referenceType = searchParams.get("referenceType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let list = [...(store.journalEntries || [])];

      if (referenceType && referenceType !== "all") {
        list = list.filter((j) => j.referenceType === referenceType);
      }

      if (startDate) {
        const start = new Date(startDate).getTime();
        list = list.filter((j) => new Date(j.entryDate).getTime() >= start);
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        list = list.filter((j) => new Date(j.entryDate).getTime() <= end);
      }

      return NextResponse.json({ success: true, journalEntries: list });
    }

    const query: any = {};
    if (referenceType && referenceType !== "all") {
      query.referenceType = referenceType;
    }
    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate);
    }

    const journalEntries = await JournalEntry.find(query)
      .sort({ entryDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, journalEntries });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "জার্নাল এন্ট্রি লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("settings.manage", req);
    const body = await req.json();

    const {
      description,
      referenceType = "transfer",
      referenceId,
      lines,
    } = body;

    if (!description || !lines || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json(
        { error: "বিবরণ এবং কমপক্ষে ২টি লেজার লাইন (ডেবিট ও ক্রেডিট) আবশ্যক" },
        { status: 400 }
      );
    }

    // Double-Entry Accounting Rule: Sum of Debits MUST equal Sum of Credits!
    const totalDebit = lines.reduce((sum, l) => sum + (Math.round(l.debitPoisha) || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (Math.round(l.creditPoisha) || 0), 0);

    if (totalDebit <= 0 || totalDebit !== totalCredit) {
      return NextResponse.json(
        {
          error: `দ্বৈত দাখিলা নীতির লঙ্ঘন! মোট ডেবিট (৳${totalDebit / 100}) এবং মোট ক্রেডিট (৳${totalCredit / 100}) অবশ্যই সমান হতে হবে।`,
        },
        { status: 400 }
      );
    }

    const entryNumber = await getNextJournalNumber();
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const journal = {
        _id: `mock-jv-${Date.now()}`,
        entryNumber,
        entryDate: new Date(),
        referenceType,
        referenceId: referenceId || `MANUAL-${Date.now()}`,
        description: description.trim(),
        lines,
        totalDebitPoisha: totalDebit,
        totalCreditPoisha: totalCredit,
        actorId: session.userId,
        actorName: session.displayName,
        createdAt: new Date(),
      };
      if (!store.journalEntries) store.journalEntries = [];
      store.journalEntries.unshift(journal);

      return NextResponse.json({
        success: true,
        message: "জার্নাল এন্ট্রি সফলভাবে সংরক্ষিত হয়েছে",
        journalEntry: journal,
      });
    }

    const journal = await JournalEntry.create({
      entryNumber,
      entryDate: new Date(),
      referenceType,
      referenceId: referenceId || `MANUAL-${Date.now()}`,
      description: description.trim(),
      lines,
      totalDebitPoisha: totalDebit,
      totalCreditPoisha: totalCredit,
      actorId: session.userId,
      actorName: session.displayName,
    });

    return NextResponse.json({
      success: true,
      message: "জার্নাল এন্ট্রি সফলভাবে সংরক্ষিত হয়েছে",
      journalEntry: journal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "জার্নাল এন্ট্রি সংরক্ষণে সমস্যা হয়েছে" },
      { status: error.status || 400 }
    );
  }
}

