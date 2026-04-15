export interface PacificaAsset {
  symbol: string;
  mark: number;
  funding: string;
  next_funding: string;
  open_interest: string;
  volume_24h: string;
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

export async function fetchPacificaPrices(): Promise<PacificaPrices | null> {
  try {
    const res = await fetch("https://app.pacifica.fi/api/v1/info/prices");
    if (!res.ok) throw new Error(`Pacifica API ${res.status}`);
    const json = await res.json();
    const items: any[] = json?.data ?? json ?? [];

    const result: PacificaPrices = { bitcoin: null, ethereum: null, solana: null };

    for (const item of items) {
      const sym = item.symbol ?? item.coin ?? "";
      const key = SYMBOL_MAP[sym];
      if (key) {
        result[key] = {
          symbol: sym,
          mark: parseFloat(item.mark) || 0,
          funding: item.funding ?? "0",
          next_funding: item.next_funding ?? "0",
          open_interest: item.open_interest ?? "0",
          volume_24h: item.volume_24h ?? "0",
        };
      }
    }

    // Validate we got at least BTC
    if (!result.bitcoin) return null;
    return result;
  } catch (err) {
    console.error("Pacifica API error:", err);
    return null;
  }
}

export function formatFundingRate(funding: string): string {
  const num = parseFloat(funding);
  if (isNaN(num) || num === 0) return "0.0000%";
  const pct = num * 100;
  return `${num > 0 ? "+" : ""}${pct.toFixed(4)}%`;
}

export function formatOpenInterest(oi: string): string {
  const num = parseFloat(oi);
  if (isNaN(num)) return "$0";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

export function getFundingColor(funding: string): string {
  const num = parseFloat(funding);
  if (num > 0) return "text-success";
  if (num < 0) return "text-danger";
  return "";
}
