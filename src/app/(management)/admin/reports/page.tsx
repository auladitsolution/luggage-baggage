"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Download, 
  Printer, 
  Boxes, 
  Users, 
  Truck, 
  Wallet,
  Receipt,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IFinancialSummary } from "@/types/accounting";
import { convertToCSV, downloadCSV } from "@/lib/export/reportExport";
import { STORE_INFO } from "@/lib/config/storeInfo";

export default function ReportsPage() {
  const [summary, setSummary] = useState<IFinancialSummary | null>(null);
  const [pnlStatement, setPnlStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Date Filter State
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const [sumRes, pnlRes] = await Promise.all([
        fetch(`/api/admin/reports/summary?${params.toString()}`),
        fetch(`/api/admin/reports/profit-loss?${params.toString()}`),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
      }
      if (pnlRes.ok) {
        const pnlData = await pnlRes.json();
        setPnlStatement(pnlData.statement);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const today = now.toISOString().split("T")[0];
      setStartDate(today);
      setEndDate(today);
    } else if (preset === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
      setStartDate(startOfMonth);
      setEndDate(endOfMonth);
    }
  };

  const handleExportCSV = () => {
    if (!summary) return;
    const reportData = [
      { metric: "মোট বিক্রয় রাজস্ব (Total Net Revenue)", amount: (summary.totalRevenuePoisha / 100).toFixed(2) },
      { metric: "বিক্রিত পণ্যের ক্রয়মূল্য (COGS)", amount: (summary.costOfGoodsSoldPoisha / 100).toFixed(2) },
      { metric: "গ্রস প্রফিট (Gross Profit)", amount: (summary.grossProfitPoisha / 100).toFixed(2) },
      { metric: "দোকান পরিচালন ব্যয় (Operating Expenses)", amount: (summary.operatingExpensesPoisha / 100).toFixed(2) },
      { metric: "কর্মচারী বেতন (Staff Payroll)", amount: (summary.staffPayrollPoisha / 100).toFixed(2) },
      { metric: "মোট মোট ব্যয় (Total Operating Cost)", amount: (summary.totalExpensesPoisha / 100).toFixed(2) },
      { metric: "নেট পরিচালন মুনাফা (Net Operating Profit)", amount: (summary.netProfitPoisha / 100).toFixed(2) },
      { metric: "বর্তমান ইনভেন্টরি মূল্যায়ন (Inventory Valuation)", amount: (summary.inventoryValuationPoisha / 100).toFixed(2) },
      { metric: "কাস্টমার বকেয়া পাওনা (Receivables)", amount: (summary.totalReceivablesPoisha / 100).toFixed(2) },
      { metric: "সাপ্লায়ার বকেয়া দেনা (Payables)", amount: (summary.totalPayablesPoisha / 100).toFixed(2) },
      { metric: "মোট তরল তহবিল (Liquid Assets)", amount: (summary.totalLiquidAssetsPoisha / 100).toFixed(2) },
    ];

    const csv = convertToCSV(reportData, [
      { key: "metric", label: "হিসাব খাত (Financial Metric)" },
      { key: "amount", label: "পরিমাণ (৳ BDT)" },
    ]);
    downloadCSV(csv, `financial-summary-report-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto print:p-0">
      {/* Printable Report Header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-xl font-bold text-slate-900">{STORE_INFO.name} ({STORE_INFO.nameBangla})</h1>
        <p className="text-xs text-slate-600">{STORE_INFO.address}</p>
        <p className="text-xs text-slate-600">মালিকানায়: {STORE_INFO.owners} • মোবাইল: {STORE_INFO.mobile} • ইমেইল: {STORE_INFO.email}</p>
        <p className="text-xs font-semibold text-slate-700 mt-1">পূর্ণাঙ্গ ব্যবসায়িক আর্থিক অডিট ও লাভ-ক্ষতি প্রতিবেদন • প্রিন্ট তারিখ: {new Date().toLocaleDateString("bn-BD")}</p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-brand-teal text-sm font-semibold mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>ব্যবসার আর্থিক অডিট ও অ্যানালিটিক্স</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            আর্থিক প্রতিবেদন ও লাভ-ক্ষতি
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            বিক্রয়, COGS, গ্রস প্রফিট, নেট প্রফিট, খরচ ও ইনভেন্টরি মূল্যায়নের সমন্বিত বিবরণী
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={!summary}
            className="flex items-center gap-1.5 text-slate-700 bg-white"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV এক্সপোর্ট</span>
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-1.5 text-slate-700 bg-white"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>প্রিন্ট করুন</span>
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            size="sm"
            variant={datePreset === "all" ? "default" : "outline"}
            onClick={() => handlePresetChange("all")}
            className={datePreset === "all" ? "bg-brand-navy text-white text-xs" : "text-xs bg-white"}
          >
            সর্বকালীন (All Time)
          </Button>
          <Button
            size="sm"
            variant={datePreset === "today" ? "default" : "outline"}
            onClick={() => handlePresetChange("today")}
            className={datePreset === "today" ? "bg-brand-navy text-white text-xs" : "text-xs bg-white"}
          >
            আজকের দিন (Today)
          </Button>
          <Button
            size="sm"
            variant={datePreset === "month" ? "default" : "outline"}
            onClick={() => handlePresetChange("month")}
            className={datePreset === "month" ? "bg-brand-navy text-white text-xs" : "text-xs bg-white"}
          >
            চলতি মাস (This Month)
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setDatePreset("custom");
              setStartDate(e.target.value);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
          <span className="text-slate-400 text-xs">থেকে</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setDatePreset("custom");
              setEndDate(e.target.value);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>
      </div>

      {/* Primary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>মোট বিক্রয় রাজস্ব</span>
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              ৳{(summary.totalRevenuePoisha / 100).toLocaleString("bn-BD")}
            </p>
            <div className="flex gap-2 mt-2 text-[11px] text-slate-500">
              <span>POS: ৳{(((summary.posRevenuePoisha || 0) / 100)).toLocaleString("bn-BD")}</span>
              <span>•</span>
              <span>অনলাইন: ৳{(((summary.onlineRevenuePoisha || 0) / 100)).toLocaleString("bn-BD")}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>গ্রস প্রফিট (বিক্রয় - COGS)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 mt-2">
              ৳{(summary.grossProfitPoisha / 100).toLocaleString("bn-BD")}
            </p>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2 font-medium">
              মার্জিন: {summary.grossProfitMarginPercent}%
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>পরিচালন ব্যয় ও বেতন</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-extrabold text-rose-600 mt-2">
              ৳{(summary.totalExpensesPoisha / 100).toLocaleString("bn-BD")}
            </p>
            <div className="flex gap-2 mt-2 text-[11px] text-slate-500">
              <span>খরচ: ৳{(summary.operatingExpensesPoisha / 100).toLocaleString("bn-BD")}</span>
              <span>•</span>
              <span>বেতন: ৳{(summary.staffPayrollPoisha / 100).toLocaleString("bn-BD")}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>নেট পরিচালন মুনাফা (Net Profit)</span>
              <DollarSign className="w-4 h-4 text-brand-teal" />
            </div>
            <p
              className={`text-2xl font-extrabold mt-2 ${
                summary.netProfitPoisha >= 0 ? "text-slate-900" : "text-rose-600"
              }`}
            >
              ৳{(summary.netProfitPoisha / 100).toLocaleString("bn-BD")}
            </p>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full inline-block mt-2 font-medium ${
                summary.netProfitPoisha >= 0
                  ? "bg-brand-teal/10 text-brand-teal"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              নেট মার্জিন: {summary.netProfitMarginPercent}%
            </span>
          </div>
        </div>
      )}

      {/* Secondary Balance Sheet Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">ইনভেন্টরি বর্তমান মূল্য (WAC)</span>
              <p className="text-lg font-bold text-slate-900">
                ৳{(summary.inventoryValuationPoisha / 100).toLocaleString("bn-BD")}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">কাস্টমার বকেয়া পাওনা (দোকান পাবে)</span>
              <p className="text-lg font-bold text-amber-600">
                ৳{(summary.totalReceivablesPoisha / 100).toLocaleString("bn-BD")}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">সাপ্লায়ার বকেয়া দেনা (দোকান দেবে)</span>
              <p className="text-lg font-bold text-rose-600">
                ৳{(summary.totalPayablesPoisha / 100).toLocaleString("bn-BD")}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">মোট তরল তহবিল (ক্যাশ + ব্যাংক)</span>
              <p className="text-lg font-bold text-blue-600">
                ৳{(summary.totalLiquidAssetsPoisha / 100).toLocaleString("bn-BD")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Income Statement (Profit & Loss Table) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-teal" />
            <h2 className="text-base font-bold text-slate-900">
              লাভ-ক্ষতি বিবরণী (Profit & Loss Statement)
            </h2>
          </div>
          <Badge variant="outline" className="text-xs bg-slate-50 font-normal">
            হিসাবকাল: {startDate || "শুরু"} হতে {endDate || "বর্তমান"}
          </Badge>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">রিপোর্ট লোড হচ্ছে...</div>
        ) : !pnlStatement ? (
          <div className="p-8 text-center text-slate-400">কোনো তথ্য পাওয়া যায়নি</div>
        ) : (
          <div className="divide-y divide-slate-100 text-sm">
            {/* 1. Revenue */}
            <div className="p-4 sm:p-5 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider text-brand-teal">
                ১. বিক্রয় রাজস্ব (Operating Revenue)
              </h3>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between text-slate-600">
                  <span>দোকানের পিওএস বিক্রয় (POS Counter Gross Sales)</span>
                  <span className="font-mono">৳{(pnlStatement.revenue.posSalesGrossPoisha / 100).toLocaleString("bn-BD")}</span>
                </div>
                {pnlStatement.revenue.posSalesDiscountPoisha > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>বাদ: পিওএস ডিসকাউন্ট ও ছাড় (Less: Discounts)</span>
                    <span className="font-mono">-৳{(pnlStatement.revenue.posSalesDiscountPoisha / 100).toLocaleString("bn-BD")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>অনলাইন ই-কমার্স বিক্রয় (Online E-Commerce Orders)</span>
                  <span className="font-mono">৳{(pnlStatement.revenue.onlineSalesNetPoisha / 100).toLocaleString("bn-BD")}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>সর্বমোট নিট বিক্রয় রাজস্ব (Total Net Revenue)</span>
                  <span className="font-mono text-blue-600">৳{(pnlStatement.revenue.totalNetRevenuePoisha / 100).toLocaleString("bn-BD")}</span>
                </div>
              </div>
            </div>

            {/* 2. COGS & Gross Profit */}
            <div className="p-4 sm:p-5">
              <h3 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider text-brand-teal">
                ২. বিক্রিত পণ্যের ক্রয়মূল্য ও মোট লাভ (COGS & Gross Profit)
              </h3>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between text-slate-600">
                  <span>বিক্রিত পণ্যের গড় ক্রয়মূল্য (Cost of Goods Sold - WAC)</span>
                  <span className="font-mono text-rose-600">-৳{(pnlStatement.costOfGoodsSold.cogsPoisha / 100).toLocaleString("bn-BD")}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>গ্রস প্রফিট / মোট লাভ (Gross Profit)</span>
                  <span className="font-mono text-emerald-600">৳{(pnlStatement.costOfGoodsSold.grossProfitPoisha / 100).toLocaleString("bn-BD")}</span>
                </div>
              </div>
            </div>

            {/* 3. Operating Expenses & Payroll */}
            <div className="p-4 sm:p-5 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider text-brand-teal">
                ৩. দোকান পরিচালন ব্যয় ও বেতন (Operating Expenses & Payroll)
              </h3>
              <div className="space-y-2 pl-4">
                {Object.entries(pnlStatement.operatingExpenses.breakdown).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-slate-600 text-xs">
                    <span className="capitalize">{cat.replace(/_/g, " ")}</span>
                    <span className="font-mono">৳{((amt as number) / 100).toLocaleString("bn-BD")}</span>
                  </div>
                ))}
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>কর্মচারীদের পরিশোধিত বেতন (Staff Payroll)</span>
                  <span className="font-mono">৳{(pnlStatement.staffPayroll.totalPaidPayrollPoisha / 100).toLocaleString("bn-BD")}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>সর্বমোট পরিচালন ব্যয় (Total Operating Cost)</span>
                  <span className="font-mono text-rose-600">-৳{(pnlStatement.netProfit.totalExpensesPoisha / 100).toLocaleString("bn-BD")}</span>
                </div>
              </div>
            </div>

            {/* 4. Net Profit */}
            <div className="p-4 sm:p-5 bg-emerald-50/40">
              <div className="flex justify-between items-center font-extrabold text-base sm:text-lg text-slate-900">
                <div>
                  <span>নেট পরিচালন মুনাফা (Net Operating Profit)</span>
                  <span className="block text-xs font-normal text-slate-500 mt-0.5">
                    গ্রস প্রফিট - (দোকান খরচ + কর্মচারী বেতন)
                  </span>
                </div>
                <span
                  className={`font-mono text-xl sm:text-2xl ${
                    pnlStatement.netProfit.netOperatingProfitPoisha >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  ৳{(pnlStatement.netProfit.netOperatingProfitPoisha / 100).toLocaleString("bn-BD")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

