import { describe, it, expect } from "vitest";
import { localeFromPaisFiscal } from "../../lib/i18n/config";

describe("i18n config / localeResolver", () => {
  it("resolves default locale for AR", () => {
    expect(localeFromPaisFiscal("AR")).toBe("es-AR");
  });

  it("resolves en-US for US", () => {
    expect(localeFromPaisFiscal("US")).toBe("en-US");
  });

  it("resolves pt-BR for BR", () => {
    expect(localeFromPaisFiscal("BR")).toBe("pt-BR");
  });

  it("resolves default locale for missing or null", () => {
    expect(localeFromPaisFiscal(null)).toBe("es-AR");
    expect(localeFromPaisFiscal(undefined)).toBe("es-AR");
  });
});
