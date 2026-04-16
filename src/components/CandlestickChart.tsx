import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { Skeleton } from "@/components/ui/skeleton";

interface Candle {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  candles: Candle[];
  loading?: boolean;
}

const CandlestickChart = ({ candles, loading }: CandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;
    if (container.clientWidth === 0) return;

    try {
      const chart = createChart(container, {
        layout: {
          background: { color: "transparent" },
          textColor: "#8BB8CC",
          fontFamily: "DM Sans, sans-serif",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.05)" },
          horzLines: { color: "rgba(255,255,255,0.05)" },
        },
        crosshair: { mode: 1 },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.1)",
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.1)",
          timeVisible: true,
          secondsVisible: false,
        },
        width: container.clientWidth,
        height: 240,
        handleScroll: true,
        handleScale: true,
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#1DB887",
        downColor: "#E84855",
        borderUpColor: "#1DB887",
        borderDownColor: "#E84855",
        wickUpColor: "#1DB887",
        wickDownColor: "#E84855",
      });

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;

      const resizeObserver = new ResizeObserver(() => {
        if (container) {
          chart.applyOptions({ width: container.clientWidth });
        }
      });
      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
        chart.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
      };
    } catch (error) {
      console.error("Chart init error:", error);
    }
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !candles || candles.length === 0) return;

    try {
      const formatted = candles
        .filter((c) => c.t && c.open && c.close)
        .map((c) => ({
          time: Math.floor(Number(c.t) / 1000) as any,
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
        }))
        .sort((a, b) => a.time - b.time)
        .filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time);

      if (formatted.length > 0) {
        candleSeriesRef.current.setData(formatted);
      }

      if (volumeSeriesRef.current) {
        const volumeData = candles
          .filter((c) => c.t && c.open && c.close)
          .map((c) => ({
            time: Math.floor(Number(c.t) / 1000) as any,
            value: c.volume ?? 0,
            color: c.close >= c.open ? "rgba(29,184,135,0.4)" : "rgba(232,72,85,0.4)",
          }))
          .sort((a, b) => a.time - b.time)
          .filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time);

        if (volumeData.length > 0) {
          volumeSeriesRef.current.setData(volumeData);
        }
      }

      chartRef.current?.timeScale().fitContent();
    } catch (error) {
      console.error("Chart data error:", error);
    }
  }, [candles]);

  if (loading) {
    return <Skeleton className="w-full rounded-lg" style={{ height: 240 }} />;
  }

  return (
    <div
      ref={chartContainerRef}
      style={{ width: "100%", height: "240px", minHeight: "240px" }}
    />
  );
};

export default CandlestickChart;
