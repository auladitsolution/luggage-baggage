"use client";

import { useState, useRef, useEffect, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Printer,
  CheckCircle2,
  DollarSign,
  Store,
  ArrowLeft,
  RotateCcw,
  Receipt,
  CreditCard,
  Smartphone,
  Split,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { STORE_INFO } from "@/lib/config/storeInfo";
import { useAuth } from "@/context/AuthContext";

interface POSCartItem {
  variantId: string;
  name: string;
  size: string;
  color: string;
  barcode: string;
  sku: string;
  unitPricePoisha: number;
  quantity: number;
  lineDiscountPoisha: number;
  image: string;
  stock: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [orderDiscountBDT, setOrderDiscountBDT] = useState<string>("0");

  // Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walk-in");
  const [customerName, setCustomerName] = useState("সাধারণ কাস্টমার (Walk-in)");
  const [customerPhone, setCustomerPhone] = useState("");

  // Payment
  const [paymentMode, setPaymentMode] = useState<"cash" | "bkash" | "card" | "split" | "due">("cash");
  const [cashAmountBDT, setCashAmountBDT] = useState<string>("");
  const [digitalAmountBDT, setDigitalAmountBDT] = useState<string>("");
  const [digitalMethod, setDigitalMethod] = useState<"bkash" | "card" | "bank">("bkash");
  const [digitalTxnRef, setDigitalTxnRef] = useState<string>("");

  // Sale Completion Modal
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);

  // Fetch live products and customers from real database
  const loadPOSData = async () => {
    try {
      setLoading(true);
      const [prodRes, custRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/customers"),
      ]);

      const prodData = await prodRes.json();
      const custData = await custRes.json();

      if (prodData.products) setProducts(prodData.products);
      if (custData.customers) setCustomers(custData.customers);
    } catch (err) {
      console.error("Failed to load POS data:", err);
    } finally {
      setLoading(false);
    }
  };

  const { user } = useAuth();

  useEffect(() => {
    // Security check: Google login accounts cannot enter POS counter
    if (user) {
      if (user.authMethod === "google" || user.roleSlug === "customer") {
        window.location.href = "/account?error=google_management_blocked";
      }
    }
  }, [user]);

  useEffect(() => {
    loadPOSData();
  }, []);

  // Autofocus barcode input for hardware scanner
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [completedInvoice]);

  // Flatten all variants from products for instant barcode scan
  const allVariants = products.flatMap((p) =>
    (p.variants || []).map((v: any) => ({
      ...v,
      productName: p.nameBangla,
      brand: p.brand?.name || p.brandId?.name || "Lumina",
      image: (typeof p.images?.[0] === "string" ? p.images[0] : p.images?.[0]?.secureUrl) || "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=400&q=80",
    }))
  );

  // Add Item to Cart
  const addItemToCart = (variant: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variant._id || i.variantId === variant.variantId);
      if (existing) {
        if (existing.quantity >= variant.stock) {
          alert(`স্টক ছাড়িয়ে গেছে! সর্বোচ্চ স্টক: ${variant.stock} পিস`);
          return prev;
        }
        return prev.map((i) =>
          (i.variantId === variant._id || i.variantId === variant.variantId)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      if (variant.stock <= 0) {
        alert("এই ভ্যারিয়েন্টটির কোনো স্টক নেই!");
        return prev;
      }

      return [
        ...prev,
        {
          variantId: variant._id || variant.variantId,
          name: variant.productName,
          size: variant.size || variant.nameVariant,
          color: variant.color || "স্ট্যান্ডার্ড",
          barcode: variant.barcode,
          sku: variant.sku,
          unitPricePoisha: variant.retailPricePoisha,
          quantity: 1,
          lineDiscountPoisha: 0,
          image: variant.image,
          stock: variant.stock,
        },
      ];
    });
  };

  // Hardware Barcode Scanner Submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    const matched = allVariants.find(
      (v) => v.barcode === query || v.sku.toLowerCase() === query.toLowerCase()
    );

    if (matched) {
      addItemToCart(matched);
      setBarcodeInput("");
    } else {
      alert(`বারকোড খুঁজে পাওয়া যায়নি! (${query})`);
      setBarcodeInput("");
    }
  };

  // Update item quantity
  const updateQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variantId === variantId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.stock) {
              alert(`সর্বোচ্চ স্টক: ${item.stock} পিস`);
              return item;
            }
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  // Calculations
  const subTotalPoisha = cart.reduce(
    (acc, item) => acc + item.unitPricePoisha * item.quantity - item.lineDiscountPoisha,
    0
  );
  const orderDiscountPoisha = Math.round((parseFloat(orderDiscountBDT) || 0) * 100);
  const grandTotalPoisha = Math.max(0, subTotalPoisha - orderDiscountPoisha);

  // Auto set initial cash amount to Grand Total when cart changes
  useEffect(() => {
    if (paymentMode === "cash" && !completedInvoice) {
      setCashAmountBDT(String(grandTotalPoisha / 100));
    }
  }, [grandTotalPoisha, paymentMode, completedInvoice]);

  // Payment Breakdown
  const cashPoisha =
    paymentMode === "cash"
      ? Math.round((parseFloat(cashAmountBDT) || 0) * 100)
      : paymentMode === "split"
      ? Math.round((parseFloat(cashAmountBDT) || 0) * 100)
      : 0;

  const digitalPoisha =
    paymentMode === "bkash" || paymentMode === "card"
      ? grandTotalPoisha
      : paymentMode === "split"
      ? Math.round((parseFloat(digitalAmountBDT) || 0) * 100)
      : 0;

  const totalPaidPoisha = cashPoisha + digitalPoisha;
  const changeDuePoisha = Math.max(0, totalPaidPoisha - grandTotalPoisha);
  const dueAmountPoisha = Math.max(0, grandTotalPoisha - totalPaidPoisha);

  // Handle Checkout / Sale Finalization
  const handleFinalizeSale = async () => {
    setErrorMessage("");

    if (cart.length === 0) {
      setErrorMessage("কার্টে অন্তত একটি পণ্য যোগ করুন");
      return;
    }

    if (dueAmountPoisha > 0 && !customerPhone.trim()) {
      setErrorMessage("বাকি বা আংশিক পরিশোধ বিক্রির ক্ষেত্রে কাস্টমারের মোবাইল নম্বর আবশ্যক।");
      return;
    }

    try {
      setSubmitting(true);

      const paymentsList = [];
      if (cashPoisha > 0) {
        paymentsList.push({
          method: "cash",
          // Only actual paid up to grand total, rest is change return
          amountPoisha: Math.min(cashPoisha, grandTotalPoisha),
        });
      }
      if (digitalPoisha > 0) {
        paymentsList.push({
          method: digitalMethod,
          amountPoisha: digitalPoisha,
          transactionReference: digitalTxnRef || undefined,
        });
      }

      // Generate client-side idempotency key for network resilience
      const idempotencyKey = `pos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        idempotencyKey,
        customerId: selectedCustomerId !== "walk-in" ? selectedCustomerId : undefined,
        customerName: customerName || "সাধারণ কাস্টমার (Walk-in)",
        customerPhone: customerPhone.trim(),
        items: cart.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          unitPricePoisha: i.unitPricePoisha,
          lineDiscountPoisha: i.lineDiscountPoisha,
        })),
        orderDiscountPoisha,
        payments: paymentsList,
      };

      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "বিক্রয় সম্পন্ন করা যায়নি");
      }

      setCompletedInvoice({
        ...data.invoice,
        tenderedCashPoisha: cashPoisha,
        changeReturnPoisha: changeDuePoisha,
      });

      // Refresh products stock in background
      loadPOSData();
    } catch (err: any) {
      setErrorMessage(err.message || "সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextSale = () => {
    setCart([]);
    setOrderDiscountBDT("0");
    setCashAmountBDT("");
    setDigitalAmountBDT("");
    setDigitalTxnRef("");
    setSelectedCustomerId("walk-in");
    setCustomerName("সাধারণ কাস্টমার (Walk-in)");
    setCustomerPhone("");
    setPaymentMode("cash");
    setCompletedInvoice(null);
    setErrorMessage("");
    barcodeInputRef.current?.focus();
  };

  // Filter products by search query
  const filteredVariants = allVariants.filter((v) => {
    const s = searchQuery.toLowerCase();
    return (
      v.productName.toLowerCase().includes(s) ||
      v.brand.toLowerCase().includes(s) ||
      (v.size && v.size.toLowerCase().includes(s)) ||
      (v.color && v.color.toLowerCase().includes(s)) ||
      v.barcode.includes(s) ||
      v.sku.toLowerCase().includes(s)
    );
  });

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden text-xs">
      {/* Top Header */}
      <header className="h-14 bg-brand-navy text-white px-4 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 font-semibold text-[11px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">ড্যাশবোর্ড</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center p-0.5">
              <img
                src="/logo.png"
                alt={STORE_INFO.name}
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-white">
              {STORE_INFO.name} ({STORE_INFO.nameBangla}) • পিওএস কাউন্টার
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Hardware Barcode Scanner Input */}
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="বারকোড স্ক্যান করুন (Scan)..."
              className="w-48 sm:w-64 pl-8 pr-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-300 text-xs focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
            />
            <Barcode className="w-4 h-4 text-brand-gold absolute left-2.5 top-2" />
          </form>

          <button
            onClick={loadPOSData}
            title="পণ্য ও স্টক রিফ্রেশ"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main POS Interface Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Product Catalog & Search (60%) */}
        <div className="flex-1 flex flex-col p-3 overflow-hidden border-r border-slate-200">
          {/* Search Box */}
          <div className="relative mb-3 flex-shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্যের নাম, সাইজ (20, 24, 28), ব্র্যান্ড বা বারকোড দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-teal" />
                <span>পণ্য লোড হচ্ছে...</span>
              </div>
            ) : filteredVariants.length === 0 ? (
              <div className="text-center py-16 text-slate-400">কোনো পণ্য পাওয়া যায়নি।</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredVariants.map((v) => (
                  <button
                    key={v._id || v.barcode}
                    onClick={() => addItemToCart(v)}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-brand-teal hover:shadow-md transition-all text-left flex flex-col justify-between group relative"
                  >
                    <div>
                      <div className="relative h-24 w-full rounded-lg overflow-hidden bg-slate-50 mb-2 border border-slate-100">
                        <Image unoptimized src={v.image} alt="" fill className="object-contain p-1 group-hover:scale-105 transition-transform" />
                        <span className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          v.stock <= 3 ? "bg-rose-600 text-white" : "bg-brand-navy/80 text-white"
                        }`}>
                          স্টক: {toBengaliNumber(v.stock)}
                        </span>
                      </div>
                      <span className="font-bold text-brand-navy text-[11px] block line-clamp-1">
                        {v.productName}
                      </span>
                      <span className="text-[10px] text-brand-teal font-semibold block">
                        {v.size || v.nameVariant} ({v.brand})
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono block">
                        {v.barcode}
                      </span>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs">
                        {formatBDT(v.retailPricePoisha)}
                      </span>
                      <span className="p-1 rounded bg-slate-100 group-hover:bg-brand-teal group-hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cart, Customer & Checkout Station (40%) */}
        <div className="w-full lg:w-[420px] xl:w-[460px] bg-white flex flex-col shadow-lg border-l border-slate-200 flex-shrink-0">
          {/* Customer Selection Box */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-teal" />
                <span>গ্রাহক নির্বাচন</span>
              </span>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedCustomerId(id);
                  if (id === "walk-in") {
                    setCustomerName("সাধারণ কাস্টমার (Walk-in)");
                    setCustomerPhone("");
                  } else {
                    const c = customers.find((cust) => cust._id === id);
                    if (c) {
                      setCustomerName(c.name);
                      setCustomerPhone(c.phone);
                    }
                  }
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-800"
              >
                <option value="walk-in">সাধারণ কাস্টমার (Walk-in)</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone}) {c.currentDuePoisha > 0 ? `[বকেয়া ৳${c.currentDuePoisha/100}]` : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomerId !== "walk-in" && (
              <div className="text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 flex justify-between">
                <span>নাম: <strong>{customerName}</strong></span>
                <span>ফোন: <strong>{customerPhone}</strong></span>
              </div>
            )}

            {/* If walk-in but wants to input phone for due */}
            {selectedCustomerId === "walk-in" && paymentMode === "due" && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="গ্রাহকের নাম *"
                  value={customerName === "সাধারণ কাস্টমার (Walk-in)" ? "" : customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="px-2 py-1 rounded border border-slate-200 text-xs"
                />
                <input
                  type="text"
                  placeholder="মোবাইল নম্বর *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="px-2 py-1 rounded border border-slate-200 text-xs"
                />
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Barcode className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>কার্ট খালি। বারকোড স্ক্যান করুন বা পণ্য বাছাই করুন।</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.variantId} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 block line-clamp-1">{item.name}</span>
                    <span className="text-[10px] text-brand-teal font-semibold">{item.size} • {item.color}</span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {formatBDT(item.unitPricePoisha)} × {item.quantity} = <strong>{formatBDT(item.unitPricePoisha * item.quantity)}</strong>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.variantId, -1)}
                      className="p-1 rounded hover:bg-white text-slate-700"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, 1)}
                      className="p-1 rounded hover:bg-white text-slate-700"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => setCart(cart.filter((i) => i.variantId !== item.variantId))}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="বাতিল করুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Payment & Totals Station */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2.5">
            {errorMessage && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Discount & Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>উপ-মোট (Subtotal):</span>
                <span>{formatBDT(subTotalPoisha)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>অর্ডার ডিসকাউন্ট (৳):</span>
                <input
                  type="number"
                  value={orderDiscountBDT}
                  onChange={(e) => setOrderDiscountBDT(e.target.value)}
                  placeholder="0"
                  className="w-20 px-2 py-0.5 rounded border border-slate-200 text-right font-bold text-xs"
                />
              </div>

              <div className="flex justify-between font-extrabold text-sm text-brand-navy pt-1 border-t border-slate-200">
                <span>সর্বমোট (Grand Total):</span>
                <span>{formatBDT(grandTotalPoisha)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              <button
                type="button"
                onClick={() => setPaymentMode("cash")}
                className={`py-1.5 rounded-lg font-bold text-[11px] flex flex-col items-center gap-0.5 border ${
                  paymentMode === "cash"
                    ? "bg-brand-navy text-white border-brand-navy"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>নগদ</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("bkash")}
                className={`py-1.5 rounded-lg font-bold text-[11px] flex flex-col items-center gap-0.5 border ${
                  paymentMode === "bkash"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>বিকাশ/নগদ</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("split")}
                className={`py-1.5 rounded-lg font-bold text-[11px] flex flex-col items-center gap-0.5 border ${
                  paymentMode === "split"
                    ? "bg-brand-teal text-white border-brand-teal"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>স্প্লিট</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("due")}
                className={`py-1.5 rounded-lg font-bold text-[11px] flex flex-col items-center gap-0.5 border ${
                  paymentMode === "due"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>বাকি/আংশিক</span>
              </button>
            </div>

            {/* Dynamic Payment Inputs */}
            {paymentMode === "cash" && (
              <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">গৃহীত নগদ টাকা:</span>
                  <input
                    type="number"
                    value={cashAmountBDT}
                    onChange={(e) => setCashAmountBDT(e.target.value)}
                    placeholder="৳"
                    className="w-28 px-2 py-1 rounded border border-slate-200 text-right font-extrabold text-sm"
                  />
                </div>
                {changeDuePoisha > 0 && (
                  <div className="text-right text-emerald-700 font-bold text-xs">
                    ভাংতি ফেরত: {formatBDT(changeDuePoisha)}
                  </div>
                )}
              </div>
            )}

            {paymentMode === "split" && (
              <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>নগদ টাকা:</span>
                  <input
                    type="number"
                    value={cashAmountBDT}
                    onChange={(e) => setCashAmountBDT(e.target.value)}
                    placeholder="নগদ ৳"
                    className="w-24 px-2 py-0.5 rounded border border-slate-200 text-right font-bold"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>ডিজিটাল (বিকাশ/কার্ড):</span>
                  <input
                    type="number"
                    value={digitalAmountBDT}
                    onChange={(e) => setDigitalAmountBDT(e.target.value)}
                    placeholder="বিকাশ ৳"
                    className="w-24 px-2 py-0.5 rounded border border-slate-200 text-right font-bold"
                  />
                </div>
                <input
                  type="text"
                  placeholder="ট্রানজেকশন আইডি (ঐচ্ছিক)"
                  value={digitalTxnRef}
                  onChange={(e) => setDigitalTxnRef(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-200 text-[11px]"
                />
              </div>
            )}

            {paymentMode === "bkash" && (
              <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1 text-xs">
                <input
                  type="text"
                  placeholder="বিকাশ / নগদ ট্রানজেকশন আইডি (TrxID) *"
                  value={digitalTxnRef}
                  onChange={(e) => setDigitalTxnRef(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-200 text-[11px]"
                />
              </div>
            )}

            {/* Checkout Action Button */}
            <button
              onClick={handleFinalizeSale}
              disabled={submitting || cart.length === 0}
              className="w-full py-3 rounded-xl bg-brand-teal hover:bg-brand-tealLight text-white font-extrabold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? "প্রসেস হচ্ছে..." : "বিক্রয় নিশ্চিত করুন (Finalize Sale)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sale Success & Printing Dialog */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-slate-200">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-brand-navy">বিক্রয় সফল হয়েছে!</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                চালান নং: <strong>{completedInvoice.invoiceNumber}</strong>
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-left">
              <div className="flex justify-between">
                <span>মোট বিল:</span>
                <strong>{formatBDT(completedInvoice.grandTotalPoisha)}</strong>
              </div>
              <div className="flex justify-between">
                <span>পরিশোধিত অর্থ:</span>
                <span className="text-emerald-700 font-bold">{formatBDT(completedInvoice.paidAmountPoisha)}</span>
              </div>
              {completedInvoice.dueAmountPoisha > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>বকেয়া (Due):</span>
                  <span>{formatBDT(completedInvoice.dueAmountPoisha)}</span>
                </div>
              )}
              {completedInvoice.changeReturnPoisha > 0 && (
                <div className="flex justify-between text-brand-navy font-bold pt-1 border-t border-slate-200">
                  <span>ভাংতি ফেরত:</span>
                  <span>{formatBDT(completedInvoice.changeReturnPoisha)}</span>
                </div>
              )}
            </div>

            {/* Direct Print Shortcuts */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href={`/print/receipt/${completedInvoice._id}?format=80mm`}
                target="_blank"
                className="py-2.5 px-3 rounded-xl bg-brand-navy hover:bg-brand-teal text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>৮০ মিমি থার্মাল</span>
              </Link>

              <Link
                href={`/print/receipt/${completedInvoice._id}?format=58mm`}
                target="_blank"
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Receipt className="w-4 h-4" />
                <span>৫৮ মিমি থার্মাল</span>
              </Link>
            </div>

            <Link
              href={`/print/receipt/${completedInvoice._id}?format=a4`}
              target="_blank"
              className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1"
            >
              <span>A4 পূর্ণাঙ্গ ইনভয়েস প্রিভিউ</span>
            </Link>

            <button
              onClick={handleNextSale}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              নতুন বিক্রয় শুরু করুন (Next Sale)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
