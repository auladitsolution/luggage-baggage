"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, RefreshCw, FileText } from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { STORE_INFO } from "@/lib/config/storeInfo";

export default function CustomerStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatement() {
      try {
        const res = await fetch(`/api/admin/customers/${id}`);
        const data = await res.json();
        if (data.customer) {
          setCustomer(data.customer);
          setTransactions(data.transactions || []);
          setInvoices(data.invoices || []);
        }
      } catch (err) {
        console.error("Failed to load customer statement:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStatement();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-teal" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-sm">
          <p className="text-sm text-slate-700 font-bold">কাস্টমার পাওয়া যায়নি</p>
          <Link href="/admin/dues" className="mt-3 inline-block text-xs text-brand-teal font-bold">
            বকেয়া তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      {/* Top Controls Bar */}
      <div className="no-print max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <Link
          href="/admin/dues"
          className="text-xs text-slate-600 hover:text-brand-navy flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>বকেয়া তালিকায় ফিরে যান</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-teal text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>স্টেটমেন্ট প্রিন্ট করুন</span>
        </button>
      </div>

      {/* Printable A4 Statement Sheet */}
      <div className="flex justify-center">
        <div className="bg-white p-8 sm:p-12 shadow-md rounded-2xl max-w-3xl w-full border border-slate-200 text-xs text-slate-900 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-brand-navy pb-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.png"
                alt={STORE_INFO.name}
                className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1 flex-shrink-0"
              />
              <div>
                <h1 className="text-xl font-bold text-brand-navy">{STORE_INFO.name}</h1>
                <p className="text-sm font-semibold text-brand-teal">{STORE_INFO.nameBangla}</p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  {STORE_INFO.address}
                </p>
                <p className="text-slate-600 text-[11px]">
                  প্রোপাইটর: <strong>{STORE_INFO.owners}</strong> • মোবাইল: <strong>{STORE_INFO.mobile}</strong>
                </p>
                <p className="text-slate-500 text-[10px]">ইমেইল: {STORE_INFO.email}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-brand-teal uppercase">কাস্টমার লেজার স্টেটমেন্ট</span>
              <p className="text-[10px] text-slate-500 mt-1">
                প্রিন্টের তারিখ: {new Date().toLocaleDateString("bn-BD")}
              </p>
            </div>
          </div>

          {/* Customer Summary Card */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-[11px] bg-slate-50/50 p-3 rounded-xl my-4">
            <div>
              <span className="text-slate-500 font-semibold block">গ্রাহকের নাম ও ফোন:</span>
              <strong className="text-sm text-brand-navy block">{customer.name}</strong>
              <span className="font-mono text-slate-600">{customer.phone}</span>
              {customer.address && <p className="text-slate-500 text-[10px]">{customer.address}</p>}
            </div>
            <div className="text-right space-y-1">
              <div>
                <span className="text-slate-500">ক্রেডিট সীমা: </span>
                <strong>{formatBDT(customer.creditLimitPoisha)}</strong>
              </div>
              <div>
                <span className="text-slate-500">মোট কেনাকাটা: </span>
                <strong>{formatBDT(customer.totalPurchasedPoisha || 0)}</strong>
              </div>
              <div className="text-sm font-black text-rose-600 pt-1 border-t border-slate-200">
                <span>বর্তমান বকেয়া: </span>
                <span>{formatBDT(customer.currentDuePoisha)}</span>
              </div>
            </div>
          </div>

          {/* Ledger History Table */}
          <div className="my-4">
            <span className="font-bold text-slate-700 block mb-2">লেজার লেনদেন ইতিহাস (Ledger Transactions):</span>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 font-bold text-slate-700">
                  <th className="py-2 px-3">তারিখ</th>
                  <th className="py-2 px-3">বিবরণ / লেনদেনের ধরন</th>
                  <th className="py-2 px-3">রেফারেন্স নং</th>
                  <th className="py-2 px-3 text-right">ডেবিট (+)</th>
                  <th className="py-2 px-3 text-right">ক্রেডিট (-)</th>
                  <th className="py-2 px-3 text-right">ব্যালেন্স</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                      কোনো পূর্ববর্তী লেনদেন নেই।
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any, idx: number) => {
                    const isDueSale = tx.transactionType === "due_sale";
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString("bn-BD")}
                        </td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-800">
                          {isDueSale ? "বাকি বিক্রয় (Due Sale)" : "বকেয়া আদায় (Payment Received)"}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {tx.receiptNumber || tx.notes || "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-rose-600">
                          {isDueSale ? formatBDT(tx.amountPoisha) : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">
                          {!isDueSale ? formatBDT(tx.amountPoisha) : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-brand-navy">
                          {formatBDT(tx.balanceAfterPoisha)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-16 text-center text-xs">
            <div className="border-t border-slate-300 pt-2 text-slate-600 font-semibold">
              গ্রাহকের স্বাক্ষর
            </div>
            <div className="border-t border-slate-300 pt-2 text-slate-600 font-semibold">
              হিসাবরক্ষক / কর্তৃপক্ষ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

