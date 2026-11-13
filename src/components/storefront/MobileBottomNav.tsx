"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, ShoppingBag, Store, User } from "lucide-react";
import { cn, toBengaliNumber } from "@/lib/utils";
import { getCartItems } from "@/lib/cart";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [cartItemCount, setCartItemCount] = useState(0);

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

  const navItems = [
    { label: "হোম", href: "/", icon: Home },
    { label: "শপ", href: "/shop", icon: Grid },
    { label: "পিওএস", href: "/pos", icon: Store },
    { 
      label: "কার্ট", 
      href: "/cart", 
      icon: ShoppingBag, 
      badge: cartItemCount > 0 ? toBengaliNumber(cartItemCount) : null 
    },
    { label: "অ্যাকাউন্ট", href: "/account", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 py-1.5 px-2 md:hidden shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors relative",
                isActive
                  ? "text-brand-teal font-semibold"
                  : "text-slate-600 hover:text-brand-navy"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive ? "text-brand-teal" : "text-slate-500")} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-brand-gold text-brand-navy font-bold text-[10px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

