/**
 * Centralized formatting utilities for currency and dates across LORD ESPORTZ.
 * Guarantees zero duplicate currency symbols (never "₹₹") and zero "Invalid Date" outputs.
 */

/**
 * Formats a currency amount into a clean Indian Rupee representation.
 * Examples:
 *   5000 -> "₹5,000"
 *   "5000" -> "₹5,000"
 *   "₹50,000" -> "₹50,000" (never duplicate "₹₹")
 *   49 -> "₹49"
 *   0 -> "FREE"
 *   "0" -> "FREE"
 */
export function formatCurrency(
  amount: string | number | null | undefined,
  options: { freeLabel?: string; fallback?: string } = {}
): string {
  const { freeLabel = "FREE", fallback = "FREE" } = options;

  if (amount === null || amount === undefined || amount === "") {
    return fallback;
  }

  // If already marked as free
  if (typeof amount === "string" && (amount.trim().toUpperCase() === "FREE" || amount.trim().toUpperCase() === "FREE ENTRY")) {
    return freeLabel;
  }

  // Strip any pre-existing ₹ symbols, commas, and spaces
  const cleanStr = String(amount).replace(/₹/g, "").replace(/,/g, "").trim();
  const num = Number(cleanStr);

  if (isNaN(num)) {
    // If it's a non-numeric string, return cleanly without duplicate ₹
    return String(amount).startsWith("₹") ? String(amount) : `₹${amount}`;
  }

  if (num === 0) {
    return freeLabel;
  }

  return `₹${num.toLocaleString("en-IN")}`;
}

/**
 * Safely parses and formats any date input.
 * Supports ISO strings, timestamps, Date objects, and human date strings.
 * NEVER returns "Invalid Date".
 *
 * Example valid: "25 Sep 2026", "25 Sep 2026 • 6:30 PM"
 * Example missing/invalid: "Date not available"
 */
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

    // Check if it already contains formatted date with bullets/times (e.g. "SEP 28, 2026 • 6:00 PM IST")
    if (trimmed.includes("•") || trimmed.includes("IST") || trimmed.includes("LIVE TODAY")) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  if (!dateObj) {
    // If string is already readable, return it instead of "Invalid Date"
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
