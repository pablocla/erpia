import { describe, it, expect } from "vitest";
import { formatCurrency, formatNumber, formatDate, formatDateTime } from "../../lib/i18n/formatters";

describe("i18n formatters", () => {
  it("formatCurrency ARS", () => {
    const formatted = formatCurrency(1234.56, "es-AR");
    // Depending on the local Node Intl implementation, the space might be non-breaking
    expect(formatted.replace(/\s/g, "")).toMatch(/1\.234,56|1234,56/);
  });

  it("formatCurrency USD", () => {
    const formatted = formatCurrency(1234.56, "en-US");
    expect(formatted).toContain("1,234.56");
  });

  it("formatNumber", () => {
    expect(formatNumber(1234.56, "en-US")).toBe("1,234.56");
  });

  it("formatDate", () => {
    const date = new Date("2024-01-15T10:00:00Z");
    expect(formatDate(date, "en-US")).toBe("01/15/2024");
    expect(formatDate(date, "es-AR")).toBe("15/01/2024");
  });
});
