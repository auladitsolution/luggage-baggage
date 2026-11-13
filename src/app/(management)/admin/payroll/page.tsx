"use client";

import { useEffect, useState } from "react";
import { 
  UserCheck, 
  PlusCircle, 
  Calendar, 
  Wallet, 
  CreditCard, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IPayrollRecord, IEmployee } from "@/types/payroll";
import { IFinancialAccount } from "@/types/accounting";
import { convertToCSV, downloadCSV } from "@/lib/export/reportExport";

export default function PayrollPage() {
  const [records, setRecords] = useState<IPayrollRecord[]>([]);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [accounts, setAccounts] = useState<IFinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState("all");

  // Generate Payroll Modal
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genEmployeeId, setGenEmployeeId] = useState("");
  const [genBonus, setGenBonus] = useState("");
  const [genDeduction, setGenDeduction] = useState("");
  const [genAdvance, setGenAdvance] = useState("");
  const [genNotes, setGenNotes] = useState("");

  // Pay/Disburse Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payRecord, setPayRecord] = useState<IPayrollRecord | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedMonth) params.set("monthYear", selectedMonth);
      if (statusFilter !== "all") params.set("paymentStatus", statusFilter);

      const res = await fetch(`/api/admin/payroll?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.payrollRecords || []);
      }
    } catch (err) {
      console.error("Failed to load payroll:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [empRes, accRes] = await Promise.all([
        fetch("/api/admin/employees?status=active"),
        fetch("/api/admin/accounts"),
      ]);
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
        if (empData.employees?.length > 0) {
          setGenEmployeeId(empData.employees[0]._id);
        }
      }
      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData.accounts || []);
        if (accData.accounts?.length > 0) {
          setPayAccountId(accData.accounts[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchPayroll();
  }, [selectedMonth, statusFilter]);

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: genEmployeeId,
          monthYear: selectedMonth,
          bonusPoisha: Math.round(parseFloat(genBonus || "0") * 100),
          deductionPoisha: Math.round(parseFloat(genDeduction || "0") * 100),
          advanceAdjustedPoisha: Math.round(parseFloat(genAdvance || "0") * 100),
          notes: genNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "বেতন তৈরিতে সমস্যা হয়েছে");

      setSuccessMsg("বেতন শীট সফলভাবে তৈরি হয়েছে!");
      setIsGenModalOpen(false);
      setGenBonus("");
      setGenDeduction("");
      setGenAdvance("");
      setGenNotes("");
      fetchPayroll();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openPayModal = (rec: IPayrollRecord) => {
    setPayRecord(rec);
    setPayAmount(String(rec.dueAmountPoisha / 100));
    setPayNotes("");
    setErrorMsg("");
    setIsPayModalOpen(true);
  };

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payRecord) return;
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/payroll/${payRecord._id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPoisha: Math.round(parseFloat(payAmount || "0") * 100),
          financialAccountId: payAccountId,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "বেতন প্রদানে সমস্যা হয়েছে");

      setSuccessMsg("বেতন সফলভাবে পরিশোধ এবং হিসাব সমন্বয় সম্পন্ন হয়েছে!");
      setIsPayModalOpen(false);
      fetchPayroll();
      fetchMeta();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const csv = convertToCSV(records, [
      { key: "monthYear", label: "মাস-বছর" },
      { key: "employeeName", label: "কর্মচারীর নাম" },
      { key: "employeeDesignation", label: "পদবী" },
      { key: "basicSalaryPoisha", label: "মূল বেতন (৳)", format: (v) => String(v / 100) },
      { key: "allowancePoisha", label: "ভাতা (৳)", format: (v) => String((v || 0) / 100) },
      { key: "bonusPoisha", label: "বোনাস (৳)", format: (v) => String((v || 0) / 100) },
      { key: "deductionPoisha", label: "কর্তন (৳)", format: (v) => String((v || 0) / 100) },
      { key: "netPayablePoisha", label: "প্রদেয় বেতন (৳)", format: (v) => String(v / 100) },
      { key: "paidAmountPoisha", label: "পরিশোধিত (৳)", format: (v) => String(v / 100) },
      { key: "dueAmountPoisha", label: "বকেয়া (৳)", format: (v) => String(v / 100) },
      { key: "paymentStatus", label: "স্ট্যাটাস" },
    ]);
    downloadCSV(csv, `payroll-sheet-${selectedMonth}.csv`);
  };

  const totalNetPayable = records.reduce((sum, r) => sum + r.netPayablePoisha, 0);
  const totalPaid = records.reduce((sum, r) => sum + r.paidAmountPoisha, 0);
  const totalDue = records.reduce((sum, r) => sum + r.dueAmountPoisha, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-teal text-sm font-semibold mb-1">
            <UserCheck className="w-4 h-4" />
            <span>বেতন ও পারিশ্রমিক</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            কর্মচারী বেতন ও পেরোল
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            মাসিক বেতন গণনা, বোনাস, কর্তন ও ক্যাশ/ব্যাংক থেকে বেতন বিতরণ
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={records.length === 0}
            className="flex items-center gap-1.5 text-slate-700 bg-white"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV ডাউনলোড</span>
          </Button>

          <Button
            onClick={() => setIsGenModalOpen(true)}
            className="bg-brand-navy hover:bg-slate-800 text-white flex items-center gap-2 shadow-sm font-medium"
          >
            <PlusCircle className="w-4 h-4 text-brand-gold" />
            <span>বেতন প্রস্তুত করুন</span>
          </Button>
        </div>
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
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">{selectedMonth} মোট প্রদেয় বেতন</span>
            <p className="text-2xl font-bold text-slate-900">
              ৳{(totalNetPayable / 100).toLocaleString("bn-BD")}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">পরিশোধ সম্পন্ন</span>
            <p className="text-2xl font-bold text-emerald-600">
              ৳{(totalPaid / 100).toLocaleString("bn-BD")}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">অবশিষ্ট বকেয়া বেতন</span>
            <p className="text-2xl font-bold text-rose-600">
              ৳{(totalDue / 100).toLocaleString("bn-BD")}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-4 h-4 text-brand-teal" />
            <span>বেতনের মাস:</span>
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white w-full sm:w-auto"
          >
            <option value="all">সকল অবস্থা (All Status)</option>
            <option value="unpaid">অপরিশোধিত (Unpaid)</option>
            <option value="partial">আংশিক পরিশোধ (Partial)</option>
            <option value="paid">পরিশোধিত (Paid)</option>
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">কর্মচারী</th>
                <th className="py-3.5 px-4 whitespace-nowrap">মূল বেতন</th>
                <th className="py-3.5 px-4 whitespace-nowrap">ভাতা</th>
                <th className="py-3.5 px-4 whitespace-nowrap">বোনাস</th>
                <th className="py-3.5 px-4 whitespace-nowrap">কর্তন</th>
                <th className="py-3.5 px-4 whitespace-nowrap">প্রদেয় বেতন</th>
                <th className="py-3.5 px-4 whitespace-nowrap">পরিশোধিত</th>
                <th className="py-3.5 px-4 whitespace-nowrap">বকেয়া</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {selectedMonth} মাসের কোনো বেতন রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {r.employeeName}
                      <span className="block text-xs text-slate-400 font-normal">
                        {r.employeeDesignation}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      ৳{(r.basicSalaryPoisha / 100).toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      ৳{((r.allowancePoisha || 0) / 100).toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 font-mono text-xs font-medium">
                      +৳{((r.bonusPoisha || 0) / 100).toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3.5 px-4 text-rose-500 font-mono text-xs">
                      -৳{(((r.deductionPoisha || 0) + (r.advanceAdjustedPoisha || 0)) / 100).toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ৳{(r.netPayablePoisha / 100).toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 font-medium">
                      ৳{(r.paidAmountPoisha / 100).toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-rose-600">
                      ৳{(r.dueAmountPoisha / 100).toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        className={
                          r.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : r.paymentStatus === "partial"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-rose-100 text-rose-800 border-rose-200"
                        }
                      >
                        {r.paymentStatus === "paid"
                          ? "পরিশোধিত"
                          : r.paymentStatus === "partial"
                          ? "আংশিক"
                          : "বকেয়া"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.paymentStatus !== "paid" ? (
                        <Button
                          size="sm"
                          onClick={() => openPayModal(r)}
                          className="bg-brand-navy hover:bg-slate-800 text-white text-xs h-8 px-3"
                        >
                          বেতন প্রদান
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> পরিশোধিত
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Payroll Modal */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <PlusCircle className="w-5 h-5 text-brand-teal" />
                <span>{selectedMonth} মাসের বেতন প্রস্তুতকরণ</span>
              </div>
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGeneratePayroll} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  কর্মচারী নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                <select
                  value={genEmployeeId}
                  onChange={(e) => setGenEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white"
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation}) — মূল বেতন: ৳
                      {(emp.basicSalaryPoisha / 100).toLocaleString("bn-BD")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    বোনাস (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={genBonus}
                    onChange={(e) => setGenBonus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    কর্তন (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={genDeduction}
                    onChange={(e) => setGenDeduction(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    অগ্রিম সমন্বয় (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={genAdvance}
                    onChange={(e) => setGenAdvance(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  মন্তব্য / বিবরণ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: অক্টোবর মাসের নিয়মিত বেতন"
                  value={genNotes}
                  onChange={(e) => setGenNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsGenModalOpen(false)}
                  disabled={submitting}
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-navy hover:bg-slate-800 text-white font-medium"
                >
                  {submitting ? "প্রস্তুত হচ্ছে..." : "বেতন প্রস্তুত করুন"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay/Disburse Salary Modal */}
      {isPayModalOpen && payRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>বেতন বিতরণ ও হিসাব সমন্বয়</span>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDisburse} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">কর্মচারী:</span>
                  <span className="font-semibold text-slate-900">{payRecord.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">মাস-বছর:</span>
                  <span className="font-medium text-slate-900">{payRecord.monthYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">বকেয়া বেতন:</span>
                  <span className="font-bold text-rose-600">৳{(payRecord.dueAmountPoisha / 100).toLocaleString("bn-BD")}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  যে হিসাব থেকে টাকা কাটা হবে <span className="text-rose-500">*</span>
                </label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} (ব্যালেন্স: ৳{(acc.currentBalancePoisha / 100).toLocaleString("bn-BD")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  পরিশোধের পরিমাণ (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={payRecord.dueAmountPoisha / 100}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  রেফারেন্স / নোট
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ব্যাংক ট্রানজেকশন আইডি বা ক্যাশ মেমো"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPayModalOpen(false)}
                  disabled={submitting}
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  {submitting ? "প্রদান হচ্ছে..." : "বেতন প্রদান নিশ্চিত করুন"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

