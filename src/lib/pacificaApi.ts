export interface PacificaAsset {
  symbol: string;
  mark: number;
  funding: string;
  next_funding: string;
  open_interest: string;
  volume_24h: string;
  yesterday_price: string;
  change24h: number;
}

export interface PacificaPrices {
  bitcoin: PacificaAsset | null;
  ethereum: PacificaAsset | null;
  solana: PacificaAsset | null;
}

const SYMBOL_MAP: Record<string, keyof PacificaPrices> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
};

async function fetchWithRetry(url: string, attempts = 3): Promise<any | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }
  return null;
}

export async function fetchPacificaPrices(): Promise<PacificaPrices | null> {
  const json = await fetchWithRetry("https://app.pacifica.fi/api/v1/info/prices");
  if (!json) return null;

  try {
    const items: any[] = json?.data ?? json ?? [];
    const result: PacificaPrices = { bitcoin: null, ethereum: null, solana: null };

    for (const item of items) {
      const sym = item.symbol ?? item.coin ?? "";
      const key = SYMBOL_MAP[sym];
      if (key) {
        const mark = parseFloat(item.mark) || 0;
        const yesterdayPrice = parseFloat(item.yesterday_price) || 0;
        const change24h = yesterdayPrice > 0
          ? ((mark - yesterdayPrice) / yesterdayPrice) * 100
          : 0;

        result[key] = {
          symbol: sym,
          mark,
          funding: item.funding ?? "0",
          next_funding: item.next_funding ?? "0",
          open_interest: item.open_interest ?? "0",
          volume_24h: item.volume_24h ?? "0",
          yesterday_price: item.yesterday_price ?? "0",
          change24h,
        };
      }
    }

    if (!result.bitcoin) return null;
    return result;
  } catch (err) {
    console.error("Pacifica API parse error:", err);
    return null;
  }
}

export function formatFundingRate(funding: string): string {
  const num = parseFloat(funding);
  if (isNaN(num) || num === 0) return "0.0000%";
  const pct = num * 100;
  return `${num > 0 ? "+" : ""}${pct.toFixed(4)}%`;
}

export function formatOpenInterest(oi: string, markPrice?: number): string {
  const num = parseFloat(oi);
  if (isNaN(num)) return "$0";
  const value = markPrice ? num * markPrice : num;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function getFundingColor(funding: string): string {
  const num = parseFloat(funding);
  if (num > 0) return "text-success";
  if (num < 0) return "text-danger";
  return "";
}

export function getFundingSentiment(funding: string): { text: string; color: string } {
  const num = parseFloat(funding);
  if (Math.abs(num) < 0.0001) return { text: "Mercado equilibrado", color: "#8BB8CC" };
  if (num > 0) return { text: "Mercado otimista — mais compradores que vendedores na Pacifica", color: "#1DB887" };
  return { text: "Mercado pessimista — mais vendedores que compradores na Pacifica", color: "#E84855" };
}
