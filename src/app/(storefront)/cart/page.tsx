"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { getCartItems, updateCartItemQuantity, removeFromCart, CartItem } from "@/lib/cart";
import { useShopSettings } from "@/context/ShopSettingsContext";

export default function CartPage() {
  const { settings } = useShopSettings();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [deliveryZone, setDeliveryZone] = useState<"inside_dhaka" | "outside_dhaka">("inside_dhaka");

  const loadCart = () => {
    setItems(getCartItems());
    setIsLoaded(true);
  };

  useEffect(() => {
    loadCart();
    window.addEventListener("cart_updated", loadCart);
    return () => window.removeEventListener("cart_updated", loadCart);
  }, []);

  const handleQtyChange = (variantId: string, currentQty: number, delta: number) => {
    updateCartItemQuantity(variantId, currentQty + delta);
    loadCart();
  };

  const handleRemove = (variantId: string) => {
    removeFromCart(variantId);
    loadCart();
  };

  const subTotalPoisha = items.reduce((sum, item) => sum + item.pricePoisha * item.quantity, 0);
  const feeInside = (settings.deliveryFeeInsideDhaka ?? 80) * 100;
  const feeOutside = (settings.deliveryFeeOutsideDhaka ?? 150) * 100;
  const deliveryFeePoisha =
    items.length > 0 ? (deliveryZone === "outside_dhaka" ? feeOutside : feeInside) : 0;
  const grandTotalPoisha = subTotalPoisha + deliveryFeePoisha;

  if (!isLoaded) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-brand-teal" />
        <p className="text-sm font-medium">কার্ট লোড হচ্ছে...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-brand-navy">আপনার শপিং কার্ট খালি</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          আপনি এখনও কোনো লাগেজ বা ব্যাগ কার্টে যোগ করেননি। আমাদের নতুন কালেকশন ঘুরে দেখুন!
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-navy text-white text-xs sm:text-sm font-bold hover:bg-brand-teal transition shadow-md"
        >
          <ShoppingBag className="w-4 h-4 text-brand-gold" />
          <span>পণ্য ক্যাটালগ দেখুন</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">
            শপিং কার্ট
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            আপনার কার্টে মোট {toBengaliNumber(items.length)} টি আইটেম রয়েছে
          </p>
        </div>
        <Link
          href="/shop"
          className="text-xs sm:text-sm font-semibold text-brand-teal hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>আরও কেনাকাটা করুন</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {items.map((item) => (
              <div key={item.variantId} className="p-3.5 sm:p-5 flex flex-col xs:flex-row gap-3 sm:gap-4 xs:items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                    <Image
                      unoptimized
                      src={
                        item.image ||
                        "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-brand-navy truncate">
                      {item.productName}
                    </h3>
                    <p className="text-xs text-brand-teal font-medium">{item.variantName}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">বারকোড: {item.barcode}</p>
                    <div className="text-xs sm:text-sm font-extrabold text-brand-navy pt-0.5 sm:hidden">
                      {formatBDT(item.pricePoisha * item.quantity)}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between xs:justify-end gap-3 pt-2 xs:pt-0 border-t xs:border-t-0 border-slate-100">
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
                    <button
                      onClick={() => handleQtyChange(item.variantId, item.quantity, -1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 font-bold text-slate-800 min-w-[2rem] text-center">
                      {toBengaliNumber(item.quantity)}
                    </span>
                    <button
                      onClick={() => handleQtyChange(item.variantId, item.quantity, 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item.variantId)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                    title="আইটেম মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Line Total */}
                  <div className="hidden sm:block text-right min-w-[5rem]">
                    <p className="text-base font-extrabold text-brand-navy">
                      {formatBDT(item.pricePoisha * item.quantity)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatBDT(item.pricePoisha)} / পিস
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-teal flex-shrink-0" />
            <span>
              আপনার অর্ডারের মালামাল সুরক্ষিতভাবে বক্স প্যাকিং করে হোম ডেলিভারি দেওয়া হবে।
            </span>
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-navy border-b border-slate-100 pb-3">
              অর্ডার সামারি
            </h3>

            {/* Delivery Zone Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700 block">ডেলিভারি এলাকা:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryZone("inside_dhaka")}
                  className={`py-2 px-2.5 rounded-lg border text-center transition ${
                    deliveryZone === "inside_dhaka"
                      ? "bg-teal-50 text-brand-teal border-brand-teal font-bold shadow-sm"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  ঢাকার ভেতরে (৳ ৮০)
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryZone("outside_dhaka")}
                  className={`py-2 px-2.5 rounded-lg border text-center transition ${
                    deliveryZone === "outside_dhaka"
                      ? "bg-teal-50 text-brand-teal border-brand-teal font-bold shadow-sm"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  ঢাকার বাইরে (৳ ১৫০)
                </button>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>পণ্যের মোট মূল্য:</span>
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

            <Link
              href="/checkout"
              className="w-full py-3.5 px-4 rounded-xl bg-brand-navy hover:bg-brand-teal text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg hover:shadow-brand-teal/20 mt-4"
            >
              <span>চেকআউটে এগিয়ে যান</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
