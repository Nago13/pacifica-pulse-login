import { useState } from "react";
import { ArrowUp, ArrowDown, Loader2, Check, ArrowLeft } from "lucide-react";
import type { CoinPrices } from "@/pages/Dashboard";
import type { BuzzResult } from "@/lib/elfaApi";
import type { PacificaPrices } from "@/lib/pacificaApi";
import { formatFundingRate, getFundingColor } from "@/lib/pacificaApi";
import bitcoinLogo from "@/assets/bitcoin-logo.png";
import ethereumLogo from "@/assets/ethereum-logo.png";
import solanaLogo from "@/assets/solana-logo.png";
import pacificaLogo from "@/assets/pacifica-logo.png";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BattleModeProps {
  coins: CoinPrices;
  battleActive: boolean;
  battleCountdown: number;
  battleChoice: string | null;
  onConfirm: (coinId: string, arenaCoins: string[]) => void;
  formatTimer: (s: number) => string;
  buzzScores: Record<string, BuzzResult>;
  buzzLastUpdated: Date | null;
  pacificaData: PacificaPrices | null;
  usingPacifica: boolean;
}

const COIN_LIST = [
  { id: "bitcoin", ticker: "BTC", name: "Bitcoin", logo: bitcoinLogo },
  { id: "ethereum", ticker: "ETH", name: "Ethereum", logo: ethereumLogo },
  { id: "solana", ticker: "SOL", name: "Solana", logo: solanaLogo },
];

