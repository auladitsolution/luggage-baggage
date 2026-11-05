"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Store, 
  Package, 
  Boxes, 
  Receipt, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  Truck, 
  DollarSign, 
  UserCheck, 
  BarChart3, 
  Settings,
  X,
  ExternalLink,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IUserSession } from "@/types/auth";
import { STORE_INFO } from "@/lib/config/storeInfo";
import { useShopSettings } from "@/context/ShopSettingsContext";
import { useAuth } from "@/context/AuthContext";

interface IMenuItem {
  label: string;
  href: string;
  icon: any;
  highlight?: boolean;
  badge?: string;
}

interface IMenuSection {
  title: string;
  items: IMenuItem[];
}

interface AdminSidebarProps {
  onClose?: () => void;
}

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useShopSettings();
  const { user: session, logout } = useAuth();

  useEffect(() => {
    if (session) {
      if (session.authMethod === "google" || session.roleSlug === "customer") {
        router.push("/account?error=google_management_blocked");
      }
    }
  }, [session, router]);

  const handleLogout = async () => {
    await logout();
  };

  const menuSections: IMenuSection[] = [
    {
      title: "প্রধান মেনু",
      items: [
        { label: "ড্যাশবোর্ড", href: "/admin", icon: LayoutDashboard },
        { label: "পিওএস কাউন্টার", href: "/pos", icon: Store, highlight: true },
        { label: "বিক্রয় ইনভয়েস", href: "/admin/sales", icon: Receipt },
        { label: "পণ্য ক্যাটালগ", href: "/admin/products", icon: Package },
        { label: "স্টক ব্যালেন্স", href: "/admin/inventory", icon: Boxes },
        { label: "অনলাইন অর্ডার", href: "/admin/orders", icon: ShoppingBag },
      ],
    },
    {
      title: "হিসাব ও লেনদেন",
      items: [
        { label: "বকেয়া খাতা", href: "/admin/dues", icon: CreditCard },
        { label: "কাস্টমার তালিকা", href: "/admin/customers", icon: Users },
        { label: "সরবরাহকারী (সাপ্লায়ার)", href: "/admin/suppliers", icon: Truck },
        { label: "ক্রয় চালান (Purchases)", href: "/admin/purchases", icon: Receipt },
        { label: "দোকান খরচ", href: "/admin/expenses", icon: DollarSign },
        { label: "আর্থিক হিসাব (ক্যাশ/ব্যাংক)", href: "/admin/accounts", icon: CreditCard },
        { label: "কর্মচারী তালিকা", href: "/admin/employees", icon: Users },
        { label: "কর্মচারী বেতন", href: "/admin/payroll", icon: UserCheck },
        { label: "আর্থিক রিপোর্ট ও লাভ", href: "/admin/reports", icon: BarChart3 },
      ],
    },
    {
      title: "সিস্টেম",
      items: [
        { label: "ইউজার ও পারমিশন", href: "/admin/users", icon: Users },
        { label: "শপ সেটিংস", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-brand-navy text-slate-300 flex flex-col h-full border-r border-slate-800">
      {/* Brand Logo & Close button for mobile */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-md border border-slate-700/60 flex items-center justify-center p-0.5">
            <Image
              src="/logo.png"
              alt={settings.name}
              width={36}
              height={36}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight">{settings.name}</span>
            <span className="block text-[10px] text-brand-gold">{settings.nameBangla} • {settings.shortAddress}</span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {section.title}
            </h4>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                    item.highlight
                      ? "bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25 font-bold"
                      : isActive
                      ? "bg-brand-teal text-white shadow-sm font-semibold"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Storefront Link & Active User Card */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-brand-teal" />
            <span>ই-কমার্স ওয়েবসাইট দেখুন</span>
          </span>
          <span className="text-[10px] text-brand-gold">লাইভ</span>
        </Link>

        {/* User Profile & Logout */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-brand-teal/20 text-brand-teal font-bold flex items-center justify-center flex-shrink-0">
              {session?.displayName?.[0] || settings.owners?.[0] || "M"}
            </div>
            <div className="overflow-hidden">
              <span className="block font-semibold text-white truncate">
                {session?.displayName || settings.owners || "Md. Sohel Sikder & Md. Alam"}
              </span>
              <span className="block text-[10px] text-emerald-400 truncate">
                {session?.roleNameBangla || "দোকানের মালিক"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="লগআউট"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
