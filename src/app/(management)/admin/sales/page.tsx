"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  Filter,
  Printer,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Store,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  DollarSign
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";

interface ISalesInvoiceItem {
  _id?: string;
  id?: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  items?: Array<{
    productNameBangla?: string;
    productName?: string;
    quantity: number;
    unitPricePoisha: number;
    lineTotalPoisha: number;
  }>;
  itemsSummary?: string;
  subtotalPoisha?: number;
  discountPoisha?: number;
  taxPoisha?: number;
  totalPoisha: number;
  paidPoisha: number;
  duePoisha: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  payments?: Array<{
    method: string;
    amountPoisha: number;
  }>;
  cashierName?: string;
  createdAt: string;
}

export default function AdminSalesInvoicesPage() {
  const [invoices, setInvoices] = useState<ISalesInvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("paymentStatus", statusFilter);

      const res = await fetch(`/api/admin/sales?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "বিক্রয় তালিকা লোড করতে ব্যর্থ হয়েছে");
      }

      setInvoices(data.invoices || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "বিক্রয় তালিকা লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadInvoices();
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalPaid = 0;
    let totalDue = 0;

    invoices.forEach((inv) => {
      totalSales += inv.totalPoisha || 0;
      totalPaid += inv.paidPoisha || 0;
      totalDue += inv.duePoisha || 0;
    });

    return {
      count: invoices.length,
      totalSales,
      totalPaid,
      totalDue,
    };
  }, [invoices]);

  const formatPaymentMethod = (inv: ISalesInvoiceItem) => {
    if (inv.payments && inv.payments.length > 0) {
      const methods = inv.payments.map((p) => {
        if (p.method === "cash") return "নগদ";
        if (p.method === "bkash") return "বিকাশ";
        if (p.method === "card") return "কার্ড";
        if (p.method === "bank_transfer") return "ব্যাংক";
        return p.method;
      });
      return [...new Set(methods)].join(", ");
    }
    return "নগদ";
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-navy via-brand-navyLight to-brand-teal text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-brand-gold text-xs font-semibold">
              কাউন্টার ও পিওএস বিক্রয়
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">
            বিক্রয় ইনভয়েস ও মেমো তালিকা
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            শোরুমের সকল ক্যাশ কাউন্টার বিক্রয়, রসিদ এবং পেমেন্ট স্ট্যাটাস
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-goldLight text-brand-navy font-bold text-xs shadow-md transition-all"
          >
            <Store className="w-4 h-4" />
            <span>নতুন পিওএস সেল</span>
          </Link>
          <button
            onClick={loadInvoices}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              মোট ইনভয়েস সংখ্যা
            </span>
            <span className="text-2xl font-black text-brand-navy">
              {toBengaliNumber(metrics.count)} টি
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              বর্তমান ফিল্টারে প্রদর্শিত
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              মোট বিক্রয় মূল্য
            </span>
            <span className="text-2xl font-black text-brand-navy">
              {formatBDT(metrics.totalSales)}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-1">
              মোট ইনভয়েস বিল
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              আদায়কৃত অর্থ
            </span>
            <span className="text-2xl font-black text-emerald-600">
              {formatBDT(metrics.totalPaid)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              ক্যাশ ও ডিজিটাল পেমেন্ট
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              বকেয়া পাওনা
            </span>
            <span className="text-2xl font-black text-amber-600">
              {formatBDT(metrics.totalDue)}
            </span>
            <Link href="/admin/dues" className="text-[11px] text-brand-teal hover:underline block mt-1">
              বকেয়া খাতা দেখুন →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ইনভয়েস নম্বর, কাস্টমারের নাম বা ফোন দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-brand-teal"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-navyLight text-white text-xs font-semibold transition-colors"
          >
            অনুসন্ধান
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>ফিল্টার:</span>
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-brand-teal bg-white"
          >
            <option value="all">সকল পেমেন্ট স্ট্যাটাস</option>
            <option value="paid">পরিশোধিত (Paid)</option>
            <option value="partial">আংশিক বকেয়া (Partial)</option>
            <option value="unpaid">বকেয়া (Unpaid)</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-teal" />
            <span className="text-xs">বিক্রয় তালিকা লোড হচ্ছে...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs font-medium">{error}</p>
            <button
              onClick={loadInvoices}
              className="mt-3 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">কোনো ইনভয়েস পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              এখনো কোনো বিক্রয় রসিদ তৈরি হয়নি অথবা আপনার সার্চের সাথে কোনো ফলাফল মেলেনি।
            </p>
            <Link
              href="/pos"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-navy text-white text-xs font-semibold"
            >
              <Store className="w-3.5 h-3.5" />
              <span>পিওএস-এ যান</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">ইনভয়েস নং & সময়</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">কাস্টমার</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">আইটেম বিবরণ</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">মোট বিল</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">পরিশোধিত</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">বকেয়া</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">পেমেন্ট মাধ্যম</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">রসিদ / অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const invoiceId = inv._id || inv.id;
                  const formattedDate = new Date(inv.createdAt).toLocaleDateString("bn-BD", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  const formattedTime = new Date(inv.createdAt).toLocaleTimeString("bn-BD", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={invoiceId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-brand-navy block">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formattedDate}, {formattedTime}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block">
                          {inv.customerName || "সাধারণ ক্রেতা"}
                        </span>
                        {inv.customerPhone && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {inv.customerPhone}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {inv.itemsSummary ||
                          (inv.items && inv.items.length > 0
                            ? inv.items.map((i) => `${i.productNameBangla || i.productName} (${toBengaliNumber(i.quantity)}টি)`).join(", ")
                            : "লাগেজ ও পণ্য")}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-brand-navy">
                        {formatBDT(inv.totalPoisha)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-emerald-600">
                        {formatBDT(inv.paidPoisha)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-amber-600">
                        {inv.duePoisha > 0 ? formatBDT(inv.duePoisha) : "৳ ০"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium">
                          {formatPaymentMethod(inv)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inv.paymentStatus === "paid" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>পরিশোধিত</span>
                          </span>
                        ) : inv.paymentStatus === "partial" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                            <Clock className="w-3 h-3" />
                            <span>আংশিক বকেয়া</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                            <AlertCircle className="w-3 h-3" />
                            <span>বকেয়া</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/print/receipt/${invoiceId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-navy/5 hover:bg-brand-navy hover:text-white text-brand-navy font-semibold text-[11px] transition-all"
                            title="থার্মাল রসিদ প্রিন্ট করুন"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>রসিদ</span>
                          </Link>
                          {inv.duePoisha > 0 && (
                            <Link
                              href="/admin/dues"
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[11px] transition-all"
                              title="বকেয়া আদায় করুন"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>আদায়</span>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

