"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Search,
  Barcode,
  Trash2,
  RefreshCw,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";

interface VariantForm {
  nameVariant: string;
  size: string;
  color: string;
  purchaseCostBDT: string;
  retailPriceBDT: string;
  stock: string;
  barcode: string;
  sku: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create Form State
  const [nameBangla, setNameBangla] = useState("");
  const [nameEnglish, setNameEnglish] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [descriptionBangla, setDescriptionBangla] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [variants, setVariants] = useState<VariantForm[]>([
    {
      nameVariant: "২০ ইঞ্চি (কেবিন) - কালো",
      size: "20 Inch",
      color: "কালো",
      purchaseCostBDT: "3200",
      retailPriceBDT: "4800",
      stock: "10",
      barcode: "",
      sku: "",
    },
    {
      nameVariant: "২৪ ইঞ্চি (মিডিয়াম) - কালো",
      size: "24 Inch",
      color: "কালো",
      purchaseCostBDT: "4200",
      retailPriceBDT: "6200",
      stock: "8",
      barcode: "",
      sku: "",
    },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/brands"),
      ]);

      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const brandData = await brandRes.json();

      if (prodData.products) setProducts(prodData.products);
      if (catData.categories) setCategories(catData.categories);
      if (brandData.brands) setBrands(brandData.brands);
    } catch (err) {
      console.error("Failed to load products data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        nameVariant: "২৮ ইঞ্চি (লার্জ) - কালো",
        size: "28 Inch",
        color: "কালো",
        purchaseCostBDT: "5200",
        retailPriceBDT: "7500",
        stock: "5",
        barcode: "",
        sku: "",
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: keyof VariantForm, val: string) => {
    const updated = [...variants];
    updated[index][field] = val;
    setVariants(updated);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setErrorMsg("");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ইমেজ আপলোড ব্যর্থ হয়েছে");

      setImageUrl(data.image.secureUrl);
    } catch (err: any) {
      setErrorMsg(err.message || "ইমেজ আপলোড করতে সমস্যা হয়েছে");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!nameBangla || !brandId || !categoryId) {
      setErrorMsg("পণ্যের বাংলা নাম, ব্র্যান্ড এবং ক্যাটাগরি আবশ্যক");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        nameBangla,
        nameEnglish,
        brandId,
        categoryId,
        descriptionBangla,
        images: imageUrl
          ? [
              {
                publicId: `upload-${Date.now()}`,
                secureUrl: imageUrl,
                isPrimary: true,
                sortOrder: 0,
              },
            ]
          : [],
        variants: variants.map((v) => ({
          nameVariant: v.nameVariant,
          size: v.size,
          color: v.color,
          purchaseCostPoisha: Math.round((parseFloat(v.purchaseCostBDT) || 0) * 100),
          retailPricePoisha: Math.round((parseFloat(v.retailPriceBDT) || 0) * 100),
          stock: parseInt(v.stock) || 0,
          barcode: v.barcode.trim() || undefined,
          sku: v.sku.trim() || undefined,
        })),
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "পণ্য তৈরি করা যায়নি");
      }

      setSuccessMsg("পণ্য ও ভ্যারিয়েন্ট সফলভাবে তৈরি করা হয়েছে!");
      setIsModalOpen(false);
      // Reset form
      setNameBangla("");
      setNameEnglish("");
      setDescriptionBangla("");
      setImageUrl("");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে '${name}' পণ্যটি ডিলিট/আর্কাইভ করতে চান?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadData();
    } catch (err: any) {
      alert(err.message || "ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  const filtered = products.filter((p) => {
    const s = search.toLowerCase();
    const nameMatch = p.nameBangla?.toLowerCase().includes(s) || p.nameEnglish?.toLowerCase().includes(s);
    const brandMatch = (p.brand?.name || p.brandId?.name || "").toLowerCase().includes(s);
    const catMatch = (p.category?.nameBangla || p.categoryId?.nameBangla || "").toLowerCase().includes(s);
    const variantBarcodeMatch = p.variants?.some((v: any) => v.barcode?.includes(s) || v.sku?.toLowerCase().includes(s));
    return nameMatch || brandMatch || catMatch || variantBarcodeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy tracking-tight">
            লাগেজ ও পণ্য ক্যাটালগ ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            মোট {toBengaliNumber(products.length)} টি পণ্য এবং ভ্যারিয়েন্ট ডাটাবেসে নিবন্ধিত
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            if (categories.length > 0 && !categoryId) setCategoryId(categories[0]._id);
            if (brands.length > 0 && !brandId) setBrandId(brands[0]._id);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-teal hover:bg-brand-tealLight text-white font-bold text-xs shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন লাগেজ যুক্ত করুন</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="পণ্যের নাম, ব্র্যান্ড, বারকোড বা SKU দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
        <button
          onClick={loadData}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-teal" />
            <span>পণ্য তালিকা লোড হচ্ছে...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            কোনো পণ্য পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">পণ্য ও ছবি</th>
                  <th className="py-3 px-4">ক্যাটাগরি ও ব্র্যান্ড</th>
                  <th className="py-3 px-4">ভ্যারিয়েন্টসমূহ (সাইজ, বারকোড ও স্টক)</th>
                  <th className="py-3 px-4">খুচরা মূল্য</th>
                  <th className="py-3 px-4 text-center">মোট স্টক</th>
                  <th className="py-3 px-4 text-center">বারকোড ও অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((prod) => {
                  const totalStock = prod.totalStock ?? prod.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) ?? 0;
                  const thumb = prod.images?.[0]?.secureUrl || "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=800";
                  const brandName = prod.brand?.name || prod.brandId?.name || "Lumina";
                  const catName = prod.category?.nameBangla || prod.categoryId?.nameBangla || "লাগেজ";
                  const primaryPrice = prod.variants?.[0]?.retailPricePoisha || 0;

                  return (
                    <tr key={prod._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Thumbnail & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                            <Image src={thumb} alt="" fill className="object-cover" />
                          </div>
                          <div>
                            <span className="font-bold text-brand-navy block line-clamp-1">
                              {prod.nameBangla}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {prod.nameEnglish || prod.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-700 block w-fit mb-0.5">
                          {catName}
                        </span>
                        <span className="text-[10px] text-brand-teal font-bold">
                          {brandName}
                        </span>
                      </td>

                      {/* Variants list (20", 24", 28") with SKU & Barcode */}
                      <td className="py-3.5 px-4 space-y-1">
                        {prod.variants?.map((v: any) => (
                          <div
                            key={v._id || v.sku}
                            className="flex items-center gap-2 text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100"
                          >
                            <span className="font-bold text-brand-navy">
                              {v.nameVariant || `${v.size || ""} ${v.color || ""}`}:
                            </span>
                            <span className="font-mono text-slate-500">বারকোড: {v.barcode}</span>
                            <span className={`font-semibold ${v.stock <= 3 ? "text-rose-600 font-bold" : "text-emerald-700"}`}>
                              স্টক: {toBengaliNumber(v.stock || 0)}
                            </span>
                          </div>
                        ))}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-brand-navy">
                        {formatBDT(primaryPrice)}
                      </td>

                      {/* Total Stock */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            totalStock > 5
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {toBengaliNumber(totalStock)} পিস
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/admin/products/barcode/${prod._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-brand-teal font-semibold text-[11px] transition-colors"
                            title="বারকোড স্টিকার প্রিন্ট করুন"
                          >
                            <Barcode className="w-3.5 h-3.5 text-brand-teal" />
                            <span>বারকোড</span>
                          </Link>

                          <button
                            onClick={() => handleDeleteProduct(prod._id, prod.nameBangla)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="আর্কাইভ / ডিলিট"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-brand-navy">
                নতুন লাগেজ বা পণ্য যুক্ত করুন
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    পণ্যের নাম (বাংলা) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameBangla}
                    onChange={(e) => setNameBangla(e.target.value)}
                    placeholder="যেমন: প্রেসিডেন্ট প্রিমিয়াম ট্রলি লাগেজ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-brand-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    পণ্যের নাম (ইংরেজি)
                  </label>
                  <input
                    type="text"
                    value={nameEnglish}
                    onChange={(e) => setNameEnglish(e.target.value)}
                    placeholder="e.g. President Premium Trolley"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-brand-teal focus:outline-none"
                  />
                </div>
              </div>

              {/* Brand and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ব্র্যান্ড *
                  </label>
                  <select
                    required
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-brand-teal focus:outline-none"
                  >
                    <option value="">ব্র্যান্ড নির্বাচন করুন</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ক্যাটাগরি *
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-brand-teal focus:outline-none"
                  >
                    <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.nameBangla} ({c.nameEnglish || ""})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  পণ্যের ছবি (Cloudinary Image Upload)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-700 font-semibold transition-colors">
                    <Upload className="w-3.5 h-3.5 text-brand-teal" />
                    <span>{uploadingImage ? "আপলোড হচ্ছে..." : "ছবি নির্বাচন করুন"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                  {imageUrl && (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                      <Image src={imageUrl} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="অথবা সরাসরি ছবির লিঙ্ক দিন..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  বিবরণ ও স্পেসিফিকেশন (বাংলা)
                </label>
                <textarea
                  rows={2}
                  value={descriptionBangla}
                  onChange={(e) => setDescriptionBangla(e.target.value)}
                  placeholder="পলিকার্বোনেট শেল, TSA লক, ৮ চাকা..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-brand-teal focus:outline-none"
                />
              </div>

              {/* Variants Section */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    ভ্যারিয়েন্টসমূহ (সাইজ, কালার, মূল্য ও প্রাথমিক স্টক)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="text-brand-teal hover:underline font-bold flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="w-3 h-3" />
                    <span>ভ্যারিয়েন্ট যোগ করুন</span>
                  </button>
                </div>

                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 items-end"
                  >
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 font-semibold">ভ্যারিয়েন্ট নাম / সাইজ</label>
                      <input
                        type="text"
                        value={v.nameVariant}
                        onChange={(e) => handleVariantChange(idx, "nameVariant", e.target.value)}
                        placeholder="২০ ইঞ্চি - কালো"
                        className="w-full px-2 py-1.5 rounded border border-slate-200 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold">ক্রয়মূল্য (৳)</label>
                      <input
                        type="number"
                        value={v.purchaseCostBDT}
                        onChange={(e) => handleVariantChange(idx, "purchaseCostBDT", e.target.value)}
                        placeholder="3200"
                        className="w-full px-2 py-1.5 rounded border border-slate-200 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold">বিক্রয়মূল্য (৳)</label>
                      <input
                        type="number"
                        value={v.retailPriceBDT}
                        onChange={(e) => handleVariantChange(idx, "retailPriceBDT", e.target.value)}
                        placeholder="4800"
                        className="w-full px-2 py-1.5 rounded border border-slate-200 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold">স্টক (পিস)</label>
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
                        placeholder="10"
                        className="w-full px-2 py-1.5 rounded border border-slate-200 text-[11px]"
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        disabled={variants.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        title="মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-brand-teal hover:bg-brand-tealLight text-white font-bold disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "পণ্য সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
