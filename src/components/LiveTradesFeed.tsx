import { useState, useEffect, useRef } from "react";

interface Trade {
  side?: string;
  cause?: string;
  amount?: string | number;
  symbol?: string;
  price?: string | number;
  created_at?: string | number;
  timestamp?: string | number;
}

interface LiveTradesFeedProps {
  trades: Trade[];
}

function timeAgo(ts: string | number | undefined): string {
  if (!ts) return "";
  const created = typeof ts === "string" ? new Date(ts).getTime() : ts;
  const s = Math.floor((Date.now() - created) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function formatTradePrice(p: string | number | undefined): string {
  if (!p) return "$0.00";
  const num = parseFloat(String(p));
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getBadge(side?: string, cause?: string) {
  if (cause === "market_liquidation") {
    return { text: "LIQ ⚡", color: "#F5A623", bg: "#3D1A00", border: "#F5A623" };
  }
  if (side === "open_long") {
    return { text: "LONG ↑", color: "#1DB887", bg: "#0D3D2A", border: "#1DB887" };
  }
  if (side === "open_short") {
    return { text: "SHORT ↓", color: "#E84855", bg: "#3D0D14", border: "#E84855" };
  }
  return { text: "CLOSE", color: "#8BB8CC", bg: "#1A1A2E", border: "rgba(255,255,255,0.2)" };
}

const LiveTradesFeed = ({ trades }: LiveTradesFeedProps) => {
  const [prevIds, setPrevIds] = useState<Set<string>>(new Set());
  const [newIndices, setNewIndices] = useState<Set<number>>(new Set());
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      const ids = new Set(trades.map((t, i) => `${t.price}-${t.created_at ?? t.timestamp}-${i}`));
      setPrevIds(ids);
      return;
    }
    const currentIds = trades.map((t, i) => `${t.price}-${t.created_at ?? t.timestamp}-${i}`);
    const newOnes = new Set<number>();
    currentIds.forEach((id, i) => {
      if (!prevIds.has(id)) newOnes.add(i);
    });
    setNewIndices(newOnes);
    setPrevIds(new Set(currentIds));
    if (newOnes.size > 0) {
      const timer = setTimeout(() => setNewIndices(new Set()), 800);
      return () => clearTimeout(timer);
    }
  }, [trades]);

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: "#1DB887", animation: "pulse 1.5s infinite" }}
        />
        <span className="text-foreground font-bold text-sm">Live on Pacifica</span>
      </div>
      <p className="text-[11px] mb-3" style={{ color: "#8BB8CC" }}>
        Real trades happening now
      </p>

      <div className="rounded-[10px] overflow-hidden" style={{ background: "#0F2235" }}>
        {trades.length === 0 ? (
          <p className="text-center py-5 text-xs" style={{ color: "#8BB8CC" }}>
            No recent trades available
          </p>
        ) : (
          trades.map((t, i) => {
            const badge = getBadge(t.side, t.cause);
            const isNew = newIndices.has(i);
            return (
              <div
                key={i}
                className="flex items-center justify-between transition-all duration-300"
                style={{
                  padding: "10px 14px",
                  borderBottom: i < trades.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none",
                  animation: isNew ? "tradeSlideIn 0.3s ease-out" : undefined,
                  background: isNew ? "rgba(92,200,232,0.08)" : "transparent",
                }}
              >
                <div>
                  <span
                    className="inline-block font-bold rounded-full"
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      color: badge.color,
                      background: badge.bg,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {badge.text}
                  </span>
                  <p className="text-[11px] mt-1" style={{ color: "#8BB8CC" }}>
                    {t.amount ? parseFloat(String(t.amount)).toFixed(4) : "—"} {t.symbol ?? ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-foreground font-bold text-[13px]">{formatTradePrice(t.price)}</p>
                  <p className="text-[10px]" style={{ color: "#8BB8CC" }}>
                    {timeAgo(t.created_at ?? t.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <p className="text-center mt-2 text-[10px]" style={{ color: "#8BB8CC" }}>
        All trades executed on Pacifica DEX
      </p>
    </div>
  );
};

export default LiveTradesFeed;
