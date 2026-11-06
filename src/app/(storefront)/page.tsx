"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  CheckCircle2, 
  Star, 
  ShoppingBag,
  Sparkles,
  Plane
} from "lucide-react";
import { bn } from "@/lib/localization/bn";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { STORE_INFO } from "@/lib/config/storeInfo";

interface IFeaturedProduct {
  id: string;
  _id?: string;
  nameBangla: string;
  slug: string;
  brand?: string;
  brandName?: string;
  category?: string;
  categoryName?: string;
  images: Array<{ secureUrl?: string } | string>;
  basePricePoisha?: number;
  minPricePoisha?: number;
  totalAvailableStock?: number;
  variants?: any[];
  isNewArrival?: boolean;
}

export default function StorefrontHomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<IFeaturedProduct[]>([]);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);

  useEffect(() => {
    async function loadLiveData() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          if (data.products && Array.isArray(data.products)) {
            setTotalProductsCount(data.products.length);
            const live = data.products.slice(0, 6).map((p: any) => ({
              id: p._id || p.id,
              nameBangla: p.nameBangla,
              slug: p.slug,
              brandName: p.brandName || "লাগেজ",
              categoryName: p.categoryName || "স্যুটকেস",
              images: p.images || [],
              basePricePoisha: p.minPricePoisha || 0,
              minPricePoisha: p.minPricePoisha || 0,
              totalAvailableStock: p.totalAvailableStock,
              variants: p.variants || [],
              isNewArrival: true,
            }));
            setFeaturedProducts(live);
          }

          if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
            const mappedCats = data.categories.slice(0, 6).map((cat: any, idx: number) => ({
              id: cat._id || `cat-${idx}`,
              name: cat.nameBangla || cat.nameEnglish,
              slug: cat.slug,
              count: cat.productCount || 0,
              image:
                cat.image ||
                cat.imageUrl ||
                "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&q=80",
            }));
            setCategories(mappedCats);
          } else {
            setCategories([]);
          }
        }
      } catch (e) {
        console.error("Live products fetch error:", e);
      }
    }

    loadLiveData();
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16 pb-12">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navyDark via-brand-navy to-brand-navyLight text-white py-12 md:py-20 lg:py-24">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-teal/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs sm:text-sm text-brand-gold font-medium">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                <span>{STORE_INFO.nameBangla} - নতুন ট্রাভেল কালেকশন ২০২৬</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
                {bn.storefront.heroTitle}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-light">
                {STORE_INFO.tagline}। শোরুম: {STORE_INFO.shortAddress}।
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm sm:text-base hover:bg-brand-goldLight transition-all shadow-lg hover:shadow-brand-gold/20"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{bn.storefront.shopNow}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/pos"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm sm:text-base border border-white/20 transition-all"
                >
                  <Plane className="w-4 h-4 text-brand-teal" />
                  <span>দোকানের কাউন্টার পিওএস</span>
                </Link>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-[4/3] bg-slate-800">
                <Image
                  src="https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=800&q=80"
                  alt={STORE_INFO.fullName}
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-brand-gold font-semibold uppercase tracking-wider block">
                        অফিসিয়াল শোরুম
                      </span>
                      <h4 className="text-sm font-bold mt-0.5">
                        দোকান নং ৩এ-০২২বি, যমুনা ফিউচার পার্ক
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/80 text-[11px] font-bold">
                      খোলা আছে
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Value Propositions Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3.5 p-2">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-navy">{bn.storefront.freeDelivery}</h4>
              <p className="text-xs text-brand-muted mt-0.5">ঢাকা ও সারাদেশে দ্রুত এবং সুরক্ষিত ডেলিভারি</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-navy">{bn.storefront.warrantyBadge}</h4>
              <p className="text-xs text-brand-muted mt-0.5">অনুমোদিত সার্ভিস সেন্টারে ওয়ারেন্টি সাপোর্ট</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-navy">{bn.storefront.easyReturn}</h4>
              <p className="text-xs text-brand-muted mt-0.5">মেমোসহ শোরুমে ৭ দিনের মধ্যে পরিবর্তনযোগ্য</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-navy">{bn.storefront.authenticBadge}</h4>
              <p className="text-xs text-brand-muted mt-0.5">১০০% অরিজিনাল ব্র্যান্ডের নিশ্চয়তা</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Categories Grid (Dynamic) */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">
                {bn.storefront.categoriesTitle}
              </h2>
              <p className="text-sm text-brand-muted mt-1">
                আপনার ভ্রমণের ধরন ও প্রয়োজন অনুযায়ী মানানসই লাগেজ
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:text-brand-tealLight transition-colors"
            >
              <span>সবগুলো দেখুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group flex flex-col items-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-brand-teal hover:shadow-md transition-all text-center"
              >
                <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-brand-navy group-hover:text-brand-teal transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-brand-muted mt-0.5">
                  {toBengaliNumber(cat.count || 0)} টি পণ্য
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. Featured Suitcases & Bags */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal uppercase tracking-wider mb-1">
              <span>টপ রেটেড কালেকশন</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">
              {bn.storefront.featuredProducts}
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:text-brand-tealLight transition-colors"
          >
            <span>সকল পণ্য ({toBengaliNumber(totalProductsCount)})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-brand-navy mb-1">নতুন কালেকশন শীঘ্রই আসছে</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              আমাদের যমুনা ফিউচার পার্ক শোরুমের নতুন লাগেজ ও ব্যাগ অনলাইন ক্যাটালগে যুক্ত করা হচ্ছে।
            </p>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
            >
              <span>পণ্য যুক্ত করতে ড্যাশবোর্ডে যান</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product) => {
            const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
            const displayPrice = firstVariant?.discountPricePoisha || firstVariant?.retailPricePoisha || firstVariant?.pricePoisha || product.basePricePoisha || product.minPricePoisha || 0;
            const originalPrice = firstVariant?.discountPricePoisha ? (firstVariant.retailPricePoisha || firstVariant.pricePoisha) : null;
            
            // Extract image url
            let imageUrl = "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&q=80";
            if (product.images && product.images.length > 0) {
              const img0 = product.images[0];
              if (typeof img0 === "string") imageUrl = img0;
              else if (typeof img0 === "object" && img0.secureUrl) imageUrl = img0.secureUrl;
            }

            return (
              <div
                key={product.id}
                className="group flex flex-col rounded-2xl bg-white border border-slate-200/90 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Product Thumbnail with Tags */}
                <div className="relative h-64 w-full bg-slate-100 overflow-hidden">
                  <Image
                    unoptimized
                    src={imageUrl}
                    alt={product.nameBangla}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.isNewArrival && (
                      <span className="px-2.5 py-1 rounded-md bg-brand-navy text-white text-[11px] font-semibold tracking-wide">
                        নতুন কালেকশন
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-md bg-teal-600 text-white text-[11px] font-semibold">
                      {product.brandName || "লাগেজ"}
                    </span>
                  </div>

                  {firstVariant && (firstVariant.stock <= 5 || (firstVariant.availableStock !== undefined && firstVariant.availableStock <= 5)) && (
                    <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold">
                      সীমিত স্টক ({toBengaliNumber(firstVariant.availableStock ?? firstVariant.stock)} টি বাকি)
                    </div>
                  )}
                </div>

                {/* Product Body */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs text-brand-teal font-medium">
                      {product.categoryName || "ট্রাভেল লাগেজ"}
                    </span>
                    <h3 className="text-base font-bold text-brand-navy line-clamp-2 group-hover:text-brand-teal transition-colors">
                      <Link href={`/shop/${product.slug}`}>
                        {product.nameBangla}
                      </Link>
                    </h3>

                    {/* Available Sizes Tag */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-500">সাইজ:</span>
                        <div className="flex gap-1 flex-wrap">
                          {product.variants.map((v: any, idx: number) => (
                            <span
                              key={v._id || v.id || `v-${idx}`}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-medium border border-slate-200"
                            >
                              {v.size || v.nameVariant || `${idx + 1}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Action */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-brand-navy">
                          {formatBDT(displayPrice)}
                        </span>
                        {originalPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatBDT(originalPrice)}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-600 font-medium block">
                        ✓ স্টকে উপলব্ধ
                      </span>
                    </div>

                    <Link
                      href={`/shop/${product.slug}`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-brand-navy text-white text-xs font-semibold hover:bg-brand-teal transition-colors shadow-sm"
                    >
                      {bn.storefront.viewDetails}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>

      {/* 5. Promotional Call-to-Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-navy via-brand-teal to-brand-navy text-white p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="px-3 py-1 rounded-full bg-brand-gold text-brand-navy font-bold text-xs">
              আন্তর্জাতিক ভ্রমণ প্রস্তুতি
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              আপনার পাসপোর্টের মতোই গুরুত্বপূর্ণ আপনার ট্রাভেল লাগেজ
            </h2>
            <p className="text-sm sm:text-base text-slate-200 font-light leading-relaxed">
              উমরাহ, উচ্চশিক্ষা বা অবকাশ যাপনের জন্য সেরা কোয়ালিটির লাগেজ বেছে নিন। প্রতিটি লাগেজে রয়েছে আন্তর্জাতিক ওয়ারেন্টি ও টিএসএ সিকিউরিটি লক।
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="px-6 py-3 rounded-xl bg-white text-brand-navy font-bold text-sm hover:bg-brand-gold transition-colors shadow"
              >
                এখনই লাগেজ বুক করুন
              </Link>
              <Link
                href="/pos"
                className="px-5 py-3 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 border border-white/20 transition-colors"
              >
                দোকানের কাউন্টার পিওএস দেখুন
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
