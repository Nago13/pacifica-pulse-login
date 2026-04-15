import { supabase } from "@/integrations/supabase/client";

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
    const { data, error } = await supabase.functions.invoke("elfa-buzz", {
      body: { ticker },
    });

    console.log("Elfa edge function result:", data, error);

    if (error) throw error;

    const result: BuzzResult = {
      score: data?.score ?? 50,
      label: data?.label ?? getLabel(50),
    };
    cache[ticker] = result;
    return result;
  } catch (error) {
    console.error("Buzz score error:", error);
    return cache[ticker] ?? { score: 50, label: getLabel(50) };
  }
}

// No longer needed - keeping stub for compatibility
export async function pingElfa(): Promise<void> {
  console.log("Elfa ping skipped - using edge function proxy");
}
