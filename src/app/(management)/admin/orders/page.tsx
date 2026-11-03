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
  AlertCircle,
  Eye,
  Check,
  Smartphone,
  Building2,
  FileText,
  DollarSign,
  X,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { IOnlineOrder, OnlineOrderStatus } from "@/types/orders";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<IOnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [summary, setSummary] = useState<any>({});

  // Status Change Modal
  const [selectedOrder, setSelectedOrder] = useState<IOnlineOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OnlineOrderStatus>("confirmed");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/orders${selectedStatus !== "all" ? `?status=${selectedStatus}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error("Failed to load admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedStatus]);

  const handleOpenStatusModal = (ord: IOnlineOrder) => {
    setSelectedOrder(ord);
    setNewStatus(ord.orderStatus);
    setCourierName(ord.courierName || "রেডএক্স / সুন্দরবন");
    setTrackingNumber(ord.trackingNumber || "");
    setInternalNotes(ord.internalNotes || "");
    setUpdateError("");
    setUpdateSuccess("");
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      setUpdateError("");
      const res = await fetch(`/api/admin/orders/${selectedOrder._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: newStatus,
          courierName: newStatus === "shipped" ? courierName : undefined,
          trackingNumber: newStatus === "shipped" ? trackingNumber : undefined,
          internalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে");
      }

      setUpdateSuccess(data.message || "অর্ডার স্ট্যাটাস সফলভাবে আপডেট হয়েছে");
      loadOrders();
      setTimeout(() => {
        setSelectedOrder(null);
        setUpdateSuccess("");
      }, 1200);
    } catch (err: any) {
      setUpdateError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/verify-payment`, {
        method: "PUT",
      });
      const data = await res.json();
      if (res.ok) {
        loadOrders();
      } else {
        alert(data.error || "পেমেন্ট ভেরিফাই করতে সমস্যা হয়েছে");
      }
    } catch (err) {
      console.error("Payment verify error:", err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(s) ||
      o.customerName.toLowerCase().includes(s) ||
      o.customerPhone.includes(s) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600" />
            অনলাইন অর্ডার ব্যবস্থাপনা
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ই-কমার্স স্টোরের অর্ডার প্রসেসিং, কুরিয়ার ট্র্যাকিং, ম্যানুয়াল বিকাশ/নগদ পেমেন্ট ভেরিফিকেশন ও ডেলিভারি
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          রিফ্রেশ
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">মোট অনলাইন অর্ডার</p>
            <p className="text-2xl font-bold text-slate-800">
              {toBengaliNumber(summary.totalOrders || orders.length)} টি
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">অপেক্ষমাণ নতুন অর্ডার</p>
            <p className="text-2xl font-bold text-amber-700">
              {toBengaliNumber(
                summary.pendingOrders || orders.filter((o) => o.orderStatus === "pending").length
              )}{" "}
              টি
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">পেমেন্ট ভেরিফিকেশন বাকি</p>
            <p className="text-2xl font-bold text-rose-600">
              {toBengaliNumber(
                summary.pendingPayments ||
                  orders.filter((o) => o.paymentStatus === "pending_verification").length
              )}{" "}
              টি
            </p>
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
              placeholder="অর্ডার নম্বর, নাম বা ফোন দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="pending">নতুন / অপেক্ষমাণ</option>
            <option value="confirmed">কনফার্মড</option>
            <option value="processing">প্যাকিং / প্রসেসিং</option>
            <option value="shipped">কুরিয়ারে হস্তান্তর</option>
            <option value="delivered">ডেলিভার্ড</option>
            <option value="cancelled">বাতিল</option>
            <option value="returned">রিটার্ন</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4">অর্ডার কোড ও তারিখ</th>
                <th className="py-3.5 px-4">গ্রাহক পরিচিতি</th>
                <th className="py-3.5 px-4">আইটেম ও এলাকা</th>
                <th className="py-3.5 px-4 text-right">মোট প্রদেয়</th>
                <th className="py-3.5 px-4 text-center">পেমেন্ট ভেরিফিকেশন</th>
                <th className="py-3.5 px-4 text-center">ডেলিভারি স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    অর্ডার লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    কোনো অর্ডার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const totalQty = ord.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                  return (
                    <tr key={ord._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono">{ord.orderNumber}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString("bn-BD")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{ord.customerName}</div>
                        <div className="text-xs text-slate-500">{ord.customerPhone}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[12rem]">
                          {ord.shippingAddress.address}, {ord.shippingAddress.district}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700 text-xs">
                          {toBengaliNumber(ord.items?.length || 0)} টি আইটেম ({toBengaliNumber(totalQty)} পিস)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ord.deliveryZone === "inside_dhaka" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">{formatBDT(ord.grandTotalPoisha)}</div>
                        <div className="text-[10px] text-slate-400">
                          ডেলিভারি: {formatBDT(ord.deliveryFeePoisha)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {ord.paymentStatus === "paid" ? "পরিশোধিত" : "যাচাই বাকি"}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {ord.paymentMethod === "cod"
                              ? "ক্যাশ অন ডেলিভারি"
                              : ord.paymentMethod === "bkash_manual"
                              ? "বিকাশ"
                              : ord.paymentMethod === "nagad_manual"
                              ? "নগদ"
                              : "ব্যাংক"}
                          </span>
                          {ord.paymentStatus !== "paid" &&
                            ord.paymentMethod !== "cod" &&
                            ord.manualPaymentDetails?.transactionId && (
                              <button
                                onClick={() => handleVerifyPayment(ord._id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold block mx-auto transition"
                                title={`TrxID: ${ord.manualPaymentDetails.transactionId}`}
                              >
                                পেমেন্ট ভেরিফাই
                              </button>
                            )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            ord.orderStatus === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.orderStatus === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : ord.orderStatus === "confirmed" || ord.orderStatus === "processing"
                              ? "bg-amber-100 text-amber-800"
                              : ord.orderStatus === "cancelled"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {ord.orderStatus === "delivered"
                            ? "ডেলিভার্ড"
                            : ord.orderStatus === "shipped"
                            ? "কুরিয়ারে"
                            : ord.orderStatus === "confirmed"
                            ? "কনফার্মড"
                            : ord.orderStatus === "processing"
                            ? "প্রসেসিং"
                            : ord.orderStatus === "cancelled"
                            ? "বাতিল"
                            : "অপেক্ষমাণ"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenStatusModal(ord)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold transition"
                        >
                          স্ট্যাটাস পরিবর্তন
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Status Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                অর্ডার স্ট্যাটাস আপডেট (#{selectedOrder.orderNumber})
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              {updateError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                  {updateError}
                </div>
              )}

              {updateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {updateSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নতুন স্ট্যাটাস নির্বাচন করুন
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none"
                >
                  <option value="pending">অপেক্ষমাণ (Pending)</option>
                  <option value="confirmed">কনফার্মড (Confirmed)</option>
                  <option value="processing">প্রসেসিং (Processing)</option>
                  <option value="shipped">কুরিয়ারে হস্তান্তর (Shipped)</option>
                  <option value="delivered">ডেলিভার্ড ও সম্পন্ন (Delivered - Stock Deduct)</option>
                  <option value="cancelled">বাতিল (Cancelled - Stock Release)</option>
                  <option value="returned">রিটার্ন (Returned - Stock Restored)</option>
                </select>
              </div>

              {newStatus === "shipped" && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">কুরিয়ারের নাম</label>
                    <input
                      type="text"
                      placeholder="যেমন: রেডএক্স / সুন্দরবন কুরিয়ার"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ট্র্যাকিং নম্বর</label>
                    <input
                      type="text"
                      placeholder="যেমন: REDX-998822"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  অভ্যন্তরীণ নোট (Internal Notes)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: গ্রাহকের সাথে ফোনে কথা বলে কনফার্ম করা হয়েছে"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
                >
                  {updating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
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

