import { useState, useEffect } from "react";
import { Trophy, Flame, Copy, Check, ArrowUp, ArrowDown } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface PredictionRow {
  mode: string;
  asset: string;
  direction: string | null;
  variation_real: number;
  result: boolean;
  trophies_delta: number;
  created_at: string;
}

const cardStyle = { border: "1px solid rgba(92,200,232,0.15)" };

const LEAGUE_THRESHOLDS: { league: string; min: number; next: number }[] = [
  { league: "Bronze", min: 0, next: 300 },
  { league: "Prata", min: 300, next: 800 },
  { league: "Ouro", min: 800, next: 1800 },
  { league: "Platina", min: 1800, next: 3500 },
  { league: "Diamante", min: 3500, next: 6000 },
  { league: "Lendária", min: 6000, next: 99999 },
];

const NEXT_LEAGUE: Record<string, string> = {
  Bronze: "Prata", Prata: "Ouro", Ouro: "Platina", Platina: "Diamante", Diamante: "Lendária", "Lendária": "Lendária",
};

const Profile = () => {
  const [copied, setCopied] = useState(false);
  const { user } = useUser();
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [hitRate, setHitRate] = useState(0);

  useEffect(() => {
    if (!user || user.id === "local") return;
    const fetchPredictions = async () => {
      try {
        const { data, error } = await supabase
          .from("predictions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!error && data) {
          setPredictions(data as PredictionRow[]);
        }

        // Get total count
        const { count } = await supabase
          .from("predictions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const total = count ?? 0;
        setTotalPredictions(total);

        // Get hit rate
        if (total > 0) {
          const { count: wins } = await supabase
            .from("predictions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("result", true);
          setHitRate(Math.round(((wins ?? 0) / total) * 100));
        }
      } catch (err) {
        console.error("Profile predictions error:", err);
      }
    };
    fetchPredictions();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText("https://pacifica.fi/pulse/pedro_ITA");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tweetText = encodeURIComponent("🌊 Estou jogando Pacifica Pulse! Preveja cripto e ganhe troféus 🏆\n\nEntre pelo meu link 👇");
  const tweetUrl = encodeURIComponent("https://pacifica.fi/pulse/pedro_ITA");

  const userTrophies = user?.trophies ?? 0;
  const userStreak = user?.streak ?? 0;
  const userLeague = user?.league ?? "Bronze";
  const leagueInfo = LEAGUE_THRESHOLDS.find((l) => l.league === userLeague) ?? LEAGUE_THRESHOLDS[0];
  const progressPct = leagueInfo.next > leagueInfo.min
    ? Math.min(100, Math.round(((userTrophies - leagueInfo.min) / (leagueInfo.next - leagueInfo.min)) * 100))
    : 100;
  const faltam = Math.max(0, leagueInfo.next - userTrophies);

  const assetMeta: Record<string, { icon: string; color: string }> = {
    BTC: { icon: "₿", color: "text-warning" },
    ETH: { icon: "Ξ", color: "text-pacific" },
    SOL: { icon: "S", color: "text-success" },
  };

  return (
    <div className="min-h-screen bg-ocean-dark font-dm-sans flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-ocean-button flex items-center justify-center text-foreground font-bold text-xl border-2 border-pacific">
              {(user?.username ?? "PE").slice(0, 2).toUpperCase()}
            </div>
            <div className="text-center">
              <h1 className="text-foreground text-2xl font-bold">{user?.username ?? "Pedro"}</h1>
              <p className="text-ocean-muted text-sm">@{(user?.username ?? "pedro").toLowerCase()}_ITA</p>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full mt-1">
              {[
                { label: "Liga", value: userLeague },
                { label: "Troféus", value: userTrophies.toLocaleString() },
                { label: "Streak", value: `${userStreak} dias` },
              ].map((s) => (
                <div key={s.label} className="rounded-[16px] bg-card-surface p-3 flex flex-col items-center gap-0.5" style={cardStyle}>
                  <span className="text-ocean-muted text-[10px]">{s.label}</span>
                  <span className="text-foreground font-bold text-sm">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] bg-card-surface p-5" style={{ border: "1px solid rgba(245,166,35,0.3)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={20} className="text-warning" />
              <span className="text-foreground font-bold">Liga {userLeague}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-ocean-muted mb-1.5">
              <span>{userTrophies.toLocaleString()} troféus</span><span>{leagueInfo.next < 99999 ? leagueInfo.next.toLocaleString() : "MAX"}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-ocean-dark">
              <div className="h-full rounded-full bg-pacific transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            {userLeague !== "Lendária" && (
              <p className="text-ocean-muted text-xs mt-2">Faltam {faltam.toLocaleString()} troféus para subir para {NEXT_LEAGUE[userLeague]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Taxa de acerto", value: totalPredictions > 0 ? `${hitRate}%` : "—", color: "text-success" },
              { label: "Total de previsões", value: totalPredictions > 0 ? totalPredictions.toString() : "—", color: "text-foreground" },
              { label: "Melhor streak", value: `${userStreak} dias`, color: "text-warning" },
              { label: "Ranking global", value: "—", color: "text-pacific" },
            ].map((s) => (
              <div key={s.label} className="rounded-[16px] bg-card-surface p-4 flex flex-col gap-1" style={cardStyle}>
                <span className="text-ocean-muted text-xs">{s.label}</span>
                <span className={`${s.color} font-bold text-xl`}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-[16px] bg-card-surface p-5" style={{ border: "1px solid rgba(92,200,232,0.4)" }}>
            <h3 className="text-foreground font-bold mb-1">Convide amigos e ganhe</h3>
            <p className="text-ocean-muted text-xs mb-4">Você ganha troféus + % dos ganhos do amigo para sempre</p>
            <div className="flex items-center rounded-[8px] bg-ocean-dark px-3 py-2.5 mb-3">
              <span className="text-pacific text-sm truncate flex-1">pacifica.fi/pulse/pedro_ITA</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={handleCopy} className="h-10 rounded-[12px] bg-ocean-button text-foreground text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-80">
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                {copied ? "Copiado!" : "Copiar link"}
              </button>
              <a href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`} target="_blank" rel="noopener noreferrer"
                className="h-10 rounded-[12px] bg-ocean-button text-foreground text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-80">
                <XIcon /> Compartilhar
              </a>
            </div>
          </div>

          <div className="rounded-[16px] bg-card-surface p-5" style={cardStyle}>
            <h3 className="text-foreground font-bold mb-4">Últimas previsões</h3>
            {predictions.length === 0 ? (
              <p className="text-ocean-muted text-sm text-center py-4">Nenhuma previsão ainda. Jogue para começar!</p>
            ) : (
              <div className="flex flex-col">
                {predictions.map((p, i) => {
                  const meta = assetMeta[p.asset] ?? { icon: "?", color: "text-ocean-muted" };
                  const dirLabel = p.direction === "up" ? "subiu" : p.direction === "down" ? "caiu" : p.mode;
                  const date = new Date(p.created_at);
                  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

                  return (
                    <div key={i}>
                      <div className="flex items-center gap-3 py-3">
                        <div className={`w-9 h-9 rounded-full bg-ocean-dark flex items-center justify-center ${meta.color} font-bold text-sm shrink-0`}>{meta.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-sm font-medium">
                            {p.asset} {dirLabel}{" "}
                            <span className={p.result ? "text-success" : "text-danger"}>
                              {p.variation_real > 0 ? "+" : ""}{p.variation_real.toFixed(1)}%
                            </span>
                          </p>
                          <p className="text-ocean-muted text-[11px]">{dateStr}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {p.result ? <ArrowUp size={12} className="text-success" /> : <ArrowDown size={12} className="text-danger" />}
                          <span className={`text-sm font-bold ${p.result ? "text-success" : "text-danger"}`}>
                            {p.trophies_delta > 0 ? "+" : ""}{p.trophies_delta}
                          </span>
                        </div>
                      </div>
                      {i < predictions.length - 1 && <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.06)" }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
