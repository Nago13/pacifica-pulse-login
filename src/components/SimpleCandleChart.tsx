interface Candle {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

const SimpleCandleChart = ({ candles, loading }: { candles: Candle[]; loading?: boolean }) => {
  if (loading || !candles || candles.length === 0) {
    return (
      <div className="w-full rounded-lg bg-card-dark flex items-center justify-center text-ocean-muted text-[13px]" style={{ height: 240 }}>
        Loading chart data...
      </div>
    );
  }

  const width = 600;
  const height = 200;
  const padding = { top: 10, right: 50, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const prices = candles.flatMap((c) => [c.high, c.low]);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const priceRange = maxP - minP || 1;

  const candleWidth = Math.max(2, Math.floor(chartW / candles.length) - 2);

  const toY = (price: number) =>
    padding.top + chartH - ((price - minP) / priceRange) * chartH;

  const toX = (i: number) =>
    padding.left + (i / candles.length) * chartW + candleWidth / 2;

  const priceLabels = [minP, minP + priceRange * 0.25, minP + priceRange * 0.5, minP + priceRange * 0.75, maxP];

  // Volume bar height
  const maxVol = Math.max(...candles.map((c) => c.volume ?? 0), 1);
  const volHeight = 30;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "240px" }} preserveAspectRatio="none">
        {/* Grid lines + price labels */}
        {priceLabels.map((p, i) => (
          <g key={i}>
            <line x1={padding.left} y1={toY(p)} x2={width - padding.right} y2={toY(p)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={width - padding.right + 4} y={toY(p) + 3} fill="#8BB8CC" fontSize="8" fontFamily="DM Sans, sans-serif">
              ${p >= 1000 ? Math.round(p).toLocaleString() : p.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Candles */}
        {candles.map((c, i) => {
          const isUp = c.close >= c.open;
          const color = isUp ? "#1DB887" : "#E84855";
          const x = toX(i);
          const bodyTop = toY(Math.max(c.open, c.close));
          const bodyBot = toY(Math.min(c.open, c.close));
          const bodyH = Math.max(1, bodyBot - bodyTop);

          return (
            <g key={i}>
              {/* Wick */}
              <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={color} strokeWidth="1" />
              {/* Body */}
              <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyH} fill={color} />
              {/* Volume bar */}
              <rect
                x={x - candleWidth / 2}
                y={height - padding.bottom - ((c.volume ?? 0) / maxVol) * volHeight}
                width={candleWidth}
                height={((c.volume ?? 0) / maxVol) * volHeight}
                fill={color}
                opacity={0.3}
              />
            </g>
          );
        })}

        {/* Time labels */}
        {candles
          .filter((_, i) => i % Math.ceil(candles.length / 6) === 0)
          .map((c) => {
            const origIndex = candles.indexOf(c);
            const date = new Date(c.t);
            const label = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
            return (
              <text key={origIndex} x={toX(origIndex)} y={height - 8} fill="#8BB8CC" fontSize="8" textAnchor="middle" fontFamily="DM Sans, sans-serif">
                {label}
              </text>
            );
          })}
      </svg>
    </div>
  );
};

export default SimpleCandleChart;
