"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  RefreshCw,
  ShoppingBag,
  Check,
  ArrowLeft,
  Barcode,
  Layers,
  Lock,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { addToCart } from "@/lib/cart";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${resolvedParams.slug}`);
        const data = await res.json();
        if (data.product) {
          setProduct(data.product);
          if (data.product.variants && data.product.variants.length > 0) {
            setSelectedVariantId(data.product.variants[0]._id || data.product.variants[0].id);
          }
        } else {
          // Fallback to sample
          const sample = SAMPLE_PRODUCTS.find((p) => p.slug === resolvedParams.slug) || SAMPLE_PRODUCTS[0];
          setProduct({
            _id: sample.id,
            nameBangla: sample.nameBangla,
            slug: sample.slug,
            brandName: sample.brand,
            categoryName: sample.category,
            descriptionBangla: sample.description,
            specifications: (sample as any).specifications || {},
            images: sample.images.map((img) => ({ secureUrl: img })),
            variants: sample.variants.map((v) => ({
              _id: v.id,
              nameVariant: `${v.size} - ${v.color}`,
              size: v.size,
              color: v.color,
              sku: v.sku,
              barcode: v.barcode,
              retailPricePoisha: v.pricePoisha,
              discountPricePoisha: v.discountPricePoisha,
              availableStock: v.stock,
            })),
          });
          setSelectedVariantId(sample.variants[0]?.id || "");
        }
      } catch (err) {
        console.error("Failed to load product detail:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-brand-teal" />
        <p className="text-sm font-medium">পণ্যের তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-base font-bold text-slate-800">পণ্যটি পাওয়া যায়নি</p>
        <Link href="/shop" className="text-xs text-brand-teal font-bold hover:underline">
          ক্যাটালগে ফিরে যান
        </Link>
      </div>
    );
  }

  const currentVariant =
    product.variants?.find((v: any) => (v._id || v.id) === selectedVariantId) ||
    product.variants?.[0] ||
    {};

  const currentPrice = currentVariant.discountPricePoisha || currentVariant.retailPricePoisha || 0;
  const originalPrice = currentVariant.discountPricePoisha ? currentVariant.retailPricePoisha : null;
  const availableStock = currentVariant.availableStock ?? 10;
  const inStock = availableStock > 0;

  const rawImages = product.images || [];
  const imageUrls = rawImages.map((img: any) => (typeof img === "string" ? img : img.secureUrl));
  const mainImage =
    imageUrls[selectedImageIndex] ||
    "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=800&q=80";

  const handleAddToCartClick = () => {
    if (!inStock) return;

    addToCart({
      variantId: currentVariant._id || currentVariant.id || `var-${Date.now()}`,
      productId: product._id,
      productName: product.nameBangla,
      variantName: currentVariant.nameVariant || `${currentVariant.size || ""} ${currentVariant.color || ""}`,
      sku: currentVariant.sku || "LUM-SKU",
      barcode: currentVariant.barcode || "8901234567890",
      pricePoisha: currentPrice,
      quantity,
      image: mainImage,
      maxStock: availableStock,
    });

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  };

  const handleDirectOrderClick = () => {
    if (!inStock) return;

    addToCart({
      variantId: currentVariant._id || currentVariant.id || `var-${Date.now()}`,
      productId: product._id,
      productName: product.nameBangla,
      variantName: currentVariant.nameVariant || `${currentVariant.size || ""} ${currentVariant.color || ""}`,
      sku: currentVariant.sku || "LUM-SKU",
      barcode: currentVariant.barcode || "8901234567890",
      pricePoisha: currentPrice,
      quantity,
      image: mainImage,
      maxStock: availableStock,
    });

    router.push("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-brand-muted">
        <Link href="/" className="hover:text-brand-teal">
          হোম
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-brand-teal">
          ক্যাটালগ
        </Link>
        <span>/</span>
        <span className="text-brand-navy font-semibold truncate max-w-xs">{product.nameBangla}</span>
      </div>

      {/* Main Product Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Images Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative h-80 sm:h-[450px] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
            <Image src={mainImage} alt={product.nameBangla} fill className="object-cover" priority />
            <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-brand-navy/90 text-white text-xs font-semibold">
              {product.brandName}
            </div>
            <div className="absolute top-4 right-4">
              {inStock ? (
                <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm">
                  স্টকে আছে ({toBengaliNumber(availableStock)} পিস)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-sm">
                  স্টক শেষ
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {imageUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {imageUrls.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImageIndex === idx
                      ? "border-brand-teal ring-2 ring-brand-teal/20"
                      : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Purchase Configurator */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="inline-block text-xs font-bold text-brand-teal uppercase tracking-wider mb-1">
              {product.categoryName}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight leading-snug">
              {product.nameBangla}
            </h1>
            {product.nameEnglish && (
              <p className="text-xs text-slate-400 mt-1 font-mono">{product.nameEnglish}</p>
            )}
          </div>

          {/* Price Tag */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">বিক্রয় মূল্য</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
                  {formatBDT(currentPrice)}
                </span>
                {originalPrice && (
                  <span className="text-sm sm:text-base text-slate-400 line-through">
                    {formatBDT(originalPrice)}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-500 block">বারকোড:</span>
              <span className="font-mono font-bold text-slate-700">
                {currentVariant.barcode || "8901234567890"}
              </span>
            </div>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                সাইজ ও ভ্যারিয়েন্ট নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.variants.map((v: any) => {
                  const vId = v._id || v.id;
                  const isSelected = selectedVariantId === vId;
                  const vStock = v.availableStock ?? 10;
                  return (
                    <button
                      key={vId}
                      onClick={() => setSelectedVariantId(vId)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-brand-teal bg-teal-50/60 ring-2 ring-brand-teal/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="font-bold text-xs text-brand-navy">{v.nameVariant}</div>
                      <div className="text-[11px] text-brand-teal font-extrabold mt-0.5">
                        {formatBDT(v.discountPricePoisha || v.retailPricePoisha)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {vStock > 0 ? `স্টক: ${toBengaliNumber(vStock)}` : "স্টক নেই"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Action Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Quantity Counter */}
              <div className="flex items-center justify-between border border-slate-300 rounded-xl bg-white overflow-hidden shadow-sm h-12 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 h-full text-slate-600 hover:bg-slate-100 font-bold text-base transition flex items-center justify-center"
                >
                  -
                </button>
                <span className="px-4 text-sm font-bold text-brand-navy min-w-[2.5rem] text-center">
                  {toBengaliNumber(quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(availableStock || 99, q + 1))}
                  disabled={!inStock || quantity >= availableStock}
                  className="px-3.5 h-full text-slate-600 hover:bg-slate-100 font-bold text-base transition disabled:opacity-40 flex items-center justify-center"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCartClick}
                disabled={!inStock}
                className="flex-1 h-12 px-5 rounded-xl bg-brand-navy hover:bg-brand-navyLight text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-brand-navy/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-5 h-5 text-brand-gold" />
                <span>{inStock ? "কার্টে যুক্ত করুন" : "স্টক শেষ"}</span>
              </button>

              {/* Direct Order Button */}
              <button
                type="button"
                onClick={handleDirectOrderClick}
                disabled={!inStock}
                className="flex-1 h-12 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-brand-gold to-amber-600 hover:from-amber-600 hover:to-amber-700 text-brand-navy font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-brand-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-5 h-5 text-brand-navy fill-brand-navy" />
                <span>সরাসরি অর্ডার করুন</span>
              </button>
            </div>

            {addedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  পণ্যটি সফলভাবে কার্টে যুক্ত হয়েছে!
                </span>
                <Link href="/cart" className="font-bold underline text-emerald-900">
                  কার্ট দেখুন
                </Link>
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-teal flex-shrink-0" />
              <span>সারাদেশে হোম ডেলিভারি</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-teal flex-shrink-0" />
              <span>৩ বছরের অফিসিয়াল ওয়ারেন্টি</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-teal flex-shrink-0" />
              <span>ইন্টারন্যাশনাল TSA কম্বিনেশন লক</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-brand-teal flex-shrink-0" />
              <span>৭ দিনের মধ্যে সহজ পরিবর্তন</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Description Section */}
      <div className="border-t border-slate-200 pt-8 space-y-6">
        <h3 className="text-xl font-bold text-brand-navy">পণ্যের বিস্তারিত বিবরণ ও স্পেসিফিকেশন</h3>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          {product.descriptionBangla ||
            "উন্নত মানের পলিকার্বোনেট ম্যাটেরিয়ালে তৈরি অত্যন্ত টেকসই ও আকর্ষণীয় ট্রাভেল লাগেজ। এর ৩৬০ ডিগ্রি সাইলেন্ট স্পিনার হুইল সহজে টানা যায় এবং টিএসএ অনুমোদিত নম্বর লক ভ্রমণের সময় মালামাল সুরক্ষিত রাখে।"}
        </p>

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="max-w-2xl bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-xs sm:text-sm">
              <tbody className="divide-y divide-slate-100">
                {Object.entries(product.specifications).map(([key, val]: any, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                    <td className="py-2.5 px-4 font-semibold text-slate-700 w-1/3">{key}</td>
                    <td className="py-2.5 px-4 text-slate-600">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
