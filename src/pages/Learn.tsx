import { useState, useEffect, useCallback } from "react";
import { BarChart2, Sparkles, Quote, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";
import LiveTradesFeed from "@/components/LiveTradesFeed";
import SimpleCandleChart from "@/components/SimpleCandleChart";

const COINS = ["BTC", "ETH", "SOL"] as const;
const INTERVALS = ["1m", "5m", "15m", "1h", "4h"] as const;

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  fundingRate: string;
  openInterest: string;
  volume24h: string;
  candles: { t: number; open: number; high: number; low: number; close: number; volume?: number }[];
  mentions: { text: string; likes: number; author: string }[];
  trades: any[];
}

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(4)}`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatVolume(v: string): string {
  const num = parseFloat(v);
  if (isNaN(num)) return "$0";
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

function formatFunding(f: string): string {
  const num = parseFloat(f);
  if (isNaN(num) || num === 0) return "0.0000%";
  const pct = num * 100;
  return `${num > 0 ? "+" : ""}${pct.toFixed(4)}%`;
}

function generateInsight(change: number, funding: string, buzzScore: number, symbol: string): string {
  const f = parseFloat(funding);
  const dir = change >= 0 ? "up" : "down";
  if (change > 1 && f > 0 && buzzScore > 60) {
    return `Strong bullish signals: ${symbol} price up ${change.toFixed(1)}%, positive funding, and high social activity. Traders are optimistic on Pacifica.`;
  }
  if (change < -1 && f < 0 && buzzScore < 40) {
    return `Bearish pressure detected: ${symbol} price down ${Math.abs(change).toFixed(1)}%, negative funding, and low social activity. Market caution advised.`;
  }
  return `Mixed signals: ${symbol} price ${dir} ${Math.abs(change).toFixed(1)}%, funding ${f >= 0 ? "positive" : "negative"}. Watch for a clearer trend before acting.`;
}

const Learn = () => {
  const [coin, setCoin] = useState<typeof COINS[number]>("BTC");
  const [interval, setInterval_] = useState<typeof INTERVALS[number]>("15m");
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInsight, setShowInsight] = useState(false);
  const [insightText, setInsightText] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: res, error } = await supabase.functions.invoke("market-insights", {
        body: { symbol: coin, interval },
      });
      if (error) throw error;
      setData(res as MarketData);
    } catch (e) {
      console.error("Market insights error:", e);
    } finally {
      setLoading(false);
    }
  }, [coin, interval]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const id = window.setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleAskAI = async () => {
    setInsightLoading(true);
    setShowInsight(true);
    try {
      const { data: buzzData } = await supabase.functions.invoke("elfa-buzz", {
        body: { ticker: coin },
      });
      const buzzScore = buzzData?.score ?? 50;
      const change = data?.change24h ?? 0;
      const funding = data?.fundingRate ?? "0";
      setInsightText(generateInsight(change, funding, buzzScore, coin));
    } catch {
      setInsightText("Unable to generate insight right now. Please try again.");
    } finally {
      setInsightLoading(false);
    }
  };

  const fundingNum = parseFloat(data?.fundingRate ?? "0");

  return (
    <div className="min-h-screen bg-ocean-dark pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-foreground">Market Intel</h1>
          <p className="text-xs text-ocean-muted">Real-time data powered by Pacifica</p>
        </div>

        {/* Coin Selector */}
        <div className="flex gap-2 mb-5">
          {COINS.map((c) => (
            <button
              key={c}
              onClick={() => setCoin(c)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                coin === c
                  ? "bg-pacific text-ocean-dark"
                  : "bg-card-dark border border-pacific/15 text-ocean-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card-dark rounded-xl p-3">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))
          ) : (
            <>
              <div className="bg-card-dark rounded-xl p-3">
                <p className="text-[11px] text-ocean-muted mb-1">Current Price</p>
                <p className="text-lg font-bold text-foreground">{formatPrice(data?.price ?? 0)}</p>
              </div>
              <div className="bg-card-dark rounded-xl p-3">
                <p className="text-[11px] text-ocean-muted mb-1">24h Change</p>
                <p className={`text-lg font-bold ${(data?.change24h ?? 0) >= 0 ? "text-success" : "text-danger"}`}>
                  {(data?.change24h ?? 0) >= 0 ? "+" : ""}{(data?.change24h ?? 0).toFixed(2)}%
                </p>
              </div>
              <div className="bg-card-dark rounded-xl p-3">
                <p className="text-[11px] text-ocean-muted mb-1">24h High</p>
                <p className="text-base font-semibold text-foreground">{formatPrice(data?.high24h ?? 0)}</p>
              </div>
              <div className="bg-card-dark rounded-xl p-3">
                <p className="text-[11px] text-ocean-muted mb-1">24h Low</p>
                <p className="text-base font-semibold text-foreground">{formatPrice(data?.low24h ?? 0)}</p>
              </div>
            </>
          )}
        </div>

        {/* Interval Selector */}
        <div className="flex gap-2 mb-4">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval_(iv)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                interval === iv
                  ? "bg-pacific text-ocean-dark"
                  : "bg-card-dark border border-pacific/15 text-ocean-muted"
              }`}
            >
              {iv}
            </button>
          ))}
        </div>

        {/* Price Chart */}
        <div className="bg-card-dark rounded-xl p-3 mb-5">
          <SimpleCandleChart candles={data?.candles ?? []} loading={loading} />
        </div>

        {/* Social Signals */}
        {(data?.mentions?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-foreground mb-1">Social Signals</h2>
            <p className="text-[11px] text-ocean-muted mb-3">Latest mentions from crypto Twitter, via Elfa AI</p>
            <div className="flex flex-col gap-2">
              {data!.mentions.slice(0, 5).map((m, i) => (
                <div key={i} className="bg-card-dark rounded-[10px] p-3">
                  <div className="flex items-start gap-2">
                    <Quote size={14} className="text-pacific mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-foreground line-clamp-2">{m.text}</p>
                      <p className="text-[11px] text-ocean-muted mt-1">♥ {m.likes} likes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Trades Feed */}
        <LiveTradesFeed trades={data?.trades ?? []} />

        {/* Market Context */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-foreground mb-3">Market Context</h2>
          <div className="flex flex-col gap-2">
            <div className="bg-card-dark rounded-[10px] p-3">
              <p className="text-[11px] text-ocean-muted mb-1">Funding Rate</p>
              <p className={`text-base font-semibold ${fundingNum > 0 ? "text-success" : fundingNum < 0 ? "text-danger" : "text-foreground"}`}>
                {formatFunding(data?.fundingRate ?? "0")}
              </p>
              <p className={`text-[11px] mt-1 ${fundingNum >= 0 ? "text-success" : "text-danger"}`}>
                {fundingNum >= 0 ? "Longs paying shorts — bullish sentiment" : "Shorts paying longs — bearish sentiment"}
              </p>
            </div>
            <div className="bg-card-dark rounded-[10px] p-3">
              <p className="text-[11px] text-ocean-muted mb-1">Open Interest</p>
              <p className="text-base font-semibold text-foreground">
                {formatVolume(data?.openInterest ?? "0")}
              </p>
              <p className="text-[11px] text-ocean-muted mt-1">Total value of open positions on Pacifica</p>
            </div>
            <div className="bg-card-dark rounded-[10px] p-3">
              <p className="text-[11px] text-ocean-muted mb-1">24h Volume</p>
              <p className="text-base font-semibold text-foreground">
                {formatVolume(data?.volume24h ?? "0")}
              </p>
              <p className="text-[11px] text-ocean-muted mt-1">Total traded in the last 24 hours</p>
            </div>
          </div>
        </div>

        {/* AI Insight Button */}
        <button
          onClick={handleAskAI}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1A3A4E] border border-pacific text-pacific font-semibold text-sm mb-4 transition-all active:scale-95"
        >
          <Sparkles size={16} />
          Ask AI about {coin}
        </button>

        {/* Powered by Pacifica */}
        <div className="flex items-center justify-center gap-1.5 py-3 opacity-50">
          <BarChart2 size={12} className="text-pacific" />
          <span className="text-[10px] text-ocean-muted">Powered by Pacifica</span>
        </div>
      </div>

      {/* AI Insight Modal */}
      {showInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowInsight(false)}>
          <div className="bg-card-dark rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">AI Market Insight — {coin}</h3>
              <button onClick={() => setShowInsight(false)} className="text-ocean-muted">
                <X size={18} />
              </button>
            </div>
            {insightLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <p className="text-sm text-foreground/90 leading-relaxed">{insightText}</p>
            )}
            <button
              onClick={() => setShowInsight(false)}
              className="w-full mt-4 py-2 rounded-lg bg-pacific text-ocean-dark font-semibold text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Learn;
