"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  Calendar, 
  Briefcase, 
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IEmployee } from "@/types/payroll";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Employee Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    designation: "বিক্রয় কর্মী",
    nidNumber: "",
    address: "",
    joiningDate: new Date().toISOString().split("T")[0],
    basicSalary: "",
    allowance: "",
    bankOrWalletDetails: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/employees?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const basicSalaryPoisha = Math.round(parseFloat(formData.basicSalary || "0") * 100);
      const allowancePoisha = Math.round(parseFloat(formData.allowance || "0") * 100);

      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          basicSalaryPoisha,
          allowancePoisha,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "কর্মচারী তৈরিতে সমস্যা হয়েছে");
      }

      setSuccessMsg("নতুন কর্মচারী সফলভাবে যুক্ত হয়েছে!");
      setIsModalOpen(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        designation: "বিক্রয় কর্মী",
        nidNumber: "",
        address: "",
        joiningDate: new Date().toISOString().split("T")[0],
        basicSalary: "",
        allowance: "",
        bankOrWalletDetails: "",
      });
      fetchEmployees();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-teal text-sm font-semibold mb-1">
            <Users className="w-4 h-4" />
            <span>মানবসম্পদ ব্যবস্থাপনা</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            কর্মচারী ডিরেক্টরি
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            দোকানের সকল স্টাফ, পদবী, মূল বেতন ও যোগাযোগের তথ্য
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-navy hover:bg-slate-800 text-white flex items-center gap-2 shadow-sm font-medium"
        >
          <UserPlus className="w-4 h-4 text-brand-gold" />
          <span>নতুন কর্মচারী নিবন্ধন</span>
        </Button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">মোট কর্মচারী</span>
            <p className="text-2xl font-bold text-slate-900">{employees.length} জন</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">সক্রিয় কর্মরত</span>
            <p className="text-2xl font-bold text-emerald-600">
              {employees.filter((e) => e.status === "active").length} জন
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">মাসিক মোট বেতন বাজেট</span>
            <p className="text-2xl font-bold text-slate-900">
              ৳
              {(
                employees
                  .filter((e) => e.status === "active")
                  .reduce((sum, e) => sum + e.basicSalaryPoisha + (e.allowancePoisha || 0), 0) / 100
              ).toLocaleString("bn-BD")}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="নাম, মোবাইল বা পদবী দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white"
          >
            <option value="all">সকল অবস্থা (All Status)</option>
            <option value="active">সক্রিয় (Active)</option>
            <option value="resigned">অব্যাহতি প্রাপ্ত (Resigned)</option>
            <option value="terminated">চাকরিচ্যুত (Terminated)</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">কর্মচারী</th>
                <th className="py-3.5 px-4">পদবী</th>
                <th className="py-3.5 px-4">মোবাইল</th>
                <th className="py-3.5 px-4">যোগদানের তারিখ</th>
                <th className="py-3.5 px-4">মূল বেতন</th>
                <th className="py-3.5 px-4">ভাতা</th>
                <th className="py-3.5 px-4">মোট বেতন</th>
                <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    কোনো কর্মচারীর তথ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const totalSalary = emp.basicSalaryPoisha + (emp.allowancePoisha || 0);
                  return (
                    <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {emp.name}
                        {emp.email && <span className="block text-xs text-slate-400 font-normal">{emp.email}</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 font-medium">
                          {emp.designation}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        {emp.phone}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {new Date(emp.joiningDate).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        ৳{(emp.basicSalaryPoisha / 100).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        ৳{((emp.allowancePoisha || 0) / 100).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-brand-teal">
                        ৳{(totalSalary / 100).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          className={
                            emp.status === "active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-rose-100 text-rose-800 border-rose-200"
                          }
                        >
                          {emp.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <UserPlus className="w-5 h-5 text-brand-teal" />
                <span>নতুন কর্মচারী নিবন্ধন</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    কর্মচারীর পূর্ণ নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মোঃ কামরুল হাসান"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="যেমন: 01711000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    পদবী <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white"
                  >
                    <option value="স্টোর ম্যানেজার">স্টোর ম্যানেজার</option>
                    <option value="সহকারী ম্যানেজার">সহকারী ম্যানেজার</option>
                    <option value="ক্যাশিয়ার">ক্যাশিয়ার</option>
                    <option value="বিক্রয় কর্মী">বিক্রয় কর্মী</option>
                    <option value="স্টক ইনচার্জ">স্টক ইনচার্জ</option>
                    <option value="অনলাইন অর্ডার এক্সিকিউটিভ">অনলাইন অর্ডার এক্সিকিউটিভ</option>
                    <option value="নিরাপত্তা কর্মী">নিরাপত্তা কর্মী</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    যোগদানের তারিখ
                  </label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    মাসিক মূল বেতন (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="যেমন: 20000"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    মাসিক ভাতা (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="যেমন: 3000"
                    value={formData.allowance}
                    onChange={(e) => setFormData({ ...formData, allowance: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  পেমেন্ট একাউন্ট / বিকাশ বিবরণ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ডাচ-বাংলা ব্যাংক A/C: 123... অথবা বিকাশ: 017..."
                  value={formData.bankOrWalletDetails}
                  onChange={(e) => setFormData({ ...formData, bankOrWalletDetails: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-navy hover:bg-slate-800 text-white font-medium"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "নিবন্ধন সম্পন্ন করুন"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

