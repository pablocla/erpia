/**
 * Utilities to build fixed-width strings for AFIP TXT reports.
 */

/**
 * Formats a number to a string with leading zeros.
 * @param num The number to format
 * @param length The total fixed length
 */
export function padLeft(num: number | string, length: number, char: string = "0"): string {
  return String(num).padStart(length, char);
}

/**
 * Formats a string with trailing spaces.
 * @param str The string to format
 * @param length The total fixed length
 */
export function padRight(str: string, length: number, char: string = " "): string {
  // ASCII / Latin-1 encoding, slice to max length
  return str.substring(0, length).padEnd(length, char);
}

/**
 * Formats a decimal number for AFIP TXT (no decimals points, e.g., 100.50 -> "00000000010050")
 * Assuming length includes decimals, standard AFIP is 15 length (13 int + 2 dec).
 * @param num Decimal number
 * @param totalLength Total length including the decimal places
 * @param decimalPlaces Number of decimal places
 */
export function formatDecimalFixed(num: number | string, totalLength: number = 15, decimalPlaces: number = 2): string {
  let val = Number(num);
  if (isNaN(val)) val = 0;
  
  // Convert to integer (multiply by 10^decimalPlaces and round)
  const multiplier = Math.pow(10, decimalPlaces);
  const intVal = Math.round(Math.abs(val) * multiplier);
  
  // Convert to string and pad
  let strVal = String(intVal).padStart(totalLength, "0");
  
  // AFIP uses signs? Usually positive, but some fields require sign if negative.
  // For Libro IVA Ventas, amounts are usually absolute.
  return strVal;
}

/**
 * Generates YYYYMMDD format for AFIP dates.
 */
export function formatAfipDate(date: Date): string {
  const y = date.getFullYear();
  const m = padLeft(date.getMonth() + 1, 2);
  const d = padLeft(date.getDate(), 2);
  return `${y}${m}${d}`;
}
