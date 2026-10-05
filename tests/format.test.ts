import { describe, expect, it } from "vitest";
import {
  centsToInput,
  formatDate,
  formatMoney,
  integerInput,
  moneyToCents,
} from "@/lib/format";

describe("valores monetários e datas", () => {
  it.each([
    ["0,29", 29],
    ["19.99", 1999],
    ["100", 10000],
    ["1,2", 120],
    ["90071992547409.91", Number.MAX_SAFE_INTEGER],
  ])("converte %s sem multiplicação decimal imprecisa", (input, expected) => {
    expect(moneyToCents(input)).toBe(expected);
    expect(moneyToCents(centsToInput(expected))).toBe(expected);
  });
  it.each(["0", "-1", "1.999", "1e3", "1.000,00", "90071992547409.92", "abc"])(
    "rejeita %s sem arredondar silenciosamente",
    (input) => {
      expect(() => moneyToCents(input)).toThrow();
    },
  );
  it("exibe centavos sem atribuir moeda e sinaliza limites do JS", () => {
    expect(formatMoney(123456)).toBe("1.234,56");
    expect(formatMoney(Number.MAX_SAFE_INTEGER + 1)).toContain("precisão");
    expect(() => integerInput("2.5")).toThrow();
    expect(integerInput("0", true)).toBe(0);
  });
  it("trata ISO-8601 e datas inválidas de forma consistente", () => {
    expect(formatDate("not-a-date")).toBe("Data indisponível");
    expect(formatDate("2026-01-02T12:00:00Z")).not.toBe("Data indisponível");
  });
});
