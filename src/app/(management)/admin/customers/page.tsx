"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Edit2,
  DollarSign,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimitPoisha: number;
  currentDuePoisha: number;
  totalPurchasedPoisha: number;
  totalPaidPoisha: number;
  status: "active" | "inactive";
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCreditLimitBDT, setNewCreditLimitBDT] = useState("50000");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit Credit Limit Modal
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCreditLimitBDT, setEditCreditLimitBDT] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!newName.trim() || !newPhone.trim()) {
      setCreateError("নাম এবং মোবাইল নম্বর আবশ্যক");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim() || undefined,
          address: newAddress.trim() || undefined,
          creditLimitPoisha: Math.round((parseFloat(newCreditLimitBDT) || 0) * 100),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "কাস্টমার যোগ করতে সমস্যা হয়েছে");
      }

      setIsAddModalOpen(false);
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewAddress("");
      setNewCreditLimitBDT("50000");
      loadCustomers();
    } catch (err: any) {
      setCreateError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditCreditLimitBDT(String(customer.creditLimitPoisha / 100));
    setUpdateError("");
  };

  const handleUpdateCreditLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setUpdateError("");
    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/customers/${editingCustomer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditLimitPoisha: Math.round((parseFloat(editCreditLimitBDT) || 0) * 100),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "আপডেট করতে সমস্যা হয়েছে");
      }

      setEditingCustomer(null);
      loadCustomers();
    } catch (err: any) {
      setUpdateError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setUpdating(false);
    }
  };

  // Metrics
  const totalCustomers = customers.length;
  const customersWithDue = customers.filter((c) => c.currentDuePoisha > 0);
  const totalDuePoisha = customers.reduce((sum, c) => sum + (c.currentDuePoisha || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            কাস্টমার তালিকা ও লেজার
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            রেজিস্টার্ড কাস্টমারদের তথ্য, বাকির সর্বোচ্চ সীমা, ক্রয় ও পেমেন্ট হিস্ট্রি
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/dues"
            className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 font-medium text-sm flex items-center gap-1.5 transition shadow-sm"
          >
            <CreditCard className="w-4 h-4 text-amber-600" />
            বাকি আদায় ও হিসাব
          </Link>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            নতুন কাস্টমার
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">মোট কাস্টমার</p>
            <p className="text-2xl font-bold text-slate-800">{toBengaliNumber(totalCustomers)} জন</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">মোট বর্তমান বাকি</p>
            <p className="text-2xl font-bold text-rose-600">{formatBDT(totalDuePoisha)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">বাকি থাকা কাস্টমার</p>
            <p className="text-2xl font-bold text-amber-700">{toBengaliNumber(customersWithDue.length)} জন</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <button
          onClick={loadCustomers}
          disabled={loading}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          রিফ্রেশ
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4">কাস্টমার পরিচিতি</th>
                <th className="py-3.5 px-4">যোগাযোগ ও ঠিকানা</th>
                <th className="py-3.5 px-4 text-right">ক্রেডিট লিমিট</th>
                <th className="py-3.5 px-4 text-right">বর্তমান বাকি</th>
                <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    কাস্টমার তথ্য লোড হচ্ছে...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    কোনো কাস্টমার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-400">আইডি: {c._id.slice(-6).toUpperCase()}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-700 font-medium text-xs">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {c.phone}
                      </div>
                      {c.address && (
                        <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {c.address}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-medium text-slate-700">{formatBDT(c.creditLimitPoisha)}</div>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 justify-end ml-auto mt-0.5"
                      >
                        <Edit2 className="w-3 h-3" />
                        পরিবর্তন
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.currentDuePoisha > 0 ? (
                        <div>
                          <span className="font-bold text-rose-600">{formatBDT(c.currentDuePoisha)}</span>
                          <span className="block text-[10px] text-rose-500 font-medium">বকেয়া রয়েছে</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                          পরিশোধিত
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          c.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/customers/${c._id}/statement`}
                          target="_blank"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 transition"
                          title="লেজার স্টেটমেন্ট দেখুন ও প্রিন্ট করুন"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          স্টেটমেন্ট
                        </Link>
                        {c.currentDuePoisha > 0 && (
                          <Link
                            href="/admin/dues"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1 transition shadow-sm"
                            title="বাকি আদায় করুন"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            আদায়
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                নতুন কাস্টমার নিবন্ধন
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  কাস্টমারের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: তানভীর আহমেদ"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
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
                  placeholder="customer@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ঠিকানা (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  placeholder="দোকান বা বাসার ঠিকানা..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বাকির সর্বোচ্চ সীমা (টাকা ৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={newCreditLimitBDT}
                  onChange={(e) => setNewCreditLimitBDT(e.target.value)}
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

      {/* Edit Credit Limit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                ক্রেডিট লিমিট পরিবর্তন
              </h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCreditLimit} className="p-5 space-y-4">
              {updateError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                  {updateError}
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500">কাস্টমার:</p>
                <p className="text-sm font-semibold text-slate-800">{editingCustomer.name}</p>
                <p className="text-xs text-slate-400">{editingCustomer.phone}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নতুন বাকির সীমা (টাকা ৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={editCreditLimitBDT}
                  onChange={(e) => setEditCreditLimitBDT(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
                >
                  {updating && <RefreshCw className="w-3 h-3 animate-spin" />}
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