const formatPrice = (p: number) =>
  Number(p.toFixed(2)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PACIFICA_KEY_MAP: Record<string, keyof PacificaPrices> = {
  bitcoin: "bitcoin",
  ethereum: "ethereum",
  solana: "solana",
};

const BattleMode = ({ coins, battleActive, battleCountdown, battleChoice, onConfirm, formatTimer, buzzScores, buzzLastUpdated, pacificaData, usingPacifica }: BattleModeProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [arenaSelection, setArenaSelection] = useState<string[]>(["bitcoin", "ethereum", "solana"]);
  const [betChoice, setBetChoice] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState(false);

  const timerLow = battleCountdown < 10 && battleCountdown > 0;
  const coinIdMap: Record<string, string> = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL" };

  const toggleArena = (id: string) => {
    setSelectionError(false);
    setArenaSelection((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleMountArena = () => {
    if (arenaSelection.length < 2) {
      setSelectionError(true);
      return;
    }
    setStep(2);
    setBetChoice(null);
  };

  const handleConfirmBet = () => {
    if (!betChoice) return;
    onConfirm(betChoice, arenaSelection);
  };

  const arenaCoins = COIN_LIST.filter((c) => arenaSelection.includes(c.id));

  const FundingBadge = ({ coinId }: { coinId: string }) => {
    if (!usingPacifica || !pacificaData) return null;
    const asset = pacificaData[PACIFICA_KEY_MAP[coinId]];
    if (!asset) return null;
    const fundingNum = parseFloat(asset.funding);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <span className="text-[9px]" style={{ color: "#8BB8CC" }}>FR</span>
              <span className={`text-[9px] font-bold ${getFundingColor(asset.funding)}`} style={fundingNum === 0 ? { color: "#8BB8CC" } : undefined}>
                {formatFundingRate(asset.funding)}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Funding Rate via Pacifica</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (battleActive) {
    return (
      <div className="w-full max-w-lg rounded-[16px] bg-card-surface p-5 sm:p-6" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-foreground text-lg font-bold">Coin Battle</h2>
          <span className={`font-bold text-lg tabular-nums ${timerLow ? "text-danger" : "text-pacific"}`}>
            {formatTimer(battleCountdown)}
          </span>
        </div>
        <p className="text-ocean-muted text-xs mb-5">Awaiting battle result...</p>

        <div className={`grid gap-3 mb-5 ${arenaCoins.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {arenaCoins.map((coin) => {
            const data = coins[coin.id as keyof CoinPrices];
            const isChosen = battleChoice === coin.id;
            return (
              <div
                key={coin.id}
                className={`rounded-[12px] p-3 flex flex-col items-center gap-2 transition-all duration-200 cursor-not-allowed ${
                  isChosen
                    ? "border-2 border-warning bg-[hsl(40,50%,10%)] scale-[1.03]"
                    : "border border-[rgba(92,200,232,0.15)] bg-card-surface opacity-60"
                }`}
              >
                <img src={coin.logo} alt={coin.name} className="w-10 h-10 rounded-full" />
                <div className="text-center">
                  <span className="text-foreground text-sm font-bold block">{coin.name}</span>
                  <span className="text-ocean-muted text-[11px]">{coin.ticker}</span>
                </div>
                {data && (
                  <>
                    <span className="text-pacific text-xs font-medium">${formatPrice(data.price)}</span>
                    <div className="flex items-center gap-0.5">
                      {data.change24h >= 0 ? <ArrowUp size={10} className="text-success" /> : <ArrowDown size={10} className="text-danger" />}
                      <span className={`text-[11px] font-medium ${data.change24h >= 0 ? "text-success" : "text-danger"}`}>
                        {data.change24h >= 0 ? "+" : ""}{data.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <FundingBadge coinId={coin.id} />
                    {buzzScores[coin.ticker] && (
                      <div className="w-full mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-ocean-muted text-[9px]">Buzz</span>
                          <span className="text-pacific text-[9px] font-bold">{buzzScores[coin.ticker].score}</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-ocean-dark mt-0.5">
                          <div className="h-full rounded-full bg-pacific transition-all duration-500" style={{ width: `${buzzScores[coin.ticker].score}%` }} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2">
          <Loader2 size={14} className="text-ocean-muted animate-spin" />
          <span className="text-ocean-muted text-sm">
            Bet on {coinIdMap[battleChoice!] ?? ""} — Awaiting result...
          </span>
        </div>

        {usingPacifica && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <img src={pacificaLogo} alt="Pacifica" className="w-4 h-4 rounded-full shrink-0" />
            <span className="text-[10px]" style={{ color: "#8BB8CC" }}>Powered by Pacifica</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-[16px] bg-card-surface p-5 sm:p-6" style={{ border: "1px solid rgba(92,200,232,0.15)" }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-foreground text-lg font-bold">Coin Battle</h2>
        <span className="font-bold text-lg tabular-nums text-pacific">01:00</span>
      </div>

      {step === 1 ? (
        <>
          <p className="text-ocean-muted text-xs mb-5">Choose 2 or 3 coins to battle</p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {COIN_LIST.map((coin) => {
              const data = coins[coin.id as keyof CoinPrices];
              const isSelected = arenaSelection.includes(coin.id);

              return (
                <button
                  key={coin.id}
                  onClick={() => toggleArena(coin.id)}
                  className={`relative rounded-[12px] p-3 flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-2 border-pacific bg-ocean-button"
                      : "border border-[rgba(92,200,232,0.15)] bg-card-surface hover:border-pacific/40"
                  }`}
                >
                  <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? "border-pacific bg-pacific" : "border-ocean-muted"
                  }`}>
                    {isSelected && <Check size={12} className="text-ocean-dark" />}
                  </div>

                  <img src={coin.logo} alt={coin.name} className="w-10 h-10 rounded-full" />
                  <div className="text-center">
                    <span className="text-foreground text-sm font-bold block">{coin.name}</span>
                    <span className="text-ocean-muted text-[11px]">{coin.ticker}</span>
                  </div>
                  {data ? (
                    <>
                      <span className="text-pacific text-xs font-medium">${formatPrice(data.price)}</span>
                      <div className="flex items-center gap-0.5">
                        {data.change24h >= 0 ? <ArrowUp size={10} className="text-success" /> : <ArrowDown size={10} className="text-danger" />}
                        <span className={`text-[11px] font-medium ${data.change24h >= 0 ? "text-success" : "text-danger"}`}>
                          {data.change24h >= 0 ? "+" : ""}{data.change24h.toFixed(2)}%
                        </span>
                      </div>
                      <FundingBadge coinId={coin.id} />
                      {buzzScores[coin.ticker] && (
                        <div className="w-full mt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-ocean-muted text-[9px]">Buzz</span>
                            <span className="text-pacific text-[9px] font-bold">{buzzScores[coin.ticker].score}</span>
                          </div>
                          <div className="w-full h-1 rounded-full bg-ocean-dark mt-0.5">
                            <div className="h-full rounded-full bg-pacific transition-all duration-500" style={{ width: `${buzzScores[coin.ticker].score}%` }} />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-4 w-16 rounded bg-ocean-dark animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {selectionError && (
            <p className="text-danger text-xs text-center mb-3">Select at least 2 coins</p>
          )}

          <button
            onClick={handleMountArena}
            disabled={arenaSelection.length < 2}
            className={`w-full h-14 rounded-[12px] font-bold text-sm transition-all duration-200 ${
              arenaSelection.length >= 2
                ? "bg-pacific text-ocean-dark hover:opacity-90 active:animate-press"
                : "bg-ocean-dark text-ocean-muted cursor-not-allowed opacity-40"
            }`}
          >
            Build Arena →
          </button>
        </>
      ) : (
        <>
          <p className="text-ocean-muted text-xs mb-5">Which will gain more in 60 seconds?</p>

          <div className={`grid gap-3 mb-4 ${arenaCoins.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {arenaCoins.map((coin) => {
              const data = coins[coin.id as keyof CoinPrices];
              const isSelected = betChoice === coin.id;
              const notSelected = betChoice !== null && betChoice !== coin.id;

              return (
                <button
                  key={coin.id}
                  onClick={() => setBetChoice(coin.id)}
                  className={`rounded-[12px] p-3 flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-2 border-warning bg-[hsl(40,50%,10%)] scale-[1.03]"
                      : "border border-[rgba(92,200,232,0.15)] bg-card-surface hover:border-pacific/40"
                  } ${notSelected ? "opacity-60" : ""}`}
                >
                  <img src={coin.logo} alt={coin.name} className="w-10 h-10 rounded-full" />
                  <div className="text-center">
                    <span className="text-foreground text-sm font-bold block">{coin.name}</span>
                    <span className="text-ocean-muted text-[11px]">{coin.ticker}</span>
                  </div>
                  {data ? (
                    <>
                      <span className="text-pacific text-xs font-medium">${formatPrice(data.price)}</span>
                      <div className="flex items-center gap-0.5">
                        {data.change24h >= 0 ? <ArrowUp size={10} className="text-success" /> : <ArrowDown size={10} className="text-danger" />}
                        <span className={`text-[11px] font-medium ${data.change24h >= 0 ? "text-success" : "text-danger"}`}>
                          {data.change24h >= 0 ? "+" : ""}{data.change24h.toFixed(2)}%
                        </span>
                      </div>
                      <FundingBadge coinId={coin.id} />
                    </>
                  ) : (
                    <div className="h-4 w-16 rounded bg-ocean-dark animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { setStep(1); setBetChoice(null); }}
            className="flex items-center gap-1 text-ocean-muted text-xs mb-3 hover:text-pacific transition-colors"
          >
            <ArrowLeft size={12} /> ← Change coins
          </button>

          <button
            onClick={handleConfirmBet}
            disabled={!betChoice}
            className={`w-full h-14 rounded-[12px] font-bold text-sm transition-all duration-200 ${
              betChoice
                ? "bg-pacific text-ocean-dark hover:opacity-90 active:animate-press"
                : "bg-ocean-dark text-ocean-muted cursor-not-allowed opacity-40"
            }`}
          >
            {betChoice ? `Confirm bet on ${coinIdMap[betChoice] ?? betChoice.toUpperCase()}` : "Select a coin"}
          </button>
        </>
      )}

      {usingPacifica && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <img src={pacificaLogo} alt="Pacifica" className="w-4 h-4 rounded-full shrink-0" />
          <span className="text-[10px]" style={{ color: "#8BB8CC" }}>Powered by Pacifica</span>
        </div>
      )}
    </div>
  );
};

export default BattleMode;