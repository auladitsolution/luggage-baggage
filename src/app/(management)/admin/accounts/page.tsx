"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  ArrowRightLeft, 
  PlusCircle, 
  Wallet, 
  Building2, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IFinancialAccount, IJournalEntry } from "@/types/accounting";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<IFinancialAccount[]>([]);
  const [journalEntries, setJournalEntries] = useState<IJournalEntry[]>([]);
  const [totalLiquid, setTotalLiquid] = useState(0);
  const [loading, setLoading] = useState(true);

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  // New Account Modal
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState<"cash" | "bank" | "bkash" | "nagad">("bank");
  const [newAccNumber, setNewAccNumber] = useState("");
  const [newAccBank, setNewAccBank] = useState("");
  const [newAccInitial, setNewAccInitial] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const [accRes, jvRes] = await Promise.all([
        fetch("/api/admin/accounts"),
        fetch("/api/admin/journal"),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData.accounts || []);
        setTotalLiquid(accData.totalLiquidAssetsPoisha || 0);
        if (accData.accounts?.length >= 2) {
          setFromAccountId(accData.accounts[0]._id);
          setToAccountId(accData.accounts[1]._id);
        }
      }

      if (jvRes.ok) {
        const jvData = await jvRes.json();
        setJournalEntries(jvData.journalEntries || []);
      }
    } catch (err) {
      console.error("Failed to load financial accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/accounts/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amountPoisha: Math.round(parseFloat(transferAmount || "0") * 100),
          notes: transferNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "তহবিল স্থানান্তর ব্যর্থ হয়েছে");

      setSuccessMsg("তহবিল স্থানান্তর এবং ডাবল-এন্ট্রি হিসাব ভাউচার সম্পন্ন হয়েছে!");
      setIsTransferModalOpen(false);
      setTransferAmount("");
      setTransferNotes("");
      fetchAccounts();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: newAccName,
          accountType: newAccType,
          accountNumber: newAccNumber,
          bankName: newAccBank,
          initialBalancePoisha: Math.round(parseFloat(newAccInitial || "0") * 100),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "হিসাব তৈরি ব্যর্থ হয়েছে");

      setSuccessMsg("নতুন হিসাব সফলভাবে যুক্ত হয়েছে!");
      setIsNewAccountModalOpen(false);
      setNewAccName("");
      setNewAccNumber("");
      setNewAccBank("");
      setNewAccInitial("");
      fetchAccounts();
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
            <CreditCard className="w-4 h-4" />
            <span>আর্থিক ও ক্যাশ ফ্লো ব্যবস্থাপনা</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            ক্যাশ ও ব্যাংক হিসাব
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            দোকান ক্যাশ ড্রয়ার, ব্যাংক একাউন্ট, বিকাশ ও নগদ মার্চেন্ট ওয়ালেট স্থিতি
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setIsNewAccountModalOpen(true)}
            variant="outline"
            className="flex items-center gap-1.5 text-slate-700 bg-white"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>নতুন হিসাব যোগ</span>
          </Button>

          <Button
            onClick={() => setIsTransferModalOpen(true)}
            className="bg-brand-navy hover:bg-slate-800 text-white flex items-center gap-2 shadow-sm font-medium"
          >
            <ArrowRightLeft className="w-4 h-4 text-brand-gold" />
            <span>তহবিল স্থানান্তর (Transfer)</span>
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

      {/* Total Liquid Banner */}
      <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-gold font-semibold">
            সর্বমোট কার্যকরী তরল তহবিল (Total Liquid Assets)
          </span>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight">
            ৳{(totalLiquid / 100).toLocaleString("bn-BD")}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            দোকান ক্যাশ ড্রয়ার + ব্যাংক ব্যালেন্স + বিকাশ ও নগদ ওয়ালেট
          </span>
        </div>

        <div className="flex gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1 text-xs">
            {accounts.filter((a) => a.isActive).length}টি হিসাব সক্রিয়
          </Badge>
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => {
          const isCash = acc.accountType === "cash";
          const isBank = acc.accountType === "bank";
          const isBkash = acc.accountType === "bkash";
          const isNagad = acc.accountType === "nagad";

          return (
            <div
              key={acc._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-teal/40 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
                    isCash
                      ? "bg-emerald-50 text-emerald-600"
                      : isBank
                      ? "bg-blue-50 text-blue-600"
                      : isBkash
                      ? "bg-pink-50 text-pink-600"
                      : "bg-orange-50 text-orange-600"
                  }`}
                >
                  {isCash && <Wallet className="w-5 h-5" />}
                  {isBank && <Building2 className="w-5 h-5" />}
                  {(isBkash || isNagad) && <Smartphone className="w-5 h-5" />}
                </div>

                <Badge
                  variant="outline"
                  className={
                    acc.isDefault
                      ? "bg-amber-50 text-amber-800 border-amber-200 text-[10px]"
                      : "bg-slate-50 text-slate-500 text-[10px]"
                  }
                >
                  {acc.isDefault ? "ডিফল্ট ক্যাশ" : acc.accountType.toUpperCase()}
                </Badge>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{acc.accountName}</h3>
                {acc.accountNumber && (
                  <span className="text-xs text-slate-400 font-mono block mt-0.5">
                    {acc.accountNumber}
                  </span>
                )}
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  ৳{(acc.currentBalancePoisha / 100).toLocaleString("bn-BD")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Double-Entry Journal Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-teal" />
            <h2 className="text-base font-bold text-slate-900">
              দ্বৈত দাখিলা জার্নাল লেজার (Double-Entry Journal Entries)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            মোট {journalEntries.length} টি ভাউচার
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">তারিখ</th>
                <th className="py-3.5 px-4 whitespace-nowrap">ভাউচার নম্বর</th>
                <th className="py-3.5 px-4 whitespace-nowrap">রেফারেন্স ধরণ</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">বিবরণ</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">ডেবিট (Debit)</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">ক্রেডিট (Credit)</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">ব্যালেন্স স্থিতি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : journalEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    কোনো জার্নাল এন্ট্রি পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                journalEntries.map((jv) => {
                  const isBalanced = jv.totalDebitPoisha === jv.totalCreditPoisha;
                  return (
                    <tr key={jv._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(jv.entryDate).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-xs text-brand-teal">
                        {jv.entryNumber}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[11px] font-mono bg-slate-50">
                          {jv.referenceType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-800 max-w-xs truncate">
                        {jv.description}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-emerald-600">
                        ৳{(jv.totalDebitPoisha / 100).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-rose-600">
                        ৳{(jv.totalCreditPoisha / 100).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={
                            isBalanced
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                              : "bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                          }
                        >
                          {isBalanced ? "✓ Balanced" : "✗ Unbalanced"}
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

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <ArrowRightLeft className="w-5 h-5 text-brand-teal" />
                <span>তহবিল স্থানান্তর (Fund Transfer)</span>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransfer} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  উৎস হিসাব (যেখান থেকে টাকা কাটবে) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
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
                  গন্তব্য হিসাব (যেখানে টাকা জমা হবে) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
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
                  স্থানান্তরের পরিমাণ (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="যেমন: 5000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  স্থানান্তরের কারণ / নোট
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ক্যাশ ড্রয়ার থেকে ব্যাংকে জমা"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTransferModalOpen(false)}
                  disabled={submitting}
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-navy hover:bg-slate-800 text-white font-medium"
                >
                  {submitting ? "প্রক্রিয়াধীন..." : "স্থানান্তর নিশ্চিত করুন"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Account Modal */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <PlusCircle className="w-5 h-5 text-brand-teal" />
                <span>নতুন আর্থিক হিসাব তৈরি</span>
              </div>
              <button
                onClick={() => setIsNewAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  হিসাবের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: সিটি ব্যাংক চলতি হিসাব"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  হিসাবের ধরণ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white"
                >
                  <option value="bank">ব্যাংক একাউন্ট (Bank Account)</option>
                  <option value="cash">ক্যাশ ড্রয়ার / পেটি ক্যাশ (Cash)</option>
                  <option value="bkash">বিকাশ মার্চেন্ট ওয়ালেট (bKash)</option>
                  <option value="nagad">নগদ মার্চেন্ট ওয়ালেট (Nagad)</option>
                </select>
              </div>

              {newAccType === "bank" && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ব্যাংকের নাম
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: City Bank PLC"
                    value={newAccBank}
                    onChange={(e) => setNewAccBank(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  হিসাব নম্বর / ওয়ালেট ফোন নম্বর
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 1102938475 বা 01711..."
                  value={newAccNumber}
                  onChange={(e) => setNewAccNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  প্রারম্ভিক ব্যালেন্স (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newAccInitial}
                  onChange={(e) => setNewAccInitial(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewAccountModalOpen(false)}
                  disabled={submitting}
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-navy hover:bg-slate-800 text-white font-medium"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "হিসাব তৈরি করুন"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

