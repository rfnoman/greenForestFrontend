import { format, parseISO, isValid } from "date-fns";

export function formatCurrency(
  amount: string | number,
  currency: string = "USD"
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function formatDate(dateString: string, formatStr: string = "MMM d, yyyy"): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    return format(date, formatStr);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  return formatDate(dateString, "MMM d, yyyy h:mm a");
}

export function formatNumber(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

export function formatPercent(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(numValue / 100);
}

export function parseDecimal(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export function toDecimalString(value: number): string {
  return value.toFixed(2);
}
