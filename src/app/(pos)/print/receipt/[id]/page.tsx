"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, RefreshCw } from "lucide-react";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import { generateBarcodeSVG } from "@/lib/barcode/code128";
import { STORE_INFO } from "@/lib/config/storeInfo";
import { useShopSettings } from "@/context/ShopSettingsContext";

export default function ReceiptPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;
  const { settings } = useShopSettings();
  const [format, setFormat] = useState<"80mm" | "58mm" | "a4">("80mm");
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check URL query parameter for preselected format
    const urlParams = new URLSearchParams(window.location.search);
    const requestedFormat = urlParams.get("format");
    if (requestedFormat === "58mm" || requestedFormat === "80mm" || requestedFormat === "a4") {
      setFormat(requestedFormat);
    }

    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/pos/invoices/${invoiceId}`);
        const data = await res.json();
        if (data.invoice) {
          setInvoice(data.invoice);
        }
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-teal mx-auto" />
          <p className="text-xs text-slate-500">ইনভয়েস প্রস্তুত হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-sm">
          <p className="text-sm text-slate-700 font-bold">ইনভয়েস পাওয়া যায়নি</p>
          <Link href="/pos" className="mt-3 inline-block text-xs text-brand-teal font-bold">
            পিওএস-এ ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  const barcodeSvg = generateBarcodeSVG(invoice.invoiceNumber, {
    height: 35,
    barWidth: 1.5,
    showText: false,
  });

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      {/* Top Controls Bar (hidden during actual print) */}
      <div className="no-print max-w-xl mx-auto mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/pos"
          className="text-xs text-slate-600 hover:text-brand-navy flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>পিওএস-এ ফিরে যান</span>
        </Link>

        {/* Paper Format Switcher */}
        <div className="flex flex-wrap justify-center items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFormat("80mm")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              format === "80mm" ? "bg-white text-brand-navy shadow-xs" : "text-slate-600"
            }`}
          >
            ৮০ মিমি থার্মাল
          </button>
          <button
            onClick={() => setFormat("58mm")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              format === "58mm" ? "bg-white text-brand-navy shadow-xs" : "text-slate-600"
            }`}
          >
            ৫৮ মিমি থার্মাল
          </button>
          <button
            onClick={() => setFormat("a4")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              format === "a4" ? "bg-white text-brand-navy shadow-xs" : "text-slate-600"
            }`}
          >
            A4 পূর্ণ চালান
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-teal text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>প্রিন্ট করুন</span>
        </button>
      </div>

      {/* Printable Area */}
      <div className="flex justify-center print:block">
        {/* ======================= FORMAT 1: 80MM THERMAL RECEIPT ======================= */}
        {format === "80mm" && (
          <div className="receipt-80mm bg-white p-4 shadow-md rounded-xl max-w-[80mm] w-full text-slate-900 font-sans print:shadow-none print:p-1 print:max-w-none">
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-2">
              <img src="/logo.png" alt={settings.name} className="w-10 h-10 mx-auto mb-1.5 object-contain" />
              <h2 className="text-sm font-black tracking-tight">{settings.name}</h2>
              <p className="text-[11px] font-bold text-slate-800">{settings.nameBangla}</p>
              <p className="text-[10px] text-slate-600">{settings.address}</p>
              <p className="text-[9px] text-slate-500">
                প্রোপাইটর: {settings.owners}
              </p>
              <p className="text-[9px] text-slate-600 font-medium">
                মোবাইল: {settings.mobile} • ইমেইল: {settings.email}
              </p>
            </div>

            {/* Meta */}
            <div className="text-[10px] py-1.5 border-b border-dashed border-slate-300 space-y-0.5">
              <div className="flex justify-between">
                <span>চালান: <strong>{invoice.invoiceNumber}</strong></span>
                <span className="font-mono">{new Date(invoice.createdAt).toLocaleDateString("bn-BD")}</span>
              </div>
              <div className="flex justify-between">
                <span>কাস্টমার: <strong>{invoice.customerName}</strong></span>
                {invoice.customerPhone && <span>{invoice.customerPhone}</span>}
              </div>
              <div className="text-[9px] text-slate-500">
                বিক্রয় প্রতিনিধি: {invoice.salesPersonName || "ক্যাশিয়ার"}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-[10px] my-2">
              <thead>
                <tr className="border-b border-slate-300 text-left font-bold">
                  <th className="py-1">বিবরণ</th>
                  <th className="py-1 text-center">পরিমাণ</th>
                  <th className="py-1 text-right">মূল্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-200">
                {invoice.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="py-1">
                    <td className="py-1 pr-1">
                      <span className="font-bold block leading-tight">{item.productNameBangla}</span>
                      <span className="text-[8px] text-slate-500">{item.variantName}</span>
                    </td>
                    <td className="py-1 text-center font-bold">{toBengaliNumber(item.quantity)}</td>
                    <td className="py-1 text-right font-bold">{formatBDT(item.totalAmountPoisha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-dashed border-slate-300 pt-1.5 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>উপ-মোট:</span>
                <span>{formatBDT(invoice.subTotalPoisha)}</span>
              </div>
              {invoice.orderDiscountPoisha > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>ডিসকাউন্ট:</span>
                  <span>- {formatBDT(invoice.orderDiscountPoisha)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300">
                <span>সর্বমোট বিল:</span>
                <span>{formatBDT(invoice.grandTotalPoisha)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>পরিশোধিত অর্থ:</span>
                <span>{formatBDT(invoice.paidAmountPoisha)}</span>
              </div>
              {invoice.dueAmountPoisha > 0 && (
                <div className="flex justify-between font-bold text-rose-600">
                  <span>বকেয়া (Due):</span>
                  <span>{formatBDT(invoice.dueAmountPoisha)}</span>
                </div>
              )}
            </div>

            {/* Barcode & Footer */}
            <div className="text-center pt-3 mt-2 border-t border-dashed border-slate-300">
              <div
                className="flex justify-center my-1"
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />
              <p className="text-[9px] font-mono font-bold tracking-widest">{invoice.invoiceNumber}</p>
              <p className="text-[8px] text-slate-500 mt-1">
                * {settings.receiptFooter || "বিক্রিত পণ্য ৭ দিনের মধ্যে মেমোসহ পরিবর্তনযোগ্য (টাকা ফেরতযোগ্য নয়)"} *
              </p>
              <p className="text-[9px] font-bold mt-1 text-slate-700">ধন্যবাদ! আবার আসবেন।</p>
            </div>
          </div>
        )}

        {/* ======================= FORMAT 2: 58MM THERMAL RECEIPT ======================= */}
        {format === "58mm" && (
          <div className="receipt-58mm bg-white p-2 shadow-md rounded-lg max-w-[58mm] w-full text-slate-900 font-sans text-[9px] leading-tight print:shadow-none print:p-0 print:max-w-none">
            <div className="text-center border-b border-dashed border-slate-400 pb-1.5">
              <h2 className="text-xs font-black">{settings.name}</h2>
              <p className="text-[9px] font-bold">{settings.nameBangla}</p>
              <p className="text-[8px] text-slate-600">{settings.shortAddress}</p>
              <p className="text-[8px] text-slate-500">ফোন: {settings.mobile}</p>
            </div>

            <div className="py-1 border-b border-dashed border-slate-300 text-[8px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>#{invoice.invoiceNumber.replace("INV-", "")}</span>
                <span>{new Date(invoice.createdAt).toLocaleDateString("bn-BD")}</span>
              </div>
              <div>গ্রাহক: {invoice.customerName}</div>
            </div>

            <div className="py-1 space-y-1">
              {invoice.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="pr-1">
                    <span className="font-bold block">{item.productNameBangla}</span>
                    <span className="text-[7px] text-slate-500">{item.variantName} × {toBengaliNumber(item.quantity)}</span>
                  </div>
                  <span className="font-bold">{formatBDT(item.totalAmountPoisha)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-400 pt-1 space-y-0.5">
              <div className="flex justify-between font-black text-[10px]">
                <span>মোট:</span>
                <span>{formatBDT(invoice.grandTotalPoisha)}</span>
              </div>
              <div className="flex justify-between">
                <span>জমা:</span>
                <span>{formatBDT(invoice.paidAmountPoisha)}</span>
              </div>
              {invoice.dueAmountPoisha > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>বাকি:</span>
                  <span>{formatBDT(invoice.dueAmountPoisha)}</span>
                </div>
              )}
            </div>

            <div className="text-center pt-2 mt-1 border-t border-dashed border-slate-300 text-[7px] text-slate-500">
              <p>{settings.receiptFooter || "৭ দিনের মধ্যে মেমোসহ পরিবর্তনযোগ্য"}</p>
              <p className="font-bold text-slate-700 mt-0.5">ধন্যবাদ!</p>
            </div>
          </div>
        )}

        {/* ======================= FORMAT 3: A4 TAX INVOICE ======================= */}
        {format === "a4" && (
          <div className="invoice-a4 bg-white p-8 sm:p-12 shadow-md rounded-2xl max-w-3xl w-full border border-slate-200 text-xs text-slate-900 print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-brand-navy pb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/logo.png"
                  alt={settings.name}
                  className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1 flex-shrink-0"
                />
                <div>
                  <h1 className="text-xl font-bold text-brand-navy">{settings.name}</h1>
                  <p className="text-sm font-semibold text-brand-teal">{settings.nameBangla}</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {settings.address}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    প্রোপাইটর: <strong>{settings.owners}</strong> • মোবাইল: <strong>{settings.mobile}</strong>
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    ইমেইল: {settings.email} • ফেসবুক: {settings.facebookPageLink}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-brand-teal uppercase">বিক্রয় চালান / ক্যাশ মেমো</span>
                <p className="font-mono font-bold text-brand-navy text-sm mt-1">{invoice.invoiceNumber}</p>
                <p className="text-[10px] text-slate-500">
                  তারিখ: {new Date(invoice.createdAt).toLocaleString("bn-BD")}
                </p>
              </div>
            </div>

            {/* Customer & Billing Info */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-[11px]">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">কাস্টমার তথ্য:</span>
                <strong className="text-brand-navy text-xs">{invoice.customerName}</strong>
                {invoice.customerPhone && <p className="text-slate-600">মোবাইল: {invoice.customerPhone}</p>}
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">কাউন্টার ও স্টাফ:</span>
                <p className="font-semibold text-brand-navy">{invoice.salesPersonName || "ক্যাশিয়ার"}</p>
                <p className="text-slate-500">শাখা: প্রধান শোরুম (যমুনা ফিউচার পার্ক)</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left my-4 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 font-bold text-slate-700">
                  <th className="py-2 px-3">নং</th>
                  <th className="py-2 px-3">পণ্যের বিবরণ</th>
                  <th className="py-2 px-3">SKU / বারকোড</th>
                  <th className="py-2 px-3 text-center">পরিমাণ</th>
                  <th className="py-2 px-3 text-right">একক মূল্য</th>
                  <th className="py-2 px-3 text-right">মোট মূল্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <strong className="block text-slate-900">{item.productNameBangla}</strong>
                      <span className="text-[10px] text-slate-500">{item.variantName}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                      <div>{item.sku}</div>
                      <div>{item.barcode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">{toBengaliNumber(item.quantity)}</td>
                    <td className="py-2.5 px-3 text-right">{formatBDT(item.unitPricePoisha)}</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatBDT(item.totalAmountPoisha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals & Signatures */}
            <div className="flex justify-between items-start pt-4 border-t border-slate-200">
              <div className="max-w-sm space-y-2">
                <span className="font-bold text-slate-700 block">শর্তাবলী:</span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  ১. যেকোনো পরিবর্তনের জন্য অবশ্যই মূল ইনভয়েস প্রদর্শন করতে হবে।<br />
                  ২. ব্যবহৃত বা ক্ষতিগ্রস্ত কোনো ব্যাগ পরিবর্তনযোগ্য নয়।<br />
                  ৩. ওয়ারেন্টির ক্ষেত্রে প্রস্তুতকারকের শর্তাবলী প্রযোজ্য।
                </p>
                <div className="pt-2" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
              </div>

              <div className="w-64 space-y-1.5 text-right text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>উপ-মোট:</span>
                  <span>{formatBDT(invoice.subTotalPoisha)}</span>
                </div>
                {invoice.orderDiscountPoisha > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>ডিসকাউন্ট:</span>
                    <span>- {formatBDT(invoice.orderDiscountPoisha)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-brand-navy pt-1 border-t border-slate-200">
                  <span>সর্বমোট বিল:</span>
                  <span>{formatBDT(invoice.grandTotalPoisha)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>পরিশোধিত অর্থ:</span>
                  <span>{formatBDT(invoice.paidAmountPoisha)}</span>
                </div>
                {invoice.dueAmountPoisha > 0 && (
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>বকেয়া (Due):</span>
                    <span>{formatBDT(invoice.dueAmountPoisha)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Lines */}
            <div className="grid grid-cols-2 gap-8 pt-16 text-center text-xs">
              <div className="border-t border-slate-300 pt-2 text-slate-600 font-semibold">
                গ্রাহকের স্বাক্ষর
              </div>
              <div className="border-t border-slate-300 pt-2 text-slate-600 font-semibold">
                কর্তৃপক্ষের স্বাক্ষর
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
