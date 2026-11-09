"use client";

import { useMemo } from "react";
import { generateBarcodeSVG } from "@/lib/barcode/code128";
import { formatBDT } from "@/lib/utils";
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
  storeName = `${STORE_INFO.name} (${STORE_INFO.nameBangla})`,
}: BarcodeLabelProps) {
  // Generate responsive Code-128 SVG barcode
  const barcodeSvg = useMemo(() => {
    return generateBarcodeSVG(barcode, {
      height: 36,
      barWidth: 1.8,
      showText: true,
      fontSize: 10.5,
    });
  }, [barcode]);

  // Calculate dynamic font size to guarantee that the full Bengali product name fits on 1 line without cutting
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

  return (
    <div className="w-[50mm] min-h-[35mm] max-w-[50mm] px-1.5 py-1.5 bg-white border border-slate-300 rounded shadow-xs text-center flex flex-col justify-between items-center font-sans box-border overflow-hidden select-none print:border-none print:p-0 print:m-0 print:shadow-none print:w-[50mm] print:min-h-[35mm]">
      {/* Store Header */}
      <div className="w-full text-[9px] font-bold text-slate-800 tracking-tight leading-tight line-clamp-2">
        {storeName}
      </div>

      {/* Product Details Section */}
      <div className="w-full my-0.5 space-y-0.5">
        {/* Full Bengali Product Name: 1 line, responsive font size, NEVER cut off with ellipsis */}
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

      {/* Price / MRP */}
      <div className="w-full text-[11px] font-black text-slate-900 border-t border-dashed border-slate-300 pt-0.5 leading-tight text-center">
        এমআরপি: {formatBDT(retailPricePoisha)}
      </div>
    </div>
  );
}

