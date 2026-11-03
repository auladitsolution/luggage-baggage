"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  X, 
  PhoneCall, 
  ShieldCheck, 
  Truck, 
  User, 
  LayoutDashboard,
  Store
} from "lucide-react";
import { bn } from "@/lib/localization/bn";
import { toBengaliNumber } from "@/lib/utils";
import { getCartItems } from "@/lib/cart";
import { useEffect } from "react";

import { STORE_INFO } from "@/lib/config/storeInfo";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItemCount, setCartItemCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const updateCount = () => {
      const items = getCartItems();
      const count = items.reduce((sum, i) => sum + i.quantity, 0);
      setCartItemCount(count);
    };

    updateCount();
    window.addEventListener("cart_updated", updateCount);
    return () => window.removeEventListener("cart_updated", updateCount);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm border-b border-slate-100">
      {/* Top utility notification bar */}
      <div className="bg-brand-navy text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-brand-gold" />
              <span>সারাদেশে দ্রুত হোম ডেলিভারি</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
              <span>১০০% আসল ব্র্যান্ড ও ইন্টারন্যাশনাল ওয়ারেন্টি</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href={`tel:${STORE_INFO.mobile}`}
              className="flex items-center gap-1 text-slate-300 hover:text-brand-gold transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-brand-gold" />
              <span>হটলাইন: {STORE_INFO.phoneFormatted}</span>
            </a>
            <span className="text-slate-500">|</span>
            <Link 
              href="/pos" 
              className="flex items-center gap-1 text-brand-gold hover:text-white font-medium transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>পিওএস কাউন্টার</span>
            </Link>
            <span className="text-slate-500">|</span>
            <Link 
              href="/admin" 
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>ম্যানেজমেন্ট</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-white shadow-sm border border-slate-200/80 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt={STORE_INFO.name}
                width={44}
                height={44}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-brand-navy group-hover:text-brand-teal transition-colors">
                {STORE_INFO.nameBangla}
              </span>
              <span className="hidden sm:block text-[11px] text-brand-muted -mt-1 font-normal tracking-wide">
                {STORE_INFO.name} • যমুনা ফিউচার পার্ক
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={bn.storefront.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-sm text-brand-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/account"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-700 hover:text-brand-teal hover:bg-slate-50 transition-colors text-sm font-medium"
              title={currentUser ? "আমার অ্যাকাউন্ট ও প্রোফাইল" : "লগইন বা অ্যাকাউন্ট"}
            >
              <User className="w-4 h-4 text-brand-navy" />
              <span className="max-w-[130px] truncate">
                {currentUser?.displayName || "লগইন / অ্যাকাউন্ট"}
              </span>
            </Link>

            <Link
              href="/cart"
              className="relative flex items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 text-brand-navy hover:text-brand-teal transition-colors group"
              title="শপিং কার্ট"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-gold text-brand-navy font-bold text-xs flex items-center justify-center shadow-sm">
                  {toBengaliNumber(cartItemCount)}
                </span>
              )}
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="লাগেজ বা মডেল খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Secondary Category Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 pt-3 mt-2 border-t border-slate-100 text-sm font-medium text-slate-700">
          <Link href="/" className="text-brand-teal font-semibold hover:text-brand-tealLight transition-colors">
            {bn.nav.home}
          </Link>
          <Link href="/shop" className="hover:text-brand-teal transition-colors">
            {bn.nav.shop}
          </Link>
          <Link href="/shop?category=suitcases" className="hover:text-brand-teal transition-colors">
            ট্রাভেল স্যুটকেস ও ট্রলি
          </Link>
          <Link href="/shop?category=backpacks" className="hover:text-brand-teal transition-colors">
            ট্রাভেল ব্যাকপ্যাক
          </Link>
          <Link href="/shop?category=laptop-bags" className="hover:text-brand-teal transition-colors">
            ল্যাপটপ ও বিজনেস ব্যাগ
          </Link>
          <Link href="/shop?category=cabin" className="hover:text-brand-teal transition-colors">
            কেবিন লাগেজ
          </Link>
          <Link href="/shop?category=duffel" className="hover:text-brand-teal transition-colors">
            ডাফেল ব্যাগ
          </Link>
        </nav>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-brand-teal font-semibold text-sm border-b border-slate-100"
          >
            {bn.nav.home}
          </Link>
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-700 text-sm border-b border-slate-100"
          >
            {bn.nav.shop}
          </Link>
          <Link
            href="/shop?category=suitcases"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-700 text-sm border-b border-slate-100"
          >
            ট্রাভেল স্যুটকেস ও ট্রলি
          </Link>
          <Link
            href="/shop?category=backpacks"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-700 text-sm border-b border-slate-100"
          >
            ট্রাভেল ব্যাকপ্যাক
          </Link>
          <Link
            href="/pos"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-brand-gold font-medium text-sm border-b border-slate-100"
          >
            পিওএস কাউন্টার
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-brand-navy font-medium text-sm border-b border-slate-100"
          >
            ম্যানেজমেন্ট ড্যাশবোর্ড
          </Link>
          <Link
            href="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-slate-700 font-medium text-sm"
          >
            <User className="w-4 h-4 text-brand-teal" />
            <span className="truncate">
              {currentUser ? `আমার অ্যাকাউন্ট (${currentUser.displayName})` : "লগইন / অ্যাকাউন্ট"}
            </span>
          </Link>
        </div>
      )}
    </header>
  );
}

