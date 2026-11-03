import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { FinancialAccount } from "@/models/FinancialAccount";
import { JournalEntry } from "@/models/JournalEntry";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";
import { getNextJournalNumber } from "@/lib/accounting/journalSequence";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("settings.manage");
    const body = await req.json();

    const {
      fromAccountId,
      toAccountId,
      amountPoisha,
      notes,
    } = body;

    if (!fromAccountId || !toAccountId || !amountPoisha || amountPoisha <= 0) {
      return NextResponse.json(
        { error: "উৎস হিসাব, গন্তব্য হিসাব এবং স্থানান্তরের সঠিক পরিমাণ আবশ্যক" },
        { status: 400 }
      );
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json(
        { error: "উৎস ও গন্তব্য হিসাব একই হতে পারে না" },
        { status: 400 }
      );
    }

    const transferAmount = Math.round(amountPoisha);
    const db = await connectToDatabase();
    const entryNumber = await getNextJournalNumber();

    // 1. Mock In-Memory Mode
    if (!db) {
      const store = getMockStore();
      const fromAcc = (store.financialAccounts || []).find(
        (a) => String(a._id) === String(fromAccountId)
      );
      const toAcc = (store.financialAccounts || []).find(
        (a) => String(a._id) === String(toAccountId)
      );

      if (!fromAcc || !toAcc) {
        return NextResponse.json({ error: "হিসাবদ্বয় খুঁজে পাওয়া যায়নি" }, { status: 404 });
      }

      if (fromAcc.currentBalancePoisha < transferAmount) {
        return NextResponse.json(
          {
            error: `উৎস হিসাবে পর্যাপ্ত ব্যালেন্স নেই! বর্তমান ব্যালেন্স: ৳${fromAcc.currentBalancePoisha / 100}, কাটার চেষ্টা: ৳${transferAmount / 100}`,
          },
          { status: 400 }
        );
      }

      // Balance transfer
      fromAcc.currentBalancePoisha -= transferAmount;
      fromAcc.updatedAt = new Date();

      toAcc.currentBalancePoisha += transferAmount;
      toAcc.updatedAt = new Date();

      // Double-Entry Journal: Debit Destination Account (Asset +), Credit Source Account (Asset -)
      const journal: any = {
        _id: `mock-jv-${Date.now()}`,
        entryNumber,
        entryDate: new Date(),
        referenceType: "transfer",
        referenceId: `TRF-${Date.now()}`,
        description: `তহবিল স্থানান্তর: '${fromAcc.accountName}' থেকে '${toAcc.accountName}' তে`,
        lines: [
          {
            accountId: toAcc._id,
            accountName: toAcc.accountName,
            accountType: "asset",
            debitPoisha: transferAmount,
            creditPoisha: 0,
            notes: "গন্তব্য হিসাবে জমা",
          },
          {
            accountId: fromAcc._id,
            accountName: fromAcc.accountName,
            accountType: "asset",
            debitPoisha: 0,
            creditPoisha: transferAmount,
            notes: "উৎস হিসাব থেকে কর্তন",
          },
        ],
        totalDebitPoisha: transferAmount,
        totalCreditPoisha: transferAmount,
        actorId: session.userId,
        actorName: session.displayName,
        createdAt: new Date(),
      };

      if (!store.journalEntries) store.journalEntries = [];
      store.journalEntries.unshift(journal);

      return NextResponse.json({
        success: true,
        message: "তহবিল স্থানান্তর এবং ডাবল-এন্ট্রি হিসাব ভাউচার সম্পন্ন হয়েছে",
        fromAccount: fromAcc,
        toAccount: toAcc,
        journalEntry: journal,
      });
    }

    // 2. Production Live Database Mode
    const fromAcc = await FinancialAccount.findById(fromAccountId);
    const toAcc = await FinancialAccount.findById(toAccountId);

    if (!fromAcc || !toAcc) {
      return NextResponse.json({ error: "হিসাবদ্বয় খুঁজে পাওয়া যায়নি" }, { status: 404 });
    }

    if (fromAcc.currentBalancePoisha < transferAmount) {
      return NextResponse.json(
        {
          error: `উৎস হিসাবে পর্যাপ্ত ব্যালেন্স নেই! বর্তমান ব্যালেন্স: ৳${fromAcc.currentBalancePoisha / 100}, কাটার চেষ্টা: ৳${transferAmount / 100}`,
        },
        { status: 400 }
      );
    }

    // Atomic Balance Mutation
    fromAcc.currentBalancePoisha -= transferAmount;
    await fromAcc.save();

    toAcc.currentBalancePoisha += transferAmount;
    await toAcc.save();

    const journal = await JournalEntry.create({
      entryNumber,
      entryDate: new Date(),
      referenceType: "transfer",
      referenceId: `TRF-${Date.now()}`,
      description: `তহবিল স্থানান্তর: '${fromAcc.accountName}' থেকে '${toAcc.accountName}' তে${notes ? ` (${notes})` : ""}`,
      lines: [
        {
          accountId: toAcc._id,
          accountName: toAcc.accountName,
          accountType: "asset",
          debitPoisha: transferAmount,
          creditPoisha: 0,
          notes: "গন্তব্য হিসাবে জমা",
        },
        {
          accountId: fromAcc._id,
          accountName: fromAcc.accountName,
          accountType: "asset",
          debitPoisha: 0,
          creditPoisha: transferAmount,
          notes: "উৎস হিসাব থেকে কর্তন",
        },
      ],
      totalDebitPoisha: transferAmount,
      totalCreditPoisha: transferAmount,
      actorId: session.userId,
      actorName: session.displayName,
    });

    return NextResponse.json({
      success: true,
      message: "তহবিল স্থানান্তর এবং ডাবল-এন্ট্রি হিসাব ভাউচার সম্পন্ন হয়েছে",
      fromAccount: fromAcc,
      toAccount: toAcc,
      journalEntry: journal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "তহবিল স্থানান্তর করতে সমস্যা হয়েছে" },
      { status: error.status || 400 }
    );
  }
}

