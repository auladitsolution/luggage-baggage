"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Building2,
  Smartphone,
  Phone,
  MapPin,
  Check,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { getCartItems, clearCart, CartItem } from "@/lib/cart";
import { STORE_INFO } from "@/lib/config/storeInfo";
import { useShopSettings } from "@/context/ShopSettingsContext";

export default function CheckoutPage() {
  const { settings } = useShopSettings();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("ঢাকা");
  const [thanaOrArea, setThanaOrArea] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<"inside_dhaka" | "outside_dhaka">("inside_dhaka");
  const [customerNotes, setCustomerNotes] = useState("");

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<
    "cod" | "bkash_manual" | "nagad_manual" | "bank_manual"
  >("cod");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [bankName, setBankName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  useEffect(() => {
    const cart = getCartItems();
    setItems(cart);
    setIsLoaded(true);
  }, []);

  const subTotalPoisha = items.reduce((sum, item) => sum + item.pricePoisha * item.quantity, 0);
  const feeInside = (settings.deliveryFeeInsideDhaka ?? 80) * 100;
  const feeOutside = (settings.deliveryFeeOutsideDhaka ?? 150) * 100;
  const deliveryFeePoisha =
    items.length > 0 ? (deliveryZone === "outside_dhaka" ? feeOutside : feeInside) : 0;
  const grandTotalPoisha = subTotalPoisha + deliveryFeePoisha;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage("আপনার পূর্ণ নাম এবং মোবাইল নম্বর প্রদান করুন");
      return;
    }

    if (!address.trim() || !district.trim()) {
      setErrorMessage("সম্পূর্ণ ডেলিভারি ঠিকানা ও জেলা নির্বাচন করুন");
      return;
    }

    if (paymentMethod !== "cod" && !transactionId.trim()) {
      setErrorMessage("ম্যানুয়াল পেমেন্টের ক্ষেত্রে ট্রানজেকশন আইডি (TrxID) প্রদান করুন");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        shippingAddress: {
          address: address.trim(),
          district: district.trim(),
          thanaOrArea: thanaOrArea.trim() || undefined,
        },
        deliveryZone,
        items: items.map((i) => ({
          variantId: i.variantId,
          productName: i.productName,
          quantity: i.quantity,
          image: i.image,
        })),
        paymentMethod,
        manualPaymentDetails:
          paymentMethod !== "cod"
            ? {
                senderNumber: senderNumber.trim() || undefined,
                transactionId: transactionId.trim(),
                bankName: bankName.trim() || undefined,
              }
            : undefined,
        customerNotes: customerNotes.trim() || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে");
      }

      clearCart();
      setConfirmedOrder(data.order);
    } catch (err: any) {
      setErrorMessage(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-brand-teal" />
        <p className="text-sm font-medium">চেকআউট লোড হচ্ছে...</p>
      </div>
    );
  }

  // Confirmed Order Screen
  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
            অর্ডার সফলভাবে গৃহীত হয়েছে
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
            ধন্যবাদ {confirmedOrder.customerName}! আপনার অর্ডারটি কনফার্ম হয়েছে।
          </h1>
          <p className="text-sm text-slate-600">
            অর্ডার ট্র্যাকিং নম্বর:{" "}
            <strong className="text-brand-navy font-mono text-base font-bold bg-slate-100 px-2 py-0.5 rounded">
              {confirmedOrder.orderNumber}
            </strong>
          </p>
        </div>

        {confirmedOrder.paymentMethod !== "cod" ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800 space-y-1">
            <p className="font-bold">পেমেন্ট ভেরিফিকেশন তথ্য:</p>
            <p>
              আপনার প্রদত্ত ট্রানজেকশন আইডি (<span className="font-mono">{confirmedOrder.manualPaymentDetails?.transactionId}</span>) আমাদের টিম যাচাই করবে। ভেরিফিকেশন সম্পন্ন হলে আপনার মোবাইল নম্বরে নিশ্চিতকরণ মেসেজ যাবে।
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            ক্যাশ অন ডেলিভারি: পণ্য হাতে পেয়ে সম্পূর্ণ মূল্য পরিশোধ করবেন। ডেলিভারির পূর্বে আমাদের সাপোর্ট টিম থেকে আপনাকে ফোন করা হবে।
          </p>
        )}

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-left max-w-md mx-auto space-y-2">
          <div className="flex justify-between font-bold text-slate-800">
            <span>মোট প্রদেয়:</span>
            <span className="text-emerald-700">{formatBDT(confirmedOrder.grandTotalPoisha)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>ডেলিভারি ঠিকানা:</span>
            <span>
              {confirmedOrder.shippingAddress.address}, {confirmedOrder.shippingAddress.district}
            </span>
          </div>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-brand-navy text-white text-xs font-semibold hover:bg-brand-teal transition-colors"
          >
            হোমে ফিরে যান
          </Link>
          <Link
            href="/shop"
            className="px-5 py-2.5 rounded-xl bg-brand-gold text-brand-navy text-xs font-bold hover:bg-brand-goldLight transition-colors"
          >
            আরও পণ্য দেখুন
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-base font-bold text-slate-800">আপনার কার্টে কোনো পণ্য নেই</p>
        <Link
          href="/shop"
          className="inline-block px-5 py-2 bg-brand-navy text-white rounded-lg text-xs font-bold"
        >
          ক্যাটালগ ব্রাউজ করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <Link
          href="/cart"
          className="text-xs text-brand-muted hover:text-brand-teal inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>কার্টে ফিরে যান</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">
          চেকআউট ও ডেলিভারি তথ্য
        </h1>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Customer & Address Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Customer Information */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-navy flex items-center gap-2 border-b border-slate-100 pb-3">
              <Phone className="w-4 h-4 text-brand-teal" />
              <span>১. গ্রাহকের নাম ও মোবাইল নম্বর</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  আপনার পূর্ণ নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোহাম্মদ রফিক"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  সচল মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>
            <div className="text-xs">
              <label className="font-semibold text-slate-700 block mb-1">ইমেইল (ঐচ্ছিক)</label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
          </div>

          {/* 2. Shipping Address */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-navy flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-brand-teal" />
              <span>২. ডেলিভারি ঠিকানা</span>
            </h3>

            {/* Delivery Zone */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700 block">ডেলিভারি অঞ্চল:</label>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryZone("inside_dhaka")}
                  className={`p-3 rounded-xl border text-left transition ${
                    deliveryZone === "inside_dhaka"
                      ? "bg-teal-50 text-brand-teal border-brand-teal font-bold shadow-sm"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  <div className="font-bold text-xs">ঢাকার ভেতরে</div>
                  <div className="text-[11px] text-slate-500">চার্জ: ৳ ৮০ (১-২ দিন)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryZone("outside_dhaka")}
                  className={`p-3 rounded-xl border text-left transition ${
                    deliveryZone === "outside_dhaka"
                      ? "bg-teal-50 text-brand-teal border-brand-teal font-bold shadow-sm"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  <div className="font-bold text-xs">ঢাকার বাইরে (সারাদেশ)</div>
                  <div className="text-[11px] text-slate-500">চার্জ: ৳ ১৫০ (২-৪ দিন)</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  জেলা <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ঢাকা / চট্টগ্রাম / সিলেট"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">থানা / উপজেলা</label>
                <input
                  type="text"
                  placeholder="যেমন: ধানমন্ডি / উত্তরা"
                  value={thanaOrArea}
                  onChange={(e) => setThanaOrArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="font-semibold text-slate-700 block mb-1">
                বাসা/রোড নম্বর ও বিস্তারিত ঠিকানা <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="যেমন: বাড়ি ১২, রোড ৫, ব্লক সি..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-navy flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-brand-teal" />
              <span>৩. পেমেন্ট পদ্ধতি নির্বাচন করুন</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  paymentMethod === "cod"
                    ? "bg-teal-50 border-brand-teal text-brand-teal font-bold shadow-sm"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                <Truck className="w-5 h-5 flex-shrink-0 text-brand-teal" />
                <div>
                  <div className="font-bold">ক্যাশ অন ডেলিভারি (COD)</div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    পণ্য হাতে পেয়ে টাকা পরিশোধ করুন
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("bkash_manual")}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  paymentMethod === "bkash_manual"
                    ? "bg-rose-50 border-rose-500 text-rose-700 font-bold shadow-sm"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                <Smartphone className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <div>
                  <div className="font-bold">বিকাশ ম্যানুয়াল পেমেন্ট</div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    বিকাশ করে TrxID দিন
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("nagad_manual")}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  paymentMethod === "nagad_manual"
                    ? "bg-amber-50 border-amber-500 text-amber-800 font-bold shadow-sm"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                <Smartphone className="w-5 h-5 flex-shrink-0 text-amber-600" />
                <div>
                  <div className="font-bold">নগদ ম্যানুয়াল পেমেন্ট</div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    নগদ করে TrxID দিন
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("bank_manual")}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  paymentMethod === "bank_manual"
                    ? "bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-sm"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                <Building2 className="w-5 h-5 flex-shrink-0 text-blue-600" />
                <div>
                  <div className="font-bold">ব্যাংক ডিপোজিট / ট্রান্সফার</div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    স্লিপ রেফারেন্স দিন
                  </div>
                </div>
              </button>
            </div>

            {/* Manual Payment Details Form */}
            {paymentMethod !== "cod" && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 space-y-1">
                  <p className="font-bold text-brand-navy">পেমেন্ট পাঠানোর নির্দেশনা:</p>
                  <p>
                    {paymentMethod === "bkash_manual" &&
                      `আমাদের বিকাশ মার্চেন্ট/পার্সোনাল নম্বর: ${settings.bkashNumber || settings.mobile} (${settings.name})`}
                    {paymentMethod === "nagad_manual" &&
                      `আমাদের নগদ মার্চেন্ট/পার্সোনাল নম্বর: ${settings.nagadNumber || settings.mobile} (${settings.name})`}
                    {paymentMethod === "bank_manual" &&
                      `ব্যাংক: ব্র্যাক ব্যাংক, হিসাব নাম: ${settings.name}, হিসাব নম্বর: 15012048899001, শাখা: কুড়িল / যমুনা ফিউচার পার্ক`}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      যে নম্বর/অ্যাকাউন্ট থেকে পাঠিয়েছেন
                    </label>
                    <input
                      type="text"
                      placeholder="01XXXXXXXXX"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: 8N7K6M2X"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-navy border-b border-slate-100 pb-3">
              অর্ডারের আইটেম ({toBengaliNumber(items.length)})
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.variantId} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 truncate">
                    <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                    <p className="text-[11px] text-slate-400">
                      {item.variantName} × {toBengaliNumber(item.quantity)}
                    </p>
                  </div>
                  <div className="font-extrabold text-slate-900">
                    {formatBDT(item.pricePoisha * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>পণ্যের সাবটোটাল:</span>
                <span className="font-semibold text-slate-800">{formatBDT(subTotalPoisha)}</span>
              </div>
              <div className="flex justify-between">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-semibold text-slate-800">{formatBDT(deliveryFeePoisha)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-brand-navy border-t border-slate-200 pt-3">
                <span>সর্বমোট প্রদেয়:</span>
                <span className="text-emerald-700">{formatBDT(grandTotalPoisha)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-4 rounded-xl bg-brand-navy hover:bg-brand-teal text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg hover:shadow-brand-teal/20 mt-4 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>অর্ডার প্রসেস হচ্ছে...</span>
                </>
              ) : (
                <span>অর্ডার কনফার্ম করুন ({formatBDT(grandTotalPoisha)})</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
