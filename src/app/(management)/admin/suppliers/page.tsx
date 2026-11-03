"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  Search,
  Plus,
  Phone,
  MapPin,
  CreditCard,
  DollarSign,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  User,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { ISupplier } from "@/types/purchasing";

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalPayablePoisha, setTotalPayablePoisha] = useState(0);

  // Add Supplier Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContactPerson, setNewContactPerson] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newOpeningBalanceBDT, setNewOpeningBalanceBDT] = useState("0");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Pay Supplier Modal
  const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(null);
  const [payAmountBDT, setPayAmountBDT] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "bkash" | "nagad">("bank");
  const [transactionRef, setTransactionRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccessMsg, setPaySuccessMsg] = useState("");

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/suppliers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
        setTotalPayablePoisha(data.summary?.totalPayablePoisha || 0);
      }
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [search]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!newName.trim() || !newPhone.trim()) {
      setCreateError("সরবরাহকারী প্রতিষ্ঠান ও মোবাইল নম্বর আবশ্যক");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          contactPerson: newContactPerson.trim() || undefined,
          phone: newPhone.trim(),
          email: newEmail.trim() || undefined,
          address: newAddress.trim() || undefined,
          openingBalancePoisha: Math.round((parseFloat(newOpeningBalanceBDT) || 0) * 100),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "সাপ্লায়ার যুক্ত করতে সমস্যা হয়েছে");
      }

      setIsAddModalOpen(false);
      setNewName("");
      setNewContactPerson("");
      setNewPhone("");
      setNewEmail("");
      setNewAddress("");
      setNewOpeningBalanceBDT("0");
      loadSuppliers();
    } catch (err: any) {
      setCreateError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenPayModal = (sup: ISupplier) => {
    setSelectedSupplier(sup);
    setPayAmountBDT(String(sup.currentBalancePoisha / 100));
    setPaymentMethod("bank");
    setTransactionRef("");
    setPayNotes("");
    setPayError("");
    setPaySuccessMsg("");
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    setPayError("");
    const parsedAmount = parseFloat(payAmountBDT) || 0;
    if (parsedAmount <= 0) {
      setPayError("পরিশোধের পরিমাণ অবশ্যই শূন্যের বেশি হতে হবে");
      return;
    }

    try {
      setPaying(true);
      const res = await fetch("/api/admin/suppliers/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplier._id,
          amountPoisha: Math.round(parsedAmount * 100),
          paymentMethod,
          transactionReference: transactionRef || undefined,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "পেমেন্ট ব্যর্থ হয়েছে");
      }

      setPaySuccessMsg(`সাপ্লায়ার পেমেন্ট সফল! ভাউচার #${data.payment?.paymentNumber}`);
      loadSuppliers();
      setTimeout(() => {
        setSelectedSupplier(null);
        setPaySuccessMsg("");
      }, 1800);
    } catch (err: any) {
      setPayError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setPaying(false);
    }
  };

  const suppliersWithBalance = suppliers.filter((s) => s.currentBalancePoisha > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-7 h-7 text-indigo-600" />
            সরবরাহকারী ও পাইকারি হিসাব
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            লাগেজ ও ব্যাগের পাইকারি সাপ্লায়ার তালিকা, চালান ও পাওনা পরিশোধ ট্র্যাকিং
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/purchases"
            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium text-sm flex items-center gap-1.5 transition shadow-sm"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            ক্রয় চালান ও মাল রিসিভ
          </Link>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            নতুন সাপ্লায়ার
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">মোট সরবরাহকারী</p>
            <p className="text-2xl font-bold text-slate-800">{toBengaliNumber(suppliers.length)} টি</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">মোট বকেয়া দেনা (দোকানের দায়)</p>
            <p className="text-2xl font-bold text-rose-600">{formatBDT(totalPayablePoisha)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">পাওনাদার সাপ্লায়ার</p>
            <p className="text-2xl font-bold text-amber-700">{toBengaliNumber(suppliersWithBalance.length)} টি</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="কোম্পানি, ব্যক্তি বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <button
          onClick={loadSuppliers}
          disabled={loading}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          রিফ্রেশ
        </button>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4">প্রতিষ্ঠান ও কন্টাক্ট পারসন</th>
                <th className="py-3.5 px-4">মোবাইল ও ঠিকানা</th>
                <th className="py-3.5 px-4 text-right">মোট ক্রয়</th>
                <th className="py-3.5 px-4 text-right">মোট পরিশোধ</th>
                <th className="py-3.5 px-4 text-right">বর্তমান পাওনা (দেনা)</th>
                <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    সাপ্লায়ার তথ্য লোড হচ্ছে...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    কোনো সাপ্লায়ার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      {s.contactPerson && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          {s.contactPerson}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-700 font-medium text-xs">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {s.phone}
                      </div>
                      {s.address && (
                        <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {s.address}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {formatBDT(s.totalPurchasedPoisha || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-700">
                      {formatBDT(s.totalPaidPoisha || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {s.currentBalancePoisha > 0 ? (
                        <div>
                          <span className="font-bold text-rose-600">{formatBDT(s.currentBalancePoisha)}</span>
                          <span className="block text-[10px] text-rose-500 font-medium">পাওনা রয়েছে</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                          পরিশোধিত
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {s.currentBalancePoisha > 0 && (
                          <button
                            onClick={() => handleOpenPayModal(s)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1 transition shadow-sm"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            পাওনা পরিশোধ
                          </button>
                        )}
                        <Link
                          href={`/admin/purchases?supplierId=${s._id}`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          চালান হিস্ট্রি
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                নতুন সাপ্লায়ার নিবন্ধন
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রতিষ্ঠান / কোম্পানির নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বেঙ্গল ট্রাভেল গিয়ার্স"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">যোগাযোগের ব্যক্তি (Contact Person)</label>
                <input
                  type="text"
                  placeholder="যেমন: মোঃ জসিম উদ্দিন"
                  value={newContactPerson}
                  onChange={(e) => setNewContactPerson(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ইমেইল (ঐচ্ছিক)</label>
                <input
                  type="email"
                  placeholder="supplier@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ঠিকানা / পাইকারি মার্কেট</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: চকবাজার পাইকারি মার্কেট, ঢাকা"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রারম্ভিক বকেয়া পাওনা (টাকা ৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={newOpeningBalanceBDT}
                  onChange={(e) => setNewOpeningBalanceBDT(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  নিবন্ধন সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                সাপ্লায়ার পাওনা পরিশোধ
              </h3>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
              {payError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                  {payError}
                </div>
              )}

              {paySuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {paySuccessMsg}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p className="text-xs text-slate-500">সরবরাহকারী:</p>
                <p className="text-sm font-bold text-slate-900">{selectedSupplier.name}</p>
                <p className="text-xs text-rose-600 font-semibold">
                  বর্তমান মোট পাওনা: {formatBDT(selectedSupplier.currentBalancePoisha)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পরিশোধের পরিমাণ (টাকা ৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={payAmountBDT}
                  onChange={(e) => setPayAmountBDT(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "bank", label: "ব্যাংক" },
                    { id: "cash", label: "ক্যাশ" },
                    { id: "bkash", label: "বিকাশ" },
                    { id: "nagad", label: "নগদ" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition ${
                        paymentMethod === m.id
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ট্রানজেকশন / চেক রেফারেন্স</label>
                <input
                  type="text"
                  placeholder="চেক নম্বর বা অনলাইন ব্যাংক TRX ID"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মন্তব্য (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: আগস্ট মাসের চালানের আংশিক পরিশোধ"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSupplier(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
                >
                  {paying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  পরিশোধ সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

