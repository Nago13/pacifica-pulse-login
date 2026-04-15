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

export async function getBuzzScore(ticker: string): Promise<BuzzResult> {
  try {
    const res = await fetch(
      `${ELFA_BASE}/v2/data/top-mentions?ticker=${ticker}&timeWindow=24h&pageSize=20`,
      { headers: { "x-elfa-api-key": API_KEY } }
    );
    if (!res.ok) throw new Error(`Elfa API ${res.status}`);
    const data = await res.json();

    const totalEngajamento =
      data?.data?.reduce(
        (sum: number, item: any) => sum + (item.likes || 0) + (item.retweets || 0),
        0
      ) ?? 0;

    const buzzRaw = Math.min(totalEngajamento / 100, 100);
    const score = Math.round(buzzRaw);
    const result: BuzzResult = { score, label: getLabel(score) };
    cache[ticker] = result;
    return result;
  } catch {
    // fallback: last known or 50
    return cache[ticker] ?? { score: 50, label: getLabel(50) };
  }
}
