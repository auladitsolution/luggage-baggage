"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Menu, 
  Bell, 
  Store, 
  PlusCircle, 
  Clock, 
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { STORE_INFO } from "@/lib/config/storeInfo";
import { useShopSettings } from "@/context/ShopSettingsContext";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { settings } = useShopSettings();
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          title="মেনু খুলুন"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden flex items-center gap-2">
          <img src="/logo.png" alt={settings.name} className="w-7 h-7 object-contain rounded-lg border border-slate-200 bg-white" />
          <span className="font-bold text-xs text-brand-navy">{settings.name}</span>
        </div>

        {/* Store Active Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-brand-teal font-medium">
          <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
          <span>দোকান শাখা: <strong>{settings.name} ({settings.shortAddress})</strong></span>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Shift indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>শিফট: <strong>সকাল ১০:০০ - রাত ৯:০০</strong></span>
        </div>

        {/* Quick Launch POS Button */}
        <Link
          href="/pos"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-gold hover:bg-brand-goldLight text-brand-navy font-bold text-xs shadow-sm transition-colors"
        >
          <Store className="w-4 h-4" />
          <span>পিওএস কাউন্টার</span>
        </Link>

        {/* Quick Notification */}
        <div className="relative">
          <button className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>
        </div>
      </div>
    </header>
  );
}

