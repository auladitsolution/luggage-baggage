"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Package,
  ShoppingBag,
  Store,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  PhoneCall,
  MessageCircle,
  MapPin,
  Clock,
  ArrowRight,
  LogIn,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { STORE_INFO } from "@/lib/config/storeInfo";
import { useAuth } from "@/context/AuthContext";

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const { user, loading, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm("আপনি কি নিশ্চিতভাবে অ্যাকাউন্ট থেকে লগআউট করতে চান?")) return;
    try {
      setLoggingOut(true);
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.isOwner) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          👑 স্টোর ওনার (মালিক)
        </span>
      );
    }
    switch (user.roleSlug) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            🛡️ সিস্টেম অ্যাডমিন
          </span>
        );
      case "cashier":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            💼 পিওএস ক্যাশিয়ার
          </span>
        );
      case "inventory":
      case "inventory_manager" as any:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            📦 ইনভেন্টরি ম্যানেজার
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
            👤 সম্মানিত গ্রাহক (Customer)
          </span>
        );
    }
  };

  const hasStaffAccess =
    user &&
    user.authMethod !== "google" &&
    (user.isOwner ||
      ["admin", "manager", "cashier", "inventory", "accountant", "online_manager"].includes(
        user.roleSlug
      ));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-4 border-brand-teal border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">অ্যাকাউন্ট তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-slate-500 flex items-center gap-2">
          <Link href="/" className="hover:text-brand-teal transition-colors">
            হোম
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">আমার অ্যাকাউন্ট</span>
        </nav>

        {/* Security / Unauthorized Error Alert */}
        {errorParam === "google_management_blocked" && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-amber-900 mb-0.5">
                পিওএস ও ম্যানেজমেন্টে গুগল অ্যাকাউন্ট দিয়ে প্রবেশাধিকার সংরক্ষিত
              </strong>
              <span className="text-slate-700 leading-relaxed">
                গুগল সাইন-ইন শুধুমাত্র সম্মানিত গ্রাহকদের অনলাইন শপ ও অর্ডার ট্র্যাকিংয়ের জন্য নির্ধারিত।
                দোকানের পিওএস কাউন্টার অথবা ম্যানেজমেন্ট ড্যাশবোর্ডে প্রবেশ করতে দোকান মালিকের অনুমোদিত
                ইউজার আইডি ও পাসওয়ার্ড দিয়ে লগইন করুন।
              </span>
            </div>
          </div>
        )}

        {user ? (
          /* ==========================================================
             LOGGED-IN CUSTOMER / USER VIEW
             ========================================================== */
          <>
            {/* User Profile Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -z-0 pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0">
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.displayName || "User"}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">
                        {user.displayName || "সম্মানিত ব্যবহারকারী"}
                      </h1>
                      {getRoleBadge()}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500">{user.email || "ইমেইল সংরক্ষিত নেই"}</p>
                    <p className="text-[11px] text-brand-teal mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      নিরাপদ সার্ভার-সাইড সেশন সক্রিয়
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{loggingOut ? "লগআউট হচ্ছে..." : "লগআউট"}</span>
                </button>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* My Orders Card */}
              <Link
                href="/account/orders"
                className="group bg-white p-6 rounded-2xl border border-slate-200/90 hover:border-brand-teal hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-brand-navy group-hover:text-brand-teal transition-colors mb-1">
                    আমার অনলাইন অর্ডারসমূহ
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    আপনার সম্পন্নকৃত অর্ডার, কুরিয়ার ডেলিভারি স্ট্যাটাস ও ট্র্যাকিং নম্বর পর্যবেক্ষণ করুন।
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-teal">
                  <span>অর্ডার ট্র্যাকিং দেখুন</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Shopping Cart Card */}
              <Link
                href="/cart"
                className="group bg-white p-6 rounded-2xl border border-slate-200/90 hover:border-brand-teal hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-brand-gold flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-brand-navy group-hover:text-brand-teal transition-colors mb-1">
                    শপিং কার্ট ও চেকআউট
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    কার্টে সংরক্ষিত প্রিমিয়াম লাগেজ ও ট্রলি ব্যাগগুলো দেখুন এবং সহজে অর্ডার সম্পন্ন করুন।
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-teal">
                  <span>কার্টে যান</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>

            {/* Staff / Administrative Quick Links (Displayed only if user has elevated privileges) */}
            {hasStaffAccess && (
              <div className="bg-gradient-to-br from-slate-900 to-brand-navy rounded-3xl p-6 text-white shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-gold" />
                  <h3 className="text-base font-bold tracking-tight">স্টাফ ও ম্যানেজমেন্ট অ্যাক্সেস</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  আপনার ইউজার রোলে অভ্যন্তরীণ ব্যবস্থাপনা পারমিশন বিদ্যমান রয়েছে। নিচের শর্টকাট দিয়ে সরাসরি কাউন্টারে বা
                  ম্যানেজমেন্টে প্রবেশ করতে পারেন।
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Link
                    href="/pos"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Store className="w-5 h-5 text-brand-gold" />
                      <div>
                        <div className="text-sm font-semibold">পিওএস কাউন্টার</div>
                        <div className="text-[11px] text-slate-300">রিটেইল বারকোড বিলিং ও বিক্রয়</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-brand-gold" />
                  </Link>

                  <Link
                    href="/admin"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="w-5 h-5 text-brand-teal" />
                      <div>
                        <div className="text-sm font-semibold">ম্যানেজমেন্ট ড্যাশবোর্ড</div>
                        <div className="text-[11px] text-slate-300">স্টক, হিসাব, পেরোল ও রিপোর্টস</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-brand-teal" />
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ==========================================================
             GUEST / NOT LOGGED-IN VIEW
             ========================================================== */
          <div className="space-y-6">
            {/* Login Prompt Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200/90 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-teal text-white flex items-center justify-center mx-auto shadow-md">
                <User className="w-8 h-8 text-brand-gold" />
              </div>

              <div className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold text-brand-navy mb-2">আপনার অ্যাকাউন্টে স্বাগতম</h1>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  আপনার গুগল অ্যাকাউন্ট ব্যবহার করে এক ক্লিকে লগইন করুন অথবা আপনার পূর্ববর্তী অনলাইন অর্ডারের সার্বিক
                  স্ট্যাটাস পর্যবেক্ষণ করুন।
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
                <Link
                  href="/login?redirect=/account"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-navy hover:bg-brand-teal text-white text-sm font-bold shadow-md transition-colors"
                >
                  <LogIn className="w-4 h-4 text-brand-gold" />
                  <span>লগইন করুন</span>
                </Link>

                <Link
                  href="/account/orders"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 hover:border-brand-teal bg-slate-50 hover:bg-white text-slate-700 text-sm font-semibold transition-colors"
                >
                  <Package className="w-4 h-4 text-brand-teal" />
                  <span>অর্ডার ট্র্যাক করুন</span>
                </Link>
              </div>
            </div>

            {/* Guest Order Lookup Banner */}
            <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-brand-navy">লগইন ছাড়াই কি অর্ডার খুঁজে পেতে চান?</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    আপনার ব্যবহৃত মোবাইল নম্বর দিয়ে সরাসরি অর্ডার স্ট্যাটাস এবং বিস্তারিত মেমো দেখতে পারেন।
                  </p>
                </div>
              </div>
              <Link
                href="/account/orders"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-teal text-white text-xs font-bold hover:bg-brand-navy transition-colors flex-shrink-0 shadow-sm"
              >
                <span>ফোনে অর্ডার খুঁজুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Store Information & Customer Support Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-teal" />
              <span>শোরুম ও গ্রাহক সেবা সহায়তা</span>
            </h3>
            <span className="text-xs text-brand-muted">{STORE_INFO.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">শোরুমের ঠিকানা:</span>
                <span className="leading-relaxed">{STORE_INFO.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <PhoneCall className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">হটলাইন ও হোয়াটসঅ্যাপ:</span>
                <a href={`tel:${STORE_INFO.mobile}`} className="hover:text-brand-teal block font-medium">
                  {STORE_INFO.phoneFormatted}
                </a>
                <a
                  href={STORE_INFO.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#25D366] font-semibold hover:underline mt-0.5"
                >
                  <MessageCircle className="w-3 h-3" />
                  হোয়াটসঅ্যাপে চ্যাট করুন
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">কার্যক্রমের সময়:</span>
                <span>{STORE_INFO.businessHoursBangla}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 rounded-full border-4 border-brand-teal border-t-transparent animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-600">অ্যাকাউন্ট তথ্য লোড হচ্ছে...</p>
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}

