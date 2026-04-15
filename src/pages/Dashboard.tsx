import { useState, useEffect, useCallback, useRef } from "react";
import bitcoinLogo from "@/assets/bitcoin-logo.png";
import oceanCoralBg from "@/assets/ocean-coral-bg.png";
import { Flame, Trophy, ArrowUp, ArrowDown, Package, Loader2, Gift } from "lucide-react";
import { getBuzzScore, type BuzzResult } from "@/lib/elfaApi";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import GameModeSelector, { type GameMode } from "@/components/GameModeSelector";
import BattleMode from "@/components/BattleMode";
import PrecisionMode from "@/components/PrecisionMode";
import type { PrecisionRange } from "@/components/PrecisionMode";
import { useUser } from "@/contexts/UserContext";

const API_URL_MULTI = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true&precision=2";
const COUNTDOWN_SECONDS = 60;

export interface CoinData {
  price: number;
  change24h: number;
}

export type CoinPrices = {
  bitcoin: CoinData | null;
  ethereum: CoinData | null;
  solana: CoinData | null;
};

const leagueBadgeColors: Record<string, string> = {
  Bronze: "bg-[#CD7F32] text-ocean-dark",
  Prata: "bg-[#A8B2BB] text-ocean-dark",
  Ouro: "bg-warning text-ocean-dark",
  Platina: "bg-pacific text-ocean-dark",
  Diamante: "bg-[#B9F2FF] text-ocean-dark",
  "Lendária": "bg-danger text-foreground",
};

