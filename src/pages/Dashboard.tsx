import { useState, useEffect, useCallback, useRef } from "react";
import { Flame, Trophy, ArrowUp, ArrowDown, Package, Loader2, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import GameModeSelector, { type GameMode } from "@/components/GameModeSelector";
import BattleMode from "@/components/BattleMode";
import PrecisionMode from "@/components/PrecisionMode";
import type { PrecisionRange } from "@/components/PrecisionMode";
import { useUser } from "@/contexts/UserContext";

const API_URL_MULTI = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true";
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

const RANGE_BOUNDS: Record<PrecisionRange, [number, number]> = {
  "0-0.1": [0, 0.1],
  "0.1-0.5": [0.1, 0.5],
  "0.5-2": [0.5, 2],
  "2+": [2, Infinity],
};

const leagueBadgeColors: Record<string, string> = {
  Bronze: "bg-[#CD7F32] text-ocean-dark",
  Prata: "bg-[#A8B2BB] text-ocean-dark",
  Ouro: "bg-warning text-ocean-dark",
  Platina: "bg-pacific text-ocean-dark",
  Diamante: "bg-[#B9F2FF] text-ocean-dark",
  "Lendária": "bg-danger text-foreground",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, checkChest, openChest } = useUser();
  const [coins, setCoins] = useState<CoinPrices>({ bitcoin: null, ethereum: null, solana: null });
  const [flashing, setFlashing] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Chest state
  const [chestAvailable, setChestAvailable] = useState(false);
  const [chestReward, setChestReward] = useState<{ tipo: string; valor: number } | null>(null);
  const [showChestModal, setShowChestModal] = useState(false);

  // Classic prediction state
  const [predictionActive, setPredictionActive] = useState(false);
  const [predictionDir, setPredictionDir] = useState<"up" | "down" | null>(null);
  const [predictionPrice, setPredictionPrice] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("classic");

  // Stats state
  const [acertosHoje, setAcertosHoje] = useState<string>("—");
  const [taxaAcerto, setTaxaAcerto] = useState<string>("—");
  const [ranking, setRanking] = useState<string>("—");

  // Battle state
  const [battleActive, setBattleActive] = useState(false);
  const [battleCountdown, setBattleCountdown] = useState(0);
  const battleCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [battleChoice, setBattleChoice] = useState<string | null>(null);
  const [battleStartPrices, setBattleStartPrices] = useState<CoinPrices | null>(null);
  const [battleArenaCoins, setBattleArenaCoins] = useState<string[]>([]);

  // Precision state
  const [precisionActive, setPrecisionActive] = useState(false);
  const [precisionCountdown, setPrecisionCountdown] = useState(0);
  const precisionCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [precisionRange, setPrecisionRange] = useState<PrecisionRange | null>(null);
  const [precisionPrice, setPrecisionPrice] = useState<number | null>(null);
  const [precisionReward, setPrecisionReward] = useState(0);

  // Check chest availability
  useEffect(() => {
    checkChest().then(setChestAvailable);
  }, [checkChest]);

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
      if (!predictionActive && !battleActive && !precisionActive) fetchPrices();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices, predictionActive, battleActive, precisionActive]);

  const formatTimer = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const formatPrice = (p: number) =>
    p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const price = coins.bitcoin?.price ?? null;
  const change24h = coins.bitcoin?.change24h ?? null;

  const startCountdown = (ref: React.MutableRefObject<ReturnType<typeof setInterval> | null>, setter: React.Dispatch<React.SetStateAction<number>>) => {
    ref.current = setInterval(() => {
      setter((prev) => {
        if (prev <= 1) {
          if (ref.current) clearInterval(ref.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Classic ──
  const handlePress = (dir: "up" | "down") => {
    if (predictionActive || price === null) return;
    setPredictionDir(dir);
    setPredictionPrice(price);
    setPredictionActive(true);
    setCountdown(COUNTDOWN_SECONDS);
    startCountdown(countdownRef, setCountdown);
  };

  useEffect(() => {
    if (countdown === 0 && predictionActive && predictionPrice !== null && predictionDir) {
      const resolve = async () => {
        const result = await fetchPrices();
        const finalPrice = result?.bitcoin?.price ?? price;
        if (finalPrice === null) return;
        const variacao = ((finalPrice - predictionPrice) / predictionPrice) * 100;
        const priceWentUp = finalPrice > predictionPrice;
        const acertou = (predictionDir === "up" && priceWentUp) || (predictionDir === "down" && !priceWentUp);
        setPredictionActive(false);
        setPredictionDir(null);
        setPredictionPrice(null);
        navigate("/result", {
          state: {
            acertou,
            variacao: Math.abs(variacao).toFixed(2),
            ativo: "BTC",
            direcao: predictionDir,
            precoInicial: predictionPrice,
            precoFinal: finalPrice,
            streak: user?.streak ?? 0,
          },
        });
      };
      resolve();
    }
  }, [countdown, predictionActive, predictionPrice, predictionDir, fetchPrices, navigate, price, user]);

  // ── Battle ──
  const handleBattleConfirm = (chosenCoin: string, arenaCoins: string[]) => {
    setBattleChoice(chosenCoin);
    setBattleArenaCoins(arenaCoins);
    setBattleStartPrices({ ...coins });
    setBattleActive(true);
    setBattleCountdown(COUNTDOWN_SECONDS);
    startCountdown(battleCountdownRef, setBattleCountdown);
  };

  useEffect(() => {
    if (battleCountdown === 0 && battleActive && battleStartPrices && battleChoice) {
      const resolve = async () => {
        const result = await fetchPrices();
        const finalCoins = result ?? coins;
        const tickerMap: Record<string, string> = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL" };
        const calcVar = (coin: keyof CoinPrices) => {
          const start = battleStartPrices[coin]?.price;
          const end = finalCoins[coin]?.price;
          if (!start || !end) return 0;
          return ((end - start) / start) * 100;
        };
        const arenaVariations: Record<string, number> = {};
        for (const coinId of battleArenaCoins) {
          arenaVariations[tickerMap[coinId] ?? coinId.toUpperCase()] = calcVar(coinId as keyof CoinPrices);
        }
        const moedaVencedora = Object.entries(arenaVariations).sort((a, b) => b[1] - a[1])[0][0];
        const chosenTicker = tickerMap[battleChoice] ?? "BTC";
        setBattleActive(false);
        setBattleChoice(null);
        setBattleStartPrices(null);
        setBattleArenaCoins([]);
        const stateData: Record<string, unknown> = {
          modo: "batalha", moedaEscolhida: chosenTicker, moedaVencedora,
          acertou: chosenTicker === moedaVencedora, arenaCoins: Object.keys(arenaVariations),
          streak: user?.streak ?? 0,
        };
        for (const [ticker, val] of Object.entries(arenaVariations)) {
          stateData[`variacao${ticker}`] = (val >= 0 ? "+" : "") + val.toFixed(2) + "%";
        }
        navigate("/result", { state: stateData });
      };
      resolve();
    }
  }, [battleCountdown, battleActive, battleStartPrices, battleChoice, fetchPrices, navigate, coins, battleArenaCoins, user]);

  // ── Precision ──
  const handlePrecisionConfirm = (range: PrecisionRange, reward: number) => {
    if (price === null) return;
    setPrecisionRange(range);
    setPrecisionPrice(price);
    setPrecisionReward(reward);
    setPrecisionActive(true);
    setPrecisionCountdown(COUNTDOWN_SECONDS);
    startCountdown(precisionCountdownRef, setPrecisionCountdown);
  };

  useEffect(() => {
    if (precisionCountdown === 0 && precisionActive && precisionPrice !== null && precisionRange) {
      const resolve = async () => {
        const result = await fetchPrices();
        const finalPrice = result?.bitcoin?.price ?? price;
        if (finalPrice === null) return;
        const variacaoAbs = Math.abs(((finalPrice - precisionPrice) / precisionPrice) * 100);
        const [min, max] = RANGE_BOUNDS[precisionRange];
        const acertou = variacaoAbs >= min && variacaoAbs < max;

        let faixaReal = "";
        for (const [key, [lo, hi]] of Object.entries(RANGE_BOUNDS)) {
          if (variacaoAbs >= lo && variacaoAbs < hi) { faixaReal = key; break; }
        }

        setPrecisionActive(false);
        const savedRange = precisionRange;
        const savedPrice = precisionPrice;
        const savedReward = precisionReward;
        setPrecisionRange(null);
        setPrecisionPrice(null);
        setPrecisionReward(0);

        navigate("/result", {
          state: {
            modo: "precisao",
            faixaEscolhida: savedRange,
            faixaReal,
            variacaoReal: variacaoAbs.toFixed(2),
            acertou,
            retorno: savedReward,
            precoInicial: savedPrice,
            precoFinal: finalPrice,
            streak: user?.streak ?? 0,
          },
        });
      };
      resolve();
    }
  }, [precisionCountdown, precisionActive, precisionPrice, precisionRange, precisionReward, fetchPrices, navigate, price, user]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (battleCountdownRef.current) clearInterval(battleCountdownRef.current);
      if (precisionCountdownRef.current) clearInterval(precisionCountdownRef.current);
    };
  }, []);

  const anyActive = predictionActive || battleActive || precisionActive;
  const timerLow = countdown < 10 && countdown > 0;

  const userTrophies = user?.trophies ?? 0;
  const userStreak = user?.streak ?? 0;
  const userLeague = user?.league ?? "Bronze";
  const initials = (user?.username ?? "PE").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-ocean-dark font-dm-sans flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
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

      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-4 pb-24 gap-4 overflow-y-auto">
        <GameModeSelector selected={gameMode} onSelect={setGameMode} disabled={anyActive} />

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
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <span className="text-warning font-bold text-lg">₿</span>
                </div>
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
                  <span className="text-pacific text-xs font-bold">72/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-ocean-dark">
                  <div className="h-full rounded-full bg-pacific transition-all duration-500" style={{ width: "72%" }} />
                </div>
                <p className="text-ocean-muted text-[11px] mt-1.5">Alta atividade nas redes</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePress("up")}
                  disabled={predictionActive || price === null}
                  className={`h-16 rounded-[12px] font-bold text-foreground flex items-center justify-center gap-2 transition-all duration-200 border-2 border-success bg-[hsl(160,53%,12%)] ${
                    predictionActive ? "opacity-40 cursor-not-allowed" : "hover:bg-success hover:text-ocean-dark active:animate-press"
                  } ${predictionDir === "up" && predictionActive ? "!opacity-100 !bg-success !text-ocean-dark" : ""}`}
                >
                  <ArrowUp size={20} className={predictionDir === "up" && predictionActive ? "text-ocean-dark" : "text-success"} /> SOBE
                </button>
                <button
                  onClick={() => handlePress("down")}
                  disabled={predictionActive || price === null}
                  className={`h-16 rounded-[12px] font-bold text-foreground flex items-center justify-center gap-2 transition-all duration-200 border-2 border-danger bg-[hsl(355,53%,15%)] ${
                    predictionActive ? "opacity-40 cursor-not-allowed" : "hover:bg-danger hover:text-ocean-dark active:animate-press"
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
                { label: "Acertos hoje", value: "—" },
                { label: "Taxa de acerto", value: "—" },
                { label: "Ranking", value: "—" },
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
            battleCountdown={battleCountdown}
            battleChoice={battleChoice}
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
            precisionCountdown={precisionCountdown}
            precisionRange={precisionRange}
            precisionPrice={precisionPrice}
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
