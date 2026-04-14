import { useState, useEffect, useCallback, useRef } from "react";
import { Flame, Trophy, ArrowUp, ArrowDown, Package, Loader2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import GameModeSelector, { type GameMode } from "@/components/GameModeSelector";

const API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true";
const COUNTDOWN_SECONDS = 60;

const Dashboard = () => {
  const navigate = useNavigate();
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [flashing, setFlashing] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Prediction state
  const [predictionActive, setPredictionActive] = useState(false);
  const [predictionDir, setPredictionDir] = useState<"up" | "down" | null>(null);
  const [predictionPrice, setPredictionPrice] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("classic");

  const fetchPrice = useCallback(async (): Promise<number | null> => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const newPrice = data.bitcoin.usd as number;
      const newChange = data.bitcoin.usd_24h_change as number;
      setPrice(newPrice);
      setChange24h(newChange);
      setApiError(false);
      setFlashing(true);
      setTimeout(() => setFlashing(false), 300);
      return newPrice;
    } catch {
      setApiError(true);
      return null;
    }
  }, []);

  // Auto-refresh price every 30s (only when no prediction active)
  useEffect(() => {
    fetchPrice();
    const interval = setInterval(() => {
      if (!predictionActive) fetchPrice();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPrice, predictionActive]);

  const formatTimer = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const formatPrice = (p: number) =>
    p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePress = (dir: "up" | "down") => {
    if (predictionActive || price === null) return;
    setPredictionDir(dir);
    setPredictionPrice(price);
    setPredictionActive(true);
    setCountdown(COUNTDOWN_SECONDS);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // When countdown hits 0 and prediction is active, resolve
  useEffect(() => {
    if (countdown === 0 && predictionActive && predictionPrice !== null && predictionDir) {
      const resolve = async () => {
        const finalPrice = await fetchPrice();
        const usedPrice = finalPrice ?? price;
        if (usedPrice === null) return;

        const variacao = ((usedPrice - predictionPrice) / predictionPrice) * 100;
        const priceWentUp = usedPrice > predictionPrice;
        const acertou =
          (predictionDir === "up" && priceWentUp) ||
          (predictionDir === "down" && !priceWentUp);

        // Reset prediction state
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
            precoFinal: usedPrice,
          },
        });
      };
      resolve();
    }
  }, [countdown, predictionActive, predictionPrice, predictionDir, fetchPrice, navigate, price]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const timerLow = countdown < 10 && countdown > 0;

  return (
    <div className="min-h-screen bg-ocean-dark font-dm-sans flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ocean-button flex items-center justify-center text-foreground font-bold text-sm">PE</div>
          <span className="text-foreground font-medium text-sm">Pedro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flame size={18} className="text-warning" />
          <span className="text-foreground text-sm font-medium">Streak: 5 dias</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Trophy size={16} className="text-pacific" />
            <span className="text-foreground text-sm font-bold">847</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-warning text-ocean-dark text-xs font-bold">Ouro</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-4 pb-24 gap-4 overflow-y-auto">
        <GameModeSelector selected={gameMode} onSelect={setGameMode} disabled={predictionActive} />

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
                    predictionActive
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-success hover:text-ocean-dark active:animate-press"
                  } ${predictionDir === "up" && predictionActive ? "!opacity-100 !bg-success !text-ocean-dark" : ""}`}
                >
                  <ArrowUp size={20} className={predictionDir === "up" && predictionActive ? "text-ocean-dark" : "text-success"} /> SOBE
                </button>
                <button
                  onClick={() => handlePress("down")}
                  disabled={predictionActive || price === null}
                  className={`h-16 rounded-[12px] font-bold text-foreground flex items-center justify-center gap-2 transition-all duration-200 border-2 border-danger bg-[hsl(355,53%,15%)] ${
                    predictionActive
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-danger hover:text-ocean-dark active:animate-press"
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
                { label: "Acertos hoje", value: "2/3" },
                { label: "Taxa de acerto", value: "68%" },
                { label: "Ranking", value: "#142" },
              ].map((s) => (
                <div key={s.label} className="rounded-[16px] bg-card-surface p-3 flex flex-col items-center gap-1" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
                  <span className="text-ocean-muted text-[10px] sm:text-xs text-center">{s.label}</span>
                  <span className="text-foreground font-bold text-base sm:text-lg">{s.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full max-w-lg rounded-[16px] bg-card-surface p-8 flex flex-col items-center justify-center gap-3" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
            <Clock size={40} className="text-pacific opacity-50" />
            <span className="text-foreground text-lg font-bold">Em breve...</span>
            <span className="text-ocean-muted text-sm text-center">
              O modo {gameMode === "battle" ? "Batalha" : "Precisão"} está sendo desenvolvido. Fique ligado!
            </span>
          </div>
        )}
      </main>

      <button className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-card-surface flex items-center justify-center shadow-lg z-10" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
        <Package size={24} className="text-pacific" />
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-foreground text-[10px] font-bold flex items-center justify-center">1</span>
      </button>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
