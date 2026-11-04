"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { STORE_INFO } from "@/lib/config/storeInfo";
import { useShopSettings } from "@/context/ShopSettingsContext";

export default function MoneyReceiptPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { settings } = useShopSettings();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState<"80mm" | "a4">("80mm");

  useEffect(() => {
    async function loadReceipt() {
      try {
        const res = await fetch(`/api/admin/dues/receipt/${id}`);
        const data = await res.json();
        if (data.receipt) {
          setReceipt(data.receipt);
        }
      } catch (err) {
        console.error("Failed to load receipt:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-teal" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-sm">
          <p className="text-sm text-slate-700 font-bold">মানি রিসিট পাওয়া যায়নি</p>
          <Link href="/admin/dues" className="mt-3 inline-block text-xs text-brand-teal font-bold">
            বকেয়া তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      {/* Top Controls Bar (hidden during actual print) */}
      <div className="no-print max-w-xl mx-auto mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/admin/dues"
          className="text-xs text-slate-600 hover:text-brand-navy flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>বকেয়া তালিকায় ফিরে যান</span>
        </Link>

        {/* Paper Format Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFormat("80mm")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              format === "80mm" ? "bg-white text-brand-navy shadow-xs" : "text-slate-600"
            }`}
          >
            ৮০ মিমি থার্মাল
          </button>
          <button
            onClick={() => setFormat("a4")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              format === "a4" ? "bg-white text-brand-navy shadow-xs" : "text-slate-600"
            }`}
          >
            A4 পূর্ণ রসিদ
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-teal text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>প্রিন্ট করুন</span>
        </button>
      </div>

      {/* Printable Area */}
      <div className="flex justify-center print:block">
        {/* ======================= FORMAT 1: 80MM THERMAL RECEIPT ======================= */}
        {format === "80mm" && (
          <div className="receipt-80mm bg-white p-4 shadow-md rounded-xl max-w-[80mm] w-full text-slate-900 font-sans print:shadow-none print:p-1 print:max-w-none">
            <div className="text-center border-b border-dashed border-slate-300 pb-2">
              <img src="/logo.png" alt={settings.name} className="w-10 h-10 mx-auto mb-1.5 object-contain" />
              <h2 className="text-sm font-black">{settings.name}</h2>
              <p className="text-[11px] font-bold text-slate-800">{settings.nameBangla}</p>
              <p className="text-[10px] text-slate-600">{settings.address}</p>
              <p className="text-[9px] text-slate-500">ফোন: {settings.mobile}</p>
              <div className="mt-1 inline-block px-2 py-0.5 rounded bg-slate-100 font-extrabold text-[10px] uppercase tracking-wide">
                টাকা জমার রসিদ (Money Receipt)
              </div>
            </div>

            <div className="text-[10px] py-1.5 border-b border-dashed border-slate-300 space-y-0.5">
              <div className="flex justify-between">
                <span>রসিদ নং: <strong>{receipt.receiptNumber}</strong></span>
                <span className="font-mono">{new Date(receipt.createdAt).toLocaleDateString("bn-BD")}</span>
              </div>
              <div className="flex justify-between">
                <span>কাস্টমার: <strong>{receipt.customerName}</strong></span>
                <span>{receipt.customerPhone}</span>
              </div>
              <div className="text-[9px] text-slate-500">
                পেমেন্ট মেথড: <strong className="uppercase">{receipt.paymentMethod}</strong>
                {receipt.transactionReference && ` (Trx: ${receipt.transactionReference})`}
              </div>
            </div>

            {/* Allocated Invoices breakdown */}
            {receipt.allocatedInvoices?.length > 0 && (
              <div className="py-1.5 border-b border-dashed border-slate-300 text-[9px] space-y-1">
                <span className="font-bold block text-slate-600">চালানে সমন্বয় (FIFO Allocation):</span>
                {receipt.allocatedInvoices.map((inv: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{inv.invoiceNumber}:</span>
                    <span>জমা: {formatBDT(inv.allocatedAmountPoisha)} {inv.remainingDuePoisha > 0 ? `(বাকি ${formatBDT(inv.remainingDuePoisha)})` : "[পরিশোধিত]"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Balances */}
            <div className="border-t border-dashed border-slate-300 pt-1.5 space-y-1 text-[10px]">
              <div className="flex justify-between text-slate-600">
                <span>পূর্বের বকেয়া:</span>
                <span>{formatBDT(receipt.balanceBeforePoisha)}</span>
              </div>
              <div className="flex justify-between font-black text-xs text-emerald-700">
                <span>আদায়কৃত অর্থ:</span>
                <span>{formatBDT(receipt.amountPoisha)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-brand-navy pt-1 border-t border-slate-300">
                <span>অবশিষ্ট বকেয়া (Due):</span>
                <span>{formatBDT(receipt.balanceAfterPoisha)}</span>
              </div>
            </div>

            <div className="text-center pt-3 mt-2 border-t border-dashed border-slate-300 text-[8px] text-slate-500">
              <p>আদায়কারী: {receipt.collectedByName || "ক্যাশিয়ার"}</p>
              <p className="font-bold text-slate-700 mt-0.5">টাকা সফলভাবে গৃহীত হয়েছে। ধন্যবাদ!</p>
            </div>
          </div>
        )}

        {/* ======================= FORMAT 2: A4 OFFICIAL RECEIPT ======================= */}
        {format === "a4" && (
          <div className="invoice-a4 bg-white p-8 sm:p-12 shadow-md rounded-2xl max-w-3xl w-full border border-slate-200 text-xs text-slate-900 print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-brand-navy pb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/logo.png"
                  alt={settings.name}
                  className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1 flex-shrink-0"
                />
                <div>
                  <h1 className="text-xl font-bold text-brand-navy">{settings.name}</h1>
                  <p className="text-sm font-semibold text-brand-teal">{settings.nameBangla}</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {settings.address}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    প্রোপাইটর: <strong>{settings.owners}</strong> • মোবাইল: <strong>{settings.mobile}</strong>
                  </p>
                  <p className="text-slate-500 text-[10px]">ইমেইল: {settings.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-brand-teal uppercase">টাকা জমার রসিদ</span>
                <p className="font-mono font-bold text-brand-navy text-sm mt-1">{receipt.receiptNumber}</p>
                <p className="text-[10px] text-slate-500">
                  তারিখ: {new Date(receipt.createdAt).toLocaleString("bn-BD")}
                </p>
              </div>
            </div>

            {/* Customer & Payment Info */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-[11px]">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">কাস্টমার তথ্য:</span>
                <strong className="text-brand-navy text-xs">{receipt.customerName}</strong>
                <p className="text-slate-600">মোবাইল: {receipt.customerPhone}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">পেমেন্ট বিবরণ:</span>
                <p className="font-semibold text-brand-navy uppercase">মাধ্যম: {receipt.paymentMethod}</p>
                {receipt.transactionReference && <p className="text-slate-500">TrxID: {receipt.transactionReference}</p>}
                <p className="text-slate-500">আদায়কারী: {receipt.collectedByName || "ক্যাশিয়ার"}</p>
              </div>
            </div>

            {/* FIFO Invoice Allocations Table */}
            <div className="my-4">
              <span className="font-bold text-slate-700 block mb-2">চালানভিত্তিক অর্থ সমন্বয় (FIFO Invoice Allocation):</span>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 font-bold text-slate-700">
                    <th className="py-2 px-3">নং</th>
                    <th className="py-2 px-3">চালান নম্বর</th>
                    <th className="py-2 px-3 text-right">বরাদ্দকৃত অর্থ</th>
                    <th className="py-2 px-3 text-right">অবশিষ্ট বকেয়া</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipt.allocatedInvoices?.map((inv: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-brand-navy">{inv.invoiceNumber}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatBDT(inv.allocatedAmountPoisha)}</td>
                      <td className="py-2 px-3 text-right font-mono">{inv.remainingDuePoisha > 0 ? formatBDT(inv.remainingDuePoisha) : "০ ৳ (পরিশোধিত)"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <div className="w-64 space-y-1.5 text-right text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>পূর্ববর্তী মোট বকেয়া:</span>
                  <span>{formatBDT(receipt.balanceBeforePoisha)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-emerald-700 pt-1 border-t border-slate-200">
                  <span>গৃহীত অর্থ:</span>
                  <span>{formatBDT(receipt.amountPoisha)}</span>
                </div>
                <div className="flex justify-between font-bold text-brand-navy">
                  <span>বর্তমান অবশিষ্ট বকেয়া:</span>
                  <span>{formatBDT(receipt.balanceAfterPoisha)}</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-16 text-center text-xs">
              <div className="border-t border-slate-300 pt-2 text-slate-600 font-semibold">
                গ্রাহকের স্বাক্ষর
              </div>
              <div className="border-t border-slate-300 pt-2 text-slate-600 font-semibold">
                আদায়কারীর স্বাক্ষর ও সিল
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

