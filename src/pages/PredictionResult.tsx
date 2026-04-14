import { useState, useEffect, useMemo, useRef } from "react";
import { Check, X, Flame, Trophy, Package, BarChart3, RotateCcw, ArrowUp, ArrowDown, Target, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

interface ClassicResultState {
  acertou: boolean;
  variacao: string;
  ativo: string;
  direcao: "up" | "down";
  precoInicial: number;
  precoFinal: number;
  streak: number;
  modo?: undefined;
}

interface BattleResultState {
  modo: "batalha";
  moedaEscolhida: string;
  moedaVencedora: string;
  acertou: boolean;
  arenaCoins: string[];
  streak: number;
  [key: string]: unknown;
}

interface PrecisionResultState {
  modo: "precisao";
  faixaEscolhida: string;
  faixaReal: string;
  variacaoReal: string;
  acertou: boolean;
  retorno: number;
  precoInicial: number;
  precoFinal: number;
  streak: number;
}

type ResultState = ClassicResultState | BattleResultState | PrecisionResultState;

const Particles = ({ color }: { color: string }) => {
  const particles = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 3 + Math.random() * 4,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 2}s`,
    })),
    []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 rounded-full animate-particle-rise"
          style={{
            left: p.left, width: p.size, height: p.size,
            backgroundColor: color, opacity: 0.3,
            animationDelay: p.delay, animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
};

const CountUp = ({ target, prefix, className }: { target: number; prefix: string; className: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.round(current));
    }, 1000 / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span className={className}>{prefix}{count}</span>;
};

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const COIN_META: Record<string, { name: string; symbol: string; symbolBg: string; symbolColor: string }> = {
  BTC: { name: "Bitcoin", symbol: "₿", symbolBg: "bg-warning/20", symbolColor: "text-warning" },
  ETH: { name: "Ethereum", symbol: "Ξ", symbolBg: "bg-[hsl(260,60%,25%)]", symbolColor: "text-[hsl(260,80%,70%)]" },
  SOL: { name: "Solana", symbol: "◎", symbolBg: "bg-[hsl(280,50%,20%)]", symbolColor: "text-[hsl(170,80%,60%)]" },
};

const MODE_LABELS: Record<string, string> = { classico: "Clássico", batalha: "Batalha", precisao: "Precisão" };

const ResultModal = ({ acertou, chestEarned, chestSlotsFull, noChestEarned, bausRestantes, mode, navigate, trophies, showModal, onClose }: {
  acertou: boolean; chestEarned: boolean; chestSlotsFull: boolean; noChestEarned: boolean; bausRestantes: number; mode: string; navigate: ReturnType<typeof useNavigate>; trophies: number; showModal: boolean; onClose: () => void;
}) => {
  if (!showModal) return null;
  const modeLabel = MODE_LABELS[mode] ?? mode;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div
        className="w-full max-w-[320px] rounded-[16px] p-8 text-center"
        style={{
          background: "#0F2235",
          border: acertou ? "1px solid #5CC8E8" : "1px solid #E84855",
          animation: "resultModalIn 0.3s ease-out forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {acertou ? (
          <>
            <div className="flex justify-center mb-4">
              <Package size={48} style={{ color: "#5CC8E8", animation: "chestPulse 1s ease-in-out infinite" }} />
            </div>
            <h2 className="text-foreground font-bold text-[22px] mb-2">Previsão correta!</h2>
            <p className="font-bold text-[18px] mb-4" style={{ color: "#1DB887" }}>+{trophies} troféus</p>
            <div className="w-full h-px mb-4" style={{ background: "rgba(255,255,255,0.08)" }} />
            {(chestEarned || chestSlotsFull) && (
              <>
                <p className="text-foreground font-bold text-[15px] mb-1">Baú de Batalha desbloqueado!</p>
                {bausRestantes > 0 ? (
                  <p className="text-[12px] mb-4" style={{ color: "#8BB8CC" }}>
                    Você pode ganhar mais {bausRestantes} baú(s) no modo {modeLabel} hoje
                  </p>
                ) : (
                  <p className="text-[12px] mb-4" style={{ color: "#F5A623" }}>
                    Slots cheios por hoje!
                  </p>
                )}
              </>
            )}
            {noChestEarned && (
              <>
                <p className="text-foreground font-bold text-[15px] mb-1">Baú de Batalha desbloqueado!</p>
                <p className="text-[12px] mb-4" style={{ color: "#F5A623" }}>
                  Slots cheios por hoje!
                </p>
              </>
            )}
            {!chestEarned && !chestSlotsFull && !noChestEarned && <div className="mb-4" />}
            <button
              onClick={() => { onClose(); navigate("/chests"); }}
              className="w-full h-11 rounded-[12px] font-bold text-sm mb-3 transition-all hover:opacity-80"
              style={{ background: "#5CC8E8", color: "#0D1B2A" }}
            >
              Ver meus baús →
            </button>
            <button
              onClick={onClose}
              className="w-full h-11 rounded-[12px] font-bold text-sm text-foreground transition-all hover:opacity-80"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              Continuar jogando
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <X size={48} style={{ color: "#E84855" }} />
            </div>
            <h2 className="text-foreground font-bold text-[22px] mb-2">Quase lá!</h2>
            <p className="font-bold text-[18px] mb-6" style={{ color: "#E84855" }}>-15 troféus</p>
            <button
              onClick={() => { onClose(); navigate("/play"); }}
              className="w-full h-11 rounded-[12px] font-bold text-sm text-foreground mb-3 transition-all hover:opacity-80"
              style={{ background: "#E84855" }}
            >
              Tentar novamente
            </button>
            <button
              onClick={() => { onClose(); navigate("/leaderboard"); }}
              className="w-full h-11 rounded-[12px] font-bold text-sm text-foreground transition-all hover:opacity-80"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              Ver leaderboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const PredictionResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState | null;
  const { user, savePrediction, refreshUser, earnBattleChest, countBattleChestsToday } = useUser();
  const savedRef = useRef(false);
  const [chestEarned, setChestEarned] = useState(false);
  const [chestSlotsFull, setChestSlotsFull] = useState(false);
  const [noChestEarned, setNoChestEarned] = useState(false);
  const [bausRestantes, setBausRestantes] = useState(0);
  const [currentMode, setCurrentMode] = useState("classico");

  const isBattle = state?.modo === "batalha";
  const isPrecision = state?.modo === "precisao";
  const acertou = state?.acertou ?? true;
  const streak = (state as any)?.streak ?? user?.streak ?? 0;

  useEffect(() => {
    if (!state || savedRef.current) return;
    savedRef.current = true;

    let trophiesDelta: number;
    let mode: string;
    let asset: string;
    let direction: string | null = null;
    let priceInitial = 0;
    let priceFinal = 0;
    let variationReal = 0;

    if (isPrecision) {
      const s = state as PrecisionResultState;
      mode = "precisao"; asset = "BTC"; priceInitial = s.precoInicial; priceFinal = s.precoFinal;
      variationReal = parseFloat(s.variacaoReal); trophiesDelta = s.acertou ? s.retorno : -15;
    } else if (isBattle) {
      const s = state as BattleResultState;
      mode = "batalha"; asset = s.moedaEscolhida; trophiesDelta = s.acertou ? 40 : -15;
    } else {
      const s = state as ClassicResultState;
      mode = "classico"; asset = s.ativo; direction = s.direcao;
      priceInitial = s.precoInicial; priceFinal = s.precoFinal;
      variationReal = parseFloat(s.variacao);
      const baseTrophies = 25; const hasMultiplier = s.acertou && streak > 3;
      trophiesDelta = s.acertou ? (hasMultiplier ? Math.round(baseTrophies * 1.5) : baseTrophies) : -15;
    }

    setCurrentMode(mode);

    const doSave = async () => {
      await savePrediction({
        mode, asset, direction, price_initial: priceInitial, price_final: priceFinal,
        variation_real: variationReal, result: acertou, trophies_delta: trophiesDelta,
      });
      await refreshUser();

      if (acertou) {
        const countBefore = await countBattleChestsToday(mode);
        if (countBefore < 5) {
          const earned = await earnBattleChest(mode);
          if (earned) {
            const remaining = 5 - (countBefore + 1);
            setBausRestantes(remaining);
            setChestEarned(true);
            if (remaining === 0) setChestSlotsFull(true);
          }
        } else {
          setNoChestEarned(true);
        }
      }
    };
    doSave();
  }, [state, savePrediction, refreshUser, acertou, isBattle, isPrecision, streak, earnBattleChest, countBattleChestsToday]);

  const chestProps = { acertou, chestEarned, chestSlotsFull, noChestEarned, bausRestantes, mode: currentMode, navigate };

  if (isPrecision) {
    return <PrecisionResult state={state as PrecisionResultState} navigate={navigate} user={user} streak={streak} chestProps={chestProps} />;
  }

  if (isBattle) {
    return <BattleResult state={state as BattleResultState} navigate={navigate} user={user} streak={streak} chestProps={chestProps} />;
  }

  // Classic mode
  const variacao = (state as ClassicResultState)?.variacao ?? "0.00";
  const ativo = (state as ClassicResultState)?.ativo ?? "BTC";
  const direcao = (state as ClassicResultState)?.direcao ?? "up";

  const baseTrophies = acertou ? 25 : 15;
  const hasMultiplier = acertou && streak > 3;
  const finalTrophies = hasMultiplier ? Math.round(baseTrophies * 1.5) : baseTrophies;

  const dirLabel = direcao === "up" ? "subiu" : "caiu";
  const actualMovement = state
    ? ((state as ClassicResultState).precoFinal >= (state as ClassicResultState).precoInicial ? "subiu" : "caiu")
    : dirLabel;

  const borderColor = acertou ? "border-success" : "border-danger";
  const particleColor = acertou ? "hsl(160,74%,42%)" : "hsl(355,79%,59%)";

  const tweetText = encodeURIComponent(
    acertou
      ? `🏆 Acertei minha previsão no Pacifica Pulse! ${ativo} ${actualMovement} ${variacao}% 📈\n\n🔥 Streak: ${streak} dias | Liga ${user?.league ?? "—"} | ${user?.trophies ?? 0} troféus\n\nTente também 👇`
      : `📊 Errei dessa vez no Pacifica Pulse, mas sigo firme!\n\nTente também 👇`
  );
  const tweetUrl = encodeURIComponent("https://pacifica.fi/pulse/pedro");

  return (
    <div className="min-h-screen bg-ocean-dark font-dm-sans flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <Particles color={particleColor} />

      <div className={`relative z-10 w-full max-w-md rounded-[16px] bg-card-surface p-6 sm:p-8 animate-result-enter border-2 ${borderColor}`}>
        <div className="flex justify-center mb-4">
          {acertou ? (
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
              <Check size={32} className="text-ocean-dark" strokeWidth={3} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-danger flex items-center justify-center">
              <X size={32} className="text-ocean-dark" strokeWidth={3} />
            </div>
          )}
        </div>

        <h1 className="text-foreground text-[32px] font-bold text-center mb-1">
          {acertou ? "Acertou!" : "Errou dessa vez"}
        </h1>
        <p className="text-ocean-muted text-center text-sm mb-6">
          {ativo} {actualMovement} {variacao}% em 1 minuto
        </p>

        <div className="text-center mb-5">
          <CountUp target={finalTrophies} prefix={acertou ? "+" : "−"} className={`text-[64px] font-bold leading-none ${acertou ? "text-pacific" : "text-danger"}`} />
          <p className="text-ocean-muted text-xs mt-1">troféus</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Flame size={18} className={acertou ? "text-warning" : "text-ocean-muted"} />
          <span className="text-foreground text-sm font-medium">
            {acertou ? `Streak: ${streak + 1} dias` : "Streak zerado"}
          </span>
        </div>

        {hasMultiplier && (
          <p className="text-success text-xs text-center mb-6">
            Multiplicador 1.5× aplicado → +{finalTrophies} troféus
          </p>
        )}
        {(!acertou || !hasMultiplier) && <div className="mb-6" />}

        <div className="h-px w-full mb-5" style={{ background: "rgba(255,255,255,0.06)" }} />

        <div className="rounded-[12px] bg-ocean-dark p-4 mb-5" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} className="text-pacific" />
            <span className="text-foreground text-xs font-bold">Liga {user?.league ?? "—"}</span>
            <span className="text-ocean-muted text-[10px] ml-auto">{user?.trophies?.toLocaleString() ?? "—"} troféus</span>
          </div>
          <p className="text-foreground text-sm font-medium mb-1">
            {acertou ? `✅ Acertei! ${ativo} ${variacao}%` : `📊 Errei, mas sigo firme!`}
          </p>
          <p className="text-pacific text-[10px] mt-1">pacifica.fi/pulse/pedro</p>
        </div>

        <ChestNotification {...chestProps} />

        {chestProps.acertou && <div className="mb-1" />}

        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
          target="_blank" rel="noopener noreferrer"
          className="w-full h-12 rounded-[12px] flex items-center justify-center gap-2 text-foreground font-medium text-sm transition-all duration-200 hover:opacity-80 mb-3"
          style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <XIcon /> Postar no X e ganhar +30 troféus
        </a>

        <button onClick={() => navigate("/leaderboard")} className="w-full h-11 rounded-[12px] flex items-center justify-center gap-2 text-ocean-muted font-medium text-sm transition-all duration-200 hover:text-foreground border border-ocean-muted/30 mb-3">
          <BarChart3 size={16} /> Ver leaderboard
        </button>

        <button onClick={() => navigate("/play")} className="w-full h-11 rounded-[12px] flex items-center justify-center gap-2 text-pacific font-medium text-sm transition-all duration-200 hover:opacity-80 border border-pacific/30">
          <RotateCcw size={16} /> Jogar novamente
        </button>
      </div>
    </div>
  );
};

// ========== Battle Result ==========

type ChestProps = { acertou: boolean; chestEarned: boolean; chestSlotsFull: boolean; noChestEarned: boolean; bausRestantes: number; mode: string; navigate: ReturnType<typeof useNavigate> };

const BattleResult = ({ state, navigate, user, streak, chestProps }: { state: BattleResultState; navigate: ReturnType<typeof useNavigate>; user: any; streak: number; chestProps: ChestProps }) => {
  const { acertou, moedaEscolhida, moedaVencedora, arenaCoins } = state;
  const trophies = acertou ? 40 : 15;
  const borderColor = acertou ? "border-success" : "border-danger";
  const particleColor = acertou ? "hsl(160,74%,42%)" : "hsl(355,79%,59%)";

  const variations: { ticker: string; variacao: string }[] = (arenaCoins ?? ["BTC", "ETH", "SOL"]).map((ticker) => ({
    ticker,
    variacao: (state[`variacao${ticker}`] as string) ?? "+0.00%",
  }));

  const varSummary = variations.map((v) => `${v.ticker}: ${v.variacao}`).join(" | ");
  const tweetText = encodeURIComponent(
    acertou
      ? `🏆 Acertei no modo Batalha do Pacifica Pulse! ${moedaEscolhida} foi a campeã! 🪙\n\n${varSummary}\n\nTente também 👇`
      : `📊 Errei no modo Batalha, a campeã foi ${moedaVencedora}!\n\n${varSummary}\n\nTente também 👇`
  );
  const tweetUrl = encodeURIComponent("https://pacifica.fi/pulse/pedro");

  return (
    <div className="min-h-screen bg-ocean-dark font-dm-sans flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <Particles color={particleColor} />

      <div className={`relative z-10 w-full max-w-md rounded-[16px] bg-card-surface p-6 sm:p-8 animate-result-enter border-2 ${borderColor}`}>
        <div className="flex justify-center mb-4">
          {acertou ? (
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
              <Trophy size={32} className="text-ocean-dark" strokeWidth={2} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-danger flex items-center justify-center">
              <X size={32} className="text-ocean-dark" strokeWidth={3} />
            </div>
          )}
        </div>

        <h1 className="text-foreground text-[28px] font-bold text-center mb-1">
          {acertou ? "Você acertou!" : "Dessa vez não..."}
        </h1>
        <p className="text-ocean-muted text-center text-sm mb-6">
          {acertou
            ? `${moedaEscolhida} foi a campeã!`
            : `A campeã foi ${moedaVencedora}`}
        </p>

        <div className="rounded-[12px] bg-ocean-dark p-4 mb-5 space-y-3" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
          {variations.map((v) => {
            const meta = COIN_META[v.ticker];
            const isWinner = v.ticker === moedaVencedora;
            const isChosen = v.ticker === moedaEscolhida;
            const varNum = parseFloat(v.variacao);

            return (
              <div
                key={v.ticker}
                className={`flex items-center gap-3 p-3 rounded-[10px] transition-all ${
                  isWinner ? "border-2 border-success bg-success/10" : "border border-[rgba(92,200,232,0.08)]"
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${meta.symbolBg} flex items-center justify-center shrink-0`}>
                  <span className={`${meta.symbolColor} font-bold text-sm`}>{meta.symbol}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground text-sm font-bold">{meta.name}</span>
                    <span className="text-ocean-muted text-[11px]">{v.ticker}</span>
                    {isChosen && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pacific/20 text-pacific ml-auto">SUA APOSTA</span>
                    )}
                    {isWinner && !isChosen && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-success/20 text-success ml-auto">CAMPEÃ</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {varNum >= 0 ? <ArrowUp size={12} className="text-success" /> : <ArrowDown size={12} className="text-danger" />}
                  <span className={`text-sm font-bold ${varNum >= 0 ? "text-success" : "text-danger"}`}>
                    {v.variacao}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mb-5">
          <CountUp target={trophies} prefix={acertou ? "+" : "−"} className={`text-[56px] font-bold leading-none ${acertou ? "text-pacific" : "text-danger"}`} />
          <p className="text-ocean-muted text-xs mt-1">troféus</p>
        </div>

        <div className="h-px w-full mb-5" style={{ background: "rgba(255,255,255,0.06)" }} />

        <ChestNotification {...chestProps} />
        {chestProps.acertou && <div className="mb-1" />}

        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
          target="_blank" rel="noopener noreferrer"
          className="w-full h-12 rounded-[12px] flex items-center justify-center gap-2 text-foreground font-medium text-sm transition-all duration-200 hover:opacity-80 mb-3"
          style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <XIcon /> Postar no X e ganhar +30 troféus
        </a>

        <button onClick={() => navigate("/leaderboard")} className="w-full h-11 rounded-[12px] flex items-center justify-center gap-2 text-ocean-muted font-medium text-sm transition-all duration-200 hover:text-foreground border border-ocean-muted/30 mb-3">
          <BarChart3 size={16} /> Ver leaderboard
        </button>

        <button onClick={() => navigate("/play")} className="w-full h-11 rounded-[12px] flex items-center justify-center gap-2 text-pacific font-medium text-sm transition-all duration-200 hover:opacity-80 border border-pacific/30">
          <RotateCcw size={16} /> Jogar novamente
        </button>
      </div>
    </div>
  );
};

// ========== Precision Result ==========

const RANGE_LABELS: Record<string, string> = {
  "0-0.1": "< 0.1%",
  "0.1-0.5": "0.1% – 0.5%",
  "0.5-2": "0.5% – 2%",
  "2+": "> 2%",
};

const PrecisionResult = ({ state, navigate, user, streak, chestProps }: { state: PrecisionResultState; navigate: ReturnType<typeof useNavigate>; user: any; streak: number; chestProps: ChestProps }) => {
  const { acertou, faixaEscolhida, faixaReal, variacaoReal, retorno, precoInicial, precoFinal } = state;
  const trophies = acertou ? retorno : 15;
  const borderColor = acertou ? "border-success" : "border-danger";
  const particleColor = acertou ? "hsl(160,74%,42%)" : "hsl(355,79%,59%)";

  const formatP = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tweetText = encodeURIComponent(
    acertou
      ? `🎯 Precisão perfeita no Pacifica Pulse! Variação de ${variacaoReal}% — dentro da faixa ${RANGE_LABELS[faixaEscolhida]}!\n\n+${retorno} troféus 🏆\n\nTente também 👇`
      : `📊 Quase lá no modo Precisão! Variação de ${variacaoReal}%\n\nTente também 👇`
  );
  const tweetUrl = encodeURIComponent("https://pacifica.fi/pulse/pedro");

  return (
    <div className="min-h-screen bg-ocean-dark font-dm-sans flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <Particles color={particleColor} />

      <div className={`relative z-10 w-full max-w-md rounded-[16px] bg-card-surface p-6 sm:p-8 animate-result-enter border-2 ${borderColor}`}>
        <div className="flex justify-center mb-4">
          {acertou ? (
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
              <Target size={32} className="text-ocean-dark" strokeWidth={2} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-danger flex items-center justify-center">
              <Target size={32} className="text-ocean-dark" strokeWidth={2} />
            </div>
          )}
        </div>

        <h1 className="text-foreground text-[28px] font-bold text-center mb-1">
          {acertou ? "Precisão perfeita!" : "Quase lá..."}
        </h1>
        <p className="text-ocean-muted text-center text-sm mb-6">
          {acertou
            ? `A variação foi ${variacaoReal}% — dentro da sua faixa!`
            : `A variação foi ${variacaoReal}% — fora da sua faixa`}
        </p>

        <div className="rounded-[12px] bg-ocean-dark p-4 mb-5" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-center flex-1">
              <span className="text-ocean-muted text-[10px] block mb-1">Preço inicial</span>
              <span className="text-foreground text-sm font-bold">${formatP(precoInicial)}</span>
            </div>
            <ArrowRight size={16} className={acertou ? "text-success shrink-0" : "text-danger shrink-0"} />
            <div className="text-center flex-1">
              <span className="text-ocean-muted text-[10px] block mb-1">Preço final</span>
              <span className="text-foreground text-sm font-bold">${formatP(precoFinal)}</span>
            </div>
            <ArrowRight size={16} className={acertou ? "text-success shrink-0" : "text-danger shrink-0"} />
            <div className="text-center flex-1">
              <span className="text-ocean-muted text-[10px] block mb-1">Variação</span>
              <span className={`text-sm font-bold ${acertou ? "text-success" : "text-danger"}`}>
                {precoFinal >= precoInicial ? "+" : "-"}{variacaoReal}%
              </span>
            </div>
          </div>
        </div>

        <div className={`rounded-[10px] p-3 mb-2 flex items-center justify-between ${acertou ? "border-2 border-success bg-success/10" : "border-2 border-danger bg-danger/10"}`}>
          <span className="text-foreground text-sm font-medium">
            Sua aposta: {RANGE_LABELS[faixaEscolhida] ?? faixaEscolhida}
          </span>
          <span className={`font-bold text-sm ${acertou ? "text-success" : "text-danger"}`}>
            {acertou ? "✓" : "✗"}
          </span>
        </div>

        {!acertou && faixaReal && (
          <p className="text-ocean-muted text-xs text-center mb-4">
            A variação real ficou em: {RANGE_LABELS[faixaReal] ?? faixaReal}
          </p>
        )}
        {acertou && <div className="mb-4" />}

        <div className="text-center mb-5">
          <CountUp target={trophies} prefix={acertou ? "+" : "−"} className={`text-[56px] font-bold leading-none ${acertou ? "text-pacific" : "text-danger"}`} />
          <p className="text-ocean-muted text-xs mt-1">troféus</p>
        </div>

        <div className="h-px w-full mb-5" style={{ background: "rgba(255,255,255,0.06)" }} />

        <ChestNotification {...chestProps} />
        {chestProps.acertou && <div className="mb-1" />}

        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
          target="_blank" rel="noopener noreferrer"
          className="w-full h-12 rounded-[12px] flex items-center justify-center gap-2 text-foreground font-medium text-sm transition-all duration-200 hover:opacity-80 mb-3"
          style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <XIcon /> Postar no X e ganhar +30 troféus
        </a>

        <button onClick={() => navigate("/leaderboard")} className="w-full h-11 rounded-[12px] flex items-center justify-center gap-2 text-ocean-muted font-medium text-sm transition-all duration-200 hover:text-foreground border border-ocean-muted/30 mb-3">
          <BarChart3 size={16} /> Ver leaderboard
        </button>

        <button onClick={() => navigate("/play")} className="w-full h-11 rounded-[12px] flex items-center justify-center gap-2 text-pacific font-medium text-sm transition-all duration-200 hover:opacity-80 border border-pacific/30">
          <RotateCcw size={16} /> Jogar novamente
        </button>
      </div>
    </div>
  );
};

export default PredictionResult;
