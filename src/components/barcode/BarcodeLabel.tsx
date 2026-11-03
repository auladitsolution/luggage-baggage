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
  const barcodeSvg = useMemo(() => {
    return generateBarcodeSVG(barcode, {
      height: 40,
      barWidth: 1.8,
      showText: true,
      fontSize: 11,
    });
  }, [barcode]);

  return (
    <div className="w-[50mm] min-h-[35mm] p-2 bg-white border border-slate-300 rounded text-center flex flex-col justify-between items-center font-sans print:border-none print:p-0">
      {/* Store Header */}
      <div className="text-[10px] font-bold text-slate-800 tracking-tight leading-tight">
        {storeName}
      </div>

      {/* Product & Variant */}
      <div className="my-0.5">
        <div className="text-[11px] font-bold text-slate-900 leading-tight line-clamp-1">
          {productName}
        </div>
        <div className="text-[9px] text-slate-600 font-medium">
          {variantName} • <span className="font-mono">{sku}</span>
        </div>
      </div>

      {/* Barcode SVG */}
      <div
        className="my-1 flex justify-center items-center overflow-hidden"
        dangerouslySetInnerHTML={{ __html: barcodeSvg }}
      />

      {/* Price */}
      <div className="text-[12px] font-black text-slate-900 border-t border-dashed border-slate-300 pt-0.5 w-full">
        এমআরপি: {formatBDT(retailPricePoisha)}
      </div>
    </div>
  );
}

