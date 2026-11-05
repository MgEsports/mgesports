/**
 * Centralized formatting utilities for currency and dates across LORD ESPORTZ Admin Portal.
 * Guarantees zero duplicate currency symbols (never "₹₹") and zero "Invalid Date" outputs.
 */

export function formatCurrency(
  amount: string | number | null | undefined,
  options: { freeLabel?: string; fallback?: string } = {}
): string {
  const { freeLabel = "FREE", fallback = "FREE" } = options;

  if (amount === null || amount === undefined || amount === "") {
    return fallback;
  }

  if (typeof amount === "string" && (amount.trim().toUpperCase() === "FREE" || amount.trim().toUpperCase() === "FREE ENTRY")) {
    return freeLabel;
  }

  const cleanStr = String(amount).replace(/₹/g, "").replace(/,/g, "").trim();
  const num = Number(cleanStr);

  if (isNaN(num)) {
    return String(amount).startsWith("₹") ? String(amount) : `₹${amount}`;
  }

  if (num === 0) {
    return freeLabel;
  }

  return `₹${num.toLocaleString("en-IN")}`;
}

export function formatDate(
  dateInput: string | number | Date | null | undefined,
  options: {
    includeTime?: boolean;
    timeStr?: string | null;
    fallback?: string;
  } = {}
): string {
  const { includeTime = false, timeStr, fallback = "Date not available" } = options;

  if (!dateInput) {
    return fallback;
  }

  let dateObj: Date | null = null;

  if (dateInput instanceof Date) {
    dateObj = isNaN(dateInput.getTime()) ? null : dateInput;
  } else if (typeof dateInput === "number") {
    const d = new Date(dateInput);
    dateObj = isNaN(d.getTime()) ? null : d;
  } else if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (!trimmed) return fallback;

    if (trimmed.includes("•") || trimmed.includes("IST") || trimmed.includes("LIVE TODAY")) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  if (!dateObj) {
    if (typeof dateInput === "string" && dateInput.length > 3) {
      return dateInput;
    }
    return fallback;
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const dateFormatted = `${day} ${month} ${year}`;

  if (includeTime) {
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${dateFormatted} • ${hours}:${minutes} ${ampm}`;
  }

  if (timeStr && timeStr.trim()) {
    return `${dateFormatted} • ${timeStr.trim()}`;
  }

  return dateFormatted;
}
