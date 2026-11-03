"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Boxes,
  AlertTriangle,
  Store,
  PlusCircle,
  ArrowRight,
  Printer,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Receipt,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Clock
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { STORE_INFO } from "@/lib/config/storeInfo";

interface IDashboardStats {
  todaySalesPoisha: number;
  todayCashReceivedPoisha: number;
  totalCustomerDuesPoisha: number;
  totalInventoryValuePoisha: number;
}

interface ISaleItem {
  id: string;
  _id?: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  itemsSummary?: string;
  totalPoisha: number;
  paidPoisha: number;
  duePoisha: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  paymentMethod?: string;
  createdAt: string;
}

interface ILowStockItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  availableStock: number;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<IDashboardStats>({
    todaySalesPoisha: 0,
    todayCashReceivedPoisha: 0,
    totalCustomerDuesPoisha: 0,
    totalInventoryValuePoisha: 0,
  });
  const [recentSales, setRecentSales] = useState<ISaleItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<ILowStockItem[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [summaryRes, salesRes, inventoryRes] = await Promise.all([
        fetch("/api/admin/reports/summary"),
        fetch("/api/admin/sales"),
        fetch("/api/admin/reports/inventory"),
      ]);

      if (summaryRes.ok) {
        const sumData = await summaryRes.json();
        if (sumData.summary) {
          const s = sumData.summary;
          setStats({
            todaySalesPoisha: s.totalRevenuePoisha || 0,
            todayCashReceivedPoisha: s.totalLiquidAssetsPoisha || s.posRevenuePoisha || 0,
            totalCustomerDuesPoisha: s.totalReceivablesPoisha || 0,
            totalInventoryValuePoisha: s.inventoryValuationPoisha || 0,
          });
        }
      }

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        if (salesData.invoices && Array.isArray(salesData.invoices)) {
          const mapped = salesData.invoices.slice(0, 6).map((inv: any) => ({
            id: inv._id || inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName || "সাধারণ ক্রেতা",
            customerPhone: inv.customerPhone || "",
            itemsSummary:
              inv.itemsSummary ||
              (inv.items && inv.items.length > 0
                ? inv.items.map((i: any) => `${i.productNameBangla || i.productName} (${toBengaliNumber(i.quantity)}টি)`).join(", ")
                : "লাগেজ ও ট্রাভেল আইটেম"),
            totalPoisha: inv.totalPoisha || inv.grandTotalPoisha || 0,
            paidPoisha: inv.paidPoisha || 0,
            duePoisha: inv.duePoisha || 0,
            paymentStatus: inv.paymentStatus || "paid",
            paymentMethod:
              inv.payments && inv.payments.length > 0
                ? inv.payments.map((p: any) => (p.method === "cash" ? "নগদ" : p.method === "bkash" ? "বিকাশ" : p.method)).join(", ")
                : "নগদ",
            createdAt: inv.createdAt,
          }));
          setRecentSales(mapped);
        }
      }

      if (inventoryRes.ok) {
        const invData = await inventoryRes.json();
        if (invData.items && Array.isArray(invData.items)) {
          const low = invData.items
            .filter((item: any) => item.availableStock <= 3)
            .slice(0, 5)
            .map((item: any) => ({
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              availableStock: item.availableStock,
            }));
          setLowStockItems(low);
        }
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-navy via-brand-navyLight to-brand-teal text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-white/10 text-brand-gold text-xs font-semibold">
            {STORE_INFO.nameBangla} - সেন্ট্রাল কন্ট্রোল ড্যাশবোর্ড
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">
            স্বাগতম, {STORE_INFO.ownersBangla} (মালিক)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            আজকের বিক্রয়, রিয়েল-টাইম স্টক স্থিতি ও আর্থিক লেনদেনের সারসংক্ষেপ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="তথ্য রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-goldLight text-brand-navy font-bold text-xs shadow-md transition-all"
          >
            <Store className="w-4 h-4" />
            <span>পিওএস কাউন্টারে যান</span>
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              মোট বিক্রয় রাজস্ব
            </span>
            <span className="text-2xl font-black text-brand-navy">
              {formatBDT(stats.todaySalesPoisha)}
            </span>
            <Link href="/admin/sales" className="text-[11px] text-brand-teal hover:underline flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>বিক্রয় ইনভয়েসসমূহ →</span>
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Cash in Drawer / Liquid Assets */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              নগদ ও ব্যাংক স্থিতি
            </span>
            <span className="text-2xl font-black text-emerald-600">
              {formatBDT(stats.todayCashReceivedPoisha)}
            </span>
            <Link href="/admin/accounts" className="text-[11px] text-emerald-700 hover:underline block mt-1">
              ক্যাশ ও অ্যাকাউন্ট ব্যালেন্স →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Customer Dues */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              মোট কাস্টমার বকেয়া
            </span>
            <span className="text-2xl font-black text-amber-600">
              {formatBDT(stats.totalCustomerDuesPoisha)}
            </span>
            <Link href="/admin/dues" className="text-[11px] text-brand-teal hover:underline block mt-1">
              বকেয়া খাতা ও আদায় →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Total Stock Valuation */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              ইনভেন্টরি স্টক মূল্য (WAC)
            </span>
            <span className="text-2xl font-black text-brand-navy">
              {formatBDT(stats.totalInventoryValuePoisha)}
            </span>
            <Link href="/admin/inventory" className="text-[11px] text-blue-600 hover:underline block mt-1">
              স্টক ব্যালেন্স খাতা →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Low Stock Alert Banner (Real-time) */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-rose-900">
                সীমিত স্টক সতর্কতা! {toBengaliNumber(lowStockItems.length)} টি ভ্যারিয়েন্টের স্টক ৩ পিসের নিচে নেমেছে।
              </h4>
              <p className="text-[11px] text-rose-700">
                {lowStockItems.map((item) => `${item.productName} (${item.variantName} - ${toBengaliNumber(item.availableStock)}টি বাকি)`).join(", ")}
              </p>
            </div>
          </div>
          <Link
            href="/admin/inventory"
            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex-shrink-0"
          >
            স্টক রি-অর্ডার দেখুন
          </Link>
        </div>
      )}

      {/* Recent Sales Table & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-brand-navy">
                সাম্প্রতিক বিক্রয় ইনভয়েসসমূহ
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">
                কাউন্টার ও পিওএস-এ প্রস্তুতকৃত সর্বশেষ ক্যাশ মেমো
              </p>
            </div>
            <Link
              href="/admin/sales"
              className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
            >
              <span>সকল ইনভয়েস ({toBengaliNumber(recentSales.length)})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentSales.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">এখনো কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।</p>
                <Link
                  href="/pos"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-teal font-semibold hover:underline"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>প্রথম বিক্রয় শুরু করুন</span>
                </Link>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">ইনভয়েস নং</th>
                    <th className="py-3 px-4">কাস্টমার</th>
                    <th className="py-3 px-4">আইটেম বিবরণ</th>
                    <th className="py-3 px-4 text-right">মোট বিল</th>
                    <th className="py-3 px-4">পেমেন্ট</th>
                    <th className="py-3 px-4 text-center">রসিদ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">
                        {sale.invoiceNumber}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {new Date(sale.createdAt).toLocaleDateString("bn-BD")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-brand-text block">
                          {sale.customerName}
                        </span>
                        {sale.customerPhone && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sale.customerPhone}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {sale.itemsSummary}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-brand-navy">
                        {formatBDT(sale.totalPoisha)}
                      </td>
                      <td className="py-3.5 px-4">
                        {sale.paymentStatus === "paid" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{sale.paymentMethod || "নগদ"}</span>
                          </span>
                        ) : sale.paymentStatus === "partial" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                            <Clock className="w-3 h-3" />
                            <span>বকেয়া {formatBDT(sale.duePoisha)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                            বকেয়া
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/print/receipt/${sale.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-navy hover:text-white text-slate-700 font-semibold text-[11px] transition-colors"
                          title="রসিদ প্রিন্ট করুন"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>প্রিন্ট</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Operational Shortcuts */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-brand-navy mb-3">
              দ্রুত কাজের শর্টকাট (Quick Operations)
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/pos"
                className="p-3 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100/60 transition-all flex flex-col items-center text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Store className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">পিওএস কাউন্টার</span>
                <span className="text-[10px] text-slate-500">বিক্রয় শুরু করুন</span>
              </Link>

              <Link
                href="/admin/products"
                className="p-3 rounded-xl border border-slate-200 hover:border-brand-teal hover:bg-slate-50 transition-all flex flex-col items-center text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-brand-navy flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">পণ্য ক্যাটালগ</span>
                <span className="text-[10px] text-slate-500">নতুন লাগেজ যোগ</span>
              </Link>

              <Link
                href="/admin/dues"
                className="p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all flex flex-col items-center text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">বকেয়া খাতা</span>
                <span className="text-[10px] text-slate-500">টাকা আদায় এন্ট্রি</span>
              </Link>

              <Link
                href="/admin/expenses"
                className="p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 transition-all flex flex-col items-center text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">দোকান খরচ</span>
                <span className="text-[10px] text-slate-500">দৈনিক খরচ ভাউচার</span>
              </Link>

              <Link
                href="/admin/purchases"
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col items-center text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">ক্রয় চালান</span>
                <span className="text-[10px] text-slate-500">সাপ্লায়ার স্টক রিসিভ</span>
              </Link>

              <Link
                href="/admin/reports"
                className="p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all flex flex-col items-center text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">প্রফিট & লস</span>
                <span className="text-[10px] text-slate-500">আর্থিক হিসাব রিপোর্ট</span>
              </Link>
            </div>
          </div>

          {/* Store Info Card */}
          <div className="bg-gradient-to-br from-slate-900 to-brand-navy rounded-2xl p-5 text-white">
            <span className="text-[11px] text-brand-gold uppercase tracking-wider font-semibold">
              শোরুম অবস্থান ও বিবরণ
            </span>
            <h4 className="text-sm font-bold mt-1 text-white">
              {STORE_INFO.fullName}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {STORE_INFO.addressBangla}
            </p>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>মোবাইল: {STORE_INFO.mobile}</span>
              <Link href="/admin/settings" className="text-brand-gold hover:underline">
                সেটিংস এডিট →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
