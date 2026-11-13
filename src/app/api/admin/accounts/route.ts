import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { FinancialAccount } from "@/models/FinancialAccount";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("reports.read", req);
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const accounts = store.financialAccounts || [];
      const totalLiquidAssetsPoisha = accounts
        .filter((a) => a.isActive)
        .reduce((sum, a) => sum + a.currentBalancePoisha, 0);

      return NextResponse.json({
        success: true,
        accounts,
        totalLiquidAssetsPoisha,
      });
    }

    // Seed default accounts in MongoDB if none exist
    const count = await FinancialAccount.countDocuments();
    if (count === 0) {
      await FinancialAccount.create([
        {
          accountName: "দোকান ক্যাশ ড্রয়ার",
          accountType: "cash",
          currentBalancePoisha: 5000000, // ৳৫০,০০০
          isActive: true,
          isDefault: true,
        },
        {
          accountName: "ব্র্যাক ব্যাংক চলতি হিসাব (A/C: 150120...)",
          accountType: "bank",
          bankName: "BRAC Bank PLC",
          accountNumber: "15012048596001",
          currentBalancePoisha: 25000000, // ৳২,৫০,০০০
          isActive: true,
          isDefault: false,
        },
        {
          accountName: "বিকাশ মার্চেন্ট ওয়ালেট (01711223344)",
          accountType: "bkash",
          accountNumber: "01711223344",
          currentBalancePoisha: 4000000, // ৳৪০,০০০
          isActive: true,
          isDefault: false,
        },
        {
          accountName: "নগদ মার্চেন্ট ওয়ালেট (01811223344)",
          accountType: "nagad",
          accountNumber: "01811223344",
          currentBalancePoisha: 2000000, // ৳২০,০০০
          isActive: true,
          isDefault: false,
        },
      ]);
    }

    const accounts = await FinancialAccount.find().sort({ isDefault: -1, accountType: 1 }).lean();
    const totalLiquidAssetsPoisha = accounts
      .filter((a) => a.isActive)
      .reduce((sum, a) => sum + a.currentBalancePoisha, 0);

    return NextResponse.json({
      success: true,
      accounts,
      totalLiquidAssetsPoisha,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "আর্থিক হিসাব লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("settings.manage", req);
    const body = await req.json();

    const {
      accountName,
      accountType,
      accountNumber,
      bankName,
      branchName,
      initialBalancePoisha = 0,
      isDefault = false,
    } = body;

    if (!accountName || !accountType) {
      return NextResponse.json(
        { error: "হিসাবের নাম এবং ধরণ আবশ্যক" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      if (!store.financialAccounts) store.financialAccounts = [];

      const newAccount = {
        _id: `mock-acc-${Date.now()}`,
        accountName: accountName.trim(),
        accountType,
        accountNumber: accountNumber?.trim(),
        bankName: bankName?.trim(),
        branchName: branchName?.trim(),
        currentBalancePoisha: Math.round(initialBalancePoisha),
        isActive: true,
        isDefault: !!isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.financialAccounts.push(newAccount);
      return NextResponse.json({
        success: true,
        message: "নতুন হিসাব সফলভাবে যুক্ত করা হয়েছে",
        account: newAccount,
      });
    }

    const account = await FinancialAccount.create({
      accountName: accountName.trim(),
      accountType,
      accountNumber: accountNumber?.trim(),
      bankName: bankName?.trim(),
      branchName: branchName?.trim(),
      currentBalancePoisha: Math.round(initialBalancePoisha),
      isActive: true,
      isDefault: !!isDefault,
    });

    return NextResponse.json({
      success: true,
      message: "নতুন হিসাব সফলভাবে যুক্ত করা হয়েছে",
      account,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "হিসাব তৈরি করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

