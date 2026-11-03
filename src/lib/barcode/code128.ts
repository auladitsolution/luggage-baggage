/**
 * Code-128 (Subset B) Pure TypeScript SVG Barcode Generator
 * Works seamlessly in Browser, Node.js server, React SSR, and thermal receipt printing.
 */

// Code 128 encoding table patterns (widths of bars and spaces, 6 digits summing to 11)
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (106 is stop)
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/**
 * Generate SVG string for Code-128 Barcode
 */
export function generateBarcodeSVG(text: string, options: {
  height?: number;
  barWidth?: number;
  showText?: boolean;
  fontSize?: number;
} = {}): string {
  const height = options.height || 50;
  const barWidth = options.barWidth || 2;
  const showText = options.showText !== false;
  const fontSize = options.fontSize || 12;

  if (!text || text.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="${height}"></svg>`;
  }

  // Calculate Checksum & codes
  const codes: number[] = [START_CODE_B];
  let checkSum = START_CODE_B;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Code 128B maps ASCII 32 to 126 to values 0 to 94
    const value = charCode - 32;
    if (value >= 0 && value <= 95) {
      codes.push(value);
      checkSum += value * (i + 1);
    }
  }

  codes.push(checkSum % 103);
  codes.push(STOP_CODE);

  // Convert codes to bar pattern string
  let pattern = "";
  for (const c of codes) {
    pattern += CODE128_PATTERNS[c] || "";
  }

  // Draw SVG rects from width patterns
  let x = 10; // Left quiet zone
  let isBar = true;
  let rects = "";

  for (let i = 0; i < pattern.length; i++) {
    const width = parseInt(pattern[i], 10) * barWidth;
    if (isBar) {
      rects += `<rect x="${x}" y="5" width="${width}" height="${height}" fill="#000000" />`;
    }
    x += width;
    isBar = !isBar;
  }

  const totalWidth = x + 10; // Right quiet zone
  const totalHeight = showText ? height + fontSize + 12 : height + 10;

  let textSvg = "";
  if (showText) {
    textSvg = `<text x="${totalWidth / 2}" y="${height + fontSize + 6}" font-family="monospace" font-size="${fontSize}" font-weight="600" text-anchor="middle" fill="#1e293b">${text}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">${rects}${textSvg}</svg>`;
}

/**
 * Generate a unique SKU for a luggage variant
 * e.g., 'PRES-TRL-BLK-24'
 */
export function generateSKU(params: {
  brandSlug: string;
  categorySlug: string;
  color?: string;
  size?: string;
}): string {
  const brandPart = (params.brandSlug || "LUM").replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
  const catPart = (params.categorySlug || "LUG").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
  const colorPart = (params.color || "DEF").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
  const sizePart = (params.size || "STD").replace(/[^A-Za-z0-9]/g, "").replace(/inch/i, "").slice(0, 3).toUpperCase();

  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${brandPart}-${catPart}-${colorPart}-${sizePart}-${rand}`;
}

/**
 * Generate a random 12-digit unique retail barcode
 * Prefix: 2026 (Store year) + 8 random digits
 */
export function generateUniqueBarcode(): string {
  const prefix = "2026";
  const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${prefix}${randomPart}`;
}

