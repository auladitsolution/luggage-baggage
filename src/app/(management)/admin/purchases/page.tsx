"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Plus,
  Truck,
  CreditCard,
  DollarSign,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  CheckCircle2,
  PackagePlus,
  Trash2,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { IPurchaseInvoice, ISupplier } from "@/types/purchasing";

interface ProductVariantOption {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  barcode: string;
  purchaseCostPoisha: number;
}

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<IPurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [variants, setVariants] = useState<ProductVariantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState("");

  // New Purchase Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState("");
  const [items, setItems] = useState<
    Array<{
      variantId: string;
      productName: string;
      variantName: string;
      quantityReceived: number;
      unitCostBDT: string;
    }>
  >([]);
  const [discountBDT, setDiscountBDT] = useState("0");
  const [paidAmountBDT, setPaidAmountBDT] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cash" | "bkash">("bank");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccessMsg, setCreateSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [purRes, supRes, invRes] = await Promise.all([
        fetch(`/api/admin/purchases${selectedSupplierFilter ? `?supplierId=${selectedSupplierFilter}` : ""}`),
        fetch("/api/admin/suppliers"),
        fetch("/api/admin/inventory"),
      ]);

      const [purData, supData, invData] = await Promise.all([
        purRes.json(),
        supRes.json(),
        invRes.json(),
      ]);

      if (purData.purchases) setPurchases(purData.purchases);
      if (supData.suppliers) setSuppliers(supData.suppliers);

      if (invData.items) {
        const variantOptions = invData.items.map((i: any) => ({
          variantId: i.variantId,
          productId: i.productId,
          productName: i.productName,
          variantName: i.variantName,
          sku: i.sku,
          barcode: i.barcode,
          purchaseCostPoisha: i.purchaseCostPoisha || 0,
        }));
        setVariants(variantOptions);
      }
    } catch (err) {
      console.error("Failed to load purchases data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSupplierFilter]);

  const handleAddItemRow = () => {
    if (variants.length === 0) return;
    const first = variants[0];
    setItems((prev) => [
      ...prev,
      {
        variantId: first.variantId,
        productName: first.productName,
        variantName: first.variantName,
        quantityReceived: 10,
        unitCostBDT: String((first.purchaseCostPoisha || 300000) / 100),
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      if (field === "variantId") {
        const matched = variants.find((v) => v.variantId === value);
        if (matched) {
          copy[index].variantId = matched.variantId;
          copy[index].productName = matched.productName;
          copy[index].variantName = matched.variantName;
          copy[index].unitCostBDT = String((matched.purchaseCostPoisha || 300000) / 100);
        }
      } else {
        (copy[index] as any)[field] = value;
      }
      return copy;
    });
  };

  // Calculations for New Purchase Form
  const totalCostBDT = items.reduce(
    (sum, item) => sum + (item.quantityReceived || 0) * (parseFloat(item.unitCostBDT) || 0),
    0
  );
  const discountVal = parseFloat(discountBDT) || 0;
  const grandTotalBDT = Math.max(0, totalCostBDT - discountVal);
  const paidVal = parseFloat(paidAmountBDT) || 0;
  const dueVal = Math.max(0, grandTotalBDT - paidVal);

  const handleOpenNewPurchase = () => {
    setIsAddModalOpen(true);
    setCreateError("");
    setCreateSuccessMsg("");
    if (suppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliers[0]._id);
    }
    if (items.length === 0 && variants.length > 0) {
      handleAddItemRow();
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccessMsg("");

    if (!selectedSupplierId) {
      setCreateError("সরবরাহকারী নির্বাচন করুন");
      return;
    }

    if (items.length === 0) {
      setCreateError("অন্তত একটি পণ্য যোগ করুন");
      return;
    }

    try {
      setCreating(true);
      const payload = {
        supplierId: selectedSupplierId,
        supplierInvoiceRef: supplierInvoiceRef.trim() || undefined,
        items: items.map((i) => ({
          variantId: i.variantId,
          productName: i.productName,
          quantityReceived: parseInt(String(i.quantityReceived), 10) || 1,
          unitCostPoisha: Math.round((parseFloat(i.unitCostBDT) || 0) * 100),
        })),
        discountPoisha: Math.round(discountVal * 100),
        paidAmountPoisha: Math.round(paidVal * 100),
        paymentMethod: paidVal > 0 ? paymentMethod : undefined,
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/admin/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "চালান তৈরি করতে সমস্যা হয়েছে");
      }

      setCreateSuccessMsg(`চালান #${data.invoice?.purchaseInvoiceNumber} সফলভাবে গ্রহণ করা হয়েছে ও স্টক বেড়েছে!`);
      loadData();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSupplierInvoiceRef("");
        setDiscountBDT("0");
        setPaidAmountBDT("0");
        setNotes("");
        setCreateSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      setCreateError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setCreating(false);
    }
  };

  // KPI Calculations
  const totalPurchaseCount = purchases.length;
  const totalGrandTotalPoisha = purchases.reduce((sum, p) => sum + (p.grandTotalPoisha || 0), 0);
  const totalDuePoisha = purchases.reduce((sum, p) => sum + (p.dueAmountPoisha || 0), 0);

  const filteredPurchases = purchases.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.purchaseInvoiceNumber.toLowerCase().includes(s) ||
      p.supplierName.toLowerCase().includes(s) ||
      (p.supplierInvoiceRef && p.supplierInvoiceRef.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-emerald-600" />
            পণ্য ক্রয় চালান ও গুডস রিসিভ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            সাপ্লায়ার চালান এন্ট্রি, ওয়্যারহাউসে স্টক গ্রহণ এবং স্বয়ংক্রিয় গড় ক্রয়মূল্য (WAC) আপডেট
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/suppliers"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm flex items-center gap-1.5 transition"
          >
            <Truck className="w-4 h-4 text-slate-600" />
            সরবরাহকারী তালিকা
          </Link>

          <button
            onClick={handleOpenNewPurchase}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm flex items-center gap-1.5 transition shadow-sm"
          >
            <PackagePlus className="w-4 h-4" />
            নতুন চালান / মাল রিসিভ
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">মোট ক্রয় চালান</p>
            <p className="text-2xl font-bold text-slate-800">{toBengaliNumber(totalPurchaseCount)} টি</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">মোট ক্রয়মূল্য</p>
            <p className="text-2xl font-bold text-slate-800">{formatBDT(totalGrandTotalPoisha)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">মোট বকেয়া দেনা</p>
            <p className="text-2xl font-bold text-rose-600">{formatBDT(totalDuePoisha)}</p>
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
              placeholder="চালান নম্বর বা সাপ্লায়ার দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">সকল সাপ্লায়ার</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          রিফ্রেশ
        </button>
      </div>

      {/* Purchase Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4 whitespace-nowrap">চালান ও মেমো</th>
                <th className="py-3.5 px-4 whitespace-nowrap">সরবরাহকারী</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">আইটেম ও পরিমাণ</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">মোট বিল</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">পরিশোধ ও বাকি</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    ক্রয় চালান লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    কোনো ক্রয় চালান পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const totalQty = p.items?.reduce((sum, i) => sum + (i.quantityReceived || 0), 0) || 0;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.purchaseInvoiceNumber}</div>
                        <div className="text-xs text-slate-400">
                          {p.supplierInvoiceRef ? `মেমো: ${p.supplierInvoiceRef}` : "সরাসরি চালান"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(p.createdAt).toLocaleDateString("bn-BD")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{p.supplierName}</div>
                        <div className="text-xs text-slate-400">রিসিভ করেছেন: {p.receivedByName || "অ্যাডমিন"}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-slate-700">
                          {toBengaliNumber(totalQty)} পিস
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          ({toBengaliNumber(p.items?.length || 0)} টি আইটেম)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">{formatBDT(p.grandTotalPoisha)}</div>
                        {p.discountPoisha > 0 && (
                          <div className="text-[11px] text-emerald-600">ছাড়: {formatBDT(p.discountPoisha)}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="text-xs text-emerald-700 font-medium">
                          জমা: {formatBDT(p.paidAmountPoisha || 0)}
                        </div>
                        {p.dueAmountPoisha > 0 ? (
                          <div className="text-xs text-rose-600 font-bold">
                            বাকি: {formatBDT(p.dueAmountPoisha)}
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-600 font-semibold">সম্পূর্ণ পরিশোধিত</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
                          মাল প্রাপ্ত (Received)
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-400" />
                নতুন মাল রিসিভ / চালান এন্ট্রি
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 space-y-5">
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

              {/* Supplier & Memo Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সরবরাহকারী প্রতিষ্ঠান <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">সাপ্লায়ার নির্বাচন করুন</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সাপ্লায়ারের মেমো / চালান নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: MEMO-88412"
                    value={supplierInvoiceRef}
                    onChange={(e) => setSupplierInvoiceRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    রিসিভকৃত লাগেজ ও আইটেম তালিকা
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    আরও আইটেম যোগ করুন
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div className="flex-1 w-full">
                        <select
                          value={item.variantId}
                          onChange={(e) => handleItemChange(idx, "variantId", e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                        >
                          {variants.map((v) => (
                            <option key={v.variantId} value={v.variantId}>
                              {v.productName} ({v.variantName}) - {v.sku}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            placeholder="পরিমাণ"
                            value={item.quantityReceived}
                            onChange={(e) =>
                              handleItemChange(idx, "quantityReceived", parseInt(e.target.value, 10) || 1)
                            }
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-center font-bold focus:outline-none"
                            title="পরিমাণ (পিস)"
                          />
                        </div>

                        <div className="w-28">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            placeholder="ক্রয়মূল্য"
                            value={item.unitCostBDT}
                            onChange={(e) => handleItemChange(idx, "unitCostBDT", e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-right font-medium focus:outline-none"
                            title="একক ক্রয়মূল্য (টাকা)"
                          />
                        </div>

                        <div className="w-28 text-right font-bold text-xs text-slate-800">
                          {formatBDT(
                            Math.round(
                              (item.quantityReceived || 0) * (parseFloat(item.unitCostBDT) || 0) * 100
                            )
                          )}
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown & Immediate Payment */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      তাৎক্ষণিক পরিশোধ (টাকা ৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={paidAmountBDT}
                      onChange={(e) => setPaidAmountBDT(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-emerald-600 focus:outline-none"
                    />
                  </div>

                  {paidVal > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
                      <div className="flex gap-2">
                        {["bank", "cash", "bkash"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPaymentMethod(m as any)}
                            className={`px-3 py-1 rounded text-xs font-medium border ${
                              paymentMethod === m
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-slate-700 border-slate-200"
                            }`}
                          >
                            {m === "bank" ? "ব্যাংক" : m === "cash" ? "ক্যাশ" : "বিকাশ"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ছাড় / ডিসকাউন্ট (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={discountBDT}
                      onChange={(e) => setDiscountBDT(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 flex flex-col justify-center text-sm">
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>মোট পণ্যের মূল্য:</span>
                    <span>{formatBDT(Math.round(totalCostBDT * 100))}</span>
                  </div>
                  {discountVal > 0 && (
                    <div className="flex justify-between text-emerald-600 text-xs">
                      <span>ছাড়:</span>
                      <span>-{formatBDT(Math.round(discountVal * 100))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                    <span>নেট প্রদেয় (Grand Total):</span>
                    <span>{formatBDT(Math.round(grandTotalBDT * 100))}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 text-xs">
                    <span>পরিশোধিত:</span>
                    <span>{formatBDT(Math.round(paidVal * 100))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 pt-1">
                    <span>অবশিষ্ট দেনা (সাপ্লায়ার বাকি):</span>
                    <span>{formatBDT(Math.round(dueVal * 100))}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মন্তব্য (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: সদরঘাট ওয়্যারহাউসে রিসিভ করা হয়েছে"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  মাল রিসিভ ও স্টক বৃদ্ধি নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

