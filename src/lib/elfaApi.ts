const ELFA_BASE = "https://api.elfa.ai";
const API_KEY = import.meta.env.VITE_ELFA_API_KEY;

export interface BuzzResult {
  score: number;
  label: string;
}

const cache: Record<string, BuzzResult> = {};

function getLabel(score: number): string {
  if (score <= 30) return "Baixa atividade nas redes";
  if (score <= 60) return "Atividade moderada nas redes";
  if (score <= 80) return "Alta atividade nas redes";
  return "Atividade explosiva nas redes";
}

async function fetchTopMentions(ticker: string): Promise<BuzzResult | null> {
  try {
    const res = await fetch(
      `${ELFA_BASE}/v2/data/top-mentions?ticker=${ticker}&timeWindow=24h&pageSize=20`,
      { headers: { "x-elfa-api-key": API_KEY } }
    );
    console.log("Elfa top-mentions status:", res.status);
    if (!res.ok) throw new Error(`Elfa top-mentions ${res.status}`);
    const data = await res.json();
    console.log("Elfa top-mentions response:", JSON.stringify(data, null, 2));

    const totalEngajamento =
      data?.data?.reduce(
        (sum: number, item: any) => sum + (item.likes || 0) + (item.retweets || 0),
        0
      ) ?? 0;

    const buzzRaw = Math.min(totalEngajamento / 100, 100);
    const score = Math.round(buzzRaw);
    return { score, label: getLabel(score) };
  } catch (error) {
    console.error("Elfa top-mentions error:", error);
    return null;
  }
}

async function fetchTrendingTokens(ticker: string): Promise<BuzzResult | null> {
  try {
    const res = await fetch(
      `${ELFA_BASE}/v2/aggregations/trending-tokens?timeWindow=24h&pageSize=50`,
      { headers: { "x-elfa-api-key": API_KEY } }
    );
    console.log("Elfa trending-tokens status:", res.status);
    if (!res.ok) throw new Error(`Elfa trending-tokens ${res.status}`);
    const data = await res.json();
    console.log("Elfa trending-tokens response:", JSON.stringify(data, null, 2));

    const tokenData = data?.data?.find(
      (t: any) =>
        t.token?.toUpperCase() === ticker.toUpperCase() ||
        t.symbol?.toUpperCase() === ticker.toUpperCase()
    );
    console.log("Token encontrado:", tokenData);

    if (tokenData) {
      const mencoes = tokenData?.mentions || tokenData?.count || 0;
      const score = Math.min(Math.round(mencoes / 10), 100);
      return { score, label: getLabel(score) };
    }
    return null;
  } catch (error) {
    console.error("Elfa trending-tokens error:", error);
    return null;
  }
}

export async function getBuzzScore(ticker: string): Promise<BuzzResult> {
  // Try top-mentions first
  let result = await fetchTopMentions(ticker);
  if (result) {
    cache[ticker] = result;
    return result;
  }

  // Fallback: trending-tokens
  result = await fetchTrendingTokens(ticker);
  if (result) {
    cache[ticker] = result;
    return result;
  }

  // Final fallback
  return cache[ticker] ?? { score: 50, label: getLabel(50) };
}

export async function pingElfa(): Promise<void> {
  try {
    const res = await fetch(`${ELFA_BASE}/v2/ping`, {
      headers: { "x-elfa-api-key": API_KEY },
    });
    console.log("Elfa ping status:", res.status);
    const data = await res.json();
    console.log("Elfa ping response:", data);
  } catch (error) {
    console.error("Elfa ping error:", error);
  }
}
