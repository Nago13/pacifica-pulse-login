import { useState } from "react";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import bitcoinLogo from "@/assets/bitcoin-logo.png";

export type PrecisionRange = "0-0.1" | "0.1-0.5" | "0.5-2" | "2+";

interface PrecisionModeProps {
  price: number | null;
  change24h: number | null;
  flashing: boolean;
  apiError: boolean;
  precisionActive: boolean;
  precisionCountdown: number;
  precisionRange: PrecisionRange | null;
  precisionPrice: number | null;
  onConfirm: (range: PrecisionRange, reward: number) => void;
  formatTimer: (s: number) => string;
  formatPrice: (p: number) => string;
}

const RANGES: {
  id: PrecisionRange;
  label: string;
  difficulty: string;
  reward: number;
  loss: number;
  bars: number;
  barColor: string;
}[] = [
  { id: "0-0.1", label: "< 0.1%", difficulty: "Muito provável", reward: 10, loss: 15, bars: 1, barColor: "bg-success" },
  { id: "0.1-0.5", label: "0.1% – 0.5%", difficulty: "Provável", reward: 25, loss: 15, bars: 2, barColor: "bg-warning" },
  { id: "0.5-2", label: "0.5% – 2%", difficulty: "Improvável", reward: 60, loss: 15, bars: 3, barColor: "bg-[hsl(25,90%,55%)]" },
  { id: "2+", label: "> 2%", difficulty: "Muito improvável", reward: 150, loss: 15, bars: 4, barColor: "bg-danger" },
];

const RiskBars = ({ filled, color }: { filled: number; color: string }) => (
  <div className="flex items-center gap-[3px]">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className={`w-5 h-1 rounded-sm ${i <= filled ? color : "bg-ocean-dark"}`}
      />
    ))}
  </div>
);

const PrecisionMode = ({
  price, change24h, flashing, apiError,
  precisionActive, precisionCountdown, precisionRange, precisionPrice,
  onConfirm, formatTimer, formatPrice,
}: PrecisionModeProps) => {
  const [selected, setSelected] = useState<PrecisionRange | null>(null);
  const timerLow = precisionCountdown < 10 && precisionCountdown > 0;

  const handleConfirm = () => {
    if (!selected) return;
    const range = RANGES.find((r) => r.id === selected)!;
    onConfirm(selected, range.reward);
  };

  return (
    <div className="w-full max-w-lg rounded-[16px] bg-card-surface p-5 sm:p-6" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-foreground text-lg font-bold">Modo Precisão</h2>
        <span className={`font-bold text-lg tabular-nums ${precisionActive ? (timerLow ? "text-danger" : "text-pacific") : "text-pacific"}`}>
          {precisionActive ? formatTimer(precisionCountdown) : "01:00"}
        </span>
      </div>
      <p className="text-ocean-muted text-xs mb-5">
        Acerte o tamanho da variação do BTC em 60 segundos
      </p>

      {/* BTC price display */}
      <div className="flex items-center gap-3 mb-3">
        <img src={bitcoinLogo} alt="Bitcoin" className="w-10 h-10 rounded-full" />
        <div>
          <span className="text-foreground text-xl font-bold">Bitcoin</span>
          <span className="text-ocean-muted text-sm ml-2">BTC</span>
        </div>
      </div>
      <div className="mb-1">
        {price === null ? (
          <div className="h-10 w-48 rounded-lg bg-ocean-dark animate-pulse" />
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-foreground text-3xl font-bold transition-colors duration-300 ${flashing ? "animate-price-flash" : ""}`}>
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

      {/* Range grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {RANGES.map((range) => {
          const isSelected = precisionActive ? precisionRange === range.id : selected === range.id;
          const isDisabled = precisionActive;

          return (
            <button
              key={range.id}
              onClick={() => !isDisabled && setSelected(range.id)}
              disabled={isDisabled}
              className={`relative rounded-[12px] p-4 text-left transition-all duration-200 ${
                isSelected
                  ? "border-2 border-pacific bg-ocean-button"
                  : "border border-[rgba(92,200,232,0.15)] bg-card-surface"
              } ${isDisabled && !isSelected ? "opacity-40 cursor-not-allowed" : isDisabled ? "cursor-not-allowed" : "cursor-pointer hover:border-pacific/40"}`}
            >
              <span className="text-foreground font-bold text-[15px] block mb-1">{range.label}</span>
              <span className="text-ocean-muted text-[11px] block mb-2">{range.difficulty}</span>
              <span className="text-pacific font-bold text-sm block mb-1">
                +{range.reward} troféus se acertar
              </span>
              <span className="text-danger text-[11px] block mb-3">
                Perda se errar: -{range.loss} troféus
              </span>
              <div className="absolute bottom-3 right-3">
                <RiskBars filled={range.bars} color={range.barColor} />
              </div>
            </button>
          );
        })}
      </div>

      {!precisionActive ? (
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className={`w-full h-14 rounded-[12px] font-bold text-sm transition-all duration-200 ${
            selected
              ? "bg-pacific text-ocean-dark hover:opacity-90 active:animate-press"
              : "bg-ocean-dark text-ocean-muted cursor-not-allowed opacity-40"
          }`}
        >
          {selected ? "Confirmar aposta" : "Selecione uma faixa"}
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 mt-1">
          <Loader2 size={14} className="text-ocean-muted animate-spin" />
          <span className="text-ocean-muted text-sm">
            Aguardando variação... Preço de entrada: ${precisionPrice !== null ? formatPrice(precisionPrice) : "—"}
          </span>
        </div>
      )}
    </div>
  );
};

export default PrecisionMode;
