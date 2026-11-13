"use client";

import { useMemo } from "react";
import { generateBarcodeSVG } from "@/lib/barcode/code128";
import { STORE_INFO } from "@/lib/config/storeInfo";

interface BarcodeLabelProps {
  productName: string;
  variantName: string;
  sku: string;
  barcode: string;
  retailPricePoisha: number;
  storeName?: string;
}

export function BarcodeLabel({
  productName,
  variantName,
  sku,
  barcode,
  retailPricePoisha,
  storeName = STORE_INFO.name,
}: BarcodeLabelProps) {
  // Sanitize store name: remove any Bengali/non-ASCII in parentheses so it stays purely English
  const cleanStoreName = useMemo(() => {
    return (storeName || STORE_INFO.name)
      .replace(/\s*\([^\x00-\x7F]+\)\s*/g, "")
      .trim() || STORE_INFO.name;
  }, [storeName]);

  // Generate responsive Code-128 SVG barcode
  const barcodeSvg = useMemo(() => {
    return generateBarcodeSVG(barcode, {
      height: 36,
      barWidth: 1.8,
      showText: true,
      fontSize: 10.5,
    });
  }, [barcode]);

  // Format English price without Bengali currency sign (e.g. 480000 -> "4,800")
  const formattedPrice = useMemo(() => {
    const taka = retailPricePoisha / 100;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(taka);
  }, [retailPricePoisha]);

  // Calculate dynamic font size to guarantee that the product name fits on 1 line without cutting
  const nameFontSize = useMemo(() => {
    const len = (productName || "").trim().length;
    if (len <= 14) return 11;
    if (len <= 18) return 10;
    if (len <= 23) return 9.2;
    if (len <= 28) return 8.4;
    if (len <= 34) return 7.6;
    if (len <= 40) return 7.0;
    return 6.5;
  }, [productName]);

  // Dynamic font size for MRP line to guarantee it stays strictly on 1 line
  const priceFontSize = useMemo(() => {
    const textLen = `MRP: ${formattedPrice} TK. (VAT Including)`.length;
    if (textLen <= 26) return 10;
    if (textLen <= 30) return 9.5;
    if (textLen <= 34) return 8.8;
    return 8;
  }, [formattedPrice]);

  return (
    <div className="w-[50mm] min-h-[35mm] max-w-[50mm] px-1.5 py-1.5 bg-white border border-slate-300 rounded shadow-xs text-center flex flex-col justify-between items-center font-sans box-border overflow-hidden select-none print:border-none print:p-0 print:m-0 print:shadow-none print:w-[50mm] print:min-h-[35mm]">
      {/* Store Header - English Only, no Bengali */}
      <div className="w-full text-[9px] font-bold text-slate-800 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis text-center">
        {cleanStoreName}
      </div>

      {/* Product Details Section */}
      <div className="w-full my-0.5 space-y-0.5">
        {/* Product Name in English: 1 line, responsive font size */}
        <div
          className="w-full font-bold text-slate-900 leading-tight whitespace-nowrap overflow-hidden text-center tracking-tight"
          style={{
            fontSize: `${nameFontSize}px`,
            letterSpacing: (productName || "").length > 25 ? "-0.25px" : "normal",
          }}
          title={productName}
        >
          {productName}
        </div>

        {/* Variant Info (Size / Color) */}
        {variantName && (
          <div className="w-full text-[8px] text-slate-600 font-medium leading-tight whitespace-nowrap overflow-hidden text-center tracking-tight">
            {variantName}
          </div>
        )}

        {/* SKU: Always on 1 line, never cut or broken across lines */}
        <div className="w-full text-[8.5px] font-mono font-bold text-slate-700 leading-tight whitespace-nowrap overflow-hidden text-center tracking-wide">
          {sku}
        </div>
      </div>

      {/* Responsive Barcode SVG (fits 100% inside card, zero overflow) */}
      <div
        className="w-full max-w-full my-0.5 flex justify-center items-center overflow-hidden [&>svg]:w-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:block"
        dangerouslySetInnerHTML={{ __html: barcodeSvg }}
      />

      {/* Price / MRP - Guaranteed strictly 1 single line in English */}
      <div
        className="w-full font-black text-slate-900 border-t border-dashed border-slate-300 pt-0.5 leading-tight text-center whitespace-nowrap tracking-tight"
        style={{ fontSize: `${priceFontSize}px` }}
      >
        MRP: {formattedPrice} TK. (VAT Including)
      </div>
    </div>
  );
}

