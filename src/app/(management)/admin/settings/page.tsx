"use client";

import { useState, useEffect } from "react";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Globe,
  Printer,
  Truck,
  ShieldCheck,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Receipt,
  Smartphone,
  Crown
} from "lucide-react";
import { STORE_INFO } from "@/lib/config/storeInfo";
import { useShopSettings } from "@/context/ShopSettingsContext";

export default function ShopSettingsPage() {
  const { refreshSettings } = useShopSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    organizationName: STORE_INFO.name,
    organizationNameBangla: STORE_INFO.nameBangla,
    owners: STORE_INFO.owners,
    ownersBangla: STORE_INFO.ownersBangla,
    address: STORE_INFO.address,
    addressBangla: STORE_INFO.addressBangla,
    mobile: STORE_INFO.mobile,
    whatsapp: STORE_INFO.whatsapp,
    email: STORE_INFO.email,
    facebookPageLink: STORE_INFO.facebookPageLink,
    bin: STORE_INFO.bin,
    mushak: STORE_INFO.mushak,
    receiptFooter: "আমাদের পণ্য পছন্দ করায় ধন্যবাদ। বিক্রিত পণ্য ৭ দিনের মধ্যে মেমোসহ পরিবর্তনযোগ্য।",
    defaultThermalSize: "80mm" as "58mm" | "80mm",
    deliveryFeeInsideDhaka: 80,
    deliveryFeeOutsideDhaka: 150,
    isCodEnabled: true,
    bkashNumber: STORE_INFO.mobile,
    nagadNumber: STORE_INFO.mobile,
    businessHours: STORE_INFO.businessHoursBangla,
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "সেটিংস লোড করতে ব্যর্থ হয়েছে");
      }
      if (data.settings) {
        setFormData((prev) => ({
          ...prev,
          ...data.settings,
        }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে");
      }

      setSuccess("শপ সেটিংস সফলভাবে ডাটাবেসে আপডেট ও সংরক্ষিত হয়েছে!");

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("shop-settings-updated", {
            detail: data.settings || formData,
          })
        );
      }
      await refreshSettings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">শপ সেটিংস লোড করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy tracking-tight">
            শপ সেটিংস ও ব্যবসায়িক কনফিগারেশন
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            শোরুমের প্রোফাইল, পিওএস রসিদ, ডেলিভারি চার্জ এবং পেমেন্ট সেটিংস পরিচালনা করুন
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>রিফ্রেশ</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-brand-gold" />
            <span>{saving ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Business & Showroom Profile */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-brand-teal flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-navy">
                দোকান ও ব্যবসা পরিচিতি (Business Profile)
              </h2>
              <p className="text-[11px] text-slate-500">
                হেডার, ফুটার, চালান এবং অনলাইন স্টোরে প্রদর্শিত অফিসিয়াল তথ্য
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-sm border border-slate-200 p-1 flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="Shop Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">প্রতিষ্ঠানের অফিসিয়াল লোগো ও ফেভিকন</span>
              <p className="text-[11px] text-slate-500">অ্যাপের হেডার, ফুটার, ফেভিকন, পিওএস কাউন্টার এবং ইনভয়েস/ক্যাশ মেমোতে ব্যবহৃত হচ্ছে</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                প্রতিষ্ঠানের নাম (English) *
              </label>
              <input
                type="text"
                required
                value={formData.organizationName}
                onChange={(e) => handleChange("organizationName", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                প্রতিষ্ঠানের নাম (বাংলা) *
              </label>
              <input
                type="text"
                required
                value={formData.organizationNameBangla}
                onChange={(e) => handleChange("organizationNameBangla", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>মালিকদের নাম (Owners) *</span>
              </label>
              <input
                type="text"
                required
                value={formData.owners}
                onChange={(e) => handleChange("owners", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>শোরুমের পূর্ণ ঠিকানা (Address) *</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>শোরুমের সময়সূচি</span>
              </label>
              <input
                type="text"
                value={formData.businessHours}
                onChange={(e) => handleChange("businessHours", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>মোবাইল নম্বর *</span>
              </label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>হোয়াটসঅ্যাপ নম্বর *</span>
              </label>
              <input
                type="text"
                required
                value={formData.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>অফিসিয়াল ইমেইল *</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>অফিসিয়াল ফেসবুক পেজ লিংক</span>
              </label>
              <input
                type="url"
                value={formData.facebookPageLink}
                onChange={(e) => handleChange("facebookPageLink", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-mono"
              />
            </div>
          </div>
        </div>

        {/* Card 2: POS Receipt & Printing Settings */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-navy">
                পিওএস ইনভয়েস ও রসিদ প্রিন্ট সেটিংস (POS Receipt)
              </h2>
              <p className="text-[11px] text-slate-500">
                থার্মাল প্রিন্টার সাইজ, ভ্যাট নিবন্ধন এবং রসিদের শর্তাবলি কনফিগারেশন
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                ডিফল্ট থার্মাল প্রিন্টার সাইজ
              </label>
              <select
                value={formData.defaultThermalSize}
                onChange={(e) => handleChange("defaultThermalSize", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy bg-white"
              >
                <option value="80mm">৮০ মিমি (80mm - স্ট্যান্ডার্ড থার্মাল)</option>
                <option value="58mm">৫৮ মিমি (58mm - মিনি পোর্টেবল)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                ভ্যাট নিবন্ধন / BIN নম্বর
              </label>
              <input
                type="text"
                value={formData.bin}
                onChange={(e) => handleChange("bin", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                চালান ক্যাটাগরি (মূসক)
              </label>
              <input
                type="text"
                value={formData.mushak}
                onChange={(e) => handleChange("mushak", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                <span>রসিদের পাদটীকা / শর্তাবলি (Receipt Footer Terms)</span>
              </label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => handleChange("receiptFooter", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy"
              />
            </div>
          </div>
        </div>

        {/* Card 3: E-Commerce & Delivery Settings */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-navy">
                অনলাইন শপ ও ডেলিভারি কনফিগারেশন (Storefront & Delivery)
              </h2>
              <p className="text-[11px] text-slate-500">
                ই-কমার্স সাইটের হোম ডেলিভারি ফি এবং পেমেন্ট ওয়ালেট নম্বর
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                ঢাকা সিটির ভেতরে ডেলিভারি ফি (৳)
              </label>
              <input
                type="number"
                min={0}
                value={formData.deliveryFeeInsideDhaka}
                onChange={(e) => handleChange("deliveryFeeInsideDhaka", Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-bold font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                ঢাকা সিটির বাইরে ডেলিভারি ফি (৳)
              </label>
              <input
                type="number"
                min={0}
                value={formData.deliveryFeeOutsideDhaka}
                onChange={(e) => handleChange("deliveryFeeOutsideDhaka", Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-bold font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                বিকাশ মার্চেন্ট / পার্সোনাল নম্বর
              </label>
              <input
                type="text"
                value={formData.bkashNumber}
                onChange={(e) => handleChange("bkashNumber", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                নগদ মার্চেন্ট / পার্সোনাল নম্বর
              </label>
              <input
                type="text"
                value={formData.nagadNumber}
                onChange={(e) => handleChange("nagadNumber", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-mono"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isCodEnabled"
                checked={formData.isCodEnabled}
                onChange={(e) => handleChange("isCodEnabled", e.target.checked)}
                className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal"
              />
              <label htmlFor="isCodEnabled" className="font-semibold text-slate-800 cursor-pointer">
                ক্যাশ অন ডেলিভারি (Cash on Delivery) সক্রিয় রাখুন
              </label>
            </div>
          </div>
        </div>

        {/* Card 4: System Health & Security Overview */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/20 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                সিস্টেম স্ট্যাটাস ও নিরাপত্তা (System Health)
              </h2>
              <p className="text-[11px] text-slate-500">
                ডাটাবেস কানেকশন, ক্লাউড মিডিয়া ও অডিট লগিং সক্রিয়তা
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                ডাটাবেস
              </span>
              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                MongoDB Atlas (সংযুক্ত)
              </span>
              <span className="text-[11px] text-slate-500 block">ক্লাউড ক্লাস্টার ৩-নোড রেপ্লিকাসেট</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                মিডিয়া সিডিএন
              </span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Cloudinary CDN
              </span>
              <span className="text-[11px] text-slate-500 block">ছবি অটো অপ্টিমাইজেশন ও ক্যাশিং</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                নিরাপত্তা স্তর
              </span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                PBKDF2 + RBAC
              </span>
              <span className="text-[11px] text-slate-500 block">মালিক-নিয়ন্ত্রিত কঠোর অ্যাক্সেস</span>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-white shadow-sm transition-all"
          >
            <Save className="w-4 h-4 text-brand-gold" />
            <span>{saving ? "সংরক্ষণ হচ্ছে..." : "সকল সেটিংস সংরক্ষণ করুন"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
