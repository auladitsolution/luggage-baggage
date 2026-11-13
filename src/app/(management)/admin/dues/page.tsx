"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  DollarSign,
  Search,
  CheckCircle2,
  FileText,
  RefreshCw,
  Printer,
  X,
  AlertCircle,
  Smartphone,
  Building2,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";

interface DueCustomer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  creditLimitPoisha: number;
  currentDuePoisha: number;
  lastInvoiceNumber: string;
  lastInvoiceDate: string;
  unpaidInvoicesCount: number;
}

export default function AdminDuesPage() {
  const [customers, setCustomers] = useState<DueCustomer[]>([]);
  const [totalDuePoisha, setTotalDuePoisha] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Collect Modal
  const [selectedCustomer, setSelectedCustomer] = useState<DueCustomer | null>(null);
  const [amountBDT, setAmountBDT] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bkash" | "bank">("cash");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Post Collection Success Receipt State
  const [createdReceipt, setCreatedReceipt] = useState<any>(null);

  const loadDues = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/dues");
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
        setTotalDuePoisha(data.summary?.totalDuePoisha || 0);
      }
    } catch (err) {
      console.error("Failed to load dues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDues();
  }, []);

  const handleOpenCollectModal = (c: DueCustomer) => {
    setSelectedCustomer(c);
    setAmountBDT(String(c.currentDuePoisha / 100)); // Default to full due
    setPaymentMethod("cash");
    setTransactionRef("");
    setNotes("");
    setErrorMsg("");
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setErrorMsg("");
    const parsedAmount = parseFloat(amountBDT) || 0;
    if (parsedAmount <= 0) {
      setErrorMsg("আদায়ের পরিমাণ অবশ্যই শূন্যের বেশি হতে হবে");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/dues/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer._id,
          amountPoisha: Math.round(parsedAmount * 100),
          paymentMethod,
          transactionReference: transactionRef || undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "বকেয়া আদায় সম্পন্ন হয়নি");
      }

      setCreatedReceipt(data.receipt);
      setSelectedCustomer(null);
      await loadDues();
    } catch (err: any) {
      setErrorMsg(err.message || "সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header with Total Dues Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy tracking-tight">
            কাস্টমার বকেয়া খাতা ও লেজার
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            বাকি বিক্রি, কিস্তি ট্র্যাকিং ও বকেয়া আদায়ের অডিটেবল রেকর্ড (FIFO Allocation)
          </p>
        </div>

        <div className="p-3 px-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-amber-700" />
          <div>
            <span className="text-[11px] font-semibold text-amber-800 block">মোট বকেয়া পাওনা</span>
            <span className="text-lg font-black text-amber-900">{formatBDT(totalDuePoisha)}</span>
          </div>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex items-center gap-3 max-w-md">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="কাস্টমারের নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <button
          onClick={loadDues}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
          title="রিফ্রেশ"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Dues Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-teal" />
            <span>বকেয়া তথ্য লোড হচ্ছে...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            কোনো বকেয়া কাস্টমার পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">কাস্টমার নাম ও মোবাইল</th>
                  <th className="py-3 px-4 whitespace-nowrap">ঠিকানা</th>
                  <th className="py-3 px-4 whitespace-nowrap">ক্রেডিট লিমিট</th>
                  <th className="py-3 px-4 whitespace-nowrap">বর্তমান বকেয়া</th>
                  <th className="py-3 px-4 whitespace-nowrap">সর্বশেষ চালান</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((cust) => (
                  <tr key={cust._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-brand-navy block">{cust.name}</span>
                      <span className="font-mono text-slate-500 text-[10px]">{cust.phone}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{cust.address}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {formatBDT(cust.creditLimitPoisha)}
                    </td>
                    <td className="py-3 px-4 font-black text-rose-600 text-sm">
                      {formatBDT(cust.currentDuePoisha)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      <div>{cust.lastInvoiceNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(cust.lastInvoiceDate).toLocaleDateString("bn-BD")}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenCollectModal(cust)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors"
                        >
                          টাকা গ্রহণ
                        </button>
                        <Link
                          href={`/admin/customers/${cust._id}/statement`}
                          target="_blank"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-[11px] flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>স্টেটমেন্ট</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-brand-navy">
                বকেয়া টাকা গ্রহণ (Collect Due Payment)
              </h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span>কাস্টমার:</span>
                <strong>{selectedCustomer.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>মোবাইল:</span>
                <span className="font-mono">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-200">
                <span>মোট বকেয়া:</span>
                <span>{formatBDT(selectedCustomer.currentDuePoisha)}</span>
              </div>
            </div>

            <form onSubmit={handleCollectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  আদায়কৃত টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedCustomer.currentDuePoisha / 100}
                  value={amountBDT}
                  onChange={(e) => setAmountBDT(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-black text-base focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  পেমেন্ট মাধ্যম *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "cash"
                        ? "bg-brand-navy text-white border-brand-navy shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>নগদ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bkash")}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "bkash"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>বিকাশ/নগদ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank")}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "bank"
                        ? "bg-brand-teal text-white border-brand-teal shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>ব্যাংক</span>
                  </button>
                </div>
              </div>

              {paymentMethod !== "cash" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ট্রানজেকশন রেফারেন্স নং (TrxID)
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. TRX12345678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  নোট বা মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="যেমন: আংশিক কিস্তি পরিশোধ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? "জমা হচ্ছে..." : "টাকা গ্রহণ নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Collection Success Dialog with Money Receipt Print Option */}
      {createdReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-slate-200">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-brand-navy">বকেয়া টাকা জমা হয়েছে!</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                মানি রিসিট নং: <strong>{createdReceipt.receiptNumber}</strong>
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span>কাস্টমার:</span>
                <strong>{createdReceipt.customerName}</strong>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>আদায়কৃত অর্থ:</span>
                <span>{formatBDT(createdReceipt.amountPoisha)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>পূর্বের বকেয়া:</span>
                <span>{formatBDT(createdReceipt.balanceBeforePoisha)}</span>
              </div>
              <div className="flex justify-between font-black text-brand-navy pt-1 border-t border-slate-200">
                <span>অবশিষ্ট বকেয়া:</span>
                <span>{formatBDT(createdReceipt.balanceAfterPoisha)}</span>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href={`/admin/dues/receipt/${createdReceipt._id}?format=80mm`}
                target="_blank"
                className="py-2.5 px-3 rounded-xl bg-brand-navy hover:bg-brand-teal text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>৮০মিমি রসিদ</span>
              </Link>

              <Link
                href={`/admin/dues/receipt/${createdReceipt._id}?format=a4`}
                target="_blank"
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>A4 রসিদ</span>
              </Link>
            </div>

            <button
              onClick={() => setCreatedReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
