"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  RefreshCw,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Phone,
  FileText,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";

export default function CustomerOrdersPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchOrders = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);
      const res = await fetch(`/api/orders?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ডেলিভার্ড
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Truck className="w-3.5 h-3.5" />
            কুরিয়ারে হস্তান্তর
          </span>
        );
      case "confirmed":
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            প্রসেসিং চলছে
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            বাতিল
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            <Clock className="w-3.5 h-3.5" />
            অপেক্ষমাণ
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight flex items-center gap-2">
          <Package className="w-7 h-7 text-brand-teal" />
          আমার অর্ডার ও ট্র্যাকিং
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          আপনার মোবাইল নম্বর দিয়ে পূর্বে দেওয়া অনলাইন অর্ডারগুলোর বর্তমান অবস্থা ট্র্যাক করুন
        </p>
      </div>

      {/* Phone Search Card */}
      <form
        onSubmit={handleSearchOrders}
        className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center"
      >
        <div className="relative flex-1 w-full">
          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            required
            placeholder="আপনার মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-navy text-white text-xs sm:text-sm font-bold hover:bg-brand-teal transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>অর্ডার খুঁজুন</span>
        </button>
      </form>

      {/* Orders List */}
      {hasSearched && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                এই মোবাইল নম্বরে কোনো অর্ডার পাওয়া যায়নি
              </p>
              <p className="text-xs text-slate-400">
                অনুগ্রহ করে অর্ডার দেওয়ার সময় ব্যবহৃত সঠিক মোবাইল নম্বরটি লিখুন।
              </p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord._id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-navy text-sm sm:text-base">
                        #{ord.orderNumber}
                      </span>
                      {getStatusBadge(ord.orderStatus)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      অর্ডার তারিখ: {new Date(ord.createdAt).toLocaleDateString("bn-BD")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500">মোট মূল্য:</p>
                    <p className="text-base font-extrabold text-emerald-700">
                      {formatBDT(ord.grandTotalPoisha)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {ord.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{item.productName}</span>
                        <span className="text-slate-400 ml-1">({item.variantName})</span>
                        <span className="text-brand-teal ml-1 font-semibold">
                          × {toBengaliNumber(item.quantity)}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-700">
                        {formatBDT(item.totalAmountPoisha)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tracking & Courier Info */}
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="flex flex-col sm:flex-row justify-between gap-1">
                    <span className="text-slate-600">
                      <strong>ডেলিভারি ঠিকানা:</strong> {ord.shippingAddress.address},{" "}
                      {ord.shippingAddress.district}
                    </span>
                    <span className="text-slate-600">
                      <strong>পেমেন্ট:</strong>{" "}
                      {ord.paymentMethod === "cod"
                        ? "ক্যাশ অন ডেলিভারি"
                        : ord.paymentMethod === "bkash_manual"
                        ? "বিকাশ"
                        : ord.paymentMethod === "nagad_manual"
                        ? "নগদ"
                        : "ব্যাংক"}{" "}
                      ({ord.paymentStatus === "paid" ? "পরিশোধিত" : "যাচাই চলমান"})
                    </span>
                  </div>
                  {ord.courierName && (
                    <div className="text-brand-teal font-medium">
                      কুরিয়ার: {ord.courierName}{" "}
                      {ord.trackingNumber && `(ট্র্যাকিং: ${ord.trackingNumber})`}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

