"use client";

import { useEffect, useState } from "react";
import {
  Boxes,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  X,
  History,
  AlertCircle,
} from "lucide-react";
import { toBengaliNumber, formatBDT } from "@/lib/utils";

interface InventoryItem {
  balanceId: string;
  variantId: string;
  productId: string;
  productName: string;
  brand: string;
  variantName: string;
  sku: string;
  barcode: string;
  location: string;
  locationId: string;
  currentStock: number;
  reservedStock: number;
  available: number;
  lowStockAlertThreshold: number;
  isLowStock: boolean;
  retailPricePoisha: number;
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"balances" | "movements">("balances");

  // Modal State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");
  const [adjustQty, setAdjustQty] = useState("1");
  const [adjustReason, setAdjustReason] = useState("শারীরিক গণনা পরবর্তী সমন্বয়");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        if (data.items.length > 0 && !selectedVariantId) {
          setSelectedVariantId(data.items[0].variantId);
        }
      }
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      const res = await fetch("/api/admin/inventory/movements");
      const data = await res.json();
      if (data.movements) {
        setMovements(data.movements);
      }
    } catch (err) {
      console.error("Failed to load movements:", err);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    if (activeTab === "movements") {
      loadMovements();
    }
  }, [activeTab]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const qty = parseInt(adjustQty, 10);
    if (!selectedVariantId || isNaN(qty) || qty <= 0) {
      setErrorMsg("সঠিক পরিমাণ প্রদান করুন");
      return;
    }

    const quantityChange = adjustType === "add" ? qty : -qty;

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: selectedVariantId,
          quantityChange,
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "স্টক সমন্বয় ব্যর্থ হয়েছে");
      }

      setSuccessMsg("স্টক সফলভাবে সমন্বয় করা হয়েছে!");
      setIsAdjustOpen(false);
      setAdjustQty("1");
      await loadInventory();
      if (activeTab === "movements") await loadMovements();
    } catch (err: any) {
      setErrorMsg(err.message || "সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items
    .filter((i) => (filterLowStock ? i.isLowStock : true))
    .filter((i) => {
      const s = search.toLowerCase();
      return (
        i.productName.toLowerCase().includes(s) ||
        i.variantName.toLowerCase().includes(s) ||
        i.sku.toLowerCase().includes(s) ||
        i.barcode.includes(s)
      );
    });

  const lowStockCount = items.filter((i) => i.isLowStock).length;
  const totalStockPieces = items.reduce((acc, i) => acc + i.currentStock, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy tracking-tight">
            ইনভেন্টরি ও রিয়েল-টাইম স্টক স্থিতি
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            মোট {toBengaliNumber(items.length)} টি এসকেইউ • সর্বমোট {toBengaliNumber(totalStockPieces)} পিস লাগেজ স্টকে রয়েছে
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              filterLowStock
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>সীমিত স্টক ({toBengaliNumber(lowStockCount)})</span>
          </button>

          <button
            onClick={() => {
              setIsAdjustOpen(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-teal text-white text-xs font-bold transition-colors shadow-xs"
          >
            স্টক সমন্বয় (Adjustment)
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("balances")}
          className={`pb-2.5 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "balances"
              ? "border-brand-teal text-brand-teal"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>বর্তমান স্টক তালিকা</span>
        </button>

        <button
          onClick={() => setActiveTab("movements")}
          className={`pb-2.5 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "movements"
              ? "border-brand-teal text-brand-teal"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          <span>অপরিবর্তনীয় স্টক অডিট লেজার</span>
        </button>
      </div>

      {activeTab === "balances" && (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="পণ্যের নাম, ভ্যারিয়েন্ট, SKU বা বারকোড দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <button
              onClick={loadInventory}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-teal" />
                <span>স্টক লোড হচ্ছে...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                কোনো স্টক আইটেম পাওয়া যায়নি।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">পণ্য ও ভ্যারিয়েন্ট</th>
                      <th className="py-3 px-4 whitespace-nowrap">এসকেইউ ও বারকোড</th>
                      <th className="py-3 px-4 whitespace-nowrap">শাখা বা গোডাউন</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">ফিজিক্যাল স্টক</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">অনলাইন রিজার্ভ</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">বিক্রয়যোগ্য স্টক</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">স্ট্যাটাস</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item, idx) => (
                      <tr key={item.balanceId || item.variantId || `inv-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-brand-navy block">
                            {item.productName}
                          </span>
                          <span className="text-[11px] text-brand-teal">
                            {item.variantName} ({item.brand})
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500">
                          <div>
                            SKU: <strong className="text-slate-700">{item.sku}</strong>
                          </div>
                          <div className="text-[10px]">বারকোড: {item.barcode}</div>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {item.location}
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {toBengaliNumber(item.currentStock)}
                        </td>

                        <td className="py-3 px-4 text-center text-amber-600 font-bold">
                          {toBengaliNumber(item.reservedStock)}
                        </td>

                        <td className="py-3 px-4 text-center font-extrabold text-brand-navy text-sm">
                          {toBengaliNumber(item.available)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {item.isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                              সীমিত স্টক
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                              পর্যাপ্ত
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedVariantId(item.variantId);
                              setIsAdjustOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-[11px]"
                          >
                            সমন্বয়
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Movements Tab (Immutable Audit Ledger) */}
      {activeTab === "movements" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs">
              সর্বশেষ স্টক মুভমেন্ট অডিট লেজার
            </h3>
            <button
              onClick={loadMovements}
              className="text-xs text-brand-teal hover:underline font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {movements.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              কোনো মুভমেন্ট হিস্ট্রি পাওয়া যায়নি।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4 whitespace-nowrap">তারিখ ও সময়</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">ভ্যারিয়েন্ট</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">মুভমেন্টের ধরন</th>
                    <th className="py-2.5 px-4 text-center whitespace-nowrap">পরিবর্তন (Qty)</th>
                    <th className="py-2.5 px-4 text-center whitespace-nowrap">ব্যালেন্স (পূর্ব ➔ পর)</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">কারণ ও বিবরণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m, idx) => (
                    <tr key={m._id || `mov-${idx}`} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {m.variantId?.nameVariant || m.variantId || "ভ্যারিয়েন্ট"}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {m.variantId?.sku}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-700">
                          {m.movementType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold">
                        <span
                          className={m.quantity > 0 ? "text-emerald-700" : "text-rose-600"}
                        >
                          {m.quantity > 0 ? `+${toBengaliNumber(m.quantity)}` : toBengaliNumber(m.quantity)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-600">
                        {toBengaliNumber(m.balanceBefore)} ➔ {toBengaliNumber(m.balanceAfter)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                        {m.reason || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Concurrency-Safe Stock Adjustment Modal */}
      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-brand-navy">
                স্টক সমন্বয় (Stock Adjustment)
              </h2>
              <button
                onClick={() => setIsAdjustOpen(false)}
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

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ভ্যারিয়েন্ট নির্বাচন করুন *
                </label>
                <select
                  required
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-brand-teal focus:outline-none"
                >
                  {items.map((i, idx) => (
                    <option key={i.balanceId || i.variantId || `opt-${idx}`} value={i.variantId || i.balanceId}>
                      {i.productName} {i.variantName ? `(${i.variantName})` : ""} — বর্তমান স্টক: {i.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  সমন্বয়ের ধরন *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("add")}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      adjustType === "add"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>স্টক বৃদ্ধি (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType("subtract")}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      adjustType === "subtract"
                        ? "bg-rose-50 border-rose-300 text-rose-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Minus className="w-4 h-4 text-rose-600" />
                    <span>স্টক হ্রাস (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  পরিমাণ (পিস) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="যেমন: ৫"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-brand-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  সমন্বয়ের কারণ বা নোট *
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="যেমন: শারীরিক গণনা পরবর্তী সমন্বয় / নষ্ট বা হারিয়ে যাওয়া"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-brand-teal focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-brand-teal hover:bg-brand-tealLight text-white font-bold disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? "সমন্বয় হচ্ছে..." : "স্টক নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
