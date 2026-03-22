// Format VND currency
export function formatVND(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + " tỷ";
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + " triệu";
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(0) + "K";
  }
  return value.toLocaleString("vi-VN") + " đ";
}

// Full VND format
export function formatVNDFull(value: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

// Convert unit to grams
export function toGrams(quantity: number, unit: string): number {
  switch (unit) {
    case "luong": return quantity * 37.5;
    case "chi": return quantity * 3.75;
    case "gram": return quantity;
    case "kg": return quantity * 1000;
    default: return quantity * 37.5;
  }
}

// Unit label
export function unitLabel(unit: string): string {
  const map: Record<string, string> = {
    luong: "lượng",
    chi: "chỉ",
    gram: "gram",
    kg: "kg",
  };
  return map[unit] ?? unit;
}

// Percentage change
export function pctChange(current: number, original: number): number {
  if (original === 0) return 0;
  return ((current - original) / original) * 100;
}

// Format date VN
export function formatDateVN(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
