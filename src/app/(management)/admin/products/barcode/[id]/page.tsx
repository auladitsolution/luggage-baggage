"use client";

import { use, useEffect, useState } from "react";
import { BarcodeLabel } from "@/components/barcode/BarcodeLabel";
import { Printer, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";

export default function BarcodePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [copies, setCopies] = useState<number>(1);
  const [customProductName, setCustomProductName] = useState<string>("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/admin/products/${id}`);
        const data = await res.json();
        if (data.product) {
          setProduct(data.product);
          setCustomProductName(data.product.nameEnglish || data.product.nameBangla || "");
          if (data.product.variants?.length > 0) {
            setSelectedVariantId(data.product.variants[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load product for barcode:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-teal" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">পণ্যটি খুঁজে পাওয়া যায়নি।</p>
        <Link href="/admin/products" className="text-xs text-brand-teal font-bold mt-2 inline-block">
          পণ্য তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  const selectedVariant =
    product.variants?.find((v: any) => v._id === selectedVariantId) ||
    product.variants?.[0];

  return (
    <div className="space-y-6">
      {/* Screen Control Bar (Hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-brand-navy">
              বারকোড লেবেল প্রিন্টার
            </h1>
            <p className="text-xs text-slate-500">
              {product.nameEnglish || product.nameBangla}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold">লেবেল পণ্যের নাম (English):</span>
            <input
              type="text"
              value={customProductName}
              onChange={(e) => setCustomProductName(e.target.value)}
              placeholder="e.g. Hardshell Trolley Luggage"
              className="w-48 sm:w-60 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-teal"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold">কপি:</span>
            <input
              type="number"
              min="1"
              max="50"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-center font-bold"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-teal hover:bg-brand-tealLight text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Variant Selector (Hidden during print) */}
      <div className="flex flex-wrap gap-2 print:hidden bg-slate-50 p-3 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-600 self-center mr-2">
          ভ্যারিয়েন্ট নির্বাচন:
        </span>
        {product.variants?.map((v: any) => (
          <button
            key={v._id}
            onClick={() => setSelectedVariantId(v._id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedVariant?._id === v._id
                ? "bg-brand-navy text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {v.nameVariant} ({new Intl.NumberFormat("en-US").format(v.retailPricePoisha / 100)} TK)
          </button>
        ))}
      </div>

      {/* Printable Sheet (Shown both on screen and styled for print) */}
      <div className="bg-slate-100 p-6 rounded-2xl flex flex-wrap gap-4 justify-center print:bg-transparent print:p-0">
        {selectedVariant &&
          Array.from({ length: copies }).map((_, idx) => (
            <div key={idx} className="print:m-0 print:break-inside-avoid">
              <BarcodeLabel
                productName={customProductName || product.nameEnglish || product.nameBangla}
                variantName={selectedVariant.nameVariant}
                sku={selectedVariant.sku}
                barcode={selectedVariant.barcode}
                retailPricePoisha={selectedVariant.retailPricePoisha}
              />
            </div>
          ))}
      </div>
    </div>
  );
}

