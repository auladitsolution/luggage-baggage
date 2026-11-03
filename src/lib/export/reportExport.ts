/**
 * CSV and Report Data Export Utilities (UTF-8 with BOM for Bengali hind siliguri support in Excel)
 */

export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columnHeaders: { key: keyof T; label: string; format?: (val: any) => string }[]
): string {
  if (!data || data.length === 0) return "";

  // UTF-8 BOM so Excel opens Bengali characters properly
  const BOM = "\uFEFF";

  const headerRow = columnHeaders.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");

  const rows = data.map((item) => {
    return columnHeaders
      .map((col) => {
        const val = item[col.key];
        const formatted = col.format ? col.format(val) : val !== undefined && val !== null ? String(val) : "";
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  return BOM + [headerRow, ...rows].join("\r\n");
}

export function downloadCSV(csvContent: string, filename: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

