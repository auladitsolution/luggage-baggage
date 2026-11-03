"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  Search,
  Plus,
  DollarSign,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  CheckCircle2,
  Calendar,
  Filter,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { IExpense, EXPENSE_CATEGORIES, ExpenseCategory } from "@/types/purchasing";

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [totalExpensePoisha, setTotalExpensePoisha] = useState(0);

  // New Expense Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("staff_refreshment");
  const [amountBDT, setAmountBDT] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "bkash" | "nagad">("cash");
  const [paidTo, setPaidTo] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccessMsg, setCreateSuccessMsg] = useState("");

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/expenses${selectedCategory !== "all" ? `?category=${selectedCategory}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.expenses) {
        setExpenses(data.expenses);
        setTotalExpensePoisha(data.summary?.totalExpensePoisha || 0);
      }
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccessMsg("");

    const parsedAmount = parseFloat(amountBDT) || 0;
    if (parsedAmount <= 0) {
      setCreateError("খরচের পরিমাণ শূন্যের বেশি হতে হবে");
      return;
    }

    if (!description.trim()) {
      setCreateError("খরচের সুনির্দিষ্ট বিবরণ আবশ্যক");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amountPoisha: Math.round(parsedAmount * 100),
          paymentMethod,
          paidTo: paidTo.trim() || undefined,
          expenseDate,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "খরচের ভাউচার তৈরি ব্যর্থ হয়েছে");
      }

      setCreateSuccessMsg(`খরচের ভাউচার #${data.expense?.voucherNumber} সফলভাবে এন্ট্রি হয়েছে!`);
      loadExpenses();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAmountBDT("");
        setPaidTo("");
        setDescription("");
        setCreateSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      setCreateError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setCreating(false);
    }
  };

  const handleApproveExpense = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadExpenses();
      }
    } catch (err) {
      console.error("Approval error:", err);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.voucherNumber.toLowerCase().includes(s) ||
      e.description.toLowerCase().includes(s) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-600" />
            দোকান ব্যয় ও খরচ ভাউচার
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            দোকান ভাড়া, বিদ্যুৎ বিল, স্টাফ নাস্তা, পরিবহন ও অন্যান্য খরচের হিসাব
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-1.5 transition shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          নতুন খরচ যুক্ত করুন
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">মোট অনুমোদিত খরচ</p>
            <p className="text-2xl font-bold text-rose-600">{formatBDT(totalExpensePoisha)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">মোট খরচ ভাউচার</p>
            <p className="text-2xl font-bold text-slate-800">{toBengaliNumber(expenses.length)} টি</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">চলতি মাসের ভাউচার</p>
            <p className="text-2xl font-bold text-slate-800">
              {toBengaliNumber(
                expenses.filter((e) => new Date(e.expenseDate).getMonth() === new Date().getMonth()).length
              )}{" "}
              টি
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ভাউচার নম্বর বা বিবরণ দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">সকল খরচের খাত</option>
            {Object.entries(EXPENSE_CATEGORIES).map(([catKey, catLabel]) => (
              <option key={catKey} value={catKey}>
                {catLabel}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={loadExpenses}
          disabled={loading}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          রিফ্রেশ
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4">ভাউচার ও তারিখ</th>
                <th className="py-3.5 px-4">খরচের খাত</th>
                <th className="py-3.5 px-4">বিবরণ ও প্রাপক</th>
                <th className="py-3.5 px-4 text-center">মাধ্যম</th>
                <th className="py-3.5 px-4 text-right">পরিমাণ</th>
                <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    খরচ তালিকা লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    কোনো খরচের ভাউচার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{exp.voucherNumber}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(exp.expenseDate).toLocaleDateString("bn-BD")}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {exp.categoryBangla}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{exp.description}</div>
                      {exp.paidTo && (
                        <div className="text-xs text-slate-400">প্রাপক: {exp.paidTo}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-600">
                      {exp.paymentMethod === "cash"
                        ? "নগদ (Cash)"
                        : exp.paymentMethod === "bkash"
                        ? "বিকাশ"
                        : "ব্যাংক"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-rose-600">{formatBDT(exp.amountPoisha)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {exp.status === "approved" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                          অনুমোদিত
                        </span>
                      ) : exp.status === "rejected" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-800">
                          প্রত্যাখ্যাত
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApproveExpense(exp._id, "approved")}
                            className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-medium hover:bg-emerald-700"
                          >
                            অনুমোদন
                          </button>
                          <button
                            onClick={() => handleApproveExpense(exp._id, "rejected")}
                            className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[11px] font-medium hover:bg-rose-200"
                          >
                            বাতিল
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                নতুন খরচ এন্ট্রি
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {createError}
                </div>
              )}

              {createSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {createSuccessMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  খরচের খাত <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {Object.entries(EXPENSE_CATEGORIES).map(([catKey, catLabel]) => (
                    <option key={catKey} value={catKey}>
                      {catLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  খরচের পরিমাণ (টাকা ৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="যেমন: ১৫০০"
                  value={amountBDT}
                  onChange={(e) => setAmountBDT(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-bold text-rose-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="cash">নগদ (Cash)</option>
                    <option value="bank">ব্যাংক ট্রান্সফার</option>
                    <option value="bkash">বিকাশ</option>
                    <option value="nagad">নগদ (Nagad)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">প্রাপক / কাকে দেওয়া হলো</label>
                <input
                  type="text"
                  placeholder="যেমন: মার্কেট সুপারভাইজার / ডেসকো"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  খরচের সুনির্দিষ্ট বিবরণ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="খরচের কারণ ও বিবরণ লিখুন..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  ভাউচার সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

