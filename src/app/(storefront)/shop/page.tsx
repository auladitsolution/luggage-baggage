"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Layers,
  X,
  RotateCcw,
  Tag,
  CheckCircle2,
  PackageCheck,
  Eye,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { SAMPLE_PRODUCTS, SAMPLE_CATEGORIES } from "@/lib/sample-data";

interface ProductItem {
  _id: string;
  nameBangla: string;
  nameEnglish?: string;
  slug: string;
  categoryName: string;
  categorySlug?: string;
  brandName: string;
  images: Array<{ secureUrl: string } | string>;
  minPricePoisha: number;
  maxPricePoisha: number;
  totalAvailableStock: number;
  inStock: boolean;
  variants: any[];
}

const PRICE_PRESETS = [
  { id: "all", label: "সকল মূল্য", min: null, max: null },
  { id: "under-5k", label: "৳ ৫,০০০ এর নিচে", min: 0, max: 5000 },
  { id: "5k-10k", label: "৳ ৫,০০০ - ৳ ১০,০০০", min: 5000, max: 10000 },
  { id: "10k-15k", label: "৳ ১০,০০০ - ৳ ১৫,০০০", min: 10000, max: 15000 },
  { id: "above-15k", label: "৳ ১৫,০০০ এর উপরে", min: 15000, max: null },
];

function ShopCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category") || "all";
  const initialBrand = searchParams.get("brand") || "all";
  const initialSize = searchParams.get("size") || "all";
  const initialPrice = searchParams.get("price") || "all";
  const initialInStock = searchParams.get("inStock") === "true";
  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sort") || "featured";

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand);
  const [selectedSize, setSelectedSize] = useState<string>(initialSize);
  const [selectedPricePreset, setSelectedPricePreset] = useState<string>(initialPrice);
  const [inStockOnly, setInStockOnly] = useState<boolean>(initialInStock);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [search, setSearch] = useState<string>(initialSearch);

  // Mobile drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state when URL searchParams changes
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "all");
    setSelectedBrand(searchParams.get("brand") || "all");
    setSelectedSize(searchParams.get("size") || "all");
    setSelectedPricePreset(searchParams.get("price") || "all");
    setInStockOnly(searchParams.get("inStock") === "true");
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedCategory !== "all" ||
      selectedBrand !== "all" ||
      selectedSize !== "all" ||
      selectedPricePreset !== "all" ||
      inStockOnly ||
      Boolean(search)
    );
  }, [selectedCategory, selectedBrand, selectedSize, selectedPricePreset, inStockOnly, search]);

  // Reset all filters function
  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedSize("all");
    setSelectedPricePreset("all");
    setInStockOnly(false);
    setSearch("");
    router.push("/shop");
  };

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCategory !== "all") params.set("category", selectedCategory);
        if (selectedBrand !== "all") params.set("brand", selectedBrand);
        if (selectedSize !== "all") params.set("size", selectedSize);
        if (search) params.set("search", search);
        if (sortBy) params.set("sort", sortBy);
        if (inStockOnly) params.set("inStockOnly", "true");

        const pricePreset = PRICE_PRESETS.find((p) => p.id === selectedPricePreset);
        if (pricePreset) {
          if (pricePreset.min !== null) params.set("minPrice", String(pricePreset.min));
          if (pricePreset.max !== null) params.set("maxPrice", String(pricePreset.max));
        }

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();

        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
          if (data.brands && data.brands.length > 0) {
            setBrands(data.brands);
          }
        } else {
          // Fallback to sample products
          const fallback = SAMPLE_PRODUCTS.map((p) => ({
            _id: p.id,
            nameBangla: p.nameBangla,
            slug: p.slug,
            categoryName: p.category,
            categorySlug: p.category,
            brandName: p.brand,
            images: p.images.map((img) => ({ secureUrl: img })),
            minPricePoisha: p.basePricePoisha,
            maxPricePoisha: p.basePricePoisha,
            totalAvailableStock: 15,
            inStock: true,
            variants: p.variants,
          }));
          setProducts(fallback);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory, selectedBrand, selectedSize, selectedPricePreset, inStockOnly, sortBy, search]);

  // Sidebar Filter Component (reusable for desktop & mobile)
  const FilterSidebarContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            ক্যাটাগরি
          </h4>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-[11px] text-brand-teal hover:underline font-medium"
            >
              সকল
            </button>
          )}
        </div>
        <div className="space-y-1.5 text-sm max-h-72 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
              selectedCategory === "all"
                ? "bg-teal-50 text-brand-teal font-bold shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>সকল ক্যাটাগরি</span>
            {selectedCategory === "all" && <Check className="w-3.5 h-3.5 text-brand-teal" />}
          </button>
          {(categories.length > 0 ? categories : SAMPLE_CATEGORIES).map((cat: any) => {
            const catId = cat.slug || cat._id;
            const isSelected = selectedCategory === catId;
            return (
              <button
                key={catId}
                onClick={() => setSelectedCategory(catId)}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                  isSelected
                    ? "bg-teal-50 text-brand-teal font-bold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="truncate pr-2">{cat.nameBangla || cat.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {typeof cat.productCount === "number" && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-brand-teal text-white font-bold"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {toBengaliNumber(cat.productCount)}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-teal" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Filter */}
      <div className="border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            ব্র্যান্ড
          </h4>
          {selectedBrand !== "all" && (
            <button
              onClick={() => setSelectedBrand("all")}
              className="text-[11px] text-brand-teal hover:underline font-medium"
            >
              সকল
            </button>
          )}
        </div>
        <div className="space-y-1.5 text-sm">
          <button
            onClick={() => setSelectedBrand("all")}
            className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
              selectedBrand === "all"
                ? "bg-teal-50 text-brand-teal font-bold shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>সকল ব্র্যান্ড</span>
            {selectedBrand === "all" && <Check className="w-3.5 h-3.5 text-brand-teal" />}
          </button>
          {brands.map((b: any) => {
            const brandId = b.slug || b._id;
            const isSelected = selectedBrand === brandId;
            return (
              <button
                key={brandId}
                onClick={() => setSelectedBrand(brandId)}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                  isSelected
                    ? "bg-teal-50 text-brand-teal font-bold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="truncate pr-2">{b.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {typeof b.productCount === "number" && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-brand-teal text-white font-bold"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {toBengaliNumber(b.productCount)}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-teal" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Filter */}
      <div className="border-t border-slate-100 pt-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          লাগেজের সাইজ
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { id: "all", label: "সব সাইজ" },
            { id: "20", label: '২০" (কেবিন)' },
            { id: "24", label: '২৪" (মিডিয়াম)' },
            { id: "28", label: '২৮" (লার্জ)' },
          ].map((sizeOpt) => (
            <button
              key={sizeOpt.id}
              onClick={() => setSelectedSize(sizeOpt.id)}
              className={`px-3 py-2 rounded-xl border text-center transition-all ${
                selectedSize === sizeOpt.id
                  ? "bg-brand-navy text-white border-brand-navy font-bold shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              {sizeOpt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="border-t border-slate-100 pt-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          মূল্য পরিসীমা (বাজেট)
        </h4>
        <div className="space-y-1.5 text-xs">
          {PRICE_PRESETS.map((p) => {
            const isSelected = selectedPricePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPricePreset(p.id)}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                  isSelected
                    ? "bg-teal-50 text-brand-teal font-bold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{p.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-brand-teal" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* In-Stock Filter Checkbox */}
      <div className="border-t border-slate-100 pt-5">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-slate-300 transition"
          />
          <span className="text-xs font-medium text-slate-700 group-hover:text-brand-navy transition">
            শুধুমাত্র স্টকে থাকা পণ্য
          </span>
        </label>
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <div className="border-t border-slate-100 pt-4">
          <button
            onClick={handleResetFilters}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ফিল্টার রিসেট করুন</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Breadcrumb */}
      <div className="border-b border-slate-200 pb-5 mb-6">
        <div className="text-xs text-brand-muted mb-1.5">
          <Link href="/" className="hover:text-brand-teal">
            হোম
          </Link>{" "}
          / <span className="text-brand-navy font-semibold">সকল পণ্য</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
              লাগেজ ও ট্রাভেল ব্যাগ ক্যাটালগ
            </h1>
            <p className="text-sm text-brand-muted mt-1">
              মোট {toBengaliNumber(products.length)} টি প্রিমিয়াম পণ্য পাওয়া গেছে
            </p>
          </div>

          {/* Action buttons: Mobile Filter Trigger & Sort selector */}
          <div className="flex items-center gap-2.5">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 text-brand-teal" />
              <span>ফিল্টার ({hasActiveFilters ? "সক্রিয়" : "সব"})</span>
            </button>

            {/* Sort selector */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium shadow-sm"
              >
                <option value="featured">জনপ্রিয় অনুযায়ী</option>
                <option value="price-low">মূল্য: কম থেকে বেশি</option>
                <option value="price-high">মূল্য: বেশি থেকে কম</option>
                <option value="newest">নতুন কালেকশন</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-medium">সক্রিয় ফিল্টার:</span>

            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-brand-teal text-xs font-semibold">
                ক্যাটাগরি: {categories.find((c) => (c.slug || c._id) === selectedCategory)?.nameBangla || selectedCategory}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="hover:text-teal-900 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedBrand !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                ব্র্যান্ড: {brands.find((b) => (b.slug || b._id) === selectedBrand)?.name || selectedBrand}
                <button
                  onClick={() => setSelectedBrand("all")}
                  className="hover:text-indigo-900 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedSize !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                সাইজ: {selectedSize}&quot;
                <button
                  onClick={() => setSelectedSize("all")}
                  className="hover:text-amber-900 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedPricePreset !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
                {PRICE_PRESETS.find((p) => p.id === selectedPricePreset)?.label}
                <button
                  onClick={() => setSelectedPricePreset("all")}
                  className="hover:text-purple-900 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                শুধুমাত্র স্টকে
                <button
                  onClick={() => setInStockOnly(false)}
                  className="hover:text-emerald-900 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                সার্চ: &quot;{search}&quot;
                <button onClick={() => setSearch("")} className="hover:text-slate-900 transition">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:underline font-bold ml-1"
            >
              সব মুছুন
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-brand-navy text-sm">
                <SlidersHorizontal className="w-4 h-4 text-brand-teal" />
                <span>ফিল্টার অপশন</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  রিসেট
                </button>
              )}
            </div>

            <div className="mt-5">
              <FilterSidebarContent />
            </div>
          </div>
        </aside>

        {/* Mobile Filter Modal / Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileFilterOpen(false)}
            />
            {/* Sheet */}
            <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2 font-bold text-brand-navy text-sm">
                    <SlidersHorizontal className="w-4 h-4 text-brand-teal" />
                    <span>ফিল্টার অপশন</span>
                  </div>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <FilterSidebarContent />
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 sticky bottom-0 bg-white">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-3 bg-brand-teal text-white rounded-xl font-bold text-sm shadow-md hover:bg-teal-700 transition"
                >
                  ফিল্টার প্রয়োগ করুন ({toBengaliNumber(products.length)}টি পণ্য)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="py-24 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-teal" />
              <p className="text-sm font-medium">ক্যাটালগের পণ্য লোড হচ্ছে...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">কোনো পণ্য পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                আপনার নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো পণ্য এই মুহূর্তে নেই। ভিন্ন ফিল্টার বা সার্চ টার্ম চেষ্টা করুন।
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-brand-navy text-white rounded-xl text-xs font-bold hover:bg-brand-teal transition shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>সকল ফিল্টার রিসেট করুন</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                // Ensure proper high-res image or graceful luggage illustration fallback
                const firstImg =
                  typeof product.images?.[0] === "string"
                    ? product.images[0]
                    : product.images?.[0]?.secureUrl;

                const hasValidImg = Boolean(
                  firstImg &&
                  !firstImg.includes("base64,iVBOR") &&
                  (firstImg.startsWith("http") || firstImg.startsWith("/"))
                );

                const imgUrl = hasValidImg
                  ? firstImg
                  : "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=800&q=80";

                // Ensure price is never ৳0
                const displayPricePoisha =
                  product.minPricePoisha && product.minPricePoisha > 0
                    ? product.minPricePoisha
                    : (product.variants?.[0]?.retailPricePoisha || 550000);

                return (
                  <Link
                    key={product._id}
                    href={`/shop/${product.slug}`}
                    className="group flex flex-col rounded-2xl bg-white border border-slate-200/90 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 relative"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-64 w-full bg-gradient-to-br from-slate-100 to-slate-200/80 overflow-hidden flex items-center justify-center">
                      <Image
                        src={imgUrl}
                        alt={product.nameBangla}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Brand Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="px-2.5 py-1 rounded-lg bg-brand-navy/90 backdrop-blur-sm text-white text-[11px] font-bold shadow-sm tracking-wide">
                          {product.brandName}
                        </span>
                      </div>

                      {/* Stock Status Badge */}
                      <div className="absolute bottom-3 right-3 z-10">
                        {product.inStock ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/95 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            স্টকে আছে
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-600/95 text-white text-[10px] font-bold shadow-sm">
                            স্টক শেষ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-5 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] text-brand-teal font-bold uppercase tracking-wider mb-1">
                          <Tag className="w-3 h-3" />
                          <span>{product.categoryName}</span>
                        </div>
                        <h3 className="text-sm font-bold text-brand-navy line-clamp-2 group-hover:text-brand-teal transition-colors leading-snug">
                          {product.nameBangla}
                        </h3>
                      </div>

                      <div className="flex items-end justify-between border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-[11px] text-slate-400 font-medium">শুরু মূল্য</p>
                          <p className="text-lg font-black text-brand-navy tracking-tight">
                            {formatBDT(displayPricePoisha)}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 text-brand-teal group-hover:bg-brand-teal group-hover:text-white text-xs font-bold transition-all shadow-sm">
                          <Eye className="w-3.5 h-3.5" />
                          <span>বিস্তারিত</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ShopCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-teal" />
          <p className="text-sm font-medium">ক্যাটালগ লোড হচ্ছে...</p>
        </div>
      }
    >
      <ShopCatalogContent />
    </Suspense>
  );
}
