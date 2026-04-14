import { useState } from "react";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import type { CoinPrices } from "@/pages/Dashboard";

interface BattleModeProps {
  coins: CoinPrices;
  battleActive: boolean;
  battleCountdown: number;
  battleChoice: string | null;
  onConfirm: (coinId: string) => void;
  formatTimer: (s: number) => string;
}

const COIN_LIST = [
  {
    id: "bitcoin",
    ticker: "BTC",
    name: "Bitcoin",
    symbol: "₿",
    symbolBg: "bg-warning/20",
    symbolColor: "text-warning",
  },
  {
    id: "ethereum",
    ticker: "ETH",
    name: "Ethereum",
    symbol: "Ξ",
    symbolBg: "bg-[hsl(260,60%,25%)]",
    symbolColor: "text-[hsl(260,80%,70%)]",
  },
  {
    id: "solana",
    ticker: "SOL",
    name: "Solana",
    symbol: "◎",
    symbolBg: "bg-[hsl(280,50%,20%)]",
    symbolColor: "text-[hsl(170,80%,60%)]",
  },
];

const formatPrice = (p: number) =>
  p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const BattleMode = ({ coins, battleActive, battleCountdown, battleChoice, onConfirm, formatTimer }: BattleModeProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const timerLow = battleCountdown < 10 && battleCountdown > 0;

  const coinIdMap: Record<string, string> = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL" };

  return (
    <div className="w-full max-w-lg rounded-[16px] bg-card-surface p-5 sm:p-6" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-foreground text-lg font-bold">Batalha de Moedas</h2>
        <span className={`font-bold text-lg tabular-nums ${battleActive ? (timerLow ? "text-danger" : "text-pacific") : "text-pacific"}`}>
          {battleActive ? formatTimer(battleCountdown) : "01:00"}
        </span>
      </div>
      <p className="text-ocean-muted text-xs mb-5">
        Qual moeda vai valorizar mais em 60 segundos?
      </p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {COIN_LIST.map((coin) => {
          const data = coins[coin.id as keyof CoinPrices];
          const isSelected = battleActive ? battleChoice === coin.id : selected === coin.id;
          const isDisabled = battleActive;
          const notSelected = (battleActive ? battleChoice !== coin.id : selected !== null && selected !== coin.id);

          return (
            <button
              key={coin.id}
              onClick={() => !isDisabled && setSelected(coin.id)}
              disabled={isDisabled}
              className={`rounded-[12px] p-3 flex flex-col items-center gap-2 transition-all duration-200 ${
                isSelected
                  ? "border-2 border-pacific bg-ocean-button scale-[1.03]"
                  : "border border-[rgba(92,200,232,0.15)] bg-card-surface"
              } ${notSelected ? "opacity-60" : ""} ${isDisabled ? "cursor-not-allowed" : "cursor-pointer hover:border-pacific/40"}`}
            >
              <div className={`w-10 h-10 rounded-full ${coin.symbolBg} flex items-center justify-center`}>
                <span className={`${coin.symbolColor} font-bold text-lg`}>{coin.symbol}</span>
              </div>
              <div className="text-center">
                <span className="text-foreground text-sm font-bold block">{coin.name}</span>
                <span className="text-ocean-muted text-[11px]">{coin.ticker}</span>
              </div>
              {data ? (
                <>
                  <span className="text-pacific text-xs font-medium">${formatPrice(data.price)}</span>
                  <div className="flex items-center gap-0.5">
                    {data.change24h >= 0 ? (
                      <ArrowUp size={10} className="text-success" />
                    ) : (
                      <ArrowDown size={10} className="text-danger" />
                    )}
                    <span className={`text-[11px] font-medium ${data.change24h >= 0 ? "text-success" : "text-danger"}`}>
                      {data.change24h >= 0 ? "+" : ""}{data.change24h.toFixed(2)}%
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-4 w-16 rounded bg-ocean-dark animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {!battleActive ? (
        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className={`w-full h-14 rounded-[12px] font-bold text-sm transition-all duration-200 ${
            selected
              ? "bg-pacific text-ocean-dark hover:opacity-90 active:animate-press"
              : "bg-ocean-dark text-ocean-muted cursor-not-allowed"
          }`}
        >
          {selected ? `Confirmar aposta em ${coinIdMap[selected] ?? selected.toUpperCase()}` : "Selecione uma moeda"}
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 mt-1">
          <Loader2 size={14} className="text-ocean-muted animate-spin" />
          <span className="text-ocean-muted text-sm">
            Apostou em {coinIdMap[battleChoice!] ?? ""} — Aguardando resultado...
          </span>
        </div>
      )}
    </div>
  );
};

export default BattleMode;
