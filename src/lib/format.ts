// A API não declara moeda. Exibimos unidades decimais sem presumir BRL/USD.
export function centsToInput(cents: number): string {
  if (!Number.isSafeInteger(cents))
    throw new Error(
      "Valor monetário fora da precisão suportada pelo navegador.",
    );
  const value = BigInt(cents);
  return `${value / BigInt(100)}.${(value % BigInt(100)).toString().padStart(2, "0")}`;
}

export function moneyToCents(input: string): number {
  const value = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error(
      "Informe um preço positivo com até duas casas decimais, sem separador de milhar.",
    );
  const [whole, decimals = ""] = value.split(".");
  // Evita parseFloat(valor) * 100, que pode introduzir arredondamento binário.
  const cents = BigInt(whole) * BigInt(100) + BigInt(decimals.padEnd(2, "0"));
  if (cents <= BigInt(0) || cents > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error(
      "Preço fora da precisão suportada pelo navegador ou menor que o mínimo de 0,01.",
    );
  return Number(cents);
}

export function formatMoney(cents: number): string {
  if (!Number.isSafeInteger(cents))
    return "Valor fora da precisão do navegador";
  const [whole, decimals] = centsToInput(cents).split(".");
  return `${BigInt(whole).toLocaleString("pt-BR")},${decimals}`;
}

export function integerInput(value: string, allowZero = false): number {
  if (!/^\d+$/.test(value)) throw new Error("Informe uma quantidade inteira.");
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < (allowZero ? 0 : 1))
    throw new Error(
      "Quantidade inválida ou fora da precisão suportada pelo navegador.",
    );
  return result;
}

export function formatInteger(value: number): string {
  return Number.isSafeInteger(value)
    ? value.toLocaleString("pt-BR")
    : "Fora da precisão do navegador";
}

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}