const COIN_ID_MAP: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, checkChest, openChest, activePrediction, setActivePrediction, timeRemaining } = useUser();
  const [coins, setCoins] = useState<CoinPrices>({ bitcoin: null, ethereum: null, solana: null });
  const [flashing, setFlashing] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Chest state
  const [chestAvailable, setChestAvailable] = useState(false);
  const [chestReward, setChestReward] = useState<{ tipo: string; valor: number } | null>(null);
  const [showChestModal, setShowChestModal] = useState(false);

  const [gameMode, setGameMode] = useState<GameMode>("classic");

  // Derive active states from global context
  const anyPredictionActive = activePrediction !== null;
  const predictionActive = activePrediction?.mode === "classico";
  const battleActive = activePrediction?.mode === "batalha";
  const precisionActive = activePrediction?.mode === "precisao";
  const predictionDir = activePrediction?.direction as "up" | "down" | null ?? null;
  const predictionPrice = activePrediction?.priceInitial ?? null;
  const countdown = anyPredictionActive ? timeRemaining : 0;

  // Stats state
  const [acertosHoje, setAcertosHoje] = useState<string>("—");
  const [taxaAcerto, setTaxaAcerto] = useState<string>("—");
  const [ranking, setRanking] = useState<string>("—");

  // Buzz Score state
  const [buzzBTC, setBuzzBTC] = useState<BuzzResult | null>(null);
  const [buzzAll, setBuzzAll] = useState<Record<string, BuzzResult>>({});
  const buzzInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch BTC buzz score on mount + every 5 min
  useEffect(() => {
    const fetchBuzz = async () => {
      const result = await getBuzzScore("BTC");
      setBuzzBTC(result);
    };
    fetchBuzz();
    buzzInterval.current = setInterval(fetchBuzz, 5 * 60 * 1000);
    return () => { if (buzzInterval.current) clearInterval(buzzInterval.current); };
  }, []);

  // Fetch all buzz scores for battle mode
  useEffect(() => {
    if (gameMode !== "battle") return;
    const fetchAll = async () => {
      const [btc, eth, sol] = await Promise.all([
        getBuzzScore("BTC"),
        getBuzzScore("ETH"),
        getBuzzScore("SOL"),
      ]);
      setBuzzAll({ BTC: btc, ETH: eth, SOL: sol });
    };
    fetchAll();
  }, [gameMode]);

  // Check chest availability
  useEffect(() => {
    checkChest().then(setChestAvailable);
  }, [checkChest]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!user || user.id === "local") return;
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const [todayRes, allRes, rankRes] = await Promise.all([
        supabase.from("predictions").select("result").eq("user_id", user.id).gte("created_at", hoje),
        supabase.from("predictions").select("result").eq("user_id", user.id),
        supabase.from("users").select("id").gt("trophies", user.trophies),
      ]);
      const todayHits = todayRes.data?.filter((p: any) => p.result).length ?? 0;
      setAcertosHoje(String(todayHits));
      const total = allRes.data?.length ?? 0;
      const hits = allRes.data?.filter((p: any) => p.result).length ?? 0;
      setTaxaAcerto(total > 0 ? `${Math.round((hits / total) * 100)}%` : "0%");
      setRanking(`#${(rankRes.data?.length ?? 0) + 1}`);
    } catch {
      // keep fallback "—"
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleOpenChest = async () => {
    const reward = await openChest();
    if (reward) {
      setChestReward(reward);
      setShowChestModal(true);
      setChestAvailable(false);
    }
  };

  const fetchPrices = useCallback(async (): Promise<CoinPrices | null> => {
    try {
      const res = await fetch(API_URL_MULTI);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const newCoins: CoinPrices = {
        bitcoin: { price: data.bitcoin.usd, change24h: data.bitcoin.usd_24h_change },
        ethereum: { price: data.ethereum.usd, change24h: data.ethereum.usd_24h_change },
        solana: { price: data.solana.usd, change24h: data.solana.usd_24h_change },
      };
      setCoins(newCoins);
      setApiError(false);
      setFlashing(true);
      setTimeout(() => setFlashing(false), 300);
      return newCoins;
    } catch {
      setApiError(true);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(() => {
      if (!anyPredictionActive) fetchPrices();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices, anyPredictionActive]);

  const formatTimer = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const formatPrice = (p: number) =>
    Number(p.toFixed(2)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const price = coins.bitcoin?.price ?? null;
  const change24h = coins.bitcoin?.change24h ?? null;

  // ── Classic ──
  const handlePress = (dir: "up" | "down") => {
    if (anyPredictionActive || price === null) return;
    setActivePrediction({
      mode: "classico",
      asset: "BTC",
      direction: dir,
      priceInitial: price,
      startedAt: Date.now(),
      durationSeconds: COUNTDOWN_SECONDS,
    });
  };

  // ── Battle ──
  const handleBattleConfirm = (chosenCoin: string, arenaCoins: string[]) => {
    if (anyPredictionActive) return;
    const chosenTicker = COIN_ID_MAP[chosenCoin] ?? chosenCoin.toUpperCase();
    const pricesInitial: Record<string, number> = {};
    for (const coinId of arenaCoins) {
      const ticker = COIN_ID_MAP[coinId] ?? coinId.toUpperCase();
      const coinData = coins[coinId as keyof CoinPrices];
      pricesInitial[ticker] = coinData?.price ?? 0;
    }

    setActivePrediction({
      mode: "batalha",
      asset: chosenTicker,
      direction: chosenTicker,
      priceInitial: pricesInitial[chosenTicker] ?? 0,
      startedAt: Date.now(),
      durationSeconds: COUNTDOWN_SECONDS,
      assetsArena: arenaCoins,
      pricesInitial,
    });
  };

  // ── Precision ──
  const handlePrecisionConfirm = (range: PrecisionRange, reward: number) => {
    if (anyPredictionActive || price === null) return;
    setActivePrediction({
      mode: "precisao",
      asset: "BTC",
      direction: range,
      priceInitial: price,
      startedAt: Date.now(),
      durationSeconds: COUNTDOWN_SECONDS,
      precisionReward: reward,
    });
  };

  const timerLow = countdown < 10 && countdown > 0;

  const userTrophies = user?.trophies ?? 0;
  const userStreak = user?.streak ?? 0;
  const userLeague = user?.league ?? "Bronze";
  const initials = (user?.username ?? "PE").slice(0, 2).toUpperCase();

  // Helper to get prediction label
  const getPredictionLabel = () => {
    if (!activePrediction) return "";
    if (activePrediction.mode === "classico") {
      return predictionDir === "up" ? "SOBE ↑" : "CAI ↓";
    }
    if (activePrediction.mode === "batalha") {
      return `Apostou em ${activePrediction.direction}`;
    }
    if (activePrediction.mode === "precisao") {
      const rangeLabels: Record<string, string> = {
        "0-0.1": "< 0.1%",
        "0.1-0.5": "0.1% – 0.5%",
        "0.5-2": "0.5% – 2%",
        "2+": "> 2%",
      };
      return `Faixa ${rangeLabels[activePrediction.direction] ?? activePrediction.direction}`;
    }
    return "";
  };

  const getModeLabel = () => {
    if (!activePrediction) return "";
    if (activePrediction.mode === "classico") return "Clássico";
    if (activePrediction.mode === "batalha") return "Batalha";
    if (activePrediction.mode === "precisao") return "Precisão";
    return "";
  };

  const OceanBubbles = () => (
    <div className="ocean-bubbles">
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="bubble" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen font-dm-sans flex flex-col relative">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${oceanCoralBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="fixed inset-0 z-0 bg-ocean-dark/60" />
      <OceanBubbles />
      <header className="flex items-center justify-between px-4 py-3 sm:px-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ocean-button flex items-center justify-center text-foreground font-bold text-sm">{initials}</div>
          <span className="text-foreground font-medium text-sm">{user?.username ?? "Pedro"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flame size={18} className="text-warning" />
          <span className="text-foreground text-sm font-medium">Streak: {userStreak} dias</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Trophy size={16} className="text-pacific" />
            <span className="text-foreground text-sm font-bold">{userTrophies.toLocaleString()}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${leagueBadgeColors[userLeague] ?? "bg-warning text-ocean-dark"}`}>{userLeague}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-4 pb-24 gap-4 overflow-y-auto relative z-10">
        <GameModeSelector selected={gameMode} onSelect={setGameMode} disabled={anyPredictionActive} />

        {/* Active prediction card — visible across all modes */}
        {anyPredictionActive && (
          <div
            className="w-full max-w-lg rounded-[16px] p-4 flex items-center gap-3"
            style={{
              backgroundColor: "hsl(var(--ocean-button))",
              border: "1px solid hsl(var(--pacific))",
            }}
          >
            <img src={bitcoinLogo} alt="Bitcoin" className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-bold">
                {getModeLabel()} — {getPredictionLabel()}
              </p>
              <p className="text-ocean-muted text-xs">
                Aguardando resultado...
              </p>
            </div>
            <span className={`font-bold text-lg tabular-nums shrink-0 ${timerLow ? "text-danger" : "text-pacific"}`}>
              {formatTimer(countdown)}
            </span>
          </div>
        )}

        {gameMode === "classic" ? (
          <>
            <div className="w-full max-w-lg rounded-[16px] bg-card-surface p-5 sm:p-6" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
              <div className="flex items-center justify-between mb-5">
                <span className="text-ocean-muted text-xs uppercase tracking-wider font-medium">Previsão do dia</span>
                <span className={`font-bold text-lg tabular-nums ${predictionActive ? (timerLow ? "text-danger" : "text-pacific") : "text-pacific"}`}>
                  {predictionActive ? formatTimer(countdown) : "01:00"}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <img src={bitcoinLogo} alt="Bitcoin" className="w-10 h-10 rounded-full" />
                <div>
                  <span className="text-foreground text-2xl font-bold">Bitcoin</span>
                  <span className="text-ocean-muted text-sm ml-2">BTC</span>
                </div>
              </div>
              <div className="mb-1">
                {price === null ? (
                  <div className="h-14 w-72 rounded-lg bg-ocean-dark animate-pulse" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-foreground text-5xl font-bold transition-colors duration-300 ${flashing ? "animate-price-flash" : ""}`}>
                      ${formatPrice(price)}
                    </span>
                    {apiError && <span className="w-2 h-2 rounded-full bg-danger shrink-0" title="Sem atualização" />}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 mb-5">
                {change24h === null ? (
                  <div className="h-4 w-20 rounded bg-ocean-dark animate-pulse" />
                ) : (
                  <>
                    {change24h >= 0 ? <ArrowUp size={14} className="text-success" /> : <ArrowDown size={14} className="text-danger" />}
                    <span className={`text-sm font-medium ${change24h >= 0 ? "text-success" : "text-danger"}`}>
                      {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
                    </span>
                    <span className="text-ocean-muted text-xs ml-1">24h</span>
                  </>
                )}
              </div>
              <div className="h-px w-full mb-5" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-ocean-muted text-xs">Buzz Score</span>
                  {buzzBTC === null ? (
                    <div className="h-4 w-12 rounded bg-ocean-dark animate-pulse" />
                  ) : (
                    <span className="text-pacific text-xs font-bold">{buzzBTC.score}/100</span>
                  )}
                </div>
                <div className="w-full h-2 rounded-full bg-ocean-dark">
                  <div className="h-full rounded-full bg-pacific transition-all duration-500" style={{ width: `${buzzBTC?.score ?? 0}%` }} />
                </div>
                {buzzBTC === null ? (
                  <div className="h-3 w-32 rounded bg-ocean-dark animate-pulse mt-1.5" />
                ) : (
                  <p className="text-ocean-muted text-[11px] mt-1.5">{buzzBTC.label}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePress("up")}
                  disabled={anyPredictionActive || price === null}
                  className={`h-16 rounded-[12px] font-bold text-foreground flex items-center justify-center gap-2 transition-all duration-200 border-2 border-success bg-[hsl(160,53%,12%)] ${
                    anyPredictionActive ? "opacity-40 cursor-not-allowed" : "hover:bg-success hover:text-ocean-dark active:animate-press"
                  } ${predictionDir === "up" && predictionActive ? "!opacity-100 !bg-success !text-ocean-dark" : ""}`}
                >
                  <ArrowUp size={20} className={predictionDir === "up" && predictionActive ? "text-ocean-dark" : "text-success"} /> SOBE
                </button>
                <button
                  onClick={() => handlePress("down")}
                  disabled={anyPredictionActive || price === null}
                  className={`h-16 rounded-[12px] font-bold text-foreground flex items-center justify-center gap-2 transition-all duration-200 border-2 border-danger bg-[hsl(355,53%,15%)] ${
                    anyPredictionActive ? "opacity-40 cursor-not-allowed" : "hover:bg-danger hover:text-ocean-dark active:animate-press"
                  } ${predictionDir === "down" && predictionActive ? "!opacity-100 !bg-danger !text-ocean-dark" : ""}`}
                >
                  <ArrowDown size={20} className={predictionDir === "down" && predictionActive ? "text-ocean-dark" : "text-danger"} /> CAI
                </button>
              </div>

              {predictionActive && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Loader2 size={14} className="text-ocean-muted animate-spin" />
                  <span className="text-ocean-muted text-sm">
                    Aguardando resultado... Preço de entrada: ${predictionPrice !== null ? formatPrice(predictionPrice) : "—"}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full max-w-lg grid grid-cols-3 gap-3">
              {[
                { label: "Acertos hoje", value: acertosHoje },
                { label: "Taxa de acerto", value: taxaAcerto },
                { label: "Ranking", value: ranking },
              ].map((s) => (
                <div key={s.label} className="rounded-[16px] bg-card-surface p-3 flex flex-col items-center gap-1" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
                  <span className="text-ocean-muted text-[10px] sm:text-xs text-center">{s.label}</span>
                  <span className="text-foreground font-bold text-base sm:text-lg">{s.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : gameMode === "battle" ? (
          <BattleMode
            coins={coins}
            battleActive={battleActive}
            battleCountdown={countdown}
            battleChoice={activePrediction?.mode === "batalha" ? activePrediction.direction : null}
            onConfirm={handleBattleConfirm}
            formatTimer={formatTimer}
          />
        ) : (
          <PrecisionMode
            price={price}
            change24h={change24h}
            flashing={flashing}
            apiError={apiError}
            precisionActive={precisionActive}
            precisionCountdown={countdown}
            precisionRange={activePrediction?.mode === "precisao" ? activePrediction.direction as PrecisionRange : null}
            precisionPrice={activePrediction?.mode === "precisao" ? activePrediction.priceInitial : null}
            onConfirm={handlePrecisionConfirm}
            formatTimer={formatTimer}
            formatPrice={formatPrice}
          />
        )}
      </main>

      <button
        onClick={handleOpenChest}
        disabled={!chestAvailable}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-card-surface flex items-center justify-center shadow-lg z-10 transition-all hover:scale-105"
        style={{ border: "1px solid rgba(92,200,232,0.15)" }}
      >
        <Package size={24} className="text-pacific" />
        {chestAvailable && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-foreground text-[10px] font-bold flex items-center justify-center">1</span>
        )}
      </button>

      {showChestModal && chestReward && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4" onClick={() => setShowChestModal(false)}>
          <div className="bg-card-surface rounded-[16px] p-6 w-full max-w-sm text-center animate-result-enter" style={{ border: "1px solid rgba(92,200,232,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <Gift size={48} className="text-pacific mx-auto mb-4" />
            <h2 className="text-foreground text-xl font-bold mb-2">Baú Diário!</h2>
            <p className="text-ocean-muted text-sm mb-4">
              {chestReward.tipo === "moedas" && `Você ganhou +${chestReward.valor} troféus!`}
              {chestReward.tipo === "escudo" && `Você ganhou ${chestReward.valor} escudo protetor!`}
              {chestReward.tipo === "xp_boost" && `Você ganhou ${chestReward.valor}x XP Boost!`}
            </p>
            <button onClick={() => setShowChestModal(false)} className="w-full h-11 rounded-[12px] bg-pacific text-ocean-dark font-bold text-sm">
              Fechar
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Dashboard;
