import { useState, useEffect, useMemo } from "react";
import { Check, X, Flame, Trophy, Package, BarChart3, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const acertou = true;

const TROPHY_TARGET = acertou ? 25 : 15;
const MULTIPLIER_TOTAL = acertou ? 37 : 15;

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
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" style={{ animationDelay: "0.3s" }}>
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

const CountUp = ({ target, className }: { target: number; className: string }) => {
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
  return <span className={className}>{acertou ? `+${count}` : `−${count}`}</span>;
};

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PredictionResult = () => {
  const navigate = useNavigate();
  const borderColor = acertou ? "border-success" : "border-danger";
  const particleColor = acertou ? "hsl(160,74%,42%)" : "hsl(355,79%,59%)";

  const tweetText = encodeURIComponent(
    acertou
      ? `🏆 Acertei minha previsão no Pacifica Pulse! BTC subiu 2.4% 📈\n\n🔥 Streak: 5 dias | Liga Ouro | 68% de acerto\n\nTente também 👇`
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
          {acertou ? "BTC subiu 2.4% em 1 hora" : "BTC caiu 1.1% em 1 hora"}
        </p>

        <div className="text-center mb-5">
          <CountUp target={acertou ? MULTIPLIER_TOTAL : TROPHY_TARGET} className={`text-[64px] font-bold leading-none ${acertou ? "text-pacific" : "text-danger"}`} />
          <p className="text-ocean-muted text-xs mt-1">troféus</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Flame size={18} className={acertou ? "text-warning" : "text-ocean-muted"} />
          <span className="text-foreground text-sm font-medium">{acertou ? "Streak: 5 dias" : "Streak zerado"}</span>
          {acertou && <span className="px-2 py-0.5 rounded-full bg-warning text-ocean-dark text-[10px] font-bold">Novo recorde!</span>}
        </div>

        {acertou && <p className="text-success text-xs text-center mb-6">Multiplicador 1.5× aplicado → +37 troféus</p>}
        {!acertou && <div className="mb-6" />}

        <div className="h-px w-full mb-5" style={{ background: "rgba(255,255,255,0.06)" }} />

        <div className="rounded-[12px] bg-ocean-dark p-4 mb-5" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} className="text-pacific" />
            <span className="text-foreground text-xs font-bold">Liga Ouro</span>
            <span className="text-ocean-muted text-[10px] ml-auto">847 troféus</span>
          </div>
          <p className="text-foreground text-sm font-medium mb-1">{acertou ? "✅ Acertei! BTC +2.4%" : "📊 Errei, mas sigo firme!"}</p>
          <p className="text-ocean-muted text-[10px]">Taxa de acerto: 68%</p>
          <p className="text-pacific text-[10px] mt-1">pacifica.fi/pulse/pedro</p>
        </div>

        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
          target="_blank" rel="noopener noreferrer"
          className="w-full h-12 rounded-[12px] flex items-center justify-center gap-2 text-foreground font-medium text-sm transition-all duration-200 hover:opacity-80 mb-3"
          style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <XIcon /> Postar no X e ganhar +30 troféus
        </a>

        <button
          onClick={() => navigate("/leaderboard")}
          className="w-full h-11 rounded-[12px] flex items-center justify-center gap-2 text-ocean-muted font-medium text-sm transition-all duration-200 hover:text-foreground border border-ocean-muted/30 mb-3"
        >
          <BarChart3 size={16} /> Ver leaderboard
        </button>

        <button
          onClick={() => navigate("/play")}
          className="w-full h-11 rounded-[12px] flex items-center justify-center gap-2 text-pacific font-medium text-sm transition-all duration-200 hover:opacity-80 border border-pacific/30"
        >
          <RotateCcw size={16} /> Jogar novamente
        </button>
      </div>

      <button className="relative z-10 mt-6 flex items-center gap-2 px-5 py-3 rounded-[12px] bg-card-surface text-pacific font-medium text-sm animate-pulse-glow transition-all hover:opacity-90"
        style={{ border: "1px solid rgba(92,200,232,0.3)" }}
      >
        <Package size={18} /> Abrir baú disponível
      </button>
    </div>
  );
};

export default PredictionResult;
