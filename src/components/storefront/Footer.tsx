"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ShieldCheck, RefreshCw, CreditCard, MessageCircle } from "lucide-react";
import { STORE_INFO } from "@/lib/config/storeInfo";
import { useShopSettings } from "@/context/ShopSettingsContext";

export default function Footer() {
  const { settings } = useShopSettings();
  return (
    <footer className="bg-brand-navy text-slate-300 pt-12 pb-24 md:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand & Organization Info */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-md border border-slate-700/60 flex items-center justify-center p-0.5">
                <Image
                  src="/logo.png"
                  alt={settings.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">{settings.nameBangla}</span>
                <span className="block text-[11px] text-brand-gold font-medium">{settings.name}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {settings.tagline}। যমুনা ফিউচার পার্কের বৃহত্তম প্রিমিয়াম লাগেজ ও ট্রলি ব্যাগ শোরুম।
            </p>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{settings.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-teal flex-shrink-0" />
                <a href={`tel:${settings.mobile}`} className="hover:text-brand-gold transition-colors font-medium">
                  {settings.phoneFormatted} ({settings.mobile})
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-brand-gold transition-colors">
                  {settings.email}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-base font-semibold mb-4 border-l-2 border-brand-teal pl-2.5">
              গুরুত্বপূর্ণ লিংক
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/shop" className="hover:text-brand-gold transition-colors">
                  সকল পণ্য ও কালেকশন
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-brand-gold transition-colors">
                  শপিং কার্ট ও চেকআউট
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-brand-gold transition-colors">
                  অনলাইন অর্ডার ট্র্যাকিং
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-brand-gold transition-colors">
                  শোরুম ও গ্রাহক সহায়তা
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-brand-gold transition-colors">
                  অ্যাকাউন্টে লগইন
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div>
            <h4 className="text-white text-base font-semibold mb-4 border-l-2 border-brand-teal pl-2.5">
              কাস্টমার কেয়ার ও পলিসি
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-teal" />
                <span>ওয়ারেন্টি রেজিস্ট্রেশন ও ক্লেইম</span>
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-brand-gold" />
                <span>৭ দিনের পণ্য পরিবর্তন নীতিমালা</span>
              </li>
              <li className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>পেমেন্ট ও রিফান্ড নীতি</span>
              </li>
              <li className="text-slate-400 text-xs mt-3 leading-relaxed">
                পণ্য ক্রয়ের ৭ দিনের মধ্যে অরিজিনাল ক্যাশ মেমোসহ শোরুমে এনে পরিবর্তন করা যাবে।
              </li>
            </ul>
          </div>

          {/* Payment Methods & Social Buttons */}
          <div>
            <h4 className="text-white text-base font-semibold mb-4 border-l-2 border-brand-teal pl-2.5">
              নিরাপদ পেমেন্ট পদ্ধতি
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              আমরা ক্যাশ অন ডেলিভারি এবং দেশের শীর্ষস্থানীয় মোবাইল ব্যাংকিং সমর্থন করি:
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1.5 rounded bg-slate-800 text-xs font-semibold text-pink-400 border border-slate-700">
                bKash
              </span>
              <span className="px-3 py-1.5 rounded bg-slate-800 text-xs font-semibold text-orange-400 border border-slate-700">
                Nagad
              </span>
              <span className="px-3 py-1.5 rounded bg-slate-800 text-xs font-semibold text-emerald-400 border border-slate-700">
                Cash on Delivery
              </span>
            </div>

            {/* Social & WhatsApp Buttons moved below payment methods */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <a
                href={settings.facebookPageLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] text-xs font-semibold border border-[#1877F2]/30 transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook পেজ</span>
              </a>
              <a
                href={settings.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] text-xs font-semibold border border-[#25D366]/30 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} {settings.name}. All rights reserved.
          </div>
          <div>
            Developed By{" "}
            <a
              href="https://itsolution.auladhossen.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-gold hover:underline font-semibold"
            >
              Aulad IT Solution
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
